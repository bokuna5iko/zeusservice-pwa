const API_BASE_URL = 'http://localhost:3000/api';

const api = {
    // 1. Вспомогательный метод для получения токена
    getToken() {
        return localStorage.getItem('accessToken');
    },

    // 2. Универсальный метод для всех запросов (чтобы не дублировать заголовки)
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

        // Если сервер прислал пустой ответ (например, при ошибке 405), не пытаемся парсить JSON
        const contentType = response.headers.get("content-type");
        if (!response.ok || !contentType || !contentType.includes("application/json")) {
            const errorData = await response.text();
            console.error('Ошибка сервера:', errorData);
            return { success: false, message: `Ошибка сервера (${response.status})` };
        }

        return response.json();
    },

    // 3. Авторизация
    login(phone) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ phone })
        });
    },

    // 4. Получение профиля
    getProfile() {
        return this.request('/user/me');
    },

    // 5. Начисление визита (исправленный метод)
    addVisit(userId, serviceData) {
        // Должно быть /visits/add, потому что в роутах бэкенда прописано /add
        return this.request('/visits/add', { 
            method: 'POST',
            body: JSON.stringify({
                userId: userId,
                serviceType: serviceData.type,
                amount: serviceData.price
            })
        });
    },

    // 6. Статистика для админа
    getStats() {
        return this.request('/admin/stats');
    }
};

window.api = api;