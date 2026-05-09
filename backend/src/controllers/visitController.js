const db = require('../config/db'); // Проверь путь, он должен вести к файлу, где прописан pool.query
const pool = require('../config/db');

// Начисление визита
const VISITS_FOR_BONUS = 8;
const ANTI_SPAM_DELAY = 5000; // 5 секунд блокировки повторного нажатия

exports.addVisit = async (req, res) => {
    const { userId, serviceType, amount } = req.body; // Добавляем serviceType для логов

    try {
        // 2. Ищем пользователя
        const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (user.rows.length === 0) return res.status(404).json({ message: "Клиент не найден" });

        const userData = user.rows[0];

        // 3. ЗАЩИТА ОТ ДВОЙНОГО НАЧИСЛЕНИЯ
        // Проверяем, не было ли визита от этого юзера последние 5 секунд
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

        // 4. ЛОГИРОВАНИЕ (Записываем не только факт, но и ЧТО купили)
        await db.query(
            'INSERT INTO visits (user_id, service_type, amount, admin_id) VALUES ($1, $2, $3, $4)',
            [userId, serviceType || 'Комплекс', amount || 0, req.user.id]
        );

        // 5. ЛОГИКА БОНУСА (Используем константу вместо "8")
        let newCount = (userData.visit_count || 0) + 1;
        let isFree = false;

        if (newCount >= VISITS_FOR_BONUS) {
            newCount = 0; // Сбрасываем счетчик после бесплатной мойки
            isFree = true;
        }

        await db.query('UPDATE users SET visit_count = $1 WHERE id = $2', [newCount, userId]);

        res.json({
            success: true,
            newCount,
            isFree,
            message: isFree ? "Это была бесплатная мойка!" : "Визит засчитан"
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
            visitCount: visitCount,
            lastVisitDate: visitResult.rows[0].last_visit || user.last_visit,
            isEligibleForFreeWash: visitCount > 0 && visitCount % 8 === 0,
            nextBonusIn: 8 - (visitCount % 8)
        });
    } catch (err) {
        console.error('Ошибка в getUserMe:', err);
        res.status(500).json({ message: 'Ошибка получения данных профиля' });
    }
};
