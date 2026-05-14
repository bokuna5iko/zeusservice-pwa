const db = require('../config/db'); // Проверь путь, он должен вести к файлу, где прописан pool.query


// Начисление визита
const VISITS_FOR_BONUS = 8;
const ANTI_SPAM_DELAY = 5000; // 5 секунд блокировки повторного нажатия

exports.addVisit = async (req, res) => {
    // Теперь получаем serviceId (из выпадающего списка) и userId
    const { userId, serviceId } = req.body; 

    try {
        // 1. Сначала ищем услугу в справочнике, чтобы взять актуальную цену
        const serviceRes = await db.query(
            'SELECT service_name, base_price FROM services WHERE id = $1', 
            [serviceId]
        );
        
        if (serviceRes.rows.length === 0) {
            return res.status(400).json({ message: "Выбранная услуга не найдена" });
        }
        const service = serviceRes.rows[0];

        // 2. Ищем пользователя
        const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (user.rows.length === 0) return res.status(404).json({ message: "Клиент не найден" });

        const userData = user.rows[0];

        // 3. ЗАЩИТА ОТ ДВОЙНОГО НАЧИСЛЕНИЯ
        const lastVisit = await db.query(
            'SELECT created_at FROM visits WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        if (lastVisit.rows.length > 0) {
            const timeDiff = new Date() - new Date(lastVisit.rows[0].created_at);
            if (timeDiff < ANTI_SPAM_DELAY) {
                return res.status(429).json({ message: "Слишком быстро! Подождите пару секунд." });
            }
        }

        // 4. ЛОГИРОВАНИЕ (Записываем ID услуги и цену из базы)
        await db.query(
            'INSERT INTO visits (user_id, service_id, service_type, price, admin_id, amount) VALUES ($1, $2, $3, $4, $5, $6)',
            [userId, serviceId, service.service_name, service.base_price, req.user.id]
        );

        // 5. ЛОГИКА БОНУСА
        let newCount = (userData.visit_count || 0) + 1;
        let isFree = false;

        if (newCount >= VISITS_FOR_BONUS) {
            newCount = 0;
            isFree = true;
        }

        await db.query(
            'UPDATE users SET visit_count = $1, total_visits = total_visits + 1 WHERE id = $2',
            [newCount, userId]
        );

        res.json({
            success: true,
            visit_count: newCount,
            total_visits: parseInt(userData.total_visits) + 1,
            message: isFree ? "Бесплатная мойка!" : "Визит засчитан"
        });

    } catch (err) {
        console.error("Ошибка при начислении визита:", err);
        res.status(500).json({ message: "Ошибка сервера" });
    }
};

// Получение профиля пользователя
exports.getUserMe = async (req, res) => {
    try {
        // 1. Данные пользователя (добавил last_visit)
        const userResult = await pool.query(
            'SELECT id, phone, name, role, last_visit FROM users WHERE id = $1',
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const user = userResult.rows[0];

        // 2. Статистика визитов (❌ БЫЛО ПРОПУЩЕНО!)
        const visitResult = await pool.query(
            'SELECT COUNT(*) as count, MAX(created_at) as last_visit FROM visits WHERE user_id = $1',
            [req.user.id]
        );

        const visitCount = parseInt(visitResult.rows[0].count);

        res.json({
            userId: user.id,
            name: user.name,
            phone: user.phone,
            // Наш акционный счетчик (0-7), который мы получили после инкремента
            visit_count: visitCount, 
            // Наш "вечный" счетчик. 
            // ВАЖНО: убедись, что ты получил его из БД (userData.total_visits + 1)
            total_visits: (userData.total_visits || 0) + 1, 
            lastVisitDate: new Date(), // Текущее время визита
            isEligibleForFreeWash: visitCount === 0, // Если сбросился в 0 — значит мойка была бесплатной
            nextBonusIn: visitCount === 0 ? 8 : 8 - visitCount
        });
    } catch (err) {
        console.error('Ошибка в getUserMe:', err);
        res.status(500).json({ message: 'Ошибка получения данных профиля' });
    }
};

exports.getUserHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        // Заменяем visit_date на created_at, так как в твоей БД колонка называется именно так
        const result = await db.query(
            'SELECT service_type, price, created_at FROM visits WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка в getUserHistory:', err);
        res.status(500).json({ message: 'Ошибка при получении истории' });
    }
};