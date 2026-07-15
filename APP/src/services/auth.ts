import type { User, UserRole } from '../types';
import { MOCK_USERS } from './mockData';
import { getSettings } from './db';

// Simulate active user in localStorage
export const getCurrentUser = (): User | null => {
  const local = localStorage.getItem('habilis_current_user');
  if (!local) {
    // Default to worker Carlos Gómez for first load
    const defaultUser = MOCK_USERS[0];
    localStorage.setItem('habilis_current_user', JSON.stringify(defaultUser));
    return defaultUser;
  }
  return JSON.parse(local);
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem('habilis_current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('habilis_current_user');
  }
};

export const authService = {
  getCurrentUser,
  
  login: async (email: string): Promise<User> => {
    const settings = getSettings();
    if (!settings.isDemoMode) {
      // Firebase actual login goes here...
    }
    
    // Demo login matching email
    const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('Usuario no encontrado en la base de datos de Habilis.');
    }
    setCurrentUser(user);
    return user;
  },
  
  logout: async (): Promise<void> => {
    setCurrentUser(null);
  },
  
  // Killer utility for demo: switch role instantly
  switchRole: (role: UserRole): User => {
    const user = MOCK_USERS.find(u => u.role === role) || MOCK_USERS[0];
    setCurrentUser(user);
    // Raise local event to notify App.tsx to reload user state
    window.dispatchEvent(new Event('habilis_auth_change'));
    return user;
  }
};
