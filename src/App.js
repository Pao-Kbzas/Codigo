// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthChange } from './services/auth-service';

// Componentes de autenticación
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import PasswordReset from './components/auth/PasswordReset';

// Páginas principales
import Dashboard from './components/pages/Dashboard';
import PatientPage from './components/pages/PatientPage';
import AppointmentPage from './components/pages/AppointmentPage';
import StudiesPage from './components/pages/StudiesPage';
import ReportsPage from './components/pages/ReportsPage';

// Contexto de autenticación
import { AuthContext } from './contexts/AuthContext';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Suscribirse a cambios de autenticación
    const unsubscribe = onAuthChange(({ user, userData }) => {
      setCurrentUser(user ? { ...user, userData } : null);
      setLoading(false);
    });
    
    // Limpiar suscripción al desmontar
    return () => unsubscribe();
  }, []);
  
  // Componente para rutas protegidas
  const PrivateRoute = ({ children }) => {
    if (loading) {
      return <div className="loading-screen">Cargando...</div>;
    }
    
    if (!currentUser) {
      return <Navigate to="/login" />;
    }
    
    return children;
  };
  
  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      <Router>
        <div className="app-container">
          <Routes>
            {/* Rutas de autenticación */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<PasswordReset />} />
            
            {/* Ruta principal (dashboard) */}
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            
            {/* Ruta para dashboard de un médico específico */}
            <Route 
              path="/doctor/:doctorId" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            
            {/* Rutas de pacientes */}
            <Route 
              path="/patients" 
              element={
                <PrivateRoute>
                  <PatientPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/patients/:patientId" 
              element={
                <PrivateRoute>
                  <PatientPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/patients/new" 
              element={
                <PrivateRoute>
                  <PatientPage isNew={true} />
                </PrivateRoute>
              } 
            />
            
            {/* Rutas de citas */}
            <Route 
              path="/appointments" 
              element={
                <PrivateRoute>
                  <AppointmentPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/appointments/:appointmentId" 
              element={
                <PrivateRoute>
                  <AppointmentPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/appointments/new" 
              element={
                <PrivateRoute>
                  <AppointmentPage isNew={true} />
                </PrivateRoute>
              } 
            />
            
            {/* Rutas de estudios */}
            <Route 
              path="/studies" 
              element={
                <PrivateRoute>
                  <StudiesPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/studies/:studyId" 
              element={
                <PrivateRoute>
                  <StudiesPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/studies/new" 
              element={
                <PrivateRoute>
                  <StudiesPage isNew={true} />
                </PrivateRoute>
              } 
            />
            
            {/* Rutas de informes */}
            <Route 
              path="/reports" 
              element={
                <PrivateRoute>
                  <ReportsPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/reports/:reportId" 
              element={
                <PrivateRoute>
                  <ReportsPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/reports/new" 
              element={
                <PrivateRoute>
                  <ReportsPage isNew={true} />
                </PrivateRoute>
              } 
            />
            
            {/* Ruta por defecto (redirige al dashboard) */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;