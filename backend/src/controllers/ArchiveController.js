const db = require('../config/db');

exports.getClientArchive = async (req, res) => {
  try {
    const search = req.query.search || '';
    const searchPattern = `%${search}%`;

    // Запрос ищет совпадение по ID, Имени, Телефону или Марке машины
    // Сортирует по дате последнего посещения (last_visit), новые сверху, лимит 50
    const query = `
      SELECT 
        u.id, 
        u.name, 
        u.phone, 
        u.car_brand, 
        u.total_visits,
        (SELECT MAX(created_at) FROM visits v WHERE v.user_id = u.id) AS last_visit
      FROM users u
      WHERE u.role != 'admin'
        AND (
          u.id::text ILIKE $1 
          OR u.name ILIKE $1 
          OR u.phone ILIKE $1 
          OR u.car_brand ILIKE $1
        )
      ORDER BY last_visit DESC NULLS LAST
      LIMIT 50;
    `;

    const result = await db.query(query, [searchPattern]);
    res.json(result.rows);

  } catch (err) {
    console.error('Ошибка получения архива клиентов:', err);
    res.status(500).json({ message: 'Ошибка сервера при чтении справочника' });
  }
};