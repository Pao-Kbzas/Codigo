import React, { useState } from 'react';
import './App.css';
import Dashboard from './pages/Dashboard';
import Agenda from './pages/Agenda';
import Pacientes from './pages/Pacientes';
import Imagenes from './pages/Imagenes';
import { Box, Container, List, ListItem, ListItemIcon, ListItemText, Paper, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import ImageIcon from '@mui/icons-material/Image';

function App() {
  // Estado para controlar qué componente se muestra
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Función para renderizar el componente actual
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'agenda':
        // Envuelve Agenda en un try-catch para evitar que los errores bloqueen toda la app
        try {
          return <Agenda />;
        } catch (error) {
          console.error("Error en el componente Agenda:", error);
          return (
            <Box p={3}>
              <Typography color="error" variant="h6">
                Error al cargar el componente Agenda. Por favor, contacte al soporte técnico.
              </Typography>
            </Box>
          );
        }
      case 'pacientes':
        return <Pacientes />;
      case 'imagenes':
        return <Imagenes />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="App">
      {/* Barra superior */}
      <Box sx={{ 
        backgroundColor: 'primary.main', 
        color: 'white', 
        padding: 2,
        display: 'flex',
        alignItems: 'center'
      }}>
        <Typography variant="h6" component="div">
          Tesla-EC — Centro de Diagnóstico por Imagen
        </Typography>
      </Box>

      <Box sx={{ display: 'flex' }}>
        {/* Barra lateral de navegación */}
        <Paper 
          sx={{ 
            width: 240, 
            minHeight: 'calc(100vh - 64px)', 
            borderRadius: 0,
            borderRight: '1px solid #eee'
          }}
        >
          <List>
            <ListItem 
              button 
              selected={currentPage === 'dashboard'} 
              onClick={() => setCurrentPage('dashboard')}
            >
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            
            <ListItem 
              button 
              selected={currentPage === 'agenda'} 
              onClick={() => setCurrentPage('agenda')}
            >
              <ListItemIcon>
                <CalendarTodayIcon />
              </ListItemIcon>
              <ListItemText primary="Agenda" />
            </ListItem>
            
            <ListItem 
              button 
              selected={currentPage === 'pacientes'} 
              onClick={() => setCurrentPage('pacientes')}
            >
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="Pacientes" />
            </ListItem>
            
            <ListItem 
              button 
              selected={currentPage === 'imagenes'} 
              onClick={() => setCurrentPage('imagenes')}
            >
              <ListItemIcon>
                <ImageIcon />
              </ListItemIcon>
              <ListItemText primary="Imágenes" />
            </ListItem>
          </List>
        </Paper>

        {/* Contenido principal */}
        <Container maxWidth="lg" sx={{ py: 4, px: 2, flexGrow: 1 }}>
          {renderCurrentPage()}
        </Container>
      </Box>
    </div>
  );
}

export default App;