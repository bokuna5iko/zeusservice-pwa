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
            localStorage.setItem('currentUser', JSON.stringify(profile));
            
            ui.renderHome(profile);
            ui.renderProfile(profile);
            
            if (profile.role === 'admin') {
                document.getElementById('nav-admin').style.display = 'flex';
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
                
                // ЛОГИКА СКАНЕРА ТУТ (Внутри функции, где pageId определен)
                if (pageId === 'scan') {
                    scanner.start();
                } else {
                    scanner.stop();
                }
            }
        });
    });
}

// Логика входа
function setupAuthEvents() {
    const btnLogin = document.getElementById('btn-login');
    const phoneInput = document.getElementById('user-phone-input');

    if (btnLogin) {
        btnLogin.addEventListener('click', async () => {
            const phone = phoneInput.value.replace(/[^0-9]/g, '');
            
            if (phone.length < 10) {
                alert('Введите корректный номер телефона');
                return;
            }

            const result = await api.login(phone); 
            if (result && result.token) {
                localStorage.setItem('accessToken', result.token);
                window.location.reload(); 
            } else {
                alert(result.message || 'Ошибка входа');
            }
        });
    }
}

// Глобальная функция генерации QR
window.generateUserQR = function(userId) {
    const qrContainer = document.getElementById('qrcode-container'); // ПРОВЕРЬ ЭТОТ ID В INDEX.HTML
    if (!qrContainer) return;

    qrContainer.innerHTML = '';

    try {
        new QRCode(qrContainer, {
            text: String(userId),
            width: 150,
            height: 150,
            colorDark: "#1e3c72",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        console.log('QR-код сгенерирован для ID:', userId);
    } catch (err) {
        console.error('Ошибка генерации QR:', err);
    }
};