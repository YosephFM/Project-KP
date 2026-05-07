import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('siap_user') || 'null'),
  token: localStorage.getItem('siap_token'),
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { username, password });
      localStorage.setItem('siap_token', data.token);
      localStorage.setItem('siap_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Login gagal', loading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('siap_token');
    localStorage.removeItem('siap_user');
    set({ user: null, token: null });
  },

  clearError: () => set({ error: null }),
}));
