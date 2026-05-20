const db = require('../config/db'); // Твое подключение к базе данных

exports.getTodayDashboardStats = async (req, res) => {
  try {
    // 1. МЕТРИКА: Всего визитов (чеков) за сегодня
    const totalVisitsRes = await db.query(
      "SELECT COUNT(*)::int AS count FROM visits WHERE created_at >= CURRENT_DATE"
    );
    const totalVisitsToday = totalVisitsRes.rows[0].count;

    // 2. МЕТРИКА: Зарегистрировано новых пользователей в PWA сегодня
    const registeredTodayRes = await db.query(
      "SELECT COUNT(*)::int AS count FROM users WHERE created_at >= CURRENT_DATE AND role != 'admin'"
    );
    const registeredToday = registeredTodayRes.rows[0].count;

    // 3. МЕТРИКА: Выручка за сегодня
    const revenueRes = await db.query(
      "SELECT COALESCE(SUM(price), 0)::int AS sum FROM visits WHERE created_at >= CURRENT_DATE"
    );
    const totalRevenueToday = revenueRes.rows[0].sum;

    // 4. МЕТРИКА: Процент лояльных клиентов (у которых total_visits >= 4) приехавших сегодня
    // Берем долю уникальных лояльных от общего числа уникальных клиентов за сутки
    const loyaltyRes = await db.query(`
      WITH today_drivers AS (
        SELECT DISTINCT user_id FROM visits WHERE created_at >= CURRENT_DATE
      )
      SELECT 
        COUNT(td.user_id)::int AS total_unique,
        COUNT(CASE WHEN u.total_visits >= 4 THEN 1 END)::int AS loyal_unique
      FROM today_drivers td
      JOIN users u ON td.user_id = u.id
    `);
    
    const { total_unique, loyal_unique } = loyaltyRes.rows[0];
    const loyaltyPercentage = total_unique > 0 ? Math.round((loyal_unique / total_unique) * 100) : 0;

    // 5. ГРАФИК: Почасовая группировка за сегодня (Контейнер №2)
    const graphRes = await db.query(`
      SELECT 
        EXTRACT(HOUR FROM created_at)::int AS visit_hour, 
        COUNT(*)::int AS total_cars
      FROM visits
      WHERE created_at >= CURRENT_DATE
      GROUP BY visit_hour
      ORDER BY visit_hour ASC;
    `);

    // Форматируем массив под график Recharts, чтобы были красивыми строки вроде "14:00"
    // Сразу закладываем базовую сетку с 8 до 22, чтобы график выглядел целостно, даже если за час не было машин
    const hourlyGraph = [];
    for (let h = 8; h <= 22; h++) {
      const dbRow = graphRes.rows.find(row => row.visit_hour === h);
      hourlyGraph.push({
        hour: `${h < 10 ? '0' + h : h}:00`,
        cars: dbRow ? dbRow.total_cars : 0
      });
    }

    // Отправляем все собранные данные одним пакетом на фронт
    res.json({
      metrics: {
        totalVisitsToday,
        registeredToday,
        totalRevenueToday,
        loyaltyPercentage
      },
      hourlyGraph
    });

  } catch (err) {
    console.error('Ошибка при генерации аналитики админа:', err);
    res.status(500).json({ message: 'Ошибка сервера при получении статистики' });
  }
};