
/**
 * UI.JS - Управление отображением и элементами интерфейса
 */

const ui = {
    // 1. Переключение страниц
    showPage(pageId) {
        // Скрываем все страницы
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        
        // Показываем нужную
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Обновляем активную иконку в нижнем меню
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        const activeNav = document.querySelector(`.nav-item[data-page="${pageId.replace('-page', '')}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }
    },

    // 2. Отрисовка данных на главной (Home)
    renderHome(user) {
        // 1. Ищем элементы по тем именам, что у тебя в HTML
        const userInfo = document.querySelector('.user-info'); // Твой h2 с заголовком
        const badge = document.querySelector('.badge');       // Твой счетчик 0/8
        const nextBonus = document.getElementById('next-bonus-info'); // Твой p class="hint"
        const userIdDisplay = document.getElementById('user-id-display'); // Элемент для ID
    
        // 2. Обновляем приветствие
        if (userInfo) {
            // Заменяем "Ваши визиты" на приветствие с именем
            userInfo.textContent = `Привет, ${user.name || 'Клиент'}! 👋`;
        }
        
        // 3. Обновляем счетчик визитов
        const currentVisits = parseInt(user.visitCount) || 0;
        const progress = currentVisits % 8;
        
        if (badge) {
            badge.textContent = `${progress} / 8`;
        }
    
        // 4. Обновляем текст подсказки внизу карточки
        if (nextBonus) {
            const left = 8 - progress;
            nextBonus.textContent = (progress === 0 && currentVisits > 0) 
                ? 'Следующая мойка — БЕСПЛАТНО! 🎉' 
                : `До бесплатной мойки осталось: ${left}`;
        }
    
        // 5. Выводим ID пользователя текстом
        if (userIdDisplay) {
            userIdDisplay.textContent = `ID: ${user.id || user.userId || '---'}`;
        }
    
        // 6. Генерируем QR-код
        if (window.generateUserQR && (user.id || user.userId)) {
            window.generateUserQR(user.id || user.userId);
        }
    },

    // 3. Отрисовка профиля
    renderProfile(user) {
        const set = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text || '—';
        };
    
        set('profile-name', user.name || 'Клиент');
        set('profile-phone', user.phone);
        set('profile-visits', user.visitCount || 0);
        // Выводим роль текстом в профиле
        set('profile-role', user.role === 'admin' ? 'Администратор' : 'Клиент');
    },

    // 4. Обновление админ-панели
    async refreshAdminStats() {
        const statsContainer = document.getElementById('admin-stats-container');
        if (!statsContainer) return;

        try {
            const stats = await api.getStats();
            if (stats) {
                statsContainer.innerHTML = `
                    <div class="stat-card">
                        <h3>${stats.totalVisits}</h3>
                        <p>Всего визитов</p>
                    </div>
                    <div class="stat-card">
                        <h3>${stats.avgCheck || 0} ₽</h3>
                        <p>Средний чек</p>
                    </div>
                `;
            }
        } catch (err) {
            console.error('Ошибка загрузки статистики:', err);
            statsContainer.innerHTML = '<p>Ошибка загрузки данных</p>';
        }
    },

    // 5. Выход
    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('currentUser'); // Чистим кэш профиля
        window.location.reload();
    }
};

// Делаем объект доступным глобально
window.ui = ui;

// Делаем ui глобальным
window.ui = ui;