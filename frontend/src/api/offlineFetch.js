// frontend/src/api/offlineFetch.js
import { offlineDB } from "../db/offlineDB";
import { v4 as uuidv4 } from "uuid";

// Конфигурация: какие POST-запросы куда складывать в офлайн
const OFFLINE_CONFIG = {
  "/api/admin/visits/add": {
    type: "visit",
    action: "create",
    transformPayload: (body) => ({
      ...body,
      id: uuidv4(), // Генерируем UUID прямо здесь
      created_at: new Date().toISOString(),
      visit_number: body.visit_number || null,
      admin_id: null, // Заполним при синхронизации из токена
    }),
  },
  "/api/shifts/worker/request": {
    type: "shift",
    action: "create",
    transformPayload: (body) => ({
      ...body,
      id: uuidv4(),
      status: "pending",
      created_at: new Date().toISOString(),
    }),
  },
};

/**
 * Умная обёртка над fetch с поддержкой офлайн-режима
 */
export async function offlineFetch(url, options = {}) {
  const isOnline = navigator.onLine;
  const method = (options.method || "GET").toUpperCase();

  // GET-запросы всегда идут напрямую (или падают если офлайн)
  if (method === "GET") {
    return fetch(url, options);
  }

  // POST/PUT/DELETE — проверяем конфигурацию офлайна
  const config = Object.entries(OFFLINE_CONFIG).find(([path]) =>
    url.includes(path),
  );

  // Если нет конфига для этого URL — обычный fetch
  if (!config) {
    return fetch(url, options);
  }

  const [, offlineHandler] = config;

  // Онлайн — пробуем отправить на сервер
  if (isOnline) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;

      // Если сервер вернул ошибку (не сетевая) — не кладём в офлайн
      throw new Error(`Server error: ${response.status}`);
    } catch (err) {
      // Только сетевые ошибки (offline или timeout) — в очередь
      if (!navigator.onLine || err.name === "TypeError") {
        return saveToOutbox(url, options, offlineHandler);
      }
      throw err;
    }
  }

  // Офлайн — сохраняем в очередь
  return saveToOutbox(url, options, offlineHandler);
}

/**
 * Сохранение в локальную очередь
 */
async function saveToOutbox(url, options, handler) {
  try {
    const body = JSON.parse(options.body || "{}");
    const enrichedPayload = handler.transformPayload(body);

    const record = await offlineDB.addToOutbox({
      type: handler.type,
      action: handler.action,
      payload: enrichedPayload,
    });

    // Также сразу добавляем в локальный снепшот для отображения
    if (handler.type === "visit") {
      await offlineDB.todayVisits.put(enrichedPayload);
    }

    console.log("[Offline] Сохранено в очередь:", record);

    // Возвращаем фейковый Response, чтобы UI не сломался
    return new Response(
      JSON.stringify({
        success: true,
        offline: true,
        id: enrichedPayload.id,
        message:
          "Сохранено локально. Будет синхронизировано при появлении сети.",
      }),
      {
        status: 202,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[Offline] Ошибка сохранения:", err);
    throw err;
  }
}

/**
 * Принудительная синхронизация (вызывается при появлении сети)
 */
export async function syncOfflineData(apiService) {
  const pending = await offlineDB.getPendingOutbox();

  if (pending.length === 0) {
    return { synced: 0, message: "Нет данных для синхронизации" };
  }

  console.log(`[Sync] Найдено ${pending.length} записей для синхронизации`);

  const syncResults = [];

  for (const record of pending) {
    try {
      await offlineDB.markSyncing(record.localId);

      let response;

      if (record.type === "visit") {
        response = await apiService.post("/admin/sync-offline", {
          records: [record.payload],
        });
      } else if (record.type === "shift") {
        response = await apiService.post(
          "/shifts/worker/request",
          record.payload,
        );
      }

      if (response.data?.success) {
        await offlineDB.markSynced(record.localId);
        syncResults.push({ id: record.id, status: "success" });
      } else {
        throw new Error(response.data?.message || "Unknown error");
      }
    } catch (err) {
      console.error(`[Sync] Ошибка синхронизации записи ${record.id}:`, err);
      await offlineDB.markError(record.localId, err.message);
      syncResults.push({ id: record.id, status: "error", error: err.message });
    }
  }

  const successCount = syncResults.filter((r) => r.status === "success").length;

  return {
    synced: successCount,
    failed: syncResults.length - successCount,
    results: syncResults,
  };
}

export default offlineFetch;
