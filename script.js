if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log("Service Worker зарегистрирован"))
      .catch(err => console.log("Ошибка SW", err));
  }

// Ждем, пока весь HTML загрузится, чтобы JS "увидел" элементы
document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Находим нужные элементы
    const modal = document.getElementById("qr-modal");
    const qrSmall = document.querySelector(".qr-placeholder");
    const closeBtn = document.querySelector(".close-btn");

    // Проверяем в консоли, нашлись ли элементы (для отладки)
    if (!modal || !qrSmall) {
        console.error("Ошибка: Элементы не найдены! Проверь ID в HTML.");
        return;
    }

    // 2. Функция открытия окна
    qrSmall.onclick = function() {
        modal.style.display = "flex";
        // Запрещаем прокрутку страницы под окном
        document.body.style.overflow = "hidden"; 
    }

    // 3. Функция закрытия окна через крестик
    closeBtn.onclick = function() {
        modal.style.display = "none";
        document.body.style.overflow = "auto"; // Возвращаем прокрутку
    }

    // 4. Закрытие при клике на темный фон
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    }

    console.log("Скрипт успешно запущен!");
});

// 1. Инициализация данных (проверяем, есть ли они в памяти, если нет — создаем)
let userData = JSON.parse(localStorage.getItem('carwash_user')) || {
    userName: "Иван",
    currentVisits: 0,
    totalRequired: 8
};

// 2. Функция для сохранения данных в "базу" браузера
function saveToDB() {
    localStorage.setItem('carwash_user', JSON.stringify(userData));
    updateUI(); // Сразу обновляем экран
}

// 3. Обновленная функция отрисовки интерфейса
function updateUI() {
    // Обновляем имя и счетчик
    document.querySelector('.user-info').textContent = `Привет, ${userData.userName}! 👋`;
    document.querySelector('.badge').textContent = `${userData.currentVisits} / ${userData.totalRequired}`;
    
    // Красим кружочки
    const points = document.querySelectorAll('.point');
    points.forEach((point, index) => {
        // Убираем старые классы, чтобы не дублировать
        point.classList.remove('active', 'next-visit');
        point.textContent = index + 1; // Возвращаем номер

        if (index < userData.currentVisits) {
            point.classList.add('active');
            point.textContent = '✓';
        } else if (index === userData.currentVisits) {
            point.classList.add('next-visit'); // Подсвечиваем текущую мойку
        }
        
        // Если это последняя мойка (подарок)
        if (index === userData.totalRequired - 1) {
            point.classList.add('gift');
            if (userData.currentVisits < userData.totalRequired) {
                point.textContent = '🎁';
            }
        }
    });

    // Обновляем текст-подсказку
    const remaining = userData.totalRequired - userData.currentVisits;
    const hint = document.querySelector('.hint');
    if (remaining > 0) {
        hint.textContent = `Еще ${remaining} визита, и мойка за наш счет!`;
    } else {
        hint.textContent = `Поздравляем! Ваша следующая мойка БЕСПЛАТНО!`;
    }
}

// 4. Добавим "секретную" функцию для теста (нажми на имя, чтобы добавить балл)
document.querySelector('.user-info').onclick = function() {
    if (userData.currentVisits < userData.totalRequired) {
        userData.currentVisits++;
        saveToDB();
    } else {
        alert("Бонус уже получен! Обнуляем счетчик для теста.");
        userData.currentVisits = 0;
        saveToDB();
    }
};

// Запускаем отрисовку при старте
updateUI();