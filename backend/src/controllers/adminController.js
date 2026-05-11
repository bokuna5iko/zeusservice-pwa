const db = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        // --- БЛОК 1: КЛИЕНТЫ ---
        const totalUsersRes = await db.query("SELECT COUNT(*) FROM users WHERE role = 'user'");
        const totalUsers = parseInt(totalUsersRes.rows[0].count);

        const newUsersRes = await db.query(
            "SELECT COUNT(*) FROM users WHERE role = 'user' AND created_at > NOW() - INTERVAL '30 days'"
        );
        const userChange = totalUsers > 0 ? Math.round((parseInt(newUsersRes.rows[0].count) / totalUsers) * 100) : 0;

        // --- БЛОК 2: ВОЗВРАЩАЕМОСТЬ (Retention) ---
        // 1. Кто был на ПРОШЛОЙ неделе (от 14 до 7 дней назад)
        const lastWeekRes = await db.query(`
            SELECT DISTINCT user_id FROM visits 
            WHERE created_at >= NOW() - INTERVAL '14 days' 
              AND created_at < NOW() - INTERVAL '7 days'
        `);
        const lastWeekIds = lastWeekRes.rows.map(r => r.user_id);

        let retentionRate = 0;
        let returningCount = 0;

        if (lastWeekIds.length > 0) {
            // 2. Кто из них вернулся на ЭТОЙ неделе (последние 7 дней)
            const returningRes = await db.query(`
                SELECT COUNT(DISTINCT user_id) FROM visits 
                WHERE created_at >= NOW() - INTERVAL '7 days'
                  AND user_id = ANY($1)
            `, [lastWeekIds]);
            
            returningCount = parseInt(returningRes.rows[0].count);
            retentionRate = Math.round((returningCount / lastWeekIds.length) * 100);
        }

        res.json({
            totalUsers,
            userChange,
            retentionRate,
            returningCount
        });

    } catch (err) {
        console.error('Ошибка статистики:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};