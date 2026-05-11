/**
 * SCANNER.JS - Логика работы камеры и обработки QR-кодов
 */

const scanner = {
    instance: null,

    async start() {
        const scannerContainer = document.getElementById('reader');
        if (!scannerContainer) return;

        // Если сканер уже запущен, не создаем новый
        if (this.instance) return;

        this.instance = new Html5Qrcode("reader");

        const config = { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };

        try {
            await this.instance.start(
                { facingMode: "environment" }, 
                config,
                this.onScanSuccess.bind(this)
            );
            console.log('Сканер запущен');
        } catch (err) {
            console.error('Ошибка запуска камеры:', err);
            alert('Не удалось включить камеру. Проверьте разрешения.');
        }
    },

    async stop() {
        if (this.instance) {
            await this.instance.stop();
            this.instance = null;
            console.log('Сканер остановлен');
        }
    },

    async onScanSuccess(decodedText) {
        console.log('QR отсканирован:', decodedText);
        
        // Виброотклик (если поддерживается)
        if (navigator.vibrate) navigator.vibrate(100);

        // Останавливаем камеру, чтобы не сканировать повторно
        await this.stop();

        // Передаем ID пользователя в калькулятор админа
        this.openAdminCalculator(decodedText);
    },

    openAdminCalculator(userId) {
        // Заполняем скрытое поле или переменную в админке
        const adminInput = document.getElementById('admin-customer-id');
        if (adminInput) adminInput.value = userId;

        // Показываем модалку или блок начисления визита
        alert(`Пользователь найден! ID: ${userId}. Теперь введите сумму услуги.`);
        
        // Здесь можно автоматически переключить UI на форму ввода суммы
        // ui.showPage('admin-confirm-page'); 
    }
};

// Делаем доступным глобально
window.scanner = scanner;