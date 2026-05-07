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

let currentScanData = {
    userId: null,
    visitCount: 0,
    selectedPrice: 0,
    selectedService: ''
};

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
            currentVisits: profile.visitCount % 8,
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
        if (profileVisits) profileVisits.textContent = profile.visitCount || 0;
        if (profileRole) profileRole.textContent = profile.role === 'admin' ? 'Администратор' : 'Клиент';

        // Показываем кнопку админа, если роль admin
        if (profile.role === 'admin') {
            const adminNav = document.getElementById('nav-admin');
            if (adminNav) adminNav.style.display = 'flex';
        }

        // === ГЕНЕРАЦИЯ QR-КОДА ===
        // Используем profile.userId или profile.id (смотря что пришло с бэка)
        const idForQR = profile.userId || profile.id;
        if (idForQR) {
            generateUserQR(idForQR);
            
            // Обновляем текстовый ID под QR-кодом для красоты
            const userIdDisplay = document.querySelector('.user-id');
            if (userIdDisplay) userIdDisplay.textContent = `ID: ${idForQR}`;
        }

    } catch (e) {
        console.error('Ошибка загрузки профиля', e);
        document.getElementById('auth-page').classList.add('active');
        document.getElementById('home-page').classList.remove('active');
    }
}

// Вспомогательная функция для отрисовки QR
function generateUserQR(userId) {
    const qrContainer = document.getElementById('qrcode-container');
    const qrModalContainer = document.getElementById('qrcode-modal-container');

    if (!qrContainer || !qrModalContainer) return;

    // Очищаем старые QR перед отрисовкой новых
    qrContainer.innerHTML = '';
    qrModalContainer.innerHTML = '';

    // Маленький QR для главного экрана
    new QRCode(qrContainer, {
        text: `zeus:user:${userId}`,
        width: 128,
        height: 128,
        colorDark: "#1e3c72",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    // Большой QR для модального окна
    new QRCode(qrModalContainer, {
        text: `zeus:user:${userId}`,
        width: 250, // Сделаем чуть побольше для удобства сканирования
        height: 250,
        colorDark: "#1e3c72",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
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
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('SW registered'))
            .catch(err => console.error('SW registration failed', err));
    });
}

let html5QrCode;

async function startScanner() {
    const readerElement = document.getElementById('reader');
    readerElement.style.display = 'block';

    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
    }
    
    const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0 
    };

    try {
        await html5QrCode.start(
            { facingMode: "environment" },
            config,
            async (decodedText) => {
                console.log("QR отсканирован:", decodedText);
                
                // Останавливаем камеру сразу после скана
                await html5QrCode.stop();
                readerElement.style.display = 'none';

                if (decodedText.startsWith('zeus:user:')) {
                    const userId = decodedText.replace('zeus:user:', '');
                    // ВМЕСТО alert ЗАПУСКАЕМ НАЧИСЛЕНИЕ
                    await addVisitByAdmin(userId); 
                } else {
                    alert("Это не QR-код ZEUS AUTO");
                }
            }
        );
    } catch (err) {
        console.error("Ошибка камеры:", err);
        alert("Не удалось запустить камеру. Убедитесь, что сайт работает через HTTPS или localhost.");
    }
}

async function addVisitByAdmin(userId) {
    const token = localStorage.getItem('accessToken');
    
    try {
        const response = await fetch('http://192.168.0.102:3000/api/admin/visits/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId: userId }) 
        });

        const result = await response.json();

        if (response.ok) {
            alert(`Успех! Визит начислен клиенту #${userId}. Всего визитов: ${result.total_visits}`);
        } else {
            alert(`Ошибка: ${result.error || 'Не удалось начислить визит'}`);
        }
    } catch (err) {
        console.error("Ошибка при начислении:", err);
        alert("Проблема с сетью или сервером при попытке начислить визит");
    }
}

async function openCalculator(userId) {
    currentScanData.userId = userId;
    
    // 1. Запрашиваем инфо о пользователе через существующий API (или создаем быстрый эндпоинт)
    // Для начала возьмем данные, которые приходят при скане (нужно будет подправить бэкенд чуть позже)
    // А пока имитируем получение количества визитов:
    try {
        const response = await fetch(`http://192.168.0.102:3000/api/admin/user-status/${userId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });
        const data = await response.json();
        currentScanData.visitCount = data.visitCount + 1; // Текущий визит
    } catch (e) {
        console.error("Ошибка получения статуса", e);
        currentScanData.visitCount = 1; 
    }

    const modal = document.getElementById('calculator-modal');
    const container = document.getElementById('calc-container');
    const visitText = document.getElementById('visit-number-text');
    
    visitText.innerText = `Визит №${currentScanData.visitCount}`;
    
    // Проверка на "Золотой статус" (8-й визит)
    if (currentScanData.visitCount % 8 === 0) {
        container.classList.add('gold-mode');
    } else {
        container.classList.remove('gold-mode');
    }

    modal.style.display = 'block';
}

// Привязываем запуск к кнопке
const scanBtn = document.getElementById('btn-scan-qr');
if (scanBtn) {
    scanBtn.addEventListener('click', startScanner);
}

// Ждем загрузки DOM, чтобы кнопки калькулятора были доступны
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Логика выбора услуг в калькуляторе ---
    const serviceItems = document.querySelectorAll('.service-item');
    
    serviceItems.forEach(item => {
        item.addEventListener('click', function() {
            // 1. Подсвечиваем выбранную кнопку
            serviceItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // 2. Берем базовую цену из атрибута data-price
            const originalPrice = parseInt(this.dataset.price);
            currentScanData.selectedPrice = originalPrice;
            currentScanData.selectedService = this.querySelector('span').innerText;

            // 3. Считаем скидку
            let finalPrice = originalPrice;
            
            // Если 8-й визит (Золотой режим)
            if (currentScanData.visitCount % 8 === 0) {
                finalPrice = 0;
            } 
            // Если 4-й визит (Скидка 20%)
            else if (currentScanData.visitCount % 4 === 0) {
                finalPrice = originalPrice * 0.8;
            }

            // 4. Обновляем текст в модалке
            const originalPriceElem = document.getElementById('price-original');
            const finalPriceElem = document.getElementById('price-final');

            originalPriceElem.innerText = `${originalPrice}₽`;
            finalPriceElem.innerText = `${finalPrice}₽`;
            
            // Если есть любая скидка — зачеркиваем старую цену
            if (finalPrice !== originalPrice) {
                originalPriceElem.classList.add('strike-through');
            } else {
                originalPriceElem.classList.remove('strike-through');
            }
            
            // --- Кнопка "Подтвердить визит" ---
const confirmBtn = document.getElementById('btn-confirm-visit');
if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
        // Проверка: выбрал ли админ услугу?
        if (!currentScanData.selectedService) {
            alert("Пожалуйста, выберите услугу перед подтверждением!");
            return;
        }

        const finalPrice = parseInt(document.getElementById('price-final').innerText);
        const token = localStorage.getItem('accessToken');

        try {
            const response = await fetch('http://192.168.0.102:3000/api/admin/visits/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: currentScanData.userId,
                    service: currentScanData.selectedService,
                    amount: finalPrice
                })
            });

            const result = await response.json();

            if (response.ok) {
                alert(`Визит успешно оформлен!\nУслуга: ${currentScanData.selectedService}\nСумма: ${finalPrice}₽`);
                
                // Закрываем модалку и сбрасываем данные
                document.getElementById('calculator-modal').style.display = 'none';
                resetCalculator(); 
            } else {
                alert(`Ошибка: ${result.error || 'Не удалось сохранить визит'}`);
            }
        } catch (err) {
            console.error("Ошибка при отправке:", err);
            alert("Проблема с сетью или сервером");
        }
    });
}

// Вспомогательная функция для сброса данных
function resetCalculator() {
    currentScanData = { userId: null, visitCount: 0, selectedPrice: 0, selectedService: '' };
    document.querySelectorAll('.service-item').forEach(i => i.classList.remove('active'));
    document.getElementById('price-original').innerText = '0₽';
    document.getElementById('price-final').innerText = '0₽';
}

        });
    });

    // --- Кнопка закрытия калькулятора ---
    const closeBtn = document.getElementById('btn-close-calc');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('calculator-modal').style.display = 'none';
        });
    }
});