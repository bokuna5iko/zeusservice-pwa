
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
        
        const currentVisits = parseInt(user.visitCount) || 0;
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

    // 5. Отрисовка модального окна админа (Калькулятор услуг)
    renderAdminPanel(user) {
        // Проверяем, нет ли уже открытого окна, если есть — удаляем
        const oldModal = document.getElementById('admin-modal');
        if (oldModal) oldModal.remove();

        const progress = (user.visitCount || 0) % 8;
        const isFreeWash = (progress === 7); // Если 7 визитов уже есть, этот — 8-й (бесплатный)

        // Создаем верстку модального окна
        const modalHtml = `
            <div id="admin-modal" class="modal-overlay">
                <div class="modal-content ${isFreeWash ? 'gold-border' : ''}">
                    <h3>${isFreeWash ? '🎁 БЕСПЛАТНАЯ МОЙКА' : 'Начисление визита'}</h3>
                    <p>Клиент: <strong>${user.phone}</strong></p>
                    <p>Визитов: ${user.visitCount || 0}</p>
                    
                    <div class="service-selector">
                        <label>Выберите услугу:</label>
                        <select id="service-select">
                            <option value="Кузов">Кузов — 500₽</option>
                            <option value="Салон">Салон — 500₽</option>
                            <option value="Комплекс" selected>Комплекс — 1000₽</option>
                            <option value="Премиум">Премиум — 2500₽</option>
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

        // Добавляем модалку в body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // --- ЛОГИКА КНОПОК ---

        // Кнопка отмены
        document.getElementById('close-modal-btn').onclick = () => {
            document.getElementById('admin-modal').remove();
        };

        // Кнопка подтверждения
        document.getElementById('confirm-visit-btn').onclick = async () => {
            const serviceType = document.getElementById('service-select').value;
            const confirmBtn = document.getElementById('confirm-visit-btn');
            
            // Блокируем кнопку, чтобы не было двойного нажатия (защита на фронте)
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Обработка...';

            try {
                // Вызываем метод API, который мы подготовили на предыдущем шаге
                const result = await api.addVisit(user.id || user.userId, {
                    type: serviceType,
                    price: 0 // Цену можно вытягивать из select, если нужно
                });

                if (result.success) {
                    alert(result.isFree ? '🎉 Мойка списана как бонус!' : '✅ Визит успешно засчитан');
                    document.getElementById('admin-modal').remove();
                    // Обновляем статистику на странице админа, если мы на ней
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