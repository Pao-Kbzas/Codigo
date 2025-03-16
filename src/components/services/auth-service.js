// src/components/services/auth-service.js
import { supabase } from '../../supabase-config';

export const authService = {
  // Registro de usuario
  async register(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  // Inicio de sesión
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  // Cerrar sesión
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Obtener usuario actual
  async getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  // Verificar si el usuario está autenticado
  async isAuthenticated() {
    const user = await this.getCurrentUser();
    return !!user;
  }
};

// Exportaciones individuales para compatibilidad
export const register = authService.register;
export const login = authService.login;
export const logout = authService.logout;
export const getCurrentUser = authService.getCurrentUser;
export const isAuthenticated = authService.isAuthenticated;