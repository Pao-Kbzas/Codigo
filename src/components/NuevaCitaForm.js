import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CustomDatePicker from './CustomDatePicker';

// Pasos del formulario
const PASOS = ['Datos del Paciente', 'Datos Demográficos', 'Detalles Médicos', 'Estudios y Horario', 'Pagos', 'Confirmación'];

// Tipos de examen de respaldo en caso de fallar la conexión con Google Sheets
const TIPOS_EXAMEN_RESPALDO = [
  { id: 1, nombre: 'Ecografía Abdominal', duracion: 20, costo: 45.00 },
  { id: 2, nombre: 'Ecografía Pélvica', duracion: 20, costo: 40.00 },
  { id: 3, nombre: 'Ecografía Obstétrica', duracion: 30, costo: 50.00 }
];

// Función para generar horarios disponibles (función de respaldo)
function generarHorariosDisponibles() {
  const horarios = [];
  // Desde 8:00 AM hasta 7:00 PM cada 15 minutos
  for (let hora = 8; hora <= 19; hora++) {
    for (let minuto = 0; minuto < 60; minuto += 15) {
      if (hora === 19 && minuto > 0) continue; // Solo hasta 7:00 PM
      
      const horaFormateada = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
      horarios.push(horaFormateada);
    }
  }
  return horarios;
}
const NuevaCitaForm = ({ onClose, selectedDate, onSave, citaExistente }) => {
    
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
      paciente: {
        cedula: '',
        nombre: '',
        apellido: '',
        fechaNacimiento: null,
        edad: '',
        sexo: '',
        telefono: '',
        email: '',
        direccion: '',
        ciudad: '',
        provincia: ''
      },
      datosMedicos: {
        tieneOrdenMedica: false,
        medicoReferente: '',
        observaciones: ''
      },
      estudios: [],
      nuevoEstudio: {
        nombre: '',
        duracion: '',
        costo: ''
      },
      cita: {
        fecha: selectedDate || new Date(),
        hora: null,
        duracionTotal: 0,
        costoTotal: 0
      },
      pago: {
        metodoPago: 'efectivo',
        aplicarDescuento: false,
        tipoDescuento: 'porcentaje',
        valorDescuento: '',
        motivoDescuento: '',
        valorFinal: 0
      }
    });
  
    // Estado para tipos de estudios disponibles cargados desde Google Sheets
    const [tiposEstudios, setTiposEstudios] = useState([]);
    
    // Estado para controlar opciones de horarios
    const [horariosDisponibles, setHorariosDisponibles] = useState([]);
    
    
    // Estados para manejar carga y notificaciones
    const [loading, setLoading] = useState(false);
    const [loadingEstudios, setLoadingEstudios] = useState(false);
    const [snackbar, setSnackbar] = useState({
      open: false,
      message: '',
      severity: 'info'
    });
  
    // Referencia para funciones con dependencias circulares
    const actualizarTotalesRef = useRef(null);
    // Efecto para cargar tipos de estudios desde Google Sheets
  useEffect(() => {
    cargarTiposEstudios();
  }, []);

  // Efecto para cargar horarios disponibles cuando cambia la fecha
  useEffect(() => {
    if (formData.cita.fecha) {
      verificarHorariosDisponibles(formData.cita.fecha);
    }
  }, [formData.cita.fecha, formData.cita.duracionTotal]);

  // Efecto para cargar datos de cita existente si se proporciona
  useEffect(() => {
    if (citaExistente) {
      // Aquí implementaríamos la carga de datos de la cita existente
      console.log("Cargar datos de cita existente:", citaExistente);
      // TODO: Implementar la carga de datos de la cita existente
    }
  }, [citaExistente]);

  // Función para calcular el valor final con descuentos
  const calcularValorFinal = useCallback(() => {
    const { aplicarDescuento, tipoDescuento, valorDescuento } = formData.pago;
    const { costoTotal } = formData.cita;
    
    if (!aplicarDescuento || !valorDescuento) {
      setFormData(prev => ({
        ...prev,
        pago: {
          ...prev.pago,
          valorFinal: costoTotal
        }
      }));
      return;
    }
    
    let descuento = 0;
    if (tipoDescuento === 'porcentaje') {
      descuento = (parseFloat(valorDescuento) / 100) * costoTotal;
    } else {
      descuento = parseFloat(valorDescuento);
    }
    
    // Asegurar que el descuento no sea mayor que el costo total
    descuento = Math.min(descuento, costoTotal);
    
    const valorFinal = costoTotal - descuento;
    
    setFormData(prev => ({
      ...prev,
      pago: {
        ...prev.pago,
        valorFinal
      }
    }));
  }, [formData.pago, formData.cita.costoTotal]);

  // Función para actualizar totales de la cita
  const actualizarTotales = useCallback((estudios) => {
    const duracionTotal = estudios.reduce((total, estudio) => total + estudio.duracion, 0);
    const costoTotal = estudios.reduce((total, estudio) => total + estudio.costo, 0);
    
    setFormData(prev => ({
      ...prev,
      cita: {
        ...prev.cita,
        duracionTotal,
        costoTotal
      },
      pago: {
        ...prev.pago,
        valorFinal: costoTotal
      }
    }));
    
    // Recalcular valor final si hay descuento
    setTimeout(calcularValorFinal, 0);
  }, [calcularValorFinal]);
  
  // Almacenar la referencia para usar en las dependencias circulares
  useEffect(() => {
    actualizarTotalesRef.current = actualizarTotales;
  }, [actualizarTotales]);
  // Función para cargar tipos de estudios desde Google Sheets
  const cargarTiposEstudios = useCallback(() => {
    setLoadingEstudios(true);
    
    // Verificar si estamos en un entorno donde google.script.run está disponible
    if (typeof window !== 'undefined' && 
        typeof window.google !== 'undefined' && 
        window.google.script && 
        window.google.script.run) {
      // Llamar a la función de Google Apps Script
      window.google.script.run
        .withSuccessHandler(handleTiposEstudiosSuccess)
        .withFailureHandler(handleTiposEstudiosError)
        .obtenerTiposEstudios();
    } else {
      // Si no está disponible, usar datos de respaldo
      setTimeout(() => {
        handleTiposEstudiosSuccess(TIPOS_EXAMEN_RESPALDO);
      }, 500);
    }
  }, []);

  // Manejador de éxito para carga de tipos de estudios
  const handleTiposEstudiosSuccess = useCallback((tipos) => {
    setLoadingEstudios(false);
    if (Array.isArray(tipos) && tipos.length > 0) {
      setTiposEstudios(tipos);
    } else {
      console.warn("No se pudieron cargar los tipos de estudios desde el servidor");
      setTiposEstudios(TIPOS_EXAMEN_RESPALDO);
    }
  }, []);

  // Manejador de error para carga de tipos de estudios
  const handleTiposEstudiosError = useCallback((error) => {
    setLoadingEstudios(false);
    console.error("Error al cargar tipos de estudios:", error);
    setSnackbar({
      open: true,
      message: "Error al cargar tipos de estudios. Usando datos predeterminados.",
      severity: "warning"
    });
    setTiposEstudios(TIPOS_EXAMEN_RESPALDO);
  }, []);

  // Función para verificar horarios disponibles
  const verificarHorariosDisponibles = useCallback(async (fecha) => {
    try {
      setLoading(true);
      
      // Formatear fecha para API: yyyy-MM-dd
      const fechaFormateada = fecha.toISOString().split('T')[0];
      
      // Verificar si estamos en un entorno donde google.script.run está disponible
      if (typeof window !== 'undefined' && 
          typeof window.google !== 'undefined' && 
          window.google.script && 
          window.google.script.run) {
        // Llamada a la función de Apps Script
        window.google.script.run
          .withSuccessHandler(handleHorariosSuccess)
          .withFailureHandler(handleError)
          .obtenerHorariosDisponibles(fechaFormateada, formData.cita.duracionTotal || 15);
      } else {
        // Si no está disponible, usar función de respaldo
        setTimeout(() => {
          handleHorariosSuccess(generarHorariosDisponibles());
        }, 500);
      }
    } catch (error) {
      console.error("Error al verificar horarios:", error);
      setSnackbar({
        open: true,
        message: "Error al cargar horarios disponibles",
        severity: "error"
      });
      // Cargar horarios por defecto si falla la API
      setHorariosDisponibles(generarHorariosDisponibles());
      setLoading(false);
    }
  }, [formData.cita.duracionTotal]);

  // Manejador de éxito para horarios
  const handleHorariosSuccess = useCallback((horarios) => {
    setLoading(false);
    if (Array.isArray(horarios) && horarios.length > 0) {
      setHorariosDisponibles(horarios);
    } else {
      setSnackbar({
        open: true,
        message: "No hay horarios disponibles para esta fecha",
        severity: "warning"
      });
      setHorariosDisponibles([]);
    }
  }, []);

  // Manejador de errores
  const handleError = useCallback((error) => {
    setLoading(false);
    console.error("Error en la operación:", error);
    setSnackbar({
      open: true,
      message: "Error: " + (error.message || "Se produjo un error en la operación"),
      severity: "error"
    });
  }, []);
  // Manejadores para los diferentes tipos de campos
  const handleInputChange = useCallback((section, name, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value
      }
    }));
  }, []);

  const handlePatientInputChange = useCallback((e) => {
    const { name, value } = e.target;
    handleInputChange('paciente', name, value);
  }, [handleInputChange]);

  const handleMedicalInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;
    handleInputChange('datosMedicos', name, inputValue);
  }, [handleInputChange]);

  const handleAppointmentInputChange = useCallback((e) => {
    const { name, value } = e.target;
    handleInputChange('cita', name, value);
  }, [handleInputChange]);

  const handlePaymentInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;
    
    handleInputChange('pago', name, inputValue);
    
    // Recalcular valor final si cambia algo relacionado con el pago
    if (name === 'aplicarDescuento' || name === 'tipoDescuento' || name === 'valorDescuento') {
      // Usar setTimeout para asegurar que el estado se haya actualizado
      setTimeout(calcularValorFinal, 0);
    }
  }, [handleInputChange, calcularValorFinal]);

  const handleNewStudyInputChange = useCallback((e) => {
    const { name, value } = e.target;
    handleInputChange('nuevoEstudio', name, value);
  }, [handleInputChange]);

  const handleBirthDateChange = useCallback((newDate) => {
    // Actualizar fecha de nacimiento
    handleInputChange('paciente', 'fechaNacimiento', newDate);
    
    // Calcular edad automáticamente
    if (newDate) {
      const today = new Date();
      let age = today.getFullYear() - newDate.getFullYear();
      const monthDiff = today.getMonth() - newDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < newDate.getDate())) {
        age--;
      }
      
      handleInputChange('paciente', 'edad', age.toString());
    }
  }, [handleInputChange]);

  const handleAppointmentDateChange = useCallback((newDate) => {
    handleInputChange('cita', 'fecha', newDate);
    // Se actualizarán los horarios automáticamente mediante el useEffect
  }, [handleInputChange]);
  // Manejo de estudios/exámenes
  const addEstudio = useCallback((estudio) => {
    // Verificar si ya está seleccionado
    const yaSeleccionado = formData.estudios.some(e => e.id === estudio.id);
    if (yaSeleccionado) return;
    
    const nuevosEstudios = [...formData.estudios, estudio];
    setFormData(prev => ({
      ...prev,
      estudios: nuevosEstudios
    }));
    
    // Actualizar duración y costo total usando la referencia
    if (actualizarTotalesRef.current) {
      actualizarTotalesRef.current(nuevosEstudios);
    }
  }, [formData.estudios]);

  const removeEstudio = useCallback((estudioId) => {
    const nuevosEstudios = formData.estudios.filter(e => e.id !== estudioId);
    setFormData(prev => ({
      ...prev,
      estudios: nuevosEstudios
    }));
    
    // Actualizar duración y costo total usando la referencia
    if (actualizarTotalesRef.current) {
      actualizarTotalesRef.current(nuevosEstudios);
    }
  }, [formData.estudios]);

  const addNuevoEstudio = useCallback(() => {
    const { nombre, duracion, costo } = formData.nuevoEstudio;
    
    if (!nombre || !duracion || !costo) {
      setSnackbar({
        open: true,
        message: "Por favor complete todos los campos del nuevo estudio",
        severity: "warning"
      });
      return;
    }
    
    // Crear un ID único para el nuevo estudio
    const nuevoId = Math.max(
      0, 
      ...tiposEstudios.map(e => e.id || 0), 
      ...formData.estudios.map(e => e.id || 0)
    ) + 1;
    
    const nuevoEstudio = {
      id: nuevoId,
      nombre,
      duracion: parseInt(duracion),
      costo: parseFloat(costo)
    };
    
    const nuevosEstudios = [...formData.estudios, nuevoEstudio];
    
    setFormData(prev => ({
      ...prev,
      estudios: nuevosEstudios,
      nuevoEstudio: {
        nombre: '',
        duracion: '',
        costo: ''
      }
    }));
    
    // Actualizar duración y costo total usando la referencia
    if (actualizarTotalesRef.current) {
      actualizarTotalesRef.current(nuevosEstudios);
    }
  }, [formData.estudios, formData.nuevoEstudio, tiposEstudios]);
  // Búsqueda de paciente por cédula
  const buscarPaciente = useCallback(() => {
    const cedula = formData.paciente.cedula;
    if (!cedula || cedula.length < 8) {
      setSnackbar({
        open: true,
        message: "Por favor ingrese una cédula o documento válido",
        severity: "warning"
      });
      return;
    }

    setLoading(true);
    
    // Verificar si estamos en un entorno donde google.script.run está disponible
    if (typeof window !== 'undefined' && 
        typeof window.google !== 'undefined' && 
        window.google.script && 
        window.google.script.run) {
      // Llamar a la función de Google Apps Script
      window.google.script.run
        .withSuccessHandler(handlePacienteEncontrado)
        .withFailureHandler(handlePacienteNoEncontrado)
        .buscarPacientePorCedula(cedula);
    } else {
      // Simulación para desarrollo local
      setTimeout(() => {
        if (cedula === '1234567890') {
          handlePacienteEncontrado({
            cedula: '1234567890',
            nombre: 'Juan',
            apellido: 'Pérez',
            fechaNacimiento: '1985-06-15',
            edad: '38',
            sexo: 'masculino',
            telefono: '0991234567',
            email: 'juan.perez@example.com',
            direccion: 'Av. Principal 123',
            ciudad: 'Quito',
            provincia: 'Pichincha'
          });
        } else {
          handlePacienteNoEncontrado({ message: "Paciente no encontrado" });
        }
      }, 500);
    }
  }, [formData.paciente.cedula]);

  // Manejador cuando se encuentra un paciente
  const handlePacienteEncontrado = useCallback((paciente) => {
    setLoading(false);
    
    if (!paciente || !paciente.cedula) {
      handlePacienteNoEncontrado({ message: "El paciente no existe en la base de datos" });
      return;
    }
    
    // Convertir la fecha de nacimiento de string a objeto Date
    let fechaNacimiento = null;
    if (paciente.fechaNacimiento) {
      try {
        fechaNacimiento = new Date(paciente.fechaNacimiento);
      } catch (error) {
        console.error("Error al parsear la fecha de nacimiento:", error);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      paciente: {
        ...prev.paciente,
        nombre: paciente.nombre || '',
        apellido: paciente.apellido || '',
        fechaNacimiento: fechaNacimiento,
        edad: paciente.edad ? paciente.edad.toString() : '',
        sexo: paciente.sexo || '',
        telefono: paciente.telefono || '',
        email: paciente.email || '',
        direccion: paciente.direccion || '',
        ciudad: paciente.ciudad || '',
        provincia: paciente.provincia || ''
      }
    }));
    
    setSnackbar({
      open: true,
      message: "Paciente encontrado correctamente",
      severity: "success"
    });
  }, []);

  // Manejador cuando no se encuentra un paciente
  const handlePacienteNoEncontrado = useCallback((error) => {
    setLoading(false);
    console.error("Error al buscar paciente:", error);
    
    setSnackbar({
      open: true,
      message: "No se encontró al paciente. Puede registrar sus datos manualmente.",
      severity: "info"
    });
  }, []);
  // Navegación de pasos
  const handleNext = useCallback(() => {
    // Validación según el paso actual
    if (activeStep === 0) {
      // Validar datos básicos del paciente
      const { cedula, nombre, apellido } = formData.paciente;
      if (!cedula || !nombre || !apellido) {
        setSnackbar({
          open: true,
          message: "Complete los campos requeridos antes de continuar",
          severity: "warning"
        });
        return;
      }
    } else if (activeStep === 3 && formData.estudios.length === 0) {
      setSnackbar({
        open: true,
        message: "Debe seleccionar al menos un estudio",
        severity: "warning"
      });
      return;
    } else if (activeStep === 3 && !formData.cita.hora) {
      setSnackbar({
        open: true,
        message: "Debe seleccionar una hora para la cita",
        severity: "warning"
      });
      return;
    }
    
    setActiveStep((prevStep) => prevStep + 1);
  }, [activeStep, formData.paciente, formData.estudios.length, formData.cita.hora]);

  const handleBack = useCallback(() => {
    setActiveStep((prevStep) => prevStep - 1);
  }, []);

  // Envío del formulario para registrar la cita
  const handleSubmit = useCallback(() => {
    setLoading(true);
    
    // Preparar datos para el registro en el formato esperado por el backend
    const datosRegistro = {
      paciente: {
        ...formData.paciente,
        fechaNacimiento: formData.paciente.fechaNacimiento ? formData.paciente.fechaNacimiento.toISOString().split('T')[0] : ''
      },
      datosMedicos: formData.datosMedicos,
      estudios: formData.estudios.map(est => ({
        id: est.id,
        nombre: est.nombre,
        duracion: est.duracion,
        costo: est.costo
      })),
      cita: {
        fecha: formData.cita.fecha.toISOString().split('T')[0],
        hora: formData.cita.hora,
        duracionTotal: formData.cita.duracionTotal,
        costoTotal: formData.cita.costoTotal
      },
      pago: {
        ...formData.pago,
        valorDescuento: formData.pago.valorDescuento ? parseFloat(formData.pago.valorDescuento) : 0
      }
    };
    
    // Verificar si estamos en un entorno donde google.script.
    // Verificar si estamos en un entorno donde google.script.run está disponible
    if (typeof window !== 'undefined' && 
        typeof window.google !== 'undefined' && 
        window.google.script && 
        window.google.script.run) {
      // Llamar a la función de Google Apps Script para registrar la cita
      window.google.script.run
        .withSuccessHandler(handleCitaRegistrada)
        .withFailureHandler(handleErrorRegistro)
        .registrarCita(datosRegistro);
    } else {
      // Simulación para desarrollo local
      setTimeout(() => {
        handleCitaRegistrada({
          success: true,
          id: 'simulado-' + Date.now(),
          pacienteId: formData.paciente.cedula,
          mensaje: 'Cita registrada exitosamente (simulación)'
        });
      }, 1000);
    }
  }, [formData]);

  // Manejador de cita registrada con éxito
  const handleCitaRegistrada = useCallback((resultado) => {
    setLoading(false);
    
    // Si resultado trae un ID u otro indicador de éxito
    if (resultado && (resultado.id || resultado.success)) {
      setSnackbar({
        open: true,
        message: "¡Cita registrada exitosamente! " + (resultado.eventoCalendarioId ? "Evento agregado al calendario." : ""),
        severity: "success"
      });
      
      // Notificar al componente padre
      if (onSave) {
        onSave(resultado);
      }
      
      // Cerrar el formulario después de 2 segundos
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      handleErrorRegistro({ message: "No se pudo confirmar el registro de la cita" });
    }
  }, [onClose, onSave]);

  // Manejador de error al registrar cita
  const handleErrorRegistro = useCallback((error) => {
    setLoading(false);
    console.error("Error al registrar cita:", error);
    
    setSnackbar({
      open: true,
      message: "Error al registrar la cita: " + (error.message || "Error desconocido"),
      severity: "error"
    });
  }, []);

  // Cerrar notificación
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  }, []);
  // Renderizado condicional según el paso activo
  const renderStepContent = useCallback(() => {
    switch (activeStep) {
      case 0: // Datos básicos del Paciente
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cédula/Pasaporte"
                name="cedula"
                value={formData.paciente.cedula}
                onChange={handlePatientInputChange}
                required
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button 
                        onClick={buscarPaciente}
                        disabled={!formData.paciente.cedula || formData.paciente.cedula.length < 8 || loading}
                        size="small"
                        startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                      >
                        Buscar
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombres"
                name="nombre"
                value={formData.paciente.nombre}
                onChange={handlePatientInputChange}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Apellidos"
                name="apellido"
                value={formData.paciente.apellido}
                onChange={handlePatientInputChange}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomDatePicker
                label="Fecha de Nacimiento"
                value={formData.paciente.fechaNacimiento}
                onChange={handleBirthDateChange}
                required={true}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Edad"
                name="edad"
                value={formData.paciente.edad}
                onChange={handlePatientInputChange}
                margin="normal"
                InputProps={{
                  readOnly: Boolean(formData.paciente.fechaNacimiento),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel id="sexo-label">Sexo</InputLabel>
                <Select
                  labelId="sexo-label"
                  name="sexo"
                  value={formData.paciente.sexo}
                  onChange={handlePatientInputChange}
                  label="Sexo"
                >
                  <MenuItem value="masculino">Masculino</MenuItem>
                  <MenuItem value="femenino">Femenino</MenuItem>
                  <MenuItem value="otro">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
        case 1: // Datos demográficos
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono"
                name="telefono"
                value={formData.paciente.telefono}
                onChange={handlePatientInputChange}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.paciente.email}
                onChange={handlePatientInputChange}
                margin="normal"
                helperText="Si proporciona un email, se enviará una invitación al calendario"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                name="direccion"
                value={formData.paciente.direccion}
                onChange={handlePatientInputChange}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ciudad"
                name="ciudad"
                value={formData.paciente.ciudad}
                onChange={handlePatientInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Provincia"
                name="provincia"
                value={formData.paciente.provincia}
                onChange={handlePatientInputChange}
                margin="normal"
              />
            </Grid>
          </Grid>
        );

      case 2: // Detalles médicos
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.datosMedicos.tieneOrdenMedica}
                    onChange={handleMedicalInputChange}
                    name="tieneOrdenMedica"
                  />
                }
                label="Posee orden médica"
              />
            </Grid>
            
            {formData.datosMedicos.tieneOrdenMedica && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Médico Referente"
                  name="medicoReferente"
                  value={formData.datosMedicos.medicoReferente}
                  onChange={handleMedicalInputChange}
                  margin="normal"
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observaciones Médicas"
                name="observaciones"
                value={formData.datosMedicos.observaciones}
                onChange={handleMedicalInputChange}
                multiline
                rows={3}
                margin="normal"
              />
            </Grid>
          </Grid>
        );
        case 3: // Estudios y Horario
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Selección de Estudios
              </Typography>
              
              {loadingEstudios ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Estudios disponibles:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {tiposEstudios.map((estudio) => (
                      <Chip
                        key={estudio.id}
                        label={`${estudio.nombre} - $${estudio.costo.toFixed(2)}`}
                        onClick={() => addEstudio(estudio)}
                        color="primary"
                        variant="outlined"
                        sx={{ my: 0.5 }}
                      />
                    ))}
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Agregar estudio personalizado:
                  </Typography>
                  
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5}>
                      <TextField
                        fullWidth
                        label="Nombre del Estudio"
                        name="nombre"
                        value={formData.nuevoEstudio.nombre}
                        onChange={handleNewStudyInputChange}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Duración (min)"
                        name="duracion"
                        type="number"
                        value={formData.nuevoEstudio.duracion}
                        onChange={handleNewStudyInputChange}
                        margin="normal"
                        InputProps={{ inputProps: { min: 1 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Costo ($)"
                        name="costo"
                        type="number"
                        value={formData.nuevoEstudio.costo}
                        onChange={handleNewStudyInputChange}
                        margin="normal"
                        InputProps={{ inputProps: { min: 0, step: '0.01' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={1}>
                      <IconButton 
                        color="primary" 
                        onClick={addNuevoEstudio}
                        disabled={!formData.nuevoEstudio.nombre || !formData.nuevoEstudio.duracion || !formData.nuevoEstudio.costo}
                      >
                        <AddIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Estudios seleccionados:
                </Typography>
                
                {formData.estudios.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No se han seleccionado estudios. Por favor, seleccione al menos uno.
                  </Typography>
                ) : (
                  <List>
                    {formData.estudios.map((estudio) => (
                      <ListItem key={estudio.id}>
                        <ListItemText
                          primary={estudio.nombre}
                          secondary={`Duración: ${estudio.duracion} min - Costo: $${estudio.costo.toFixed(2)}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => removeEstudio(estudio.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2">
                            Total: {formData.cita.duracionTotal} min - ${formData.cita.costoTotal.toFixed(2)}
                          </Typography>
                        }
                      />
                    </ListItem>
                  </List>
                )}
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                Selección de Horario
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <CustomDatePicker
                    label="Fecha de la Cita"
                    value={formData.cita.fecha}
                    onChange={handleAppointmentDateChange}
                    required={true}
                    minDate={new Date()}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal" required>
                    <InputLabel id="hora-label">Hora</InputLabel>
                    <Select
                      labelId="hora-label"
                      name="hora"
                      value={formData.cita.hora || ''}
                      onChange={handleAppointmentInputChange}
                      label="Hora"
                      disabled={loading || formData.estudios.length === 0}
                    >
                      {loading ? (
                        <MenuItem value="" disabled>
                          <CircularProgress size={20} /> Cargando horarios...
                        </MenuItem>
                      ) : horariosDisponibles.length === 0 ? (
                        <MenuItem value="" disabled>
                          No hay horarios disponibles
                        </MenuItem>
                      ) : (
                        horariosDisponibles.map((hora) => (
                          <MenuItem key={hora} value={hora}>
                            {hora}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        );
        case 4: // Pagos
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Información de Pago
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                Costo Total: ${formData.cita.costoTotal.toFixed(2)}
              </Typography>
              
              <FormControl component="fieldset" margin="normal">
                <Typography variant="subtitle2" gutterBottom>
                  Método de Pago:
                </Typography>
                <RadioGroup
                  name="metodoPago"
                  value={formData.pago.metodoPago}
                  onChange={handlePaymentInputChange}
                >
                  <FormControlLabel value="efectivo" control={<Radio />} label="Efectivo" />
                  <FormControlLabel value="tarjeta" control={<Radio />} label="Tarjeta de Crédito/Débito" />
                  <FormControlLabel value="transferencia" control={<Radio />} label="Transferencia Bancaria" />
                </RadioGroup>
              </FormControl>
              
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.pago.aplicarDescuento}
                      onChange={handlePaymentInputChange}
                      name="aplicarDescuento"
                    />
                  }
                  label="Aplicar Descuento"
                />
              </Box>
              
              {formData.pago.aplicarDescuento && (
                <Box sx={{ mt: 1, pl: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl component="fieldset">
                        <Typography variant="subtitle2" gutterBottom>
                          Tipo de Descuento:
                        </Typography>
                        <RadioGroup
                          name="tipoDescuento"
                          value={formData.pago.tipoDescuento}
                          onChange={handlePaymentInputChange}
                        >
                          <FormControlLabel value="porcentaje" control={<Radio />} label="Porcentaje (%)" />
                          <FormControlLabel value="monto" control={<Radio />} label="Monto Fijo ($)" />
                        </RadioGroup>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={formData.pago.tipoDescuento === 'porcentaje' ? 'Porcentaje de Descuento (%)' : 'Monto de Descuento ($)'}
                        name="valorDescuento"
                        type="number"
                        value={formData.pago.valorDescuento}
                        onChange={handlePaymentInputChange}
                        margin="normal"
                        InputProps={{ 
                          inputProps: { 
                            min: 0, 
                            max: formData.pago.tipoDescuento === 'porcentaje' ? 100 : formData.cita.costoTotal,
                            step: formData.pago.tipoDescuento === 'porcentaje' ? 1 : 0.01
                          } 
                        }}
                      />
                      
                      <TextField
                        fullWidth
                        label="Motivo del Descuento"
                        name="motivoDescuento"
                        value={formData.pago.motivoDescuento}
                        onChange={handlePaymentInputChange}
                        margin="normal"
                      />
                    </Grid>
                  </Grid>
                  
                  <Typography variant="body1" color="primary" sx={{ mt: 2, fontWeight: 'bold' }}>
                    Valor con Descuento: ${formData.pago.valorFinal.toFixed(2)}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ mt: 3, bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="h6" color="primary.main">
                  Total a Pagar: ${formData.pago.valorFinal.toFixed(2)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        );
        case 5: // Confirmación
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Resumen de la Cita</Typography>
            
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle1">Datos del Paciente:</Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Nombre:</strong> {formData.paciente.nombre} {formData.paciente.apellido}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Cédula:</strong> {formData.paciente.cedula}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Edad:</strong> {formData.paciente.edad} años</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Sexo:</strong> {formData.paciente.sexo}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Teléfono:</strong> {formData.paciente.telefono}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Email:</strong> {formData.paciente.email || 'No especificado'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2"><strong>Dirección:</strong> {formData.paciente.direccion}, {formData.paciente.ciudad}, {formData.paciente.provincia}</Typography>
                </Grid>
              </Grid>
            </Box>
            
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle1">Información Médica:</Typography>
              <Typography variant="body2">
                <strong>Orden Médica:</strong> {formData.datosMedicos.tieneOrdenMedica ? 'Sí' : 'No'}
              </Typography>
              {formData.datosMedicos.tieneOrdenMedica && (
                <Typography variant="body2">
                  <strong>Médico Referente:</strong> {formData.datosMedicos.medicoReferente || 'No especificado'}
                </Typography>
              )}
              {formData.datosMedicos.observaciones && (
                <Typography variant="body2">
                  <strong>Observaciones:</strong> {formData.datosMedicos.observaciones}
                </Typography>
              )}
            </Box>

            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle1">Detalles de la Cita:</Typography>
              <Typography variant="body2">
                <strong>Fecha:</strong> {formData.cita.fecha?.toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
              <Typography variant="body2">
                <strong>Hora:</strong> {formData.cita.hora}
              </Typography>
              
              <Typography variant="subtitle2" sx={{ mt: 1 }}>Estudios a realizar:</Typography>
              <List dense disablePadding>
                {formData.estudios.map((estudio) => (
                  <ListItem key={estudio.id} disablePadding>
                    <ListItemText 
                      primary={estudio.nombre} 
                      secondary={`Duración: ${estudio.duracion} min - Costo: $${estudio.costo.toFixed(2)}`} 
                    />
                  </ListItem>
                ))}
              </List>
              
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Duración Total:</strong> {formData.cita.duracionTotal} minutos
              </Typography>
            </Box>

            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle1">Información de Pago:</Typography>
              <Typography variant="body2">
                <strong>Método de Pago:</strong> {
                  formData.pago.metodoPago === 'efectivo' ? 'Efectivo' :
                  formData.pago.metodoPago === 'tarjeta' ? 'Tarjeta de Crédito/Débito' :
                  'Transferencia Bancaria'
                }
              </Typography>
              <Typography variant="body2">
                <strong>Costo Total:</strong> ${formData.cita.costoTotal.toFixed(2)}
              </Typography>
              
              {formData.pago.aplicarDescuento && (
                <>
                  <Typography variant="body2">
                    <strong>Descuento Aplicado:</strong> {
                      formData.pago.tipoDescuento === 'porcentaje' 
                        ? `${formData.pago.valorDescuento}%` 
                        : `$${formData.pago.valorDescuento}`
                    }
                    {formData.pago.motivoDescuento && ` (${formData.pago.motivoDescuento})`}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Monto de Descuento:</strong> ${(formData.cita.costoTotal - formData.pago.valorFinal).toFixed(2)}
                  </Typography>
                </>
              )}
              
              <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                <strong>Valor a Pagar:</strong> ${formData.pago.valorFinal.toFixed(2)}
              </Typography>
            </Box>

            <Box sx={{ mt: 3, p: 2, bgcolor: '#e8f5e9', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Nota:</strong> Al confirmar esta cita, se agregará automáticamente al calendario de Tesla-EC 
                y se enviará una invitación por email al paciente si se proporcionó una dirección de correo electrónico.
              </Typography>
            </Box>
          </Box>
        );
        default:
        return <Typography>Paso no encontrado</Typography>;
    }
  }, [activeStep, formData, loading, loadingEstudios, tiposEstudios, horariosDisponibles, 
      handlePatientInputChange, handleMedicalInputChange, handleAppointmentInputChange, 
      handlePaymentInputChange, handleNewStudyInputChange, handleBirthDateChange, 
      handleAppointmentDateChange, buscarPaciente, addEstudio, removeEstudio, addNuevoEstudio]);

  // Renderizado principal del componente
  return (
    <>
      <Paper
        elevation={4}
        sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 800,
          p: 3,
          zIndex: 1000,
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          {activeStep === PASOS.length ? 'Cita Creada' : 'Nueva Cita'}
        </Typography>
       
        <Stepper activeStep={activeStep} sx={{ mb: 4 }} alternativeLabel>
          {PASOS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
       
        {renderStepContent()}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            disabled={loading}
          >
            Cancelar
          </Button>
         
          <Box>
            <Button
              disabled={activeStep === 0 || loading}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Atrás
            </Button>
           
            {activeStep === PASOS.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Confirmar Cita'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                disabled={loading}
              >
                Siguiente
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
     
      {/* Notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NuevaCitaForm;