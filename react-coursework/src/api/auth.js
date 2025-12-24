import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

// Простой API клиент
export const authAPI = {
  login: async (login, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        login,
        password
      });
      
      // Сохраняем токен и данные пользователя
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        errors: error.response?.data?.errors || { login: ['Ошибка входа'] }
      };
    }
  },
  
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        errors: error.response?.data?.errors || { general: ['Ошибка регистрации'] }
      };
    }
  },
  
  logout: () => {
    localStorage.clear();
    window.location.href = '/login';
  },
  
  isLoggedIn: () => {
    return !!localStorage.getItem('token');
  },
  
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  getToken: () => {
    return localStorage.getItem('token');
  }
};