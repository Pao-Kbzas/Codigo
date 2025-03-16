import React, { useState } from 'react';
import { Box, Toolbar, Typography } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

function MainLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
    setMobileOpen(false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Header onMenuToggle={handleDrawerToggle} />
      <Sidebar 
        open={mobileOpen} 
        onClose={handleDrawerToggle} 
        onNavigate={handleNavigate}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - 240px)` },
        }}
      >
        <Toolbar />
        
        <Typography variant="h4" gutterBottom>
          {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
        </Typography>
        
        {children}
      </Box>
    </Box>
  );
}

export default MainLayout;