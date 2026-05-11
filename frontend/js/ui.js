
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
        const userInfo = document.querySelector('.user-info');
        const badge = document.querySelector('.badge');
        const nextBonus = document.getElementById('next-bonus-info');
        const userIdDisplay = document.getElementById('user-id-display');
    
        if (userInfo) userInfo.textContent = `Привет, ${user.name || 'Клиент'}! 👋`;
        
        console.log('Рисуем главную для:', user); // Проверка данных
        const currentVisits = parseInt(user.visit_count) || 0;
        const progress = currentVisits % 8; // Остаток от деления на 8
        
        if (badge) badge.textContent = `${progress} / 8`;

        // --- ВОТ ЭТОТ КУСОК МЫ ВОЗВРАЩАЕМ ИЗ СТАРОГО КОДА ---
        const points = document.querySelectorAll('.point');
        points.forEach((point, index) => {
            point.classList.remove('active', 'next-visit');
            
            // Если это 8-й кружок, ставим подарок, иначе номер
            if (index === 7) {
                point.textContent = '🎁';
            } else {
                point.textContent = index + 1;
            }

            if (index < progress) {
                // Визит уже был
                point.classList.add('active');
                point.textContent = '✓';
            } else if (index === progress) {
                // Следующий визит (пульсирующий)
                point.classList.add('next-visit'); 
            }
        });
        // --------------------------------------------------
    
        if (nextBonus) {
            const left = 8 - progress;
            nextBonus.textContent = (progress === 0 && currentVisits > 0) 
                ? 'Следующая мойка — БЕСПЛАТНО! 🎉' 
                : `До бесплатной мойки осталось: ${left}`;
        }
    
        if (userIdDisplay) userIdDisplay.textContent = `ID: ${user.id || user.userId || '---'}`;
    
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
        const totalDisplay = document.getElementById('profile-total-visits');
        if (totalDisplay) {
            totalDisplay.textContent = user.total_visits || 0;
    }
    
        set('profile-name', user.name || 'Клиент');
        set('profile-phone', user.phone);
        set('profile-total-visits', user.total_visits || 0);
        set('profile-visits', user.visit_count || 0);
        // Выводим роль текстом в профиле
        set('profile-role', user.role === 'admin' ? 'Администратор' : 'Клиент');
    },
    
    renderHistory(visits) {
        const historyContainer = document.getElementById('visit-history-list');
        if (!historyContainer) return;
    
        if (!visits || visits.length === 0) {
            historyContainer.innerHTML = '<p class="empty-msg" style="text-align: center; color: #888; padding: 20px;">У вас пока нет визитов</p>';
            return;
        }
    
        historyContainer.innerHTML = visits.map(visit => {
            // Форматируем дату из базы (created_at) в красивый вид
            const date = new Date(visit.created_at);
            const formattedDate = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
            const formattedTime = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
            return `
                <div class="history-item" style="display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #eee;">
                    <div>
                        <div style="font-weight: bold;">${visit.service_type || 'Услуга'}</div>
                        <div style="font-size: 0.8em; color: #888;">${formattedDate}, ${formattedTime}</div>
                    </div>
                    <div style="color: #27ae60; font-weight: bold;">+1 балл</div>
                </div>
            `;
        }).join('');
    },

    // 4. Обновление админ-панели
    async refreshAdminStats() {
        try {
            const stats = await api.getStats();
            
            // 1. Обновляем основное число клиентов
            const totalUsersEl = document.getElementById('stat-total-users');
            if (totalUsersEl) {
                totalUsersEl.textContent = stats.totalUsers;
            }

            // 2. Обновляем блок процентов
            const footerEl = document.getElementById('stat-users-footer');
            if (footerEl) {
                const isPositive = stats.userChange >= 0;
                footerEl.innerHTML = `
                    <span class="stat-percent" style="color: ${isPositive ? '#27ae60' : '#e74c3c'};">
                        ${isPositive ? '+' : ''}${stats.userChange}%
                    </span>
                    <span class="stat-desc">за месяц</span>
                `;
            }

            // 3. Обновляем Возвращаемость
            const retentionValEl = document.getElementById('stat-retention-value');
            if (retentionValEl) {
                retentionValEl.textContent = `${stats.retentionRate}%`;
            }

            const retentionCountEl = document.getElementById('stat-retention-count');
            if (retentionCountEl) {
                retentionCountEl.textContent = `${stats.returningCount} чел.`;
            }
            
            console.log('Статистика (Блок 1) успешно обновлена');
        } catch (err) {
            console.error('Ошибка обновления статистики:', err);
        }
    },

    // 5. Отрисовка модального окна админа (Калькулятор услуг)
    async renderAdminPanel(user) { // Добавили async
        const oldModal = document.getElementById('admin-modal');
        if (oldModal) oldModal.remove();
    
        const currentVisitCount = parseInt(user.visit_count) || 0;
        const isFreeWash = (currentVisitCount % 8 === 7);
    
        // 1. Загружаем услуги из базы данных
        let servicesHTML = '<option disabled>Загрузка услуг...</option>';
        try {
            const services = await api.getServices();
            servicesHTML = services.map(s => `
                <option value="${s.serviceId}">${s.serviceName} — ${s.basePrice}₽</option>
            `).join('');
        } catch (err) {
            servicesHTML = '<option disabled>Ошибка загрузки меню</option>';
        }

        const modalHtml = `
            <div id="admin-modal" class="modal-overlay">
                <div class="modal-content ${isFreeWash ? 'gold-border' : ''}">
                    <h3>${isFreeWash ? '🎁 БЕСПЛАТНАЯ МОЙКА' : 'Начисление визита'}</h3>
                    
                    <div class="user-preview">
                        <p>Клиент: <strong>${user.name || 'Не указано'}</strong></p>
                        <p>Телефон: <code>${user.phone || '---'}</code></p>
                        <div class="stats-mini">
                            <p>Визитов в акции: <b>${currentVisitCount}</b></p>
                            <p>Всего моек: <b>${user.total_visits || 0}</b></p>
                        </div>
                    </div>
    
                    <div class="service-selector">
                        <label>Выберите услугу:</label>
                        <select id="service-select">
                            ${servicesHTML}
                        </select>
                    </div>
    
                    <div class="modal-actions">
                        <button id="confirm-visit-btn" class="btn-confirm">
                            ${isFreeWash ? 'Списать бонус' : 'Подтвердить визит'}
                        </button>
                        <button id="close-modal-btn" class="btn-cancel">Отмена</button>
                    </div>
                </div>
            </div>
        `;
    
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    
        document.getElementById('close-modal-btn').onclick = () => {
            document.getElementById('admin-modal').remove();
        };
    
        document.getElementById('confirm-visit-btn').onclick = async () => {
            const serviceId = document.getElementById('service-select').value;
            const confirmBtn = document.getElementById('confirm-visit-btn');
            
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Обработка...';
    
            try {
                // Передаем именно ID услуги
                const result = await api.addVisit(user.id || user.userId, serviceId);
    
                if (result.success) {
                    alert(result.message);
                    document.getElementById('admin-modal').remove();
                    if (ui.refreshAdminStats) ui.refreshAdminStats();
                } else {
                    alert('Ошибка: ' + result.message);
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = 'Попробовать снова';
                }
            } catch (err) {
                console.error(err);
                alert('Связь с сервером потеряна');
                confirmBtn.disabled = false;
            }
        };
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