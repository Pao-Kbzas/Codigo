// src/pages/Imagenes.js
import React from 'react';
import { Typography, Paper, Box, Button } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';

const Imagenes = () => {
  return (
    <>
      {/* Encabezado con título y botón de carga */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Sistema PACS</Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<FileUploadIcon />}
        >
          Cargar Imágenes
        </Button>
      </Box>

      {/* Contenedor del visor de imágenes DICOM */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Visor de Imágenes DICOM
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={2}>
          Aquí se mostrará el visor de imágenes DICOM (en desarrollo)
        </Typography>

        {/* Visor OHIF embebido */}
        <iframe
          src="https://viewer.ohif.org/"
          width="100%"
          height="600px"
          title="Visor DICOM"
          style={{ border: "none" }}
        />
      </Paper>
    </>
  );
};

export default Imagenes;
