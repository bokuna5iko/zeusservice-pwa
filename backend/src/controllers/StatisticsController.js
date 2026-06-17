// backend/src/controllers/StatisticsController.js
const db = require("../config/db");

exports.getTodayDashboardStats = async (req, res) => {
  try {
    // 1. МЕТРИКА: Всего визитов (чеков) за сегодня
    const totalVisitsRes = await db.query(
      "SELECT COUNT(*)::int AS count FROM visits WHERE created_at >= CURRENT_DATE",
    );
    const totalVisitsToday = totalVisitsRes.rows[0].count;

    // 2. МЕТРИКА: Зарегистрировано новых пользователей в PWA сегодня
    const registeredTodayRes = await db.query(
      "SELECT COUNT(*)::int AS count FROM users WHERE created_at >= CURRENT_DATE AND role != 'admin'",
    );
    const registeredToday = registeredTodayRes.rows[0].count;

    // 3. МЕТРИКА: Выручка за сегодня
    const revenueRes = await db.query(
      "SELECT COALESCE(SUM(price), 0)::int AS sum FROM visits WHERE created_at >= CURRENT_DATE",
    );
    const totalRevenueToday = revenueRes.rows[0].sum;

    // 4. МЕТРИКА: % Лояльных (🌟 ИСПРАВЛЕНО: Добавлен фильтр IS NOT NULL, чтобы гостевые визиты не вешали JOIN)
    const loyaltyRes = await db.query(`
      WITH today_drivers AS (
        SELECT DISTINCT user_id FROM visits 
        WHERE created_at >= CURRENT_DATE AND user_id IS NOT NULL
      )
      SELECT 
        COUNT(td.user_id)::int AS total_unique,
        COUNT(CASE WHEN u.total_visits >= 4 THEN 1 END)::int AS loyal_unique
      FROM today_drivers td
      JOIN users u ON td.user_id = u.id
    `);

    const { total_unique, loyal_unique } = loyaltyRes.rows[0];
    const loyaltyPercentage =
      total_unique > 0 ? Math.round((loyal_unique / total_unique) * 100) : 0;

    // 5. ГРАФИК: Почасовая группировка за сегодня
    // (🌟 ИСПРАВЛЕНО: Применяем заменяемый timezone локального сервера локально, чтобы часы совпадали)
    const graphRes = await db.query(`
      SELECT 
        EXTRACT(HOUR FROM created_at)::int AS visit_hour, 
        COUNT(*)::int AS total_cars
      FROM visits
      WHERE created_at >= CURRENT_DATE
      GROUP BY visit_hour
      ORDER BY visit_hour ASC;
    `);
    // ⚠️ Примечание: Если у тебя часовой пояс не Якутск (+9), замени 'Asia/Yakutsk'
    // на свой регион, например 'Europe/Moscow', чтобы часы на графике не плыли!

    // Форматируем массив под график Recharts
    const hourlyGraph = [];
    for (let h = 8; h <= 22; h++) {
      const dbRow = graphRes.rows.find((row) => row.visit_hour === h);
      hourlyGraph.push({
        hour: `${h < 10 ? "0" + h : h}:00`,
        cars: dbRow ? Number(dbRow.total_cars) : 0,
      });
    }

    // Отправляем на фронтенд
    res.json({
      metrics: {
        totalVisitsToday: Number(totalVisitsToday || 0),
        registeredToday: Number(registeredToday || 0),
        totalRevenueToday: Number(totalRevenueToday || 0),
        loyaltyPercentage: Number(loyaltyPercentage || 0),
      },
      hourlyGraph: hourlyGraph,
    });
  } catch (err) {
    console.error("Ошибка при генерации аналитики админа:", err);
    res
      .status(500)
      .json({ message: "Ошибка сервера при получении statistics" });
  }
};
