// src/components/services/orthanc-service.js
import axios from 'axios';

// Configuración de la API de Orthanc
const ORTHANC_URL = process.env.REACT_APP_ORTHANC_URL || 'http://localhost:8042';
const ORTHANC_USERNAME = process.env.REACT_APP_ORTHANC_USERNAME || 'orthanc';
const ORTHANC_PASSWORD = process.env.REACT_APP_ORTHANC_PASSWORD || 'orthanc';

// Configuración básica para las solicitudes a Orthanc
const orthancApi = axios.create({
  baseURL: ORTHANC_URL,
  auth: {
    username: ORTHANC_USERNAME,
    password: ORTHANC_PASSWORD
  }
});

export const orthancService = {
  // Obtener todos los pacientes de Orthanc
  async getPatients() {
    try {
      const response = await orthancApi.get('/patients');
      return response.data;
    } catch (error) {
      console.error('Error al obtener pacientes de Orthanc:', error);
      throw error;
    }
  },

  // Obtener detalles de un paciente específico
  async getPatient(patientId) {
    try {
      const response = await orthancApi.get(`/patients/${patientId}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener paciente ${patientId}:`, error);
      throw error;
    }
  },

  // Obtener todos los estudios de un paciente
  async getPatientStudies(patientId) {
    try {
      const response = await orthancApi.get(`/patients/${patientId}/studies`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener estudios del paciente ${patientId}:`, error);
      throw error;
    }
  },

  // Obtener detalles de un estudio específico
  async getStudy(studyId) {
    try {
      const response = await orthancApi.get(`/studies/${studyId}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener estudio ${studyId}:`, error);
      throw error;
    }
  },

  // Obtener todas las series de un estudio
  async getStudySeries(studyId) {
    try {
      const response = await orthancApi.get(`/studies/${studyId}/series`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener series del estudio ${studyId}:`, error);
      throw error;
    }
  },

  // Obtener todas las instancias (imágenes) de una serie
  async getSeriesInstances(seriesId) {
    try {
      const response = await orthancApi.get(`/series/${seriesId}/instances`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener instancias de la serie ${seriesId}:`, error);
      throw error;
    }
  },

  // Obtener la URL para mostrar una instancia DICOM
  getInstanceUrl(instanceId) {
    return `${ORTHANC_URL}/instances/${instanceId}/file`;
  },

  // Subir un archivo DICOM a Orthanc
  async uploadDicom(dicomFile) {
    try {
      const formData = new FormData();
      formData.append('dicom', dicomFile);
      
      const response = await orthancApi.post('/instances', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al subir archivo DICOM:', error);
      throw error;
    }
  }
};

// Exportaciones individuales para compatibilidad
export const getPatients = orthancService.getPatients;
export const getPatient = orthancService.getPatient;
export const getPatientStudies = orthancService.getPatientStudies;
export const getStudy = orthancService.getStudy;
export const getStudySeries = orthancService.getStudySeries;
export const getSeriesInstances = orthancService.getSeriesInstances;
export const getInstanceUrl = orthancService.getInstanceUrl;
export const uploadDicom = orthancService.uploadDicom;