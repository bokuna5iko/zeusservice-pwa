const API_BASE_URL = 'http://localhost:3000/api';

const api = {
    getToken() {
        return localStorage.getItem('accessToken');
    },

    async request(endpoint, options = {}) {
        const token = this.getToken();
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

        const contentType = response.headers.get("content-type");
        if (!response.ok || !contentType || !contentType.includes("application/json")) {
            const errorData = await response.text();
            console.error('Ошибка сервера:', errorData);
            return { success: false, message: `Ошибка сервера (${response.status})` };
        }

        return response.json();
    },

    login(phone) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ phone })
        });
    },

    getProfile() {
        return this.request('/user/me');
    },

    // НОВЫЙ МЕТОД: Получение справочника услуг
    getServices() {
        return this.request('/services');
    },

    // НОВЫЙ МЕТОД: Получение истории визитов
    getHistory() {
        return this.request('/visits/history');
    },

    // ОБНОВЛЕННЫЙ МЕТОД: Отправляем serviceId вместо текста
    addVisit(userId, serviceId) {
        return this.request('/visits/add', { 
            method: 'POST',
            body: JSON.stringify({
                userId: userId,
                serviceId: serviceId // Теперь передаем ID из базы
            })
        });
    },

    getStats() {
        return this.request('/admin/stats');
    }
};

window.api = api;