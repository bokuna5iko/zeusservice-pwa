// src/controllers/visitController.js
const db = require("../config/db");

const VISITS_FOR_BONUS = 8;
const ANTI_SPAM_DELAY = 5000;

// Начисление визита через калькулятор
exports.addVisit = async (req, res) => {
  const { userId, serviceId } = req.body;

  console.log("=== БЭКЕНД: ДОБАВЛЕНИЕ ВИЗИТА ===");
  console.log("Полный req.body:", req.body);
  console.log("manual_car_brand из запроса:", req.body.manual_car_brand);

  try {
    const serviceRes = await db.query(
      "SELECT service_name, base_price FROM services WHERE id = $1",
      [serviceId],
    );

    if (serviceRes.rows.length === 0) {
      return res.status(400).json({ message: "Выбранная услуга не найдена" });
    }
    const service = serviceRes.rows[0];

    const user = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
    if (user.rows.length === 0)
      return res.status(404).json({ message: "Клиент не найден" });

    const userData = user.rows[0];

    const lastVisit = await db.query(
      "SELECT created_at FROM visits WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [userId],
    );

    if (lastVisit.rows.length > 0) {
      const timeDiff = new Date() - new Date(lastVisit.rows[0].created_at);
      if (timeDiff < ANTI_SPAM_DELAY) {
        return res
          .status(429)
          .json({ message: "Слишком быстро! Подождите пару секунд." });
      }
    }

    await db.query(
      "INSERT INTO visits (user_id, service_id, service_type, price, admin_id, amount) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        userId,
        serviceId,
        service.service_name,
        service.base_price,
        req.user.id,
        service.base_price,
      ],
    );

    let newCount = (userData.visit_count || 0) + 1;
    let isFree = false;

    if (newCount >= VISITS_FOR_BONUS) {
      newCount = 0;
      isFree = true;
    }

    await db.query(
      "UPDATE users SET visit_count = $1, total_visits = total_visits + 1 WHERE id = $2",
      [newCount, userId],
    );

    res.json({
      success: true,
      visit_count: newCount,
      total_visits: parseInt(userData.total_visits || 0) + 1,
      message: isFree ? "Бесплатная мойка!" : "Визит засчитан",
    });
  } catch (err) {
    console.error("Ошибка при начислении визита:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Получение профиля текущего пользователя
exports.getUserMe = async (req, res) => {
  try {
    const userResult = await db.query(
      "SELECT id, phone, name, role, visit_count, total_visits, bonus_points FROM users WHERE id = $1",
      [req.user.id],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const user = userResult.rows[0];

    res.json({
      userId: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      visit_count: parseInt(user.visit_count || 0),
      total_visits: parseInt(user.total_visits || 0),
      bonus_points: parseInt(user.bonus_points || 0),
      nextBonusIn: user.visit_count >= 8 ? 0 : 8 - user.visit_count,
    });
  } catch (err) {
    console.error("Ошибка в getUserMe:", err);
    res.status(500).json({ message: "Ошибка получения данных профиля" });
  }
};

// 🌟 МОДЕРНИЗИРОВАНО: История визитов с использованием bonus_type
exports.getUserHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT 
        id,
        service_id,
        COALESCE(manual_service_name, service_type) AS service_name, 
        amount AS base_price,
        price,
        visit_number,
        bonus_type,
        created_at, 
        COALESCE(manual_payment_type, payment_type) AS payment_type,
        COALESCE(manual_visit_number, visit_number) AS visit_number_display,
        manual_car_brand
       FROM visits 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId],
    );

    // 🌟 Используем bonus_type из БД для определения скидки
    const visitsWithOriginal = result.rows.map((v) => {
      const finalPrice = Number(v.base_price || 0);
      let originalPrice = finalPrice;
      let hasDiscount = false;

      if (v.bonus_type === '20%') {
        // Обратно считаем исходную цену
        originalPrice = Math.round(finalPrice / 0.8);
        hasDiscount = true;
      } else if (v.bonus_type === '100%') {
        // Для бесплатного визита показываем цену основной услуги
        originalPrice = Number(v.price || finalPrice);
        if (originalPrice === 0) originalPrice = finalPrice;
        hasDiscount = true;
      }

      return {
        ...v,
        original_price: originalPrice,
        has_discount: hasDiscount,
      };
    });

    res.json(visitsWithOriginal);
  } catch (err) {
    console.error("Ошибка в getUserHistory:", err);
    res.status(500).json({ message: "Ошибка при получении истории" });
  }
};

// Получение истории визитов за текущие сутки
exports.getAdminVisitsToday = async (req, res) => {
  try {
    if (req.query.date) {
      const parsedDate = new Date(req.query.date).toISOString().split("T")[0];
    }
    const { date } = req.query;

    let queryText = "";
    let values = [];

    if (date) {
      queryText = `
        SELECT 
          v.id AS visit_id, v.user_id, v.service_id, u.role, u.total_visits,
          COALESCE(v.manual_service_name, v.service_type) AS service_name, 
          v.price, v.amount, v.created_at, 
          COALESCE(v.manual_client_name, u.name) AS name, 
          COALESCE(v.manual_client_phone, u.phone) AS phone,
          COALESCE(v.manual_visit_number, v.visit_number) AS visit_number,
          COALESCE(v.manual_payment_type, v.payment_type) AS payment_type,
          v.manual_car_brand, v.manual_client_name, v.manual_client_phone, v.manual_service_name, v.manual_payment_type, v.manual_visit_number,
          v.additional_services
        FROM visits v
        LEFT JOIN users u ON v.user_id = u.id
        WHERE v.created_at::date = $1::date
        ORDER BY v.created_at DESC`;
      values = [date];
    } else {
      queryText = `
        SELECT 
          v.id AS visit_id, v.user_id, v.service_id, u.role, u.total_visits,
          COALESCE(v.manual_service_name, v.service_type) AS service_name, 
          v.price, v.amount, v.created_at, 
          COALESCE(v.manual_client_name, u.name) AS name, 
          COALESCE(v.manual_client_phone, u.phone) AS phone,
          COALESCE(v.manual_visit_number, v.visit_number) AS visit_number,
          COALESCE(v.manual_payment_type, v.payment_type) AS payment_type,
          v.manual_car_brand, v.manual_client_name, v.manual_client_phone, v.manual_service_name, v.manual_payment_type, v.manual_visit_number,
          v.additional_services
        FROM visits v
        LEFT JOIN users u ON v.user_id = u.id
        WHERE v.created_at >= CURRENT_DATE
        ORDER BY v.created_at DESC`;
    }

    const result = await db.query(queryText, values);
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка в getAdminVisitsToday:", err);
    res
      .status(500)
      .json({ message: "Ошибка сервера при получении операционной ленты" });
  }
};
