// src/components/pages/AppointmentPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  createAppointment, 
  updateAppointment, 
  deleteAppointment,
  checkAvailability
} from '../../services/appointment-service';
import { searchPatients } from '../../services/patient-service';
import AppointmentCalendar from '../appointments/AppointmentCalendar';

const AppointmentPage = ({ isNew = false }) => {
  const [appointment, setAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPatientTerm, setSearchPatientTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [formData, setFormData] = useState({
    doctorId: '',
    patientId: '',
    patientName: '',
    date: new Date().toISOString().slice(0, 16), // Formato YYYY-MM-DDThh:mm
    duration: 30,
    studyType: '',
    notes: ''
  });
  
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  
  // Cargar datos de la cita si no es nueva
  useEffect(() => {
    if (!isNew && appointmentId) {
      loadAppointmentData();
    }
  }, [isNew, appointmentId]);
  
  // Cargar datos de la cita
  const loadAppointmentData = async () => {
    // Esta función sería implementada en un servicio real
    // Aquí simulamos el resultado para este ejemplo
    
    setIsLoading(true);
    
    try {
      // Simular obtención de datos
      // En un caso real, utilizarías un servicio como getAppointmentById(appointmentId)
      const appointmentData = {
        id: appointmentId,
        doctorId: 'doctor123',
        patientId: 'patient456',
        patientName: 'Juan Pérez',
        date: new Date(),
        duration: 30,
        studyType: 'Radiografía',
        notes: 'Primera consulta'
      };
      
      setAppointment(appointmentData);
      
      // Preparar datos del formulario
      setFormData({
        doctorId: appointmentData.doctorId || '',
        patientId: appointmentData.patientId || '',
        patientName: appointmentData.patientName || '',
        date: appointmentData.date ? appointmentData.date.toISOString().slice(0, 16) : '',
        duration: appointmentData.duration || 30,
        studyType: appointmentData.studyType || '',
        notes: appointmentData.notes || ''
      });
    } catch (error) {
      console.error('Error al cargar cita:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Buscar pacientes
  const handleSearchPatient = async () => {
    if (!searchPatientTerm) return;
    
    setIsSearching(true);
    
    try {
      const results = await searchPatients(searchPatientTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Error al buscar pacientes:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Seleccionar paciente de resultados
  const handleSelectPatient = (patient) => {
    setFormData(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: patient.fullName
    }));
    
    // Limpiar búsqueda
    setSearchPatientTerm('');
    setSearchResults([]);
  };
  
  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Verificar disponibilidad
  const handleCheckAvailability = async () => {
    if (!formData.doctorId || !formData.date) {
      alert('Por favor seleccione un médico y una fecha/hora');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const isAvailable = await checkAvailability(
        formData.doctorId,
        new Date(formData.date),
        formData.duration
      );
      
      if (isAvailable) {
        alert('Horario disponible');
      } else {
        alert('Horario no disponible. Por favor seleccione otro horario.');
      }
    } catch (error) {
      console.error('Error al verificar disponibilidad:', error);
      alert('Error al verificar disponibilidad');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Guardar cita
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.patientId || !formData.doctorId) {
      alert('Por favor seleccione un paciente y un médico');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Verificar disponibilidad primero
      const isAvailable = await checkAvailability(
        formData.doctorId,
        new Date(formData.date),
        formData.duration
      );
      
      if (!isAvailable && !appointmentId) {
        alert('Horario no disponible. Por favor seleccione otro horario.');
        setIsLoading(false);
        return;
      }
      
      if (isNew) {
        // Crear nueva cita
        const newAppointmentId = await createAppointment(formData);
        navigate(`/appointments/${newAppointmentId}`);
      } else {
        // Actualizar cita existente
        await updateAppointment(appointmentId, formData);
        navigate(-1);
      }
    } catch (error) {
      console.error('Error al guardar cita:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Eliminar cita
  const handleDelete = async () => {
    if (!appointmentId) return;
    
    if (!window.confirm('¿Está seguro de eliminar esta cita?')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await deleteAppointment(appointmentId);
      navigate('/appointments');
    } catch (error) {
      console.error('Error al eliminar cita:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="appointment-page">
      <header>
        <h1>{isNew ? 'Nueva Cita' : 'Detalles de la Cita'}</h1>
        
        {!isNew && (
          <div className="action-buttons">
            <button onClick={() => navigate(-1)}>Volver</button>
          </div>
        )}
      </header>
      
      <div className="appointment-container">
        <div className="appointment-form-container">
          {isLoading ? (
            <div className="loading">Cargando...</div>
          ) : (
            <form onSubmit={handleSubmit} className="appointment-form">
              <div className="form-section">
                <h2>Información de la Cita</h2>
                
                {/* Selección de paciente */}
                <div className="form-group">
                  <label htmlFor="patientName">Paciente</label>
                  <div className="patient-search">
                    {!formData.patientId ? (
                      <>
                        <div className="search-box">
                          <input
                            type="text"
                            value={searchPatientTerm}
                            onChange={(e) => setSearchPatientTerm(e.target.value)}
                            placeholder="Buscar paciente..."
                          />
                          <button 
                            type="button" 
                            onClick={handleSearchPatient}
                            disabled={isSearching}
                          >
                            Buscar
                          </button>
                        </div>
                        
                        {isSearching && <div className="searching">Buscando...</div>}
                        
                        {searchResults.length > 0 && (
                          <div className="search-results">
                            {searchResults.map(patient => (
                              <div 
                                key={patient.id} 
                                className="patient-item"
                                onClick={() => handleSelectPatient(patient)}
                              >
                                {patient.fullName} - {patient.documentNumber}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="selected-patient">
                        <span>{formData.patientName}</span>
                        <button 
                          type="button" 
                          className="deselect-button"
                          onClick={() => setFormData(prev => ({ ...prev, patientId: '', patientName: '' }))}
                        >
                          Cambiar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Selección de médico */}
                <div className="form-group">
                  <label htmlFor="doctorId">Médico</label>
                  <select
                    id="doctorId"
                    name="doctorId"
                    value={formData.doctorId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar médico</option>
                    <option value="doctor1">Dr. Juan Rodríguez</option>
                    <option value="doctor2">Dra. María López</option>
                    <option value="doctor3">Dr. Roberto Gómez</option>
                  </select>
                </div>
                
                {/* Tipo de estudio */}
                <div className="form-group">
                  <label htmlFor="studyType">Tipo de Estudio</label>
                  <select
                    id="studyType"
                    name="studyType"
                    value={formData.studyType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="Rayos X">Rayos X</option>
                    <option value="Ecografía">Ecografía</option>
                    <option value="Tomografía">Tomografía</option>
                    <option value="Resonancia">Resonancia</option>
                    <option value="Mamografía">Mamografía</option>
                    <option value="Consulta">Consulta General</option>
                  </select>
                </div>
                
                {/* Fecha y hora */}
                <div className="form-group">
                  <label htmlFor="date">Fecha y Hora</label>
                  <div className="date-time-group">
                    <input
                      type="datetime-local"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                    <button 
                      type="button"
                      onClick={handleCheckAvailability}
                      disabled={!formData.doctorId || !formData.date}
                    >
                      Verificar Disponibilidad
                    </button>
                  </div>
                </div>
                
                {/* Duración */}
                <div className="form-group">
                  <label htmlFor="duration">Duración (minutos)</label>
                  <select
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    required
                  >
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                    <option value="90">90 min</option>
                    <option value="120">120 min</option>
                  </select>
                </div>
                
                {/* Notas */}
                <div className="form-group">
                  <label htmlFor="notes">Notas</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>
                
                {/* Botones de acción */}
                <div className="form-actions">
                  <button type="submit" disabled={isLoading}>
                    {isNew ? 'Crear Cita' : 'Guardar Cambios'}
                  </button>
                  
                  {!isNew && (
                    <button 
                      type="button" 
                      className="delete-button"
                      onClick={handleDelete}
                      disabled={isLoading}
                    >
                      Eliminar Cita
                    </button>
                  )}
                  
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => navigate(-1)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
        
        {/* Calendario para referencia */}
        <div className="appointment-calendar-container">
          <h2>Horarios Disponibles</h2>
          <AppointmentCalendar 
            doctorId={formData.doctorId || 'all'}
            isReadOnly={true}
          />
        </div>
      </div>
    </div>
  );
};

export default AppointmentPage;