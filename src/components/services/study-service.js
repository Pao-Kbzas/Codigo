// src/components/services/study-service.js
import { supabase } from '../../supabase-config';

export const studyService = {
  // Crear un nuevo estudio
  async createStudy(studyData) {
    const { data, error } = await supabase
      .from('studies')
      .insert([studyData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Obtener todos los estudios
  async getAllStudies() {
    const { data, error } = await supabase
      .from('studies')
      .select('*');
    
    if (error) throw error;
    return data;
  },

  // Obtener estudios de un paciente específico
  async getPatientStudies(patientId) {
    const { data, error } = await supabase
      .from('studies')
      .select('*')
      .eq('patient_id', patientId);
    
    if (error) throw error;
    return data;
  },

  // Obtener un estudio por ID
  async getStudyById(id) {
    const { data, error } = await supabase
      .from('studies')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Actualizar un estudio existente
  async updateStudy(id, studyData) {
    const { data, error } = await supabase
      .from('studies')
      .update(studyData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Eliminar un estudio
  async deleteStudy(id) {
    const { error } = await supabase
      .from('studies')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Obtener el reporte de un estudio
  async getStudyReport(studyId) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('study_id', studyId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
  
  // Crear o actualizar un reporte de estudio
  async saveStudyReport(reportData) {
    const { data: existingReport } = await supabase
      .from('reports')
      .select('*')
      .eq('study_id', reportData.study_id)
      .maybeSingle();
    
    let result;
    
    if (existingReport) {
      // Actualizar reporte existente
      const { data, error } = await supabase
        .from('reports')
        .update(reportData)
        .eq('id', existingReport.id)
        .select();
      
      if (error) throw error;
      result = data[0];
    } else {
      // Crear nuevo reporte
      const { data, error } = await supabase
        .from('reports')
        .insert([reportData])
        .select();
      
      if (error) throw error;
      result = data[0];
    }
    
    return result;
  }
};

// Exportaciones individuales para compatibilidad
export const createStudy = studyService.createStudy;
export const getAllStudies = studyService.getAllStudies;
export const getPatientStudies = studyService.getPatientStudies;
export const getStudyById = studyService.getStudyById;
export const updateStudy = studyService.updateStudy;
export const deleteStudy = studyService.deleteStudy;
export const getStudyReport = studyService.getStudyReport;
export const saveStudyReport = studyService.saveStudyReport;