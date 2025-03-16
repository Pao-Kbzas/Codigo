import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Grid,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { es } from 'date-fns/locale';
import { TIPOS_EXAMEN } from '../../models/types';

// Pasos del formulario
const pasos = ['Datos del Paciente', 'Fecha y Hora', 'Tipo de Examen', 'Confirmación'];

function FormularioCita() {
  const [pasoActivo, setPasoActivo] = useState(0);
  const [datosCita, setDatosCita] = useState({
    paciente: {
      cedula: '',
      nombre: '',
      telefono: '',
      email: ''
    },
    fecha: null,
    hora: null,
    tipo: '',
    notas: ''
  });

  // Manejadores para formulario
  const handlePacienteChange = (e) => {
    const { name, value } = e.target;
    setDatosCita({
      ...datosCita,
      paciente: {
        ...datosCita.paciente,
        [name]: value
      }
    });
  };

  const handleCitaChange = (e) => {
    const { name, value } = e.target;
    setDatosCita({
      ...datosCita,
      [name]: value
    });
  };

  const handleDateChange = (newDate) => {
    setDatosCita({
      ...datosCita,
      fecha: newDate
    });
  };

  const handleTimeChange = (newTime) => {
    setDatosCita({
      ...datosCita,
      hora: newTime
    });
  };

  // Navegación entre pasos
  const handleNext = () => {
    setPasoActivo((prevPaso) => prevPaso + 1);
  };

  const handleBack = () => {
    setPasoActivo((prevPaso) => prevPaso - 1);
  };

  // Envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Datos de la cita:', datosCita);
    alert('Cita registrada exitosamente!');
    // Aquí eventualmente enviaríamos los datos al backend
  };

  // Renderizado condicional según el paso activo
  const renderPasoActivo = () => {
    switch (pasoActivo) {
      case 0:
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Datos del Paciente
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cédula"
                  name="cedula"
                  value={datosCita.paciente.cedula}
                  onChange={handlePacienteChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre Completo"
                  name="nombre"
                  value={datosCita.paciente.nombre}
                  onChange={handlePacienteChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  name="telefono"
                  value={datosCita.paciente.telefono}
                  onChange={handlePacienteChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  name="email"
                  type="email"
                  value={datosCita.paciente.email}
                  onChange={handlePacienteChange}
                />
              </Grid>
            </Grid>
          </Box>
        );
      
      case 1:
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Fecha y Hora
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <DatePicker
                    label="Fecha de la Cita"
                    value={datosCita.fecha}
                    onChange={handleDateChange}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                    minDate={new Date()}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <TimePicker
                    label="Hora de la Cita"
                    value={datosCita.hora}
                    onChange={handleTimeChange}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </Box>
        );
      
      case 2:
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Tipo de Examen
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel id="tipo-examen-label">Tipo de Examen</InputLabel>
                  <Select
                    labelId="tipo-examen-label"
                    name="tipo"
                    value={datosCita.tipo}
                    onChange={handleCitaChange}
                    label="Tipo de Examen"
                  >
                    {TIPOS_EXAMEN.map((tipo) => (
                      <MenuItem key={tipo} value={tipo}>
                        {tipo}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notas adicionales"
                  name="notas"
                  value={datosCita.notas}
                  onChange={handleCitaChange}
                  multiline
                  rows={4}
                />
              </Grid>
            </Grid>
          </Box>
        );
      
      case 3:
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Confirmar Cita
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  <strong>Paciente:</strong> {datosCita.paciente.nombre}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Cédula:</strong> {datosCita.paciente.cedula}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Teléfono:</strong> {datosCita.paciente.telefono}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Correo:</strong> {datosCita.paciente.email || 'No especificado'}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Fecha:</strong> {datosCita.fecha ? datosCita.fecha.toLocaleDateString('es-ES') : 'No especificada'}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Hora:</strong> {datosCita.hora ? datosCita.hora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'No especificada'}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Tipo de Examen:</strong> {datosCita.tipo}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Notas:</strong> {datosCita.notas || 'Sin notas adicionales'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        );
      
      default:
        return <Typography>Paso desconocido</Typography>;
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 3 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Registrar Nueva Cita
      </Typography>
      
      <Stepper activeStep={pasoActivo} sx={{ mb: 4 }}>
        {pasos.map((paso) => (
          <Step key={paso}>
            <StepLabel>{paso}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      <form onSubmit={pasoActivo === pasos.length - 1 ? handleSubmit : undefined}>
        {renderPasoActivo()}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            disabled={pasoActivo === 0}
            onClick={handleBack}
          >
            Atrás
          </Button>
          
          {pasoActivo === pasos.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              type="submit"
            >
              Registrar Cita
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
            >
              Siguiente
            </Button>
          )}
        </Box>
      </form>
    </Paper>
  );
}

export default FormularioCita;