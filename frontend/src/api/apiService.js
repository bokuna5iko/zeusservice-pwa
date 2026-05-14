import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const apiService = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Интерцептор для добавления токена авторизации к каждому запросу
apiService.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Интерцептор для обработки ошибок ответа (например, 401 Unauthorized)
apiService.interceptors.response.use(
    (response) => response,
    (error) => {
        // Если ошибка 401, можно принудительно выйти
        if (error.response && error.response.status === 401) {
            // Это будет обработано в AuthContext, где есть доступ к navigate
            console.warn('Unauthorized request, token might be expired.');
        }
        return Promise.reject(error);
    }
);

export const api = {
    login: (phone) => apiService.post('/auth/login', { phone }),
    getProfile: () => apiService.get('/user/me'),
    getServices: () => apiService.get('/services'),
    getHistory: () => apiService.get('/visits/history'),
    addVisit: (userId, serviceId) => apiService.post('/visits/add', { userId, serviceId }),
    getStats: () => apiService.get('/admin/stats'),
};

export default apiService;
