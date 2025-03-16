// src/services/pacs-integration.js
import { Healthcare } from '@google-cloud/healthcare';
import { getStudyById, updateStudy } from './study-service';
import { uploadBytes, ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase-config';

// Inicializar cliente de Healthcare API
const healthcare = new Healthcare();

// Configuración del proyecto
const projectId = 'TU_PROJECT_ID';
const location = 'TU_LOCATION'; // ej: 'us-central1'
const datasetId = 'TU_DATASET_ID';
const dicomStoreId = 'TU_DICOM_STORE_ID';

// Ruta completa al DICOM store
const dicomStoreName = `projects/${projectId}/locations/${location}/datasets/${datasetId}/dicomStores/${dicomStoreId}`;

/**
 * Consulta estudios DICOM desde el PACS por ID de paciente
 * @param {string} patientId - ID del paciente (MRN)
 * @returns {Promise<Array>} - Lista de estudios DICOM
 */
export async function queryStudiesByPatientId(patientId) {
  try {
    const dicomWebPath = `studies?PatientID=${patientId}`;
    
    const [response] = await healthcare.projects.locations.datasets.dicomStores.searchForStudies({
      parent: dicomStoreName,
      dicomWebPath
    });
    
    return response.data || [];
  } catch (error) {
    console.error('Error al consultar estudios DICOM:', error);
    throw error;
  }
}

/**
 * Obtiene metadatos de un estudio DICOM
 * @param {string} studyInstanceUID - UID del estudio DICOM
 * @returns {Promise<Object>} - Metadatos del estudio
 */
export async function getStudyMetadata(studyInstanceUID) {
  try {
    const dicomWebPath = `studies/${studyInstanceUID}/metadata`;
    
    const [response] = await healthcare.projects.locations.datasets.dicomStores.studies.retrieveMetadata({
      parent: dicomStoreName,
      dicomWebPath
    });
    
    return response.data || {};
  } catch (error) {
    console.error('Error al obtener metadatos del estudio:', error);
    throw error;
  }
}

/**
 * Importa un estudio DICOM del PACS a nuestra base de datos
 * @param {string} studyInstanceUID - UID del estudio DICOM
 * @param {string} patientId - ID del paciente en nuestro sistema
 * @returns {Promise<Object>} - Estudio importado
 */
export async function importStudyFromPACS(studyInstanceUID, patientId) {
  try {
    // 1. Obtener metadatos del estudio
    const metadata = await getStudyMetadata(studyInstanceUID);
    
    // 2. Extraer información relevante para crear el estudio en nuestro sistema
    const studyData = {
      patientId,
      pacsStudyInstanceUID: studyInstanceUID,
      modality: metadata.modality || 'Desconocido',
      studyDate: metadata.studyDate ? new Date(metadata.studyDate) : new Date(),
      studyDescription: metadata.studyDescription || 'Estudio importado',
      referring: metadata.referringPhysicianName,
      accessionNumber: metadata.accessionNumber,
      status: 'completed',
      importedFromPACS: true,
      importDate: new Date()
    };
    
    // 3. Crear estudio en nuestra base de datos
    const studyId = await createStudy(studyData);
    
    // 4. Obtener instancias (imágenes) del estudio
    const instances = await getStudyInstances(studyInstanceUID);
    
    // 5. Importar cada instancia
    const importedInstances = [];
    for (const instance of instances) {
      const importedInstance = await importDicomInstance(
        studyInstanceUID, 
        instance.seriesInstanceUID, 
        instance.sopInstanceUID,
        studyId,
        patientId
      );
      importedInstances.push(importedInstance);
    }
    
    // 6. Actualizar estudio con conteo de instancias
    await updateStudy(studyId, {
      instanceCount: importedInstances.length,
      importComplete: true
    });
    
    return {
      studyId,
      pacsStudyInstanceUID: studyInstanceUID,
      instanceCount: importedInstances.length
    };
  } catch (error) {
    console.error('Error al importar estudio del PACS:', error);
    throw error;
  }
}

/**
 * Obtiene todas las instancias DICOM de un estudio
 * @param {string} studyInstanceUID - UID del estudio DICOM
 * @returns {Promise<Array>} - Lista de instancias
 */
export async function getStudyInstances(studyInstanceUID) {
  try {
    const dicomWebPath = `studies/${studyInstanceUID}/instances`;
    
    const [response] = await healthcare.projects.locations.datasets.dicomStores.studies.retrieveInstances({
      parent: dicomStoreName,
      dicomWebPath
    });
    
    return response.data || [];
  } catch (error) {
    console.error('Error al obtener instancias del estudio:', error);
    throw error;
  }
}

/**
 * Importa una instancia DICOM específica
 * @param {string} studyInstanceUID - UID del estudio
 * @param {string} seriesInstanceUID - UID de la serie
 * @param {string} sopInstanceUID - UID de la instancia
 * @param {string} studyId - ID del estudio en nuestro sistema
 * @param {string} patientId - ID del paciente en nuestro sistema
 * @returns {Promise<Object>} - Instancia importada
 */
export async function importDicomInstance(
  studyInstanceUID, 
  seriesInstanceUID, 
  sopInstanceUID,
  studyId,
  patientId
) {
  try {
    // 1. Obtener los datos DICOM binarios
    const dicomWebPath = `studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${sopInstanceUID}`;
    
    const [response] = await healthcare.projects.locations.datasets.dicomStores.studies.series.instances.retrieveInstance({
      parent: dicomStoreName,
      dicomWebPath
    });
    
    // 2. Convertir a Blob para subirlo a Firebase Storage
    const blob = new Blob([response.data], { type: 'application/dicom' });
    
    // 3. Crear nombre de archivo basado en los UIDs
    const fileName = `${sopInstanceUID}.dcm`;
    
    // 4. Subir a Firebase Storage
    const storageRef = ref(storage, `dicom/${patientId}/${studyId}/${fileName}`);
    const uploadResult = await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    // 5. Obtener algunos metadatos básicos de la instancia
    const instanceMetadata = await getInstanceMetadata(studyInstanceUID, seriesInstanceUID, sopInstanceUID);
    
    // 6. Registrar en Firestore
    const fileData = {
      fileName,
      filePath: uploadResult.ref.fullPath,
      fileType: 'application/dicom',
      fileSize: blob.size,
      downloadURL,
      studyId,
      patientId,
      dicomMetadata: {
        studyInstanceUID,
        seriesInstanceUID,
        sopInstanceUID,
        modality: instanceMetadata.modality,
        instanceNumber: instanceMetadata.instanceNumber
      }
    };
    
    const fileDocRef = await addDoc(collection(db, 'studyFiles'), fileData);
    
    return {
      id: fileDocRef.id,
      ...fileData
    };
  } catch (error) {
    console.error('Error al importar instancia DICOM:', error);
    throw error;
  }
}

/**
 * Obtiene metadatos de una instancia DICOM específica
 * @param {string} studyInstanceUID - UID del estudio
 * @param {string} seriesInstanceUID - UID de la serie
 * @param {string} sopInstanceUID - UID de la instancia
 * @returns {Promise<Object>} - Metadatos de la instancia
 */
export async function getInstanceMetadata(studyInstanceUID, seriesInstanceUID, sopInstanceUID) {
  try {
    const dicomWebPath = `studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${sopInstanceUID}/metadata`;
    
    const [response] = await healthcare.projects.locations.datasets.dicomStores.studies.series.instances.retrieveMetadata({
      parent: dicomStoreName,
      dicomWebPath
    });
    
    return response.data || {};
  } catch (error) {
    console.error('Error al obtener metadatos de la instancia:', error);
    throw error;
  }
}

/**
 * Envía resultados de un estudio al PACS
 * @param {string} studyId - ID del estudio en nuestro sistema
 * @returns {Promise<boolean>} - Éxito de la operación
 */
export async function sendResultsToPACS(studyId) {
  try {
    // 1. Obtener datos del estudio
    const study = await getStudyById(studyId);
    
    if (!study.pacsStudyInstanceUID) {
      throw new Error('Este estudio no tiene un StudyInstanceUID asociado en el PACS');
    }
    
    // 2. Obtener informe del estudio
    const report = await getStudyReport(studyId);
    
    if (!report) {
      throw new Error('El estudio no tiene un informe asociado');
    }
    
    // 3. Convertir informe a formato compatible con PACS
    // Esto dependerá del formato que acepte tu sistema PACS específico
    // Podría ser un archivo PDF, SR DICOM, HL7, etc.
    
    // 4. Enviar al PACS mediante API correspondiente
    // Esta implementación es hipotética y dependerá del sistema PACS específico
    
    // 5. Actualizar estado del estudio en nuestro sistema
    await updateStudy(studyId, {
      reportSentToPACS: true,
      reportSentDate: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error al enviar resultados al PACS:', error);
    throw error;
  }
}