// src/controllers/shiftController.js
const db = require("../config/db");

// Вспомогательная функция расчета заработка на основе ТЗ 2.0
const calculateShiftEarnings = (carsCount) => {
  const cars = parseInt(carsCount || 0);
  if (cars < 30) return 2000;
  if (cars <= 44) return 3000;
  if (cars <= 59) return 3500;
  if (cars <= 74) return 4000;
  return 4500;
};

// 1. Получение истории смен сотрудником
exports.getWorkerHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      "SELECT id, date::text, status, earnings, cars_washed FROM shifts WHERE user_id = $1 ORDER BY date ASC",
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// 2. Подача заявки на смену сотрудником
exports.requestShift = async (req, res) => {
  const { date } = req.body;
  const userId = req.user.id;

  try {
    await db.query(
      "INSERT INTO shifts (user_id, date, status) VALUES ($1, $2, 'pending')",
      [userId, date],
    );
    res.json({ success: true, message: "Заявка успешно отправлена" });
  } catch (err) {
    if (err.code === "23505") {
      return res
        .status(400)
        .json({ message: "Вы уже подавали заявку на этот день!" });
    }
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// 3. Получение админом списка необработанных заявок
exports.getPendingShifts = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT s.id, s.date::text, u.name as worker_name FROM shifts s JOIN users u ON s.user_id = u.id WHERE s.status = 'pending' ORDER BY s.date ASC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// 4. 🌟 ДОБАВЛЕНО: Получение админом полной сетки смен для календаря-аккордеона
exports.getAdminCalendar = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.id, s.date::text, s.status, s.earnings, s.cars_washed,
                    u.id as worker_id, u.name as worker_name, u.avatar_url
             FROM shifts s 
             JOIN users u ON s.user_id = u.id 
             ORDER BY s.date ASC`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// 5. ПАКЕТНОЕ СОХРАНЕНИЕ СМЕН АДМИНОМ С КОНТРОЛЕМ КУЛДАУНА
exports.batchUpdateShifts = async (req, res) => {
  const adminId = req.user.id;
  const { changes } = req.body; // Массив объектов [{ shiftId: X, action: 'approved'/'rejected' }]

  if (!changes || !Array.isArray(changes) || changes.length === 0) {
    return res.status(400).json({ message: "Пакет изменений пуст" });
  }

  try {
    const adminCheck = await db.query(
      "SELECT last_shift_publish_at FROM users WHERE id = $1",
      [adminId],
    );
    const lastPublish = adminCheck.rows[0].last_shift_publish_at;

    if (lastPublish) {
      const timeDiff = new Date() - new Date(lastPublish);
      const cooldownMs = 5 * 60 * 1000; // 5 минут
      if (timeDiff < cooldownMs) {
        return res.status(429).json({
          message: "Защита от спама! Публикация доступна раз в 5 минут.",
        });
      }
    }

    await db.query("BEGIN");
    for (let change of changes) {
      await db.query(
        "UPDATE shifts SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [change.action, change.shiftId],
      );
    }
    await db.query(
      "UPDATE users SET last_shift_publish_at = CURRENT_TIMESTAMP WHERE id = $1",
      [adminId],
    );
    await db.query("COMMIT");

    res.json({ success: true, message: "Пакет изменений успешно опубликован" });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Ошибка при пакетном обновлении" });
  }
};

// 6. 🌟 АВТОМАТИЧЕСКИЙ ЕЖЕДНЕВНЫЙ СНИМОК СМЕН В 23:00 (Snapshot Engine)
// Каждые 60 секунд проверяем время. Если на часах ровно 23:00 — запускаем пересчет
setInterval(async () => {
  const now = new Date();
  if (now.getHours() === 23 && now.getMinutes() === 0) {
    console.log("=== SNAPSHOT ENGINE: ЗАПУСК ПЕРЕСЧЕТА ЗАРПЛАТ ЗА СУТКИ ===");
    try {
      // 1. Считаем общее количество машин, помытых за сегодня
      const todayStr = now.toISOString().split("T")[0];
      const visitsCountRes = await db.query(
        "SELECT COUNT(*) FROM visits WHERE DATE(created_at) = $1",
        [todayStr],
      );
      const totalCars = parseInt(visitsCountRes.rows[0].count || 0);

      // 2. Рассчитываем итоговую сумму по тарифной сетке
      const finalDayEarnings = calculateShiftEarnings(totalCars);

      // 3. Находим всех сотрудников, которые сегодня были «В графике» (approved),
      // фиксируем показатели и переводим их в статус «Отработано» (completed)
      await db.query(
        `UPDATE shifts 
                 SET status = 'completed', earnings = $1, cars_washed = $2, updated_at = CURRENT_TIMESTAMP
                 WHERE date = $3 AND status = 'approved'`,
        [finalDayEarnings, totalCars, todayStr],
      );
      console.log(
        `[SNAPSHOT SUCCESS] День: ${todayStr}, Машин: ${totalCars}, Сумма: ${finalDayEarnings} ₽`,
      );
    } catch (err) {
      console.error("Ошибка в работе Snapshot Engine:", err);
    }
  }
}, 60000);
