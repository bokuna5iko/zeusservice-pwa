import axios from 'axios';

const api = axios.create({
  // Заменяем localhost на прямой IP, это работает стабильнее
  baseURL: 'http://127.0.0.1:3000/api', 
  headers: {
    'Content-Type': 'application/json'
  }
});

// Автоматически добавляем токен, если он есть
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;