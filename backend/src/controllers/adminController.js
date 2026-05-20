const db = require('../config/db');

// 1. Получение количества визитов за СЕГОДНЯ (для Прогресс-бара)
exports.getTodayCount = async (req, res) => {
    try {
        // Считаем записи в visits, созданные с 00:00 текущего дня
        const result = await db.query(
            `SELECT COUNT(*)::int AS today_count 
             FROM visits 
             WHERE created_at >= CURRENT_DATE`
        );
        
        // Отдаем число (если записей нет, вернет 0)
        res.json({ today_count: result.rows[0].today_count || 0 });
    } catch (err) {
        console.error('Ошибка в getTodayCount:', err);
        res.status(500).json({ message: 'Ошибка сервера при получении статистики' });
    }
};

// 2. Получение 3-х последних действий админа (для Мини-ленты)
exports.getLastVisits = async (req, res) => {
    try {
        // Достаем последние 3 визита, подтягивая имя услуги и класс машины из таблицы services
        // Если визит гостевой (user_id IS NULL), имя клиента будет "Гость"
        const result = await db.query(
            `SELECT 
                v.id,
                v.service_type AS service_name,
                v.price AS base_price,
                v.created_at,
                v.visit_number,
                COALESCE(u.name, 'Гость') AS client_name
             FROM visits v
             LEFT JOIN users u ON v.user_id = u.id
             ORDER BY v.created_at DESC
             LIMIT 3`
        );
        
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка в getLastVisits:', err);
        res.status(500).json({ message: 'Ошибка сервера при получении ленты действий' });
    }
};

// 3. Получение списка всех услуг (для выпадающего списка в Калькуляторе)
exports.getAllServices = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, service_name, car_class, base_price FROM services ORDER BY id ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка в getAllServices:', err);
        res.status(500).json({ message: 'Ошибка сервера при получении списка услуг' });
    }
};

// 4. Зачисление визита (для Калькулятора)
exports.createVisit = async (req, res) => {
    // Начинаем транзакцию, чтобы если один запрос упадет, вся операция откатилась
    const client = await db.connect();
    
    try {
        const { phone, service_name, price, payment_type, is_guest } = req.body;

        await client.query('BEGIN');

        let userId = null;
        let currentVisitNumber = null;

        // СЦЕНАРИЙ 1: Полноценный клиент (НЕ ГОСТЬ)
        if (!is_guest) {
            // Ищем пользователя по телефону
            const userResult = await client.query('SELECT id, visit_count, total_visits FROM users WHERE phone = $1', [phone]);
            
            if (userResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(444).json({ message: 'Пользователь с таким номером не найден' });
            }

            const user = userResult.rows[0];
            userId = user.id;

            // Рассчитываем номер текущего визита для лояльности
            // Если в базе visit_count = 3, то текущий визит — 4-й (скидочный)
            // Если visit_count = 7, то текущий визит — 8-й (бесплатный)
            currentVisitNumber = user.visit_count + 1;

            let nextVisitCount = currentVisitNumber;
            // Если это был 8-й визит, сбрасываем счетчик круга лояльности в 0
            if (currentVisitNumber === 8) {
                nextVisitCount = 0;
            }

            // Обновляем счетчики пользователя
            await client.query(
                `UPDATE users 
                 SET visit_count = $1, total_visits = total_visits + 1 
                 WHERE id = $2`,
                [nextVisitCount, userId]
            );
        }

        // СЦЕНАРИЙ 2: Гость (is_guest = true) -> userId и currentVisitNumber остаются NULL

        // Вставляем запись в таблицу визитов
        await client.query(
            `INSERT INTO visits (user_id, service_type, price, visit_number, payment_type, created_at) 
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [userId, service_name, price, currentVisitNumber, payment_type]
        );

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: 'Визит успешно зачислен' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Ошибка в createVisit:', err);
        res.status(500).json({ message: 'Ошибка сервера при зачислении визита' });
    } finally {
        client.release();
    }
};

// Заглушка для общего роута статистики
exports.getStats = async (req, res) => {
    try {
        res.json({ message: "Тут будет общая статистика" });
    } catch (err) {
        res.status(500).json({ message: "Ошибка сервера" });
    }
};