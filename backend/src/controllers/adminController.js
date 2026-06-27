const db = require("../config/db");
const crypto = require("crypto"); // 🌟 ДОБАВЛЕНО: Нативный модуль для сверки хэшей SHA-256

// 1. Получение количества визитов за СЕГОДНЯ (для Прогресс-бара)
exports.getTodayCount = async (req, res) => {
  try {
    // Считаем записи в visits, созданные с 00:00 текущего дня
    const result = await db.query(
      `SELECT COUNT(*)::int AS today_count 
             FROM visits 
             WHERE created_at >= CURRENT_DATE`,
    );

    // Отдаем число (если записей нет, вернет 0)
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
    // Достаем последние 3 визита, подтягивая имя услуги и класс машины из таблицы services
    // Если визит гостевой (user_id IS NULL), имя клиента будет "Гость"
    const result = await db.query(
      `SELECT 
                v.id,
                v.service_type AS service_name,
                v.price AS base_price,
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

// 🌟 МОДЕРНИЗИРОВАНО ПО ТЗ: Полный путь: GET /api/admin/users/verify/:id
// Теперь в :id прилетает вся отсканированная строка целиком: "clientId:timestamp:hash"
exports.verifyUserById = async (req, res) => {
  const scrambledString = req.params.id;

  try {
    // 1. ПАРСИНГ СЧИТАННОЙ СТРОКИ
    const qrParts = scrambledString.split(":");
    const clientId = qrParts[0];
    const qrTimestampStr = qrParts[1];
    const incomingHash = qrParts[2];

    if (!clientId || !qrTimestampStr || !incomingHash) {
      return res
        .status(400)
        .json({ message: "Критическая ошибка: Некорректный формат QR-кода" });
    }

    // 2. ПРОВЕРКА ВРЕМЕНИ (Таймаут 3 минуты / 180 секунд)
    const qrTimestamp = parseInt(qrTimestampStr, 10);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const timeDifference = Math.abs(currentTimestamp - qrTimestamp);

    if (timeDifference > 180) {
      return res.status(400).json({
        message: "QR-код устарел. Попросите клиента обновить Главную страницу.",
      });
    }

    // 3. ПРОВЕРКА ПОДЛИННОСТИ ХЭША (SHA-256)
    const secretKey =
      process.env.QR_SECRET_KEY || "zeus_auto_super_secret_salt_2026";
    const serverHash = crypto
      .createHash("sha256")
      .update(`${clientId}${qrTimestampStr}${secretKey}`) // 🌟 ИСПРАВЛЕНО: Шаблонная строка совпадает с генератором 1 в 1!
      .digest("hex");

    if (serverHash !== incomingHash) {
      return res.status(403).json({
        message: "Критическая ошибка безопасности: Невалидный QR-код",
      });
    }

    // 4. ЕСЛИ ВСЁ ОТЛИЧНО — ИЩЕМ ПОЛЬЗОВАТЕЛЯ В БАЗЕ
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

    // 5. Считаем общее количество прошлых визитов
    const visitsRes = await db.query(
      "SELECT COUNT(*)::int AS count FROM visits WHERE user_id = $1",
      [clientId],
    );
    const visitCount = visitsRes.rows[0].count;

    // 6. Отдаем чистые данные в CalculatorModal
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
    // Принимаем параметры, которые отправляет калькулятор
    const { userId, serviceId, payment_type, is_guest, manual_price } =
      req.body;

    // Начинаем транзакцию через прямой db.query
    await db.query("BEGIN");

    // 🌟 1. ПРОВЕРКА АКТИВНОЙ СМЕНЫ ПУЛЬТА УПРАВЛЕНИЯ
    // Ищем открытую смену на текущую дату
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
    let finalPrice = manual_price || 0;
    let loyaltyStep = 1; // Шаг лояльности для вывода на пульте

    // 2. Если передан serviceId — подтягиваем название и цену услуги из справочника
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

      // Если ручная цена не была введена, берем базовую стоимость услуги
      if (!manual_price) {
        finalPrice = serviceResult.rows[0].base_price;
      }
    }

    // 3. СЦЕНАРИЙ 1: Полноценный клиент (НЕ ГОСТЬ)
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

      // Считаем номер текущего визита
      const currentVisitCount = parseInt(user.visit_count || 0);
      currentVisitNumber = currentVisitCount + 1;
      loyaltyStep = currentVisitNumber;

      // Логика скидок автомойки
      if (!manual_price) {
        if (currentVisitNumber === 4) {
          finalPrice = Math.round(finalPrice * 0.8); // Скидка 20%
        } else if (currentVisitNumber === 8) {
          finalPrice = 0; // Бесплатно
        }
      }

      let nextVisitCount = currentVisitNumber;
      if (currentVisitNumber === 8) {
        nextVisitCount = 0;
      }

      // Обновляем счетчики пользователя
      await db.query(
        `UPDATE users 
         SET visit_count = $1, 
             total_visits = COALESCE(total_visits, 0) + 1 
         WHERE id = $2`,
        [nextVisitCount, finalUserId],
      );
    }

    // 🌟 4. ОПРЕДЕЛЕНИЕ ТИПА КАССЫ И КОРРЕКТИРОВКА ФИНАНСОВЫХ ИТОГОВ СМЕНЫ
    // В зависимости от способа расчета плюсуем выручку в нужную колонку work_shifts
    const isCash = payment_type === "Наличные" || payment_type === "Нал";
    const updateColumn = isCash ? "cash_total" : "card_total";

    await db.query(
      `UPDATE work_shifts 
       SET ${updateColumn} = ${updateColumn} + $1 
       WHERE id = $2`,
      [finalPrice, activeShift.id],
    );

    // 🌟 5. СОХРАНЕНИЕ ВИЗИТА С УКАЗАНИЕМ SHIFT_ID И РУЧНЫХ ПАРАМЕТРОВ
    const insertVisitResult = await db.query(
      `INSERT INTO visits (
        user_id, service_id, service_type, price, visit_number, 
        payment_type, admin_id, amount, created_at, shift_id,
        manual_car_brand, manual_client_name, manual_client_phone, manual_service_name, manual_payment_type
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11, $12, $13, $14)
      RETURNING id, created_at`,
      [
        finalUserId,
        serviceId || null,
        serviceName,
        finalPrice,
        currentVisitNumber,
        payment_type,
        req.user.id, // ID админа, который зачислил визит
        finalPrice,
        activeShift.id, // Привязка к открытой смене дня
        is_guest ? "Гостевой авто" : null, // manual_car_brand
        is_guest ? "Гость" : null, // manual_client_name
        null, // manual_client_phone
        serviceName, // manual_service_name
        payment_type, // manual_payment_type
      ],
    );

    const newVisitId = insertVisitResult.rows[0].id;
    const newVisitCreatedAt = insertVisitResult.rows[0].created_at;

    // Коммитим транзакцию, чтобы данные железно легли в PostgreSQL
    await db.query("COMMIT");

    // 🌟 6. МГНОВЕННАЯ СИНХРОНИЗАЦИЯ ЧЕРЕЗ WEBSOCKETS (SOCKET.IO)
    // Достаем инстанс 'io', который мы привязали в server.js, и пушим событие на пульт админа
    const io = req.app.get("io");
    if (io) {
      // Подтягиваем данные для красивой вставки строки таблицы фронтенда
      const clientInfo = is_guest
        ? { name: "Гость", phone: "—", car_brand: "—" }
        : req.body.clientData || {};

      const socketPayload = {
        id: newVisitId,
        created_at: newVisitCreatedAt,
        price: finalPrice,
        loyalty_step: loyaltyStep,
        manual_car_brand: clientInfo.car_brand || "—",
        manual_client_name: clientInfo.name || "Гость",
        manual_client_phone: clientInfo.phone || "—",
        manual_service_name: serviceName,
        manual_payment_type: payment_type,
        // Также отправляем обновленные балансы кассы с бэкенда, чтобы дашборд пересчитался
        refreshFinancials: true,
      };

      io.to("admin_dashboard").emit("visit_update", {
        action: "create",
        visit: socketPayload,
      });
      console.log(
        `📡 Сокет-событие 'visit_update' (create) отправлено в комнату АРМ для визита №${newVisitId}`,
      );
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

// 6. Точечное обновление ручных параметров визита администратором из АРМ
exports.updateVisit = async (req, res) => {
  console.log("=== ТЕСТ 2: БЭКЕНД ПРИНЯЛ ЗАПРОС ===");
  console.log("req.params.id:", req.params.id);
  console.log("req.body:", req.body);

  const visitId = req.params.id;
  const {
    manual_car_brand,
    manual_client_name,
    manual_client_phone,
    manual_service_name,
    manual_payment_type,
    manual_visit_number, // 🌟 ДОБАВЛЕНО
  } = req.body;

  try {
    const checkVisit = await db.query("SELECT id FROM visits WHERE id = $1", [
      visitId,
    ]);
    if (checkVisit.rows.length === 0) {
      return res.status(404).json({ message: "Визит не найден в системе" });
    }

    // 🌟 ИСПРАВЛЕНО: Добавили manual_visit_number в SET
    const queryText = `
      UPDATE visits
      SET 
        manual_car_brand = $1,
        manual_client_name = $2,
        manual_client_phone = $3,
        manual_service_name = $4,
        manual_payment_type = $5,
        manual_visit_number = $6
      WHERE id = $7
      RETURNING id
    `;

    const values = [
      manual_car_brand || null,
      manual_client_name || null,
      manual_client_phone || null,
      manual_service_name || null,
      manual_payment_type || null,
      manual_visit_number ? parseInt(manual_visit_number, 10) : null, // Валидируем в число
      visitId,
    ];

    console.log("Массив values для SQL:", values);

    await db.query(queryText, values);

    res.status(200).json({
      success: true,
      message: "Параметры заезда успешно обновлены в базе данных",
    });

    console.log(
      `✏️ Визит №${visitId} успешно отредактирован (включая шаг лояльности).`,
    );
  } catch (err) {
    console.error("Ошибка в контроллере updateVisit:", err);
    res
      .status(500)
      .json({ message: "Ошибка сервера при обновлении полей визита" });
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
