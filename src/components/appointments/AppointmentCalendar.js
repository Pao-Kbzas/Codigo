// src/components/AppointmentCalendar.js
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getDoctorAppointments, checkAvailability } from '../services/appointment-service';
import { 
  createAppointment, 
  updateAppointment, 
  deleteAppointment
 
} from '../services/appointment-service';

const AppointmentCalendar = ({ doctorId, isReadOnly = false }) => {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  
  // Cargar citas al cambiar de vista o doctor
  useEffect(() => {
    if (!doctorId) return;
    
    const loadAppointments = async (start, end) => {
      try {
        const appointments = await getDoctorAppointments(doctorId, start, end);
        
        // Convertir citas a formato de eventos para FullCalendar
        const calendarEvents = appointments.map(appointment => ({
          id: appointment.id,
          title: `${appointment.patientName} - ${appointment.studyType || 'Consulta'}`,
          start: appointment.date,
          end: new Date(appointment.date.getTime() + (appointment.duration || 30) * 60000),
          extendedProps: {
            ...appointment
          }
        }));
        
        setEvents(calendarEvents);
      } catch (error) {
        console.error('Error al cargar citas:', error);
      }
    };
    
    // Cargar citas iniciales (un mes a partir de hoy)
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    
    loadAppointments(today, nextMonth);
  }, [doctorId]);
  
  // Manejar cambio de rango de fechas en el calendario
  const handleDatesSet = (dateInfo) => {
    if (!doctorId) return;
    
    const { start, end } = dateInfo;
    // Cargar citas para el nuevo rango de fechas
    getDoctorAppointments(doctorId, start, end)
      .then(appointments => {
        const calendarEvents = appointments.map(appointment => ({
          id: appointment.id,
          title: `${appointment.patientName} - ${appointment.studyType || 'Consulta'}`,
          start: appointment.date,
          end: new Date(appointment.date.getTime() + (appointment.duration || 30) * 60000),
          extendedProps: {
            ...appointment
          }
        }));
        
        setEvents(calendarEvents);
      })
      .catch(error => {
        console.error('Error al cargar citas:', error);
      });
  };
  
  // Manejar clic en fecha para crear nueva cita
  const handleDateClick = (info) => {
    if (isReadOnly) return;
    
    setSelectedDate(info.date);
    setCurrentAppointment({
      doctorId,
      date: info.date,
      duration: 30,
      patientName: '',
      patientId: '',
      studyType: '',
      notes: ''
    });
    setIsModalOpen(true);
  };
  
  // Manejar clic en evento existente para editar
  const handleEventClick = (info) => {
    const appointment = info.event.extendedProps;
    setCurrentAppointment({
      id: info.event.id,
      ...appointment
    });
    setIsModalOpen(true);
  };
  
  // Guardar cita (crear o actualizar)
  const handleSaveAppointment = async (appointmentData) => {
    try {
      // Verificar disponibilidad primero
      const isAvailable = await checkAvailability(
        appointmentData.doctorId,
        appointmentData.date,
        appointmentData.duration
      );
      
      if (!isAvailable && !appointmentData.id) {
        alert('El horario seleccionado no está disponible. Por favor elija otro horario.');
        return;
      }
      
      if (appointmentData.id) {
        // Actualizar cita existente
        await updateAppointment(appointmentData.id, appointmentData);
      } else {
        // Crear nueva cita
        await createAppointment(appointmentData);
      }
      
      // Recargar citas para mostrar los cambios
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      
      const appointments = await getDoctorAppointments(doctorId, today, nextMonth);
      const calendarEvents = appointments.map(appointment => ({
        id: appointment.id,
        title: `${appointment.patientName} - ${appointment.studyType || 'Consulta'}`,
        start: appointment.date,
        end: new Date(appointment.date.getTime() + (appointment.duration || 30) * 60000),
        extendedProps: {
          ...appointment
        }
      }));
      
      setEvents(calendarEvents);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error al guardar cita:', error);
      alert('Ocurrió un error al guardar la cita. Por favor intente nuevamente.');
    }
  };
  
  // Eliminar cita
  const handleDeleteAppointment = async (appointmentId) => {
    if (!appointmentId) return;
    
    try {
      await deleteAppointment(appointmentId);
      
      // Actualizar lista de eventos
      setEvents(events.filter(event => event.id !== appointmentId));
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error al eliminar cita:', error);
      alert('Ocurrió un error al eliminar la cita. Por favor intente nuevamente.');
    }
  };
  
  return (
    <div className="appointment-calendar">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        slotDuration="00:15:00"
        slotMinTime="08:00:00"
        slotMaxTime="18:00:00"
        events={events}
        datesSet={handleDatesSet}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }}
        height="auto"
        editable={!isReadOnly}
        selectable={!isReadOnly}
      />
      
      {/* Aquí iría el componente modal para crear/editar citas */}
      {isModalOpen && (
        <AppointmentModal
          appointment={currentAppointment}
          onSave={handleSaveAppointment}
          onDelete={handleDeleteAppointment}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

// Componente Modal para crear/editar citas
const AppointmentModal = ({ appointment, onSave, onDelete, onClose }) => {
  const [formData, setFormData] = useState(appointment);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <div className="modal">
      <div className="modal-content">
        <h2>{appointment.id ? 'Editar Cita' : 'Nueva Cita'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Paciente:</label>
            <input
              type="text"
              name="patientName"
              value={formData.patientName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>ID del Paciente:</label>
            <input
              type="text"
              name="patientId"
              value={formData.patientId}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Tipo de Estudio:</label>
            <select
              name="studyType"
              value={formData.studyType}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione un tipo</option>
              <option value="Rayos X">Rayos X</option>
              <option value="Ecografía">Ecografía</option>
              <option value="Tomografía">Tomografía</option>
              <option value="Resonancia">Resonancia</option>
              <option value="Mamografía">Mamografía</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Fecha y Hora:</label>
            <input
              type="datetime-local"
              name="date"
              value={formData.date instanceof Date 
                ? formData.date.toISOString().slice(0, 16) 
                : formData.date}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Duración (minutos):</label>
            <select
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
          
          <div className="form-group">
            <label>Notas:</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn-save">
              Guardar
            </button>
            
            {appointment.id && (
              <button 
                type="button" 
                className="btn-delete"
                onClick={() => onDelete(appointment.id)}
              >
                Eliminar
              </button>
            )}
            
            <button 
              type="button" 
              className="btn-cancel"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentCalendar;