// src/contexts/AuthContext.js
import { createContext } from 'react';

// Crear contexto con valores por defecto
export const AuthContext = createContext({
  currentUser: null,
  loading: true
});