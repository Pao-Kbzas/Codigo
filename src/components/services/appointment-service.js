// src/components/services/appointment-service.js
import { supabase } from '../../supabase-config';

export const appointmentService = {
  // Crear una nueva cita
  async createAppointment(appointmentData) {
    const { data, error } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Obtener todas las citas
  async getAllAppointments() {
    const { data, error } = await supabase
      .from('appointments')
      .select('*');
    
    if (error) throw error;
    return data;
  },

  // Obtener citas de un paciente específico
  async getPatientAppointments(patientId) {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId);
    
    if (error) throw error;
    return data;
  },

  // Obtener citas de un doctor específico
  async getDoctorAppointments(doctorId) {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', doctorId);
    
    if (error) throw error;
    return data;
  },

  // Verificar disponibilidad de un doctor en una fecha/hora específica
  async checkAvailability(doctorId, date, startTime, endTime) {
    const startDateTime = new Date(`${date}T${startTime}`).toISOString();
    const endDateTime = new Date(`${date}T${endTime}`).toISOString();
    
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', doctorId)
      .lt('start_time', endDateTime)
      .gt('end_time', startDateTime);
    
    if (error) throw error;
    return data.length === 0; // Retorna true si no hay conflictos
  },

  // Actualizar una cita existente
  async updateAppointment(id, appointmentData) {
    const { data, error } = await supabase
      .from('appointments')
      .update(appointmentData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Eliminar una cita
  async deleteAppointment(id) {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};

// Exportaciones individuales para compatibilidad
export const createAppointment = appointmentService.createAppointment;
export const getAllAppointments = appointmentService.getAllAppointments;
export const getPatientAppointments = appointmentService.getPatientAppointments;
export const getDoctorAppointments = appointmentService.getDoctorAppointments;
export const checkAvailability = appointmentService.checkAvailability;
export const updateAppointment = appointmentService.updateAppointment;
export const deleteAppointment = appointmentService.deleteAppointment;