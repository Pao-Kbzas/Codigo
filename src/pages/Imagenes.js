// src/pages/Imagenes.js
import React from 'react';
import { Typography, Paper, Box, Button } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';

function Imagenes() {
  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Sistema PACS
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<FileUploadIcon />}
        >
          Cargar Imágenes
        </Button>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Visor de Imágenes DICOM
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Aquí se mostrará el visor de imágenes DICOM (en desarrollo)
        </Typography>
      </Paper>
    </>
  );
}

export default Imagenes;