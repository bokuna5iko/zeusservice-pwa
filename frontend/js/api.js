const API_BASE_URL = 'http://localhost:3000/api';

const api = {
    // Общий метод для запросов
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('accessToken');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401 || response.status === 403) {
            // Если токен протух — выкидываем на логин
            localStorage.removeItem('accessToken');
            window.location.href = '#login'; 
            return;
        }

        return response.json();
    },

    // Авторизация
    login(phone, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ phone, password })
        });
    },

    // Данные пользователя
    getProfile() {
        return this.request('/user/me');
    },

    // Статистика для админа
    getAdminStats() {
        return this.request('/admin/stats');
    },

    // Начисление визита
    addVisit(data) {
        return this.request('/user/add', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};

window.api = api; // Делаем доступным глобально
