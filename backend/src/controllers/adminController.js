const db = require("../config/db");
const crypto = require("crypto");

// 1. Получение количества визитов за СЕГОДНЯ (для Прогресс-бара)
exports.getTodayCount = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT COUNT(*)::int AS today_count 
             FROM visits 
             WHERE created_at >= CURRENT_DATE`,
    );

    res.json({ today_count: result.rows[0].today_count || 0 });
  } catch (err) {
    console.error("Ошибка в getTodayCount:", err);
    res
      .status(500)
      .json({ message: "Ошибка сервера при получении статистики" });
  }
};

// 2. Получение 3-х последних действий админа (для Мини-ленты)
exports.getLastVisits = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
                v.id,
                v.service_type AS service_name,
                v.amount AS base_price,
                v.created_at,
                v.visit_number,
                COALESCE(u.name, 'Гость') AS client_name
             FROM visits v
             LEFT JOIN users u ON v.user_id = u.id
             ORDER BY v.created_at DESC
             LIMIT 3`,
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка в getLastVisits:", err);
    res
      .status(500)
      .json({ message: "Ошибка сервера при получении ленты действий" });
  }
};

// Верификация пользователя по QR-коду
exports.verifyUserById = async (req, res) => {
  const scrambledString = req.params.id;

  try {
    const qrParts = scrambledString.split(":");
    const clientId = qrParts[0];
    const qrTimestampStr = qrParts[1];
    const incomingHash = qrParts[2];

    if (!clientId || !qrTimestampStr || !incomingHash) {
      return res
        .status(400)
        .json({ message: "Критическая ошибка: Некорректный формат QR-кода" });
    }

    const qrTimestamp = parseInt(qrTimestampStr, 10);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const timeDifference = Math.abs(currentTimestamp - qrTimestamp);

    if (timeDifference > 180) {
      return res.status(400).json({
        message: "QR-код устарел. Попросите клиента обновить Главную страницу.",
      });
    }

    const secretKey =
      process.env.QR_SECRET_KEY || "zeus_auto_super_secret_salt_2026";
    const serverHash = crypto
      .createHash("sha256")
      .update(`${clientId}${qrTimestampStr}${secretKey}`)
      .digest("hex");

    if (serverHash !== incomingHash) {
      return res.status(403).json({
        message: "Критическая ошибка безопасности: Невалидный QR-код",
      });
    }

    const userRes = await db.query(
      "SELECT id, name, phone FROM users WHERE id = $1 AND role != 'admin'",
      [clientId],
    );

    if (userRes.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Клиент не найден в системе лояльности" });
    }

    const user = userRes.rows[0];

    const visitsRes = await db.query(
      "SELECT COUNT(*)::int AS count FROM visits WHERE user_id = $1",
      [clientId],
    );
    const visitCount = visitsRes.rows[0].count;

    res.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      visit_count: visitCount,
    });
  } catch (err) {
    console.error("Ошибка при верификации безопасного QR-кода:", err);
    res
      .status(500)
      .json({ message: "Ошибка сервера при проверке подлинности кода" });
  }
};

// 3. Получение списка всех услуг (для выпадающего списка в Калькуляторе)
exports.getAllServices = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, service_name, car_class, base_price FROM services ORDER BY id ASC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка в getAllServices:", err);
    res
      .status(500)
      .json({ message: "Ошибка сервера при получении списка услуг" });
  }
};

// 4. Зачисление визита (для Калькулятора и QR-сканера) с поддержкой кассы и Socket.io
exports.createVisit = async (req, res) => {
  try {
    const {
      userId,
      serviceId,
      payment_type,
      is_guest,
      manual_price,
      manual_car_brand,
    } = req.body;

    await db.query("BEGIN");

    const shiftResult = await db.query(
      "SELECT id, status FROM work_shifts WHERE shift_date = CURRENT_DATE AND status = 'open'",
    );
    const activeShift = shiftResult.rows[0];

    if (!activeShift) {
      await db.query("ROLLBACK");
      return res.status(400).json({
        message:
          "🚨 Ошибка зачисления: Операционная смена на сегодня не открыта администратором на Пульте!",
      });
    }

    let finalUserId = null;
    let currentVisitNumber = null;
    let serviceName = "Нестандартная услуга";
    
    // 🌟 ИСПРАВЛЕНО: Разделяем базовую цену (без скидки) и финальную (со скидкой)
    let basePrice = manual_price || 0;    // Исходная цена услуги
    let finalPrice = manual_price || 0;   // Итоговая цена к оплате
    let loyaltyStep = 1;
    let bonusType = null;

    if (serviceId) {
      const serviceResult = await db.query(
        "SELECT service_name, base_price FROM services WHERE id = $1",
        [serviceId],
      );
      if (serviceResult.rows.length === 0) {
        await db.query("ROLLBACK");
        return res
          .status(400)
          .json({ message: "Выбранная услуга не найдена в справочнике" });
      }
      serviceName = serviceResult.rows[0].service_name;

      if (!manual_price) {
        basePrice = serviceResult.rows[0].base_price;  // Справочная цена
        finalPrice = basePrice;                         // Пока без скидки
      }
    }

    if (!is_guest) {
      const userResult = await db.query(
        "SELECT id, name, phone, car_brand, visit_count, total_visits FROM users WHERE id = $1",
        [userId],
      );

      if (userResult.rows.length === 0) {
        await db.query("ROLLBACK");
        return res
          .status(444)
          .json({ message: "Пользователь не найден в базе данных" });
      }

      const user = userResult.rows[0];
      finalUserId = user.id;

      const lastVisitCheck = await db.query(
        "SELECT COALESCE(manual_visit_number, visit_number) AS last_num FROM visits WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
        [finalUserId],
      );

      let currentVisitCount = parseInt(user.visit_count || 0);

      if (lastVisitCheck.rows.length > 0) {
        currentVisitCount = parseInt(lastVisitCheck.rows[0].last_num || 0);
      }

      currentVisitNumber = currentVisitCount + 1;

      if (currentVisitNumber > 8) {
        currentVisitNumber = 1;
      }

      loyaltyStep = currentVisitNumber;

      // 🌟 ИСПРАВЛЕНО: Применяем скидку только к finalPrice, basePrice остаётся без изменений
      if (!manual_price) {
        if (currentVisitNumber === 4) {
          finalPrice = Math.round(basePrice * 0.8);  // Скидка 20%
          bonusType = '20%';
        } else if (currentVisitNumber === 8) {
          finalPrice = 0;                            // Бесплатно
          bonusType = '100%';
        }
      }

      let nextVisitCount = currentVisitNumber;
      if (currentVisitNumber === 8) {
        nextVisitCount = 0;
      }

      await db.query(
        `UPDATE users 
         SET visit_count = $1, 
             total_visits = COALESCE(total_visits, 0) + 1 
         WHERE id = $2`,
        [nextVisitCount, finalUserId],
      );
    }

    const isCash = payment_type === "Наличные" || payment_type === "Нал";
    const updateColumn = isCash ? "cash_total" : "card_total";

    // В кассу записываем финальную сумму (со скидкой)
    await db.query(
      `UPDATE work_shifts 
       SET ${updateColumn} = ${updateColumn} + $1 
       WHERE id = $2`,
      [finalPrice, activeShift.id],
    );

    const finalManualBrand =
      manual_car_brand && manual_car_brand.trim() !== ""
        ? manual_car_brand.trim()
        : is_guest
          ? "Гостевой авто"
          : null;

    const finalManualClientName = is_guest ? "Гость" : null;

    const insertVisitResult = await db.query(
      `INSERT INTO visits (
        user_id, service_id, service_type, price, visit_number, 
        payment_type, admin_id, amount, created_at, shift_id,
        manual_car_brand, manual_client_name, manual_client_phone, manual_service_name, manual_payment_type,
        bonus_type
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, created_at`,
      [
        finalUserId,
        serviceId || null,
        serviceName,
        basePrice,           // 🌟 price = базовая цена (1800)
        currentVisitNumber,
        payment_type,
        req.user.id,
        finalPrice,          // 🌟 amount = со скидкой (1440)
        activeShift.id,
        finalManualBrand,
        finalManualClientName,
        null,
        serviceName,
        payment_type,
        bonusType,
      ],
    );

    const newVisitId = insertVisitResult.rows[0].id;
    const newVisitCreatedAt = insertVisitResult.rows[0].created_at;

    await db.query("COMMIT");

    const io = req.app.get("io");
    if (io) {
      const clientInfo = req.body.clientData || {};

      const socketPayload = {
        id: newVisitId,
        created_at: newVisitCreatedAt,
        price: basePrice,           // 🌟 Базовая цена для отображения "было"
        amount: finalPrice,         // 🌟 Финальная цена
        bonus_type: bonusType,      // 🌟 Тип скидки
        loyalty_step: loyaltyStep,
        manual_car_brand: finalManualBrand || clientInfo.car_brand || "—",
        manual_client_name: finalUserId ? clientInfo.name || "Клиент" : "Гость",
        manual_client_phone: finalUserId ? clientInfo.phone || "—" : "—",
        manual_service_name: serviceName,
        manual_payment_type: payment_type,
        refreshFinancials: true,
      };

      io.to("admin_dashboard").emit("visit_update", {
        action: "create",
        visit: socketPayload,
      });
      console.log(`📡 Сокет-событие отправлено для визита №${newVisitId}`);
    }

    res
      .status(201)
      .json({ success: true, message: "Visits successfully added" });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Ошибка в createVisit (adminController):", err);
    res.status(500).json({ message: "Ошибка сервера при зачислении визита" });
  }
};

// 5. Получение полной истории визитов за последние 7 дней (для экрана История)
exports.getAdminHistory = async (req, res) => {
  try {
    const queryText = `
            SELECT 
                v.id AS visit_id, 
                v.created_at, 
                v.service_type AS service_name, 
                v.price,
                v.amount,
                v.bonus_type,
                v.payment_type,
                v.visit_number,
                u.id AS user_id, 
                u.name, 
                u.phone, 
                u.car_brand, 
                u.role, 
                u.total_visits, 
                u.visit_count
            FROM visits v
            LEFT JOIN users u ON v.user_id = u.id
            WHERE v.created_at >= NOW() - INTERVAL '7 days'
            ORDER BY v.created_at DESC;
        `;

    const result = await db.query(queryText);
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка in getAdminHistory:", err);
    res
      .status(500)
      .json({ message: "Ошибка сервера при получении истории визитов" });
  }
};

// 6. Обновление параметров визита + Доп. Услуги (JSONB) с пересчетом кассы
exports.updateVisit = async (req, res) => {
  console.log("=== БЭКЕНД: РЕДАКТИРОВАНИЕ ВИЗИТА + АПСЕЙЛ ДОПОВ ===");
  const visitId = req.params.id;
  const {
    manual_car_brand,
    manual_client_name,
    manual_client_phone,
    manual_service_name,
    manual_payment_type,
    manual_visit_number,
    price,
    additional_services,
  } = req.body;

  try {
    await db.query("BEGIN");

    const oldVisitRes = await db.query(
      "SELECT user_id, price, amount, payment_type, shift_id FROM visits WHERE id = $1",
      [visitId],
    );
    if (oldVisitRes.rows.length === 0) {
      await db.query("ROLLBACK");
      return res.status(444).json({ message: "Запись визита не найдена" });
    }
    const oldVisit = oldVisitRes.rows[0];

    const oldPrice = Number(oldVisit.price || 0);
    const oldAmount = Number(oldVisit.amount || oldPrice);

    // 🌟 ИСПРАВЛЕНО: price (с фронта) - это базовая цена услуги без скидки
    const basePrice = price !== undefined ? Number(price) : oldPrice;

    const addonsArray = Array.isArray(additional_services)
      ? additional_services
      : [];
    const addonsSum = addonsArray.reduce(
      (acc, current) => acc + Number(current.price || 0),
      0,
    );
    
    // 🌟 ИСПРАВЛЕНО: Считаем финальную сумму с учётом скидки
    const visitNum = manual_visit_number ? parseInt(manual_visit_number, 10) : null;
    let bonusType = null;
    let finalAmount = basePrice + addonsSum;

    if (visitNum === 4) {
      bonusType = '20%';
      finalAmount = Math.round((basePrice + addonsSum) * 0.8);
    } else if (visitNum === 8) {
      bonusType = '100%';
      finalAmount = 0;
    }

    const oldIsCash = String(oldVisit.payment_type || "")
      .toLowerCase()
      .includes("нал");
    const newIsCash = String(manual_payment_type || "")
      .toLowerCase()
      .includes("нал");

    const queryText = `
      UPDATE visits
      SET 
        manual_car_brand = $1,
        manual_client_name = $2,
        manual_client_phone = $3,
        manual_service_name = $4,
        manual_payment_type = $5,
        manual_visit_number = $6,
        payment_type = $5,
        price = $7,
        amount = $8,
        additional_services = $9,
        bonus_type = $11
      WHERE id = $10
      RETURNING id
    `;

    const values = [
      manual_car_brand || null,
      manual_client_name || null,
      manual_client_phone || null,
      manual_service_name || null,
      manual_payment_type || null,
      manual_visit_number ? parseInt(manual_visit_number, 10) : null,
      parseInt(basePrice, 10),     // 🌟 price = базовая цена (1800)
      parseFloat(finalAmount),     // 🌟 amount = со скидкой + допы (1440 + допы*0.8)
      JSON.stringify(addonsArray),
      visitId,
      bonusType,
    ];

    await db.query(queryText, values);

    const userId = oldVisit.user_id;
    if (userId && manual_visit_number !== undefined) {
      const currentLastVisitRes = await db.query(
        "SELECT COALESCE(manual_visit_number, visit_number) AS last_num FROM visits WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
        [userId],
      );
      if (currentLastVisitRes.rows.length > 0) {
        let lastRegisteredNum = parseInt(
          currentLastVisitRes.rows[0].last_num || 0,
        );
        if (lastRegisteredNum === 8) lastRegisteredNum = 0;
        await db.query("UPDATE users SET visit_count = $1 WHERE id = $2", [
          lastRegisteredNum,
          userId,
        ]);
      }
    }

    if (oldVisit.shift_id) {
      const oldColumn = oldIsCash ? "cash_total" : "card_total";
      await db.query(
        `UPDATE work_shifts SET ${oldColumn} = ${oldColumn} - $1 WHERE id = $2`,
        [oldAmount, oldVisit.shift_id],
      );

      const newColumn = newIsCash ? "cash_total" : "card_total";
      await db.query(
        `UPDATE work_shifts SET ${newColumn} = ${newColumn} + $1 WHERE id = $2`,
        [finalAmount, oldVisit.shift_id],
      );

      const updatedShiftRes = await db.query(
        "SELECT cash_total, card_total, expenses_total FROM work_shifts WHERE id = $1",
        [oldVisit.shift_id],
      );

      await db.query("COMMIT");

      return res.status(200).json({
        success: true,
        message:
          "Параметры заезда, доп. услуги и баланс кассы успешно обновлены",
        updatedShift: updatedShiftRes.rows[0],
      });
    }

    await db.query("COMMIT");
    res.status(200).json({ success: true });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Ошибка в контроллере updateVisit с допами:", err);
    res.status(500).json({ message: "Ошибка сервера при обработке апсейла" });
  }
};

// Заглушка для общего роута статистики
exports.getStats = async (req, res) => {
  try {
    res.json({ message: "Тут будет общая статистика" });
  } catch (err) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
};
