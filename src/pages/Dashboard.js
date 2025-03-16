// src/pages/Dashboard.js
import React from 'react';
import { Typography, Paper, Grid, Box } from '@mui/material';

function Dashboard() {
  return (
    <>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={4}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 200,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Citas para hoy
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No hay citas programadas para hoy
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={4}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 200,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Pacientes recientes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No hay pacientes recientes
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={4}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 200,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Estudios pendientes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No hay estudios pendientes
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}

export default Dashboard;