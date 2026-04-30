import { checkUser, registerUser } from './auth.js';

// Элементы авторизации
const phoneInput = document.getElementById('user-phone-input');
const nameInput = document.getElementById('user-name-input');
const nameGroup = document.getElementById('name-group');
const btnLogin = document.getElementById('btn-login');
const authTitle = document.getElementById('auth-title');

// Элементы навигации
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

// Элементы QR-модалки
const qrPlaceholder = document.querySelector('.qr-placeholder');
const qrModal = document.getElementById('qr-modal');
const closeBtn = document.querySelector('.close-btn');

let isRegistrationMode = false;

// --- ЛОГИКА АВТОРИЗАЦИИ ---
btnLogin.addEventListener('click', async () => {
    const phone = phoneInput.value.trim();
    if (!phone) return alert("Введите номер телефона");

    if (!isRegistrationMode) {
        const user = await checkUser(phone);
        if (user.exists) {
            // ПРОВЕРКА РОЛИ
            if (user.data.role === 'admin') {
                document.getElementById('nav-admin').style.display = 'flex';
            } else {
                document.getElementById('nav-admin').style.display = 'none';
            }

            // Переход в приложение
            document.getElementById('auth-page').classList.remove('active');
            document.getElementById('home-page').classList.add('active');
            
            // Сохраняем данные локально, чтобы не разлогиниваться при перезагрузке
            localStorage.setItem('currentUser', JSON.stringify(user.data));
            
        } else {
            isRegistrationMode = true;
            nameGroup.style.display = 'block';
            authTitle.innerText = "Регистрация";
            btnLogin.innerText = "Создать аккаунт";
        }
    } else {
        const name = nameInput.value.trim();
        if (!name) return alert("Введите имя");
        
        // При регистрации по умолчанию ставим роль 'user'
        await registerUser(phone, name); 
        location.reload(); 
    }
});

// --- ЛОГИКА ПЕРЕКЛЮЧЕНИЯ СТРАНИЦ ---
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetPage = item.getAttribute('data-page');

        // Убираем активный класс у всех страниц и кнопок меню
        pages.forEach(page => page.classList.remove('active'));
        navItems.forEach(nav => nav.classList.remove('active'));

        // Добавляем активный класс нужной странице
        document.getElementById(`${targetPage}-page`).classList.add('active');
        item.classList.add('active');
    });
});

// --- ЛОГИКА QR-МОДАЛКИ ---
if (qrPlaceholder) {
    qrPlaceholder.addEventListener('click', () => {
        qrModal.style.display = 'flex';
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        qrModal.style.display = 'none';
    });
}

// Закрытие модалки при клике вне контента
window.addEventListener('click', (e) => {
    if (e.target === qrModal) qrModal.style.display = 'none';
});

// Проверка при загрузке страницы
const savedUser = JSON.parse(localStorage.getItem('currentUser'));
if (savedUser) {
    if (savedUser.role === 'admin') {
        document.getElementById('nav-admin').style.display = 'flex';
    }
    // Если пользователь уже залогинен, можно сразу скрыть экран авторизации
    document.getElementById('auth-page').classList.remove('active');
    document.getElementById('home-page').classList.add('active');
}