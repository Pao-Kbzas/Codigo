// src/services/ris-integration.js
import axios from 'axios';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase-config';
import { createStudy, updateStudy } from './study-service';
import { createPatient, updatePatient } from './patient-service';

// Configuración de la API del RIS
const RIS_API_URL = 'https://tu-sistema-ris.com/api';
const RIS_API_KEY = 'TU_API_KEY';

// Configurar axios para las peticiones al RIS
const risApi = axios.create({
  baseURL: RIS_API_URL,
  headers: {
    'Authorization': `Bearer ${RIS_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Sincroniza órdenes de trabajo del RIS
 * @returns {Promise<Object>} - Resultado de la sincronización
 */
export async function syncOrdersFromRIS() {
  try {
    // 1. Obtener últimas órdenes del RIS
    const response = await risApi.get('/orders', {
      params: {
        status: 'pending',
        limit: 100
      }
    });
    
    const orders = response.data.orders || [];
    
    // 2. Procesar cada orden
    const results = {
      total: orders.length,
      processed: 0,
      failed: 0,
      created: 0,
      updated: 0,
      errors: []
    };
    
    for (const order of orders) {
      try {
        // Verificar si ya existe una orden con este ID de RIS
        const ordersQuery = query(
          collection(db, 'studies'),
          where('risOrderId', '==', order.orderId)
        );
        
        const existingOrders = await getDocs(ordersQuery);
        
        if (!existingOrders.empty) {
          // Actualizar orden existente
          const existingOrder = existingOrders.docs[0];
          await updateStudy(existingOrder.id, {
            status: mapRisStatusToLocalStatus(order.status),
            modality: order.modality,
            orderDetails: order.details,
            updatedAt: Timestamp.now(),
            lastSyncFromRIS: Timestamp.now()
          });
          
          results.updated++;
        } else {
          // Crear nueva orden
          
          // Buscar si el paciente ya existe
          let patientId;
          const patientsQuery = query(
            collection(db, 'patients'),
            where('risMrn', '==', order.patientMrn)
          );
          
          const existingPatients = await getDocs(patientsQuery);
          
          if (!existingPatients.empty) {
            // Usar paciente existente
            patientId = existingPatients.docs[0].id;
            
            // Actualizar datos del paciente si es necesario
            await updatePatient(patientId, {
              updatedAt: Timestamp.now(),
              lastSyncFromRIS: Timestamp.now()
            });
          } else {
            // Crear nuevo paciente
            const patientData = await getPatientFromRIS(order.patientMrn);
            
            patientId = await createPatient({
              fullName: patientData.fullName,
              documentNumber: patientData.documentNumber,
              birthDate: new Date(patientData.birthDate),
              gender: patientData.gender,
              phone: patientData.phone,
              email: patientData.email,
              address: patientData.address,
              risMrn: order.patientMrn,
              nameLowercase: patientData.fullName.toLowerCase(),
              importedFromRIS: true
            });
          }
          
          // Crear el estudio
          await createStudy({
            patientId,
            risOrderId: order.orderId,
            accessionNumber: order.accessionNumber,
            modality: order.modality,
            studyDescription: order.description,
            scheduledDate: new Date(order.scheduledDate),
            status: mapRisStatusToLocalStatus(order.status),
            priority: order.priority,
            orderDetails: order.details,
            referringPhysician: order.referringPhysician,
            importedFromRIS: true
          });
          
          results.created++;
        }
        
        results.processed++;
      } catch (orderError) {
        console.error(`Error procesando orden ${order.orderId}:`, orderError);
        results.failed++;
        results.errors.push({
          orderId: order.orderId,
          error: orderError.message
        });
      }
    }
    
    // 3. Registrar sincronización
    await addDoc(collection(db, 'syncLogs'), {
      type: 'ris-orders',
      timestamp: Timestamp.now(),
      results
    });
    
    return results;
  } catch (error) {
    console.error('Error en sincronización con RIS:', error);
    throw error;
  }
}

/**
 * Obtiene datos de un paciente desde el RIS
 * @param {string} mrn - Número de registro médico del paciente
 * @returns {Promise<Object>} - Datos del paciente
 */
export async function getPatientFromRIS(mrn) {
  try {
    const response = await risApi.get(`/patients/${mrn}`);
    return response.data.patient;
  } catch (error) {
    console.error(`Error al obtener paciente ${mrn} desde RIS:`, error);
    throw error;
  }
}

/**
 * Envía resultados de un estudio al RIS
 * @param {string} studyId - ID del estudio
 * @returns {Promise<Object>} - Resultado de la operación
 */
export async function sendResultsToRIS(studyId) {
  try {
    // 1. Obtener datos del estudio
    const study = await getStudyById(studyId);
    
    if (!study.risOrderId) {
      throw new Error('Este estudio no tiene un ID de orden en el RIS');
    }
    
    // 2. Obtener informe del estudio
    const report = await getStudyReport(studyId);
    
    if (!report) {
      throw new Error('El estudio no tiene un informe asociado');
    }
    
    // 3. Preparar datos para enviar al RIS
    const reportData = {
      orderId: study.risOrderId,
      accessionNumber: study.accessionNumber,
      reportText: report.findings,
      impression: report.impression,
      reportingPhysician: report.physicianName,
      reportDate: new Date().toISOString(),
      status: 'completed'
    };
    
    // 4. Enviar al RIS
    const response = await risApi.post('/reports', reportData);
    
    // 5. Actualizar estado del estudio en nuestro sistema
    await updateStudy(studyId, {
      reportSentToRIS: true,
      reportSentDate: new Date(),
      risReportId: response.data.reportId
    });
    
    return {
      success: true,
      risReportId: response.data.reportId
    };
  } catch (error) {
    console.error('Error al enviar resultados al RIS:', error);
    throw error;
  }
}

/**
 * Actualiza estado de un estudio en el RIS
 * @param {string} studyId - ID del estudio
 * @param {string} status - Nuevo estado
 * @returns {Promise<Object>} - Resultado de la operación
 */
export async function updateOrderStatusInRIS(studyId, status) {
  try {
    // 1. Obtener datos del estudio
    const study = await getStudyById(studyId);
    
    if (!study.risOrderId) {
      throw new Error('Este estudio no tiene un ID de orden en el RIS');
    }
    
    // 2. Mapear estado a formato RIS
    const risStatus = mapLocalStatusToRisStatus(status);
    
    // 3. Enviar actualización al RIS
    const response = await risApi.patch(`/orders/${study.risOrderId}`, {
      status: risStatus
    });
    
    // 4. Actualizar estudio local
    await updateStudy(studyId, {
      status,
      lastSyncToRIS: Timestamp.now()
    });
    
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    console.error('Error al actualizar estado en RIS:', error);
    throw error;
  }
}

/**
 * Mapea estados del RIS a estados locales
 * @param {string} risStatus - Estado en el RIS
 * @returns {string} - Estado local equivalente
 */
function mapRisStatusToLocalStatus(risStatus) {
  const statusMap = {
    'ordered': 'scheduled',
    'scheduled': 'scheduled',
    'in-progress': 'in-progress',
    'completed': 'completed',
    'reported': 'reported',
    'cancelled': 'cancelled'
  };
  
  return statusMap[risStatus] || 'scheduled';
}

/**
 * Mapea estados locales a estados del RIS
 * @param {string} localStatus - Estado local
 * @returns {string} - Estado RIS equivalente
 */
function mapLocalStatusToRisStatus(localStatus) {
  const statusMap = {
    'scheduled': 'scheduled',
    'in-progress': 'in-progress',
    'completed': 'completed',
    'reported': 'reported',
    'cancelled': 'cancelled'
  };
  
  return statusMap[localStatus] || 'scheduled';
}