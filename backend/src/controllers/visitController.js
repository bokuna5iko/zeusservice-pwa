const pool = require('../config/db');

// Начисление визита
exports.addVisit = async (req, res) => {
    const { userId, amount, service } = req.body;
    try {
        // 1. Записываем визит (используем $1, $2, $3 для Postgres)
        await pool.query(
            'INSERT INTO visits (user_id, amount, service) VALUES ($1, $2, $3)',
            [userId, amount, service]
        );

        // 2. Считаем общее кол-во визитов для проверки бонуса
        const result = await pool.query(
            'SELECT COUNT(*) as count FROM visits WHERE user_id = $1',
            [userId]
        );
        
        // В pg результат всегда в result.rows. Счётчик возвращается строкой, преобразуем в int.
        const count = parseInt(result.rows[0].count);

        // Бонус за каждую 8-ю мойку
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

// Получение профиля пользователя (статистика визитов)
exports.getUserMe = async (req, res) => {
    try {
        // req.user.id берется из токена (middleware)
        const userResult = await pool.query(
            'SELECT id, phone, role FROM users WHERE id = $1', 
            [req.user.id]
        );
        
	const userResult = await pool.query(
  	    'SELECT id, phone, name, role FROM users WHERE id = $1',  // ✅ добавь name
  	    [req.user.id]
 	 );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const user = userResult.rows[0];
        const visitCount = parseInt(visitResult.rows[0].count);

        res.json({
            userId: user.id,
	    name: user.name,
	    phone: user.phone,     // ← тоже полезно
            visitCount: visitCount,	
            visitCount: visitCount,
            lastVisitDate: visitResult.rows[0].last_visit,
            isEligibleForFreeWash: visitCount > 0 && visitCount % 8 === 0,
            nextBonusIn: 8 - (visitCount % 8)
        });
    } catch (err) {
        console.error('Ошибка в getUserMe:', err);
        res.status(500).json({ message: 'Ошибка получения данных профиля' });
    }
};
