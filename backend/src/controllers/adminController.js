const pool = require('../config/db');

exports.getStats = async (req, res) => {
    // Проверка роли (на всякий случай, хотя она будет и в роутах)
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Доступ только для администраторов' });
    }

    try {
        // 1. Общая статистика (используем .query и забираем .rows)
        const totalResult = await pool.query('SELECT COUNT(*) as count FROM visits');
        const avgResult = await pool.query('SELECT AVG(amount) as avg FROM visits');
        
        // 2. Статистика по дням (за последние 7 дней)
        // В Postgres используем ::date для приведения типа и TO_CHAR для форматирования
        const dailyResult = await pool.query(`
            SELECT 
                created_at::date as date, 
                COUNT(*) as count, 
                SUM(amount) as revenue 
            FROM visits 
            WHERE created_at > NOW() - INTERVAL '7 days'
            GROUP BY created_at::date 
            ORDER BY date DESC
        `);

        res.json({
            totalVisits: parseInt(totalResult.rows[0].count),
            avgCheck: parseFloat(avgResult.rows[0].avg || 0).toFixed(0),
            daily: dailyResult.rows
        });
    } catch (err) {
        console.error('Ошибка в adminController:', err);
        res.status(500).json({ message: 'Ошибка при получении статистики' });
    }
};