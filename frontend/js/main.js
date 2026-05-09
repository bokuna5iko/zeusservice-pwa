/**
 * MAIN.JS - Главный контроллер приложения
 */

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Приложение ZEUS AUTO запущено');

    // 1. Инициализация навигации (меню)
    setupNavigation();

    // 2. Проверка сессии
    const token = localStorage.getItem('accessToken');
    if (token) {
        await initAppData();
    } else {
        ui.showPage('auth-page');
    }

    // 3. Привязка кнопок авторизации
    setupAuthEvents();
});

// Загрузка данных при входе
async function initAppData() {
    try {
        const profile = await api.getProfile();
        if (profile) {
            console.log('Данные профиля получены:', profile);
            
            // Отрисовываем приветствие и данные
            ui.renderHome(profile);
            ui.renderProfile(profile);
            
            // Проверка роли: показываем кнопку админа только если роль 'admin'
            const navAdmin = document.getElementById('nav-admin');
            if (navAdmin) {
                if (profile.role === 'admin') {
                    navAdmin.style.display = 'flex';
                } else {
                    navAdmin.style.display = 'none';
                }
            }

            ui.showPage('home-page');
        }
    } catch (err) {
        console.error('Ошибка инициализации:', err);
        ui.logout();
    }
}

// Слушатели для меню
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const pageId = item.getAttribute('data-page'); 
            if (pageId) {
                ui.showPage(`${pageId}-page`);
                
                if (pageId === 'home') initAppData();
                if (pageId === 'admin') ui.refreshAdminStats();
                
                if (pageId === 'scan') {
                    if (typeof scanner !== 'undefined') scanner.start();
                } else {
                    if (typeof scanner !== 'undefined') scanner.stop();
                }
            }
        });
    });

    // Кнопка выхода (Logout)
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => ui.logout());
    }
}

// Логика входа
function setupAuthEvents() {
    const btnLogin = document.getElementById('btn-login');
    const phoneInput = document.getElementById('user-phone-input');

    if (btnLogin && phoneInput) {
        btnLogin.addEventListener('click', async () => {
            const rawPhone = phoneInput.value;
            const cleanPhone = rawPhone.replace(/[^0-9]/g, ''); // Теперь переменная внутри
            
            if (cleanPhone.length < 10) {
                alert('Введите корректный номер телефона');
                return;
            }

            try {
                const result = await api.login(cleanPhone); 
                if (result && result.token) {
                    localStorage.setItem('accessToken', result.token);
                    window.location.reload(); 
                } else {
                    alert(result.message || 'Ошибка входа');
                }
            } catch (err) {
                console.error('Ошибка логина:', err);
            }
        });
    }
}

// Глобальная функция генерации QR
window.generateUserQR = function(userId) {
    const qrContainer = document.getElementById('qrcode-container');
    if (!qrContainer || !userId) return;

    qrContainer.innerHTML = '';
    try {
        new QRCode(qrContainer, {
            text: String(userId),
            width: 150,
            height: 150,
            colorDark: "#1e3c72",
            colorLight: "#ffffff"
        });
    } catch (err) {
        console.error('QR Error:', err);
    }
};