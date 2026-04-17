// --- 1. РЕГИСТРАЦИЯ SERVICE WORKER ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log("Service Worker зарегистрирован"))
      .catch(err => console.log("Ошибка SW", err));
}

// --- 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (Склонения) ---
function declOfNum(number, titles) {  
    const cases = [2, 0, 1, 1, 1, 2];  
    return titles[ (number%100>4 && number%100<20)? 2 : cases[(number%10 < 5)? number%10 : 5] ];  
}

// --- 3. ДАННЫЕ И БАЗА ДАННЫХ ---
let userData = JSON.parse(localStorage.getItem('carwash_user')) || {
    userName: "Иван",
    currentVisits: 0,
    totalRequired: 8
};

function saveToDB() {
    localStorage.setItem('carwash_user', JSON.stringify(userData));
    updateUI(); 
}

// --- 4. ОБНОВЛЕНИЕ ИНТЕРФЕЙСА (UI) ---
function updateUI() {
    // Обновляем имя и счетчик в кружке
    const userInfo = document.querySelector('.user-info');
    const badge = document.querySelector('.badge');
    const hint = document.querySelector('.hint');

    if (userInfo) userInfo.textContent = `Привет, ${userData.userName}! 👋`;
    if (badge) badge.textContent = `${userData.currentVisits} / ${userData.totalRequired}`;
    
    // Красим кружочки
    const points = document.querySelectorAll('.point');
    points.forEach((point, index) => {
        point.classList.remove('active', 'next-visit');
        
        // Базовый текст для кружочка
        if (index === userData.totalRequired - 1) {
            point.textContent = '🎁';
        } else {
            point.textContent = index + 1;
        }

        if (index < userData.currentVisits) {
            point.classList.add('active');
            point.textContent = '✓';
        } else if (index === userData.currentVisits) {
            point.classList.add('next-visit'); 
        }
    });

    // Логика подсказки и склонений
    if (hint) {
        const remaining = userData.totalRequired - userData.currentVisits;
        if (remaining > 0) {
            const word = declOfNum(remaining, ['визит', 'визита', 'визитов']);
            hint.textContent = `Еще ${remaining} ${word}, и мойка за наш счет!`;
            hint.classList.remove('hint-complete');
        } else {
            hint.textContent = `Поздравляем! Ваша следующая мойка БЕСПЛАТНО!`;
            hint.classList.add('hint-complete');
        }
    }
}

// --- 5. ОБРАБОТКА СОБЫТИЙ (После загрузки DOM) ---
document.addEventListener("DOMContentLoaded", function() {
    
    // Модальное окно QR
    const modal = document.getElementById("qr-modal");
    const qrSmall = document.querySelector(".qr-placeholder");
    const closeBtn = document.querySelector(".close-btn");

    if (qrSmall && modal) {
        qrSmall.onclick = function() {
            modal.style.display = "flex";
            document.body.style.overflow = "hidden"; 
        }
    }

    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    }

    // Секретный клик для начисления баллов
    const userClickArea = document.querySelector('.user-info');
    if (userClickArea) {
        userClickArea.onclick = function() {
            if (userData.currentVisits < userData.totalRequired) {
                userData.currentVisits++;
            } else {
                alert("Бонус уже получен! Сбрасываем для теста.");
                userData.currentVisits = 0;
            }
            saveToDB();
        };
    }

    // Переключение вкладок меню
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetPage = item.getAttribute('data-page');
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            pages.forEach(page => {
                page.classList.remove('active');
                if (page.id === `${targetPage}-page`) {
                    page.classList.add('active');
                }
            });
        });
    });

    // Финальная отрисовка при загрузке
    updateUI();
});