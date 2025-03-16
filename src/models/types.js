/**
 * Definiciones de tipos para la gestión de citas
 */

// Ejemplo de estructura de cita
export const CITA_EXAMPLE = {
    id: 'cita-001',
    pacienteId: 'paciente-001',
    fecha: '2025-03-15',
    horaInicio: '09:00',
    horaFin: '09:30',
    tipo: 'Ecografía Abdominal',
    estado: 'Programada', // Programada, Completada, Cancelada
    notas: 'Paciente debe venir en ayunas',
    createdAt: '2025-03-14T14:30:00Z',
    updatedAt: '2025-03-14T14:30:00Z'
  };
  
  // Ejemplo de estructura de paciente
  export const PACIENTE_EXAMPLE = {
    id: 'paciente-001',
    cedula: '1234567890',
    nombre: 'Juan Pérez',
    fechaNacimiento: '1980-05-10',
    genero: 'Masculino',
    telefono: '0991234567',
    email: 'juan.perez@example.com',
    direccion: 'Calle Principal 123'
  };
  
  // Estados posibles de una cita
  export const ESTADOS_CITA = [
    'Programada',
    'Confirmada',
    'En Espera',
    'En Proceso',
    'Completada',
    'Cancelada',
    'No Asistió'
  ];
  
  // Tipos de examen disponibles
  export const TIPOS_EXAMEN = [
    'Ecografía Abdominal',
    'Ecografía Pélvica',
    'Ecografía Obstétrica',
    'Ecografía Transvaginal',
    'Ecografía Mamaria',
    'Ecografía Tiroidea',
    'Ecografía Testicular',
    'Ecografía Muscular',
    'Ecografía Doppler Venoso',
    'Ecografía Doppler Arterial'
  ];