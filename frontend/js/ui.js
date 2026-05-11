
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
            
            // 1. Клиенты за сегодня
            const usersValueEl = document.getElementById('stat-users-value');
            const usersFooterEl = document.getElementById('stat-users-footer');
            
            if (usersValueEl) {
                usersValueEl.textContent = stats.todayUsers;
            }

            if (usersFooterEl) {
                const isPositive = stats.userChange >= 0;
                const percentEl = usersFooterEl.querySelector('.stat-percent');
                const descEl = usersFooterEl.querySelector('.stat-desc');
                
                percentEl.className = isPositive ? 'stat-percent positive' : 'stat-percent negative';
                percentEl.textContent = `${isPositive ? '+' : ''}${stats.userChange}%`;
                descEl.textContent = 'к этому часу вчера';
            }

            // Обновляем заголовок в HTML (если нужно переименовать)
                const card = document.getElementById('stat-users-value').closest('.stat-card');
                const titleEl = card.querySelector('.stat-title');
            if (titleEl) titleEl.textContent = 'Клиенты сегодня';

            // 2. Возвращаемость
                const retentionValueEl = document.getElementById('stat-retention-value');
                const retentionFooterEl = document.getElementById('stat-retention-footer');

            if (retentionValueEl) {
                // Выводим процент постоянников среди приехавших сегодня
                retentionValueEl.textContent = `${stats.retentionRate}%`;
            }

            if (retentionFooterEl) {
                const isPositive = stats.retentionChange >= 0;
                const percentEl = retentionFooterEl.querySelector('.stat-percent');
                const descEl = retentionFooterEl.querySelector('.stat-desc');
    
                percentEl.className = isPositive ? 'stat-percent positive' : 'stat-percent negative';
                percentEl.textContent = `${isPositive ? '+' : ''}${stats.retentionChange}%`;
                descEl.textContent = 'темп постоянников';
            }

            // 3. Визиты
               const newUsersValueEl = document.getElementById('stat-visits-value');
               const newUsersFooterEl = document.getElementById('stat-visits-footer');

            if (newUsersValueEl) {
                newUsersValueEl.textContent = stats.totalVisits; // Это наши новые клиенты сегодня
            }

            if (newUsersFooterEl) {
               const isPositive = stats.visitsChange >= 0;
               const percentEl = newUsersFooterEl.querySelector('.stat-percent');
               const descEl = newUsersFooterEl.querySelector('.stat-desc');
    
               percentEl.className = isPositive ? 'stat-percent positive' : 'stat-percent negative';
               percentEl.textContent = `${isPositive ? '+' : ''}${stats.visitsChange}%`;
               descEl.textContent = 'к этому часу вчера';
            }

            // Меняем заголовок карточки программно
               const card3 = document.getElementById('stat-visits-value').closest('.stat-card');
               const title3 = card3.querySelector('.stat-title');
            if (title3) title3.textContent = 'Новые клиенты (визиты)';

            // 4. Выручка

            // Находим элементы четвертого блока
               const revenueValueEl = document.getElementById('stat-revenue-value');
               const revenueFooterEl = document.getElementById('stat-revenue-footer');

            if (revenueValueEl) {
            // Форматируем число: 15000 -> 15 000 ₽
            revenueValueEl.textContent = stats.totalRevenue.toLocaleString('ru-RU') + ' ₽';
            }

            if (revenueFooterEl) {
               const isPositive = stats.revenueChange >= 0;
               const percentEl = revenueFooterEl.querySelector('.stat-percent');
               const descEl = revenueFooterEl.querySelector('.stat-desc');
    
            percentEl.className = isPositive ? 'stat-percent positive' : 'stat-percent negative';
            percentEl.textContent = `${isPositive ? '+' : ''}${stats.revenueChange}%`;
            descEl.textContent = 'к этому часу вчера';
            }

        } catch (err) {
            console.error('Ошибка обновления статистики:', err);
        }
    },

    // Вспомогательный метод для обновления процентов (красный/зеленый)
    updateStatFooter(elementId, change) {
        const footer = document.getElementById(elementId);
        if (!footer) return;
        
        const percentEl = footer.querySelector('.stat-percent');
        if (!percentEl) return;
    
        const isPositive = change >= 0;
        percentEl.className = isPositive ? 'stat-percent positive' : 'stat-percent negative';
        percentEl.textContent = (isPositive ? '+' : '') + change + '%';
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