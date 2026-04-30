// Склонения слов
function declOfNum(number, titles) {  
    const cases = [2, 0, 1, 1, 1, 2];  
    return titles[ (number%100>4 && number%100<20)? 2 : cases[(number%10 < 5)? number%10 : 5] ];  
}

// Обновление всех элементов интерфейса
function updateUI() {
    const userData = JSON.parse(localStorage.getItem('carwash_user'));
    if (!userData) return;

    const userInfo = document.querySelector('.user-info');
    const badge = document.querySelector('.badge');
    const hint = document.querySelector('.hint');

    if (userInfo) userInfo.textContent = `Привет, ${userData.userName}! 👋`;
    if (badge) badge.textContent = `${userData.currentVisits} / ${userData.totalRequired}`;
    
    const points = document.querySelectorAll('.point');
    points.forEach((point, index) => {
        point.classList.remove('active', 'next-visit');
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