// src/pages/Pacientes.js
import React from 'react';
import { Typography, Paper, Box, Button } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

function Pacientes() {
  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Gestión de Pacientes
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<PersonAddIcon />}
        >
          Nuevo Paciente
        </Button>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Listado de Pacientes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Aquí se mostrará el listado de pacientes (en desarrollo)
        </Typography>
      </Paper>
    </>
  );
}

export default Pacientes;