const db = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        // ОПРЕДЕЛЯЕМ ВРЕМЕННЫЕ ТОЧКИ
        const now = 'NOW()'; 
        const yesterdaySameTime = "NOW() - interval '1 day'";
        const startOfToday = "date_trunc('day', NOW())";
        const startOfYesterday = "date_trunc('day', NOW() - interval '1 day')";
        const startOfMonth = "date_trunc('month', NOW())";

        // 1. БЛОК: КЛИЕНТЫ И ВЫРУЧКА (Сегодня vs Вчера до этого же часа)
        const mainStatsQuery = `
            SELECT 
                -- Сегодня
                COUNT(DISTINCT CASE WHEN created_at >= ${startOfToday} THEN user_id END) as today_users,
                COALESCE(SUM(CASE WHEN created_at >= ${startOfToday} THEN price END), 0) as today_revenue,
                
                -- Вчера до текущего часа
                COUNT(DISTINCT CASE WHEN created_at >= ${startOfYesterday} AND created_at <= ${yesterdaySameTime} THEN user_id END) as yesterday_users,
                COALESCE(SUM(CASE WHEN created_at >= ${startOfYesterday} AND created_at <= ${yesterdaySameTime} THEN price END), 0) as yesterday_revenue
            FROM visits;
        `;
        const mainStats = await db.query(mainStatsQuery);
        const { today_users, today_revenue, yesterday_users, yesterday_revenue } = mainStats.rows[0];

        // 2. БЛОК: НОВЫЕ КЛИЕНТЫ (Первый визит сегодня vs Первый визит вчера до этого часа)
        const newUsersQuery = `
            WITH first_visits AS (
                SELECT user_id, MIN(created_at) as first_time
                FROM visits
                GROUP BY user_id
            )
            SELECT 
                COUNT(CASE WHEN first_time >= ${startOfToday} THEN 1 END) as today_new,
                COUNT(CASE WHEN first_time >= ${startOfYesterday} AND first_time <= ${yesterdaySameTime} THEN 1 END) as yesterday_new
            FROM first_visits;
        `;
        const newUsersStats = await db.query(newUsersQuery);
        const { today_new, yesterday_new } = newUsersStats.rows[0];

        // 3. БЛОК: ВОЗВРАЩАЕМОСТЬ (Постоянники сегодня vs Вчера)
        // Считаем тех, у кого > 4 визитов в этом месяце на текущий момент
        const retentionQuery = `
            WITH monthly_counts AS (
                SELECT user_id, COUNT(*) as cnt 
                FROM visits 
                WHERE created_at >= ${startOfMonth}
                GROUP BY user_id
            )
            SELECT 
                COUNT(DISTINCT v.user_id) as regulars_today
            FROM visits v
            JOIN monthly_counts mc ON v.user_id = mc.user_id
            WHERE v.created_at >= ${startOfToday} AND mc.cnt > 4;
        `;
        // Для упрощения примера возьмем regulars_yesterday как 0 или добавим аналогичную логику
        const retentionStats = await db.query(retentionQuery);
        const regularsToday = parseInt(retentionStats.rows[0].regulars_today);

        // ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ %
        const calcChange = (current, previous) => {
            if (parseInt(previous) === 0) return parseInt(current) > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        // ФОРМИРУЕМ ФИНАЛЬНЫЙ JSON
        res.json({
            // Блок 1: Клиенты сегодня
            todayUsers: parseInt(today_users),
            userChange: calcChange(today_users, yesterday_users),

            // Блок 2: Возвращаемость (Лояльность)
            // % лояльных от всех приехавших сегодня
            retentionRate: today_users > 0 ? Math.round((regularsToday / today_users) * 100) : 0,
            retentionChange: calcChange(regularsToday, 0), // Здесь можно докрутить сравнение со вчера

            // Блок 3: Новые клиенты
            totalVisits: parseInt(today_new), 
            visitsChange: calcChange(today_new, yesterday_new),

            // Блок 4: Выручка
            totalRevenue: parseInt(today_revenue),
            revenueChange: calcChange(today_revenue, yesterday_revenue)
        });

    } catch (err) {
        console.error('Статистика БД ошибка:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};