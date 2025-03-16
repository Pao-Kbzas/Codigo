// src/components/services/patient-service.js
import { supabase } from '../../supabase-config';

export const patientService = {
  // Crear un nuevo paciente
  async createPatient(patientData) {
    const { data, error } = await supabase
      .from('patients')
      .insert([patientData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Obtener todos los pacientes
  async getAllPatients() {
    const { data, error } = await supabase
      .from('patients')
      .select('*');
    
    if (error) throw error;
    return data;
  },

  // Obtener un paciente por ID
  async getPatientById(id) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Actualizar un paciente existente
  async updatePatient(id, patientData) {
    const { data, error } = await supabase
      .from('patients')
      .update(patientData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Eliminar un paciente
  async deletePatient(id) {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Buscar pacientes por nombre o ID
  async searchPatients(searchTerm) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,id.eq.${searchTerm}`)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  }
};

// Exportaciones individuales para compatibilidad
export const createPatient = patientService.createPatient;
export const getAllPatients = patientService.getAllPatients;
export const getPatientById = patientService.getPatientById;
export const updatePatient = patientService.updatePatient;
export const deletePatient = patientService.deletePatient;
export const searchPatients = patientService.searchPatients;