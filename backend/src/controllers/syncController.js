// backend/src/controllers/syncController.js
const db = require("../config/db");

/**
 * Пакетная синхронизация офлайн-данных
 * POST /api/admin/sync-offline
 */
exports.syncOfflineData = async (req, res) => {
  const { records } = req.body;
  const adminId = req.user.id;

  if (!records || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Пакет данных пуст",
    });
  }

  const results = [];
  let syncedCount = 0;

  try {
    await db.query("BEGIN");

    for (const record of records) {
      try {
        if (
          record.type === "visit" ||
          record.service_type ||
          record.base_price !== undefined
        ) {
          // Синхронизация визита
          await syncVisit(record, adminId);
          syncedCount++;
          results.push({ id: record.id, status: "synced" });
        } else if (record.type === "shift" || record.date) {
          // Синхронизация смены
          await syncShift(record);
          syncedCount++;
          results.push({ id: record.id, status: "synced" });
        }
      } catch (recordError) {
        console.error(`[Sync] Ошибка записи ${record.id}:`, recordError);
        results.push({
          id: record.id,
          status: "error",
          error: recordError.message,
        });
        // Продолжаем с следующей записью, не прерываем всю транзакцию
      }
    }

    await db.query("COMMIT");

    res.json({
      success: true,
      synced: syncedCount,
      total: records.length,
      results,
    });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("[Sync] Критическая ошибка транзакции:", err);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при синхронизации",
      error: err.message,
    });
  }
};

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============

async function syncVisit(record, adminId) {
  const {
    id,
    userId,
    serviceId,
    payment_type,
    is_guest,
    manual_price,
    base_price,
    service_name,
    visit_number,
    created_at,
  } = record;

  // Проверяем, не существует ли уже такая запись
  const existing = await db.query("SELECT id FROM visits WHERE id = $1", [id]);

  if (existing.rows.length > 0) {
    // Запись уже есть — пропускаем (идемпотентность)
    return;
  }

  // Вставляем визит
  await db.query(
    `INSERT INTO visits 
      (id, user_id, service_id, service_type, price, visit_number, 
       payment_type, admin_id, amount, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      id,
      is_guest ? null : userId,
      serviceId || null,
      service_name || "Нестандартная услуга",
      manual_price || base_price || 0,
      visit_number,
      payment_type || "Наличные",
      adminId,
      manual_price || base_price || 0,
      created_at || new Date().toISOString(),
    ],
  );

  // Обновляем счётчики пользователя (только для не-гостей)
  if (!is_guest && userId) {
    const userRes = await db.query(
      "SELECT visit_count, total_visits FROM users WHERE id = $1",
      [userId],
    );

    if (userRes.rows.length > 0) {
      const user = userRes.rows[0];
      let newVisitCount = (user.visit_count || 0) + 1;

      if (newVisitCount >= 8) {
        newVisitCount = 0;
      }

      await db.query(
        `UPDATE users 
         SET visit_count = $1, 
             total_visits = COALESCE(total_visits, 0) + 1 
         WHERE id = $2`,
        [newVisitCount, userId],
      );
    }
  }
}

async function syncShift(record) {
  const { id, user_id, date, status } = record;

  const existing = await db.query("SELECT id FROM shifts WHERE id = $1", [id]);

  if (existing.rows.length > 0) return;

  await db.query(
    `INSERT INTO shifts (id, user_id, date, status) 
     VALUES ($1, $2, $3, $4)`,
    [id, user_id, date, status || "pending"],
  );
}
