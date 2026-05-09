const pool = require('../config/db');

// Начисление визита
exports.addVisit = async (req, res) => {
    const { userId, amount, service } = req.body;
    try {
        // 1. Записываем визит
        await pool.query(
            'INSERT INTO visits (user_id, amount, service) VALUES ($1, $2, $3)',
            [userId, amount, service]
        );

        // 2. Обновляем last_visit в users (БЫЛО ПРОПУЩЕНО!)
        await pool.query(
            'UPDATE users SET last_visit = NOW() WHERE id = $1',
            [userId]
        );

        // 3. Считаем визиты для бонуса
        const result = await pool.query(
            'SELECT COUNT(*) as count FROM visits WHERE user_id = $1',
            [userId]
        );
        
        const count = parseInt(result.rows[0].count);
        const isEligibleForFreeWash = count > 0 && count % 8 === 0;

        res.json({ 
            success: true, 
            visitCount: count, 
            isEligibleForFreeWash 
        });
    } catch (err) {
        console.error('Ошибка в addVisit:', err);
        res.status(500).json({ message: 'Ошибка при начислении визита' });
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
