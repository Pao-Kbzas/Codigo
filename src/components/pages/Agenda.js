// src/pages/Agenda.js
import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Paper, 
  Box, 
  Button, 
  Grid, 
  Tabs, 
  Tab,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';
import { format } from 'date-fns';
import NuevaCitaForm from '../NuevaCitaForm';

// Registrar el locale español
registerLocale('es', es);

// Datos de ejemplo para citas
const CITAS_EJEMPLO = [
  {
    id: 1,
    paciente: "María González",
    hora: "09:00",
    tipo: "Ecografía Abdominal",
    estado: "confirmada"
  },
  {
    id: 2,
    paciente: "Juan Pérez",
    hora: "10:30",
    tipo: "Ecografía Pélvica",
    estado: "pendiente"
  },
  {
    id: 3,
    paciente: "Carlos Rodríguez",
    hora: "11:45",
    tipo: "Ecografía Obstétrica",
    estado: "completada"
  },
  {
    id: 4,
    paciente: "Ana Martínez",
    hora: "15:00",
    tipo: "Ecografía Abdominal",
    estado: "cancelada"
  }
];

function Agenda() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tabValue, setTabValue] = useState(0);
  const [showNewAppointmentForm, setShowNewAppointmentForm] = useState(false);
  const [citas, setCitas] = useState(CITAS_EJEMPLO);
  
  // Función para obtener citas (simulada, luego conectarías con tu backend)
  const fetchCitas = (fecha) => {
    // Aquí eventualmente conectarías con tu API para cargar citas reales
    console.log('Obteniendo citas para:', format(fecha, 'yyyy-MM-dd'));
    return CITAS_EJEMPLO;
  };
  
  // Manejador para cambio de fecha
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    const citasDelDia = fetchCitas(newDate);
    setCitas(citasDelDia);
  };
  
  // Manejador para cambio de tabs
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Función para determinar el color según el estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmada': return 'success';
      case 'pendiente': return 'warning';
      case 'completada': return 'info';
      case 'cancelada': return 'error';
      default: return 'default';
    }
  };
  
  // Función corregida para guardar una nueva cita
  const handleSaveCita = (formData) => {
    console.log('Guardando nueva cita:', formData);
    
    try {
      // Verificar que formData y sus propiedades existen antes de usarlas
      if (!formData) {
        throw new Error('Datos del formulario no disponibles');
      }
      
      // Obtener los datos del paciente de forma segura
      const nombrePaciente = formData.paciente?.nombre || 'Nombre';
      const apellidoPaciente = formData.paciente?.apellido || 'Sin especificar';
      const horaCita = formData.cita?.hora || 'No especificada';
      
      // Obtener los estudios de forma segura
      let tipoEstudios = 'No especificado';
      if (formData.estudios && Array.isArray(formData.estudios) && formData.estudios.length > 0) {
        tipoEstudios = formData.estudios.map(e => e.nombre || 'Estudio').join(', ');
      }
      
      // Crear el objeto de cita con datos seguros
      const nuevaCita = {
        id: Math.floor(Math.random() * 1000),
        paciente: `${nombrePaciente} ${apellidoPaciente}`.trim(),
        hora: horaCita,
        tipo: tipoEstudios,
        estado: 'pendiente'
      };
      
      // Añadir a la lista local y actualizar estado
      setCitas(prevCitas => [...prevCitas, nuevaCita]);
    } catch (error) {
      console.error('Error al guardar la cita:', error);
      
      // Crear una cita genérica en caso de error
      const citaGenerica = {
        id: Math.floor(Math.random() * 1000),
        paciente: 'Paciente sin especificar',
        hora: 'Pendiente',
        tipo: 'Consulta general',
        estado: 'pendiente'
      };
      
      setCitas(prevCitas => [...prevCitas, citaGenerica]);
    } finally {
      // Cerrar el formulario en cualquier caso
      setShowNewAppointmentForm(false);
    }
  };
  
  // Filtrar las citas según la pestaña seleccionada
  const filteredAppointments = citas.filter(cita => {
    if (tabValue === 0) return true; // Todas
    if (tabValue === 1) return cita.estado === 'confirmada' || cita.estado === 'pendiente';
    if (tabValue === 2) return cita.estado === 'completada';
    if (tabValue === 3) return cita.estado === 'cancelada';
    return true;
  });

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Agenda de Citas
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => setShowNewAppointmentForm(true)}
        >
          Nueva Cita
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {/* Calendario */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Calendario</Typography>
              <IconButton size="small" onClick={() => handleDateChange(new Date())}>
                <RefreshIcon />
              </IconButton>
            </Box>
            <div className="custom-calendar-container">
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                locale="es"
                inline
                dateFormat="Pp"
                calendarClassName="custom-calendar"
              />
            </div>
          </Paper>
        </Grid>
        
        {/* Lista de citas */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Citas para {format(selectedDate, 'PPPP', { locale: es })}
            </Typography>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Todas" />
                <Tab label="Programadas" />
                <Tab label="Completadas" />
                <Tab label="Canceladas" />
              </Tabs>
            </Box>
            
            {filteredAppointments.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No hay citas para mostrar en esta categoría.
              </Typography>
            ) : (
              <List>
                {filteredAppointments.map((cita) => (
                  <ListItem 
                    key={cita.id}
                    divider
                    secondaryAction={
                      <Chip 
                        label={cita.estado} 
                        color={getStatusColor(cita.estado)}
                        size="small"
                      />
                    }
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <ListItemText
                      primary={`${cita.hora} - ${cita.paciente}`}
                      secondary={cita.tipo}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Formulario de nueva cita (modal) */}
      {showNewAppointmentForm && (
        <NuevaCitaForm 
          onClose={() => setShowNewAppointmentForm(false)}
          selectedDate={selectedDate}
          onSave={handleSaveCita}
        />
      )}
    </>
  );
}

export default Agenda;