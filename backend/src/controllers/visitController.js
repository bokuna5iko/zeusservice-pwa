// src/controllers/visitController.js
const db = require("../config/db");

const VISITS_FOR_BONUS = 8;
const ANTI_SPAM_DELAY = 5000;

// Начисление визита через калькулятор (нерабочий вариант, пока что оставлен для отладки)
exports.addVisit = async (req, res) => {
  // 🌟 ЭТИ ЛОГИ ДОЛЖНЫ ВЫСТРЕЛИТЬ САМЫМИ ПЕРВЫМИ
  console.log("\n=======================================================");
  console.log("🚀 БЭКЕНД ДЕБАГ: ТРИГГЕРНУЛСЯ ЭНДПОИНТ addVisit!");
  console.log("Полный req.body:", JSON.stringify(req.body, null, 2));
  console.log("=======================================================\n");

  const {
    userId,
    serviceId,
    payment_type,
    is_guest,
    manual_price,
    manual_car_brand,
    additional_services,
  } = req.body;

  try {
    await db.query("BEGIN");

    let basePrice = 0;
    let serviceName = "Ручной ввод";

    // 1. Вытаскиваем базовую услугу
    if (!manual_price && serviceId) {
      const serviceRes = await db.query(
        "SELECT service_name, base_price FROM services WHERE id = $1",
        [serviceId],
      );
      if (serviceRes.rows.length === 0) {
        await db.query("ROLLBACK");
        console.log("❌ Ошибка: Услуга с ID", serviceId, "не найдена в базе");
        return res.status(400).json({ message: "Выбранная услуга не найдена" });
      }
      basePrice = parseFloat(serviceRes.rows[0].base_price);
      serviceName = serviceRes.rows[0].service_name;
    } else if (manual_price) {
      basePrice = parseFloat(manual_price);
    }

    // 2. Безопасно разбираем доп. услуги
    let clientAddons = [];
    if (Array.isArray(additional_services)) {
      clientAddons = additional_services;
    } else if (typeof additional_services === "string") {
      try {
        clientAddons = JSON.parse(additional_services);
      } catch (e) {
        console.log("⚠️ Не удалось распарсить additional_services из строки");
        clientAddons = [];
      }
    }

    console.log("📋 Распознанные допки (clientAddons):", clientAddons);

    let addonsSum = 0;
    clientAddons.forEach((addon) => {
      addonsSum += parseFloat(addon.price || 0);
    });

    let totalRawPrice = basePrice + addonsSum;
    let finalAmount = totalRawPrice;
    let bonusType = null;

    let userData = null;
    let nextVisitNum = null;

    // 3. Расчёт лояльности (только для не-гостей)
    if (!is_guest && userId) {
      const user = await db.query("SELECT * FROM users WHERE id = $1", [
        userId,
      ]);
      if (user.rows.length === 0) {
        await db.query("ROLLBACK");
        console.log("❌ Ошибка: Пользователь с ID", userId, "не найден");
        return res.status(404).json({ message: "Клиент не найден" });
      }
      userData = user.rows[0];
      nextVisitNum = (userData.visit_count || 0) + 1;

      if (nextVisitNum === 4) {
        bonusType = "20%";
        finalAmount = Math.round(totalRawPrice * 0.8);
      } else if (nextVisitNum === 8) {
        bonusType = "100%";
        finalAmount = 0;
      }
    }

    // Анти-спам проверка (только если есть userId)
    if (userId) {
      const lastVisit = await db.query(
        "SELECT created_at FROM visits WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
        [userId],
      );
      if (lastVisit.rows.length > 0) {
        const timeDiff = new Date() - new Date(lastVisit.rows[0].created_at);
        if (timeDiff < 3000) {
          await db.query("ROLLBACK");
          console.log("⚠️ Сработал анти-спам кулдаун");
          return res
            .status(429)
            .json({ message: "Слишком быстро! Подождите пару секунд." });
        }
      }
    }

    // Находим текущую открытую смену
    const activeShiftRes = await db.query(
      "SELECT id FROM work_shifts WHERE status = 'open' LIMIT 1",
    );
    const activeShiftId =
      activeShiftRes.rows.length > 0 ? activeShiftRes.rows[0].id : null;

    const pType = payment_type || "Наличные";

    console.log(
      "💾 Записываем в БД... Сумма:",
      finalAmount,
      "Смена:",
      activeShiftId,
    );

    // 4. Запись в таблицу
    const queryText = `
      INSERT INTO visits 
      (user_id, service_id, service_type, price, admin_id, amount, manual_car_brand, manual_payment_type, payment_type, additional_services, bonus_type, shift_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;

    const queryValues = [
      is_guest ? null : userId,
      serviceId ? parseInt(serviceId, 10) : null,
      serviceName,
      parseInt(basePrice, 10),
      req.user.id,
      parseFloat(finalAmount),
      manual_car_brand ? manual_car_brand.trim() : null,
      pType,
      pType,
      clientAddons, // Отдаем сырой массив драйверу pg для JSONB!
      bonusType,
      activeShiftId,
    ];

    await db.query(queryText, queryValues);

    // 5. Кассовые обновления смены
    if (activeShiftId && finalAmount > 0) {
      const isCash = pType.toLowerCase().includes("нал");
      const columnToUpdate = isCash ? "cash_total" : "card_total";
      await db.query(
        `UPDATE work_shifts SET ${columnToUpdate} = ${columnToUpdate} + $1 WHERE id = $2`,
        [finalAmount, activeShiftId],
      );
    }

    // 6. Обновление счетчика пользователя (только для не-гостей)
    let newCount = 0;
    let totalVisits = 1;
    let isFree = false;

    if (userData) {
      newCount = nextVisitNum;
      if (newCount >= 8) {
        newCount = 0;
        isFree = true;
      }
      totalVisits = parseInt(userData.total_visits || 0) + 1;

      await db.query(
        "UPDATE users SET visit_count = $1, total_visits = total_visits + 1 WHERE id = $2",
        [newCount, userId],
      );
    }

    await db.query("COMMIT");
    console.log("🟢 Визит успешно зафиксирован в PostgreSQL!");

    res.json({
      success: true,
      visit_count: newCount,
      total_visits: totalVisits,
      message: isFree ? "Бесплатная мойка!" : "Визит засчитан",
    });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("❌ КРИТИЧЕСКАЯ ОШИБКА НА БЭКЕНДЕ В addVisit:", err);
    res.status(500).json({ message: "Ошибка сервера при зачислении визита" });
  }
};

// Получение профиля текущего пользователя
exports.getUserMe = async (req, res) => {
  try {
    // 🌟 ИСПРАВЛЕНО: Добавлены поля car_brand и avatar_url в SELECT
    const userResult = await db.query(
      "SELECT id, phone, name, role, visit_count, total_visits, bonus_points, car_brand, avatar_url FROM users WHERE id = $1",
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
      car_brand: user.car_brand || null,  // 🌟 Добавлено
      avatar_url: user.avatar_url || "1.png",  // 🌟 Добавлено
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
        additional_services,
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

      if (v.bonus_type === "20%") {
        // Обратно считаем исходную цену
        originalPrice = Math.round(finalPrice / 0.8);
        hasDiscount = true;
      } else if (v.bonus_type === "100%") {
        // 🌟 ИСПРАВЛЕНО: Для 100% скидки считаем полную сумму (основная + допы)
        const addons = Array.isArray(v.additional_services)
          ? v.additional_services
          : [];
        const addonsTotal = addons.reduce(
          (sum, addon) => sum + Number(addon.price || 0),
          0,
        );

        // Исходная цена = базовая услуга + все допы
        originalPrice = Number(v.price || 0) + addonsTotal;
        if (originalPrice === 0) originalPrice = Number(v.price || 0);
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
