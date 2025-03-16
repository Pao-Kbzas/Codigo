// src/components/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth-service';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar el estado de autenticación cuando el componente se monta
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error al verificar autenticación:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Función para actualizar el estado del usuario después de iniciar sesión
  const login = async (email, password) => {
    const { user } = await authService.login(email, password);
    setUser(user);
    return user;
  };

  // Función para actualizar el estado después de cerrar sesión
  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  // Función para actualizar el estado después de registrarse
  const register = async (email, password) => {
    const { user } = await authService.register(email, password);
    setUser(user);
    return user;
  };

  // Proporcionar el valor del contexto a los componentes hijos
  const value = {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;