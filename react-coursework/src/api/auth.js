import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';


export const authAPI = {
  login: async (login, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        login,
        password
      });
      
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
  
 logout: async () => {
    const token = localStorage.getItem('token');
    
    // Опционально: отправить запрос на сервер для инвалидации токена
    if (token) {
      try {
        await axios.post(`${API_URL}/auth/logout`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Logout API error:', error);
      }
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
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