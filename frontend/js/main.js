import { authenticate, getProfile, logout, checkPhone } from './api.js';

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

// Автоформатирование номера (+7)
phoneInput.addEventListener('focus', () => {
    if (!phoneInput.value.startsWith('+7')) {
        phoneInput.value = '+7 ' + phoneInput.value.replace(/[^0-9]/g, '');
    }
});

phoneInput.addEventListener('input', (e) => {
    let val = e.target.value;
    val = val.replace(/[^\d+]/g, '');
    if (val.startsWith('8')) {
        val = '+7' + val.substring(1);
    } else if (val.startsWith('7') && !val.startsWith('+7')) {
        val = '+7' + val.substring(1);
    } else if (!val.startsWith('+7') && val.length > 0) {
        val = '+7' + val.replace(/[^0-9]/g, '');
    }
    e.target.value = val;
});

// Обработчик входа
btnLogin.addEventListener('click', async () => {
    let phone = phoneInput.value.trim();
    phone = phone.replace(/[^0-9]/g, '');
    if (phone.startsWith('8')) phone = '7' + phone.substring(1);
    if (!phone.startsWith('7') && phone.length === 10) phone = '7' + phone;
    if (!phone) return alert("Введите номер телефона");

    if (!isRegistrationMode) {
        try {
            const exists = await checkPhone(phone);
            if (exists) {
                const user = await authenticate(phone);
                document.getElementById('auth-page').classList.remove('active');
                document.getElementById('home-page').classList.add('active');
                if (user.role === 'admin') {
                    document.getElementById('nav-admin').style.display = 'flex';
                }
                loadUserData();
            } else {
                isRegistrationMode = true;
                nameGroup.style.display = 'block';
                authTitle.innerText = "Регистрация";
                btnLogin.innerText = "Создать аккаунт";
            }
        } catch (e) {
            alert('Ошибка: ' + e.message);
        }
    } else {
        const name = nameInput.value.trim();
        if (!name) return alert("Введите имя");
        try {
            const user = await authenticate(phone, name);
            document.getElementById('auth-page').classList.remove('active');
            document.getElementById('home-page').classList.add('active');
            loadUserData();
        } catch (e) {
            alert('Ошибка регистрации: ' + e.message);
        }
    }
});

// Загрузка профиля и обновление интерфейса

async function loadUserData() {
    try {
        const profile = await getProfile();
        
        // Обновление UI главного экрана (визиты)
        const userData = {
            userName: profile.name,
            currentVisits: profile.total_visits % 8,
            totalRequired: 8,
            role: profile.role
        };
        localStorage.setItem('carwash_user', JSON.stringify(userData));
        localStorage.setItem('currentUser', JSON.stringify(profile));

        if (typeof window.updateUI === 'function') {
            window.updateUI();
        }

        // === ЗАПОЛНЕНИЕ ПРОФИЛЯ ===
        const profileName = document.getElementById('profile-name');
        const profilePhone = document.getElementById('profile-phone');
        const profileVisits = document.getElementById('profile-visits');
        const profileRole = document.getElementById('profile-role');

        if (profileName) profileName.textContent = profile.name || '—';
        if (profilePhone) profilePhone.textContent = profile.phone || '—';
        if (profileVisits) profileVisits.textContent = profile.total_visits || 0;
        if (profileRole) profileRole.textContent = profile.role === 'admin' ? 'Администратор' : 'Клиент';

        // Показываем кнопку админа, если роль admin
        if (profile.role === 'admin') {
            const adminNav = document.getElementById('nav-admin');
            if (adminNav) adminNav.style.display = 'flex';
        }
    } catch (e) {
        console.error('Ошибка загрузки профиля', e);
        document.getElementById('auth-page').classList.add('active');
        document.getElementById('home-page').classList.remove('active');
    }
}
// Проверка сессии при загрузке
window.addEventListener('DOMContentLoaded', () => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
        loadUserData().then(() => {
            document.getElementById('auth-page').classList.remove('active');
            document.getElementById('home-page').classList.add('active');
        }).catch(() => {});
    } else {
        document.getElementById('auth-page').classList.add('active');
    }
});

// Навигация
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetPage = item.getAttribute('data-page');
        pages.forEach(page => page.classList.remove('active'));
        navItems.forEach(nav => nav.classList.remove('active'));
        document.getElementById(`${targetPage}-page`).classList.add('active');
        item.classList.add('active');
        if (targetPage === 'home') loadUserData();
    });
});

// QR-модалка
if (qrPlaceholder) {
    qrPlaceholder.addEventListener('click', () => qrModal.style.display = 'flex');
}
if (closeBtn) {
    closeBtn.addEventListener('click', () => qrModal.style.display = 'none');
}
window.addEventListener('click', (e) => {
    if (e.target === qrModal) qrModal.style.display = 'none';
});

// Кнопка выхода в профиле
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        logout();
    });
}

// Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registered'))
            .catch(err => console.error('SW registration failed', err));
    });
}
