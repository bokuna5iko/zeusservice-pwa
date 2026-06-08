// frontend/src/db/offlineDB.js
import Dexie from "dexie";
import { v4 as uuidv4 } from "uuid";

class OfflineDatabase extends Dexie {
  constructor() {
    super("ZeusAutoOfflineDB");

    this.version(1).stores({
      // Слепок данных за сегодня
      services: "id, service_name, car_class, base_price",
      todayVisits:
        "id, user_id, service_type, price, created_at, visit_number, payment_type, is_guest, admin_id",
      todayShifts:
        "id, user_id, date, status, earnings, cars_washed, worker_name",
      usersSnapshot: "id, name, phone, car_brand, visit_count, total_visits",

      // Очередь офлайн-операций
      outboxQueue: "++localId, id, type, action, status, createdAt",

      // Метаданные синхронизации
      syncMeta: "key, value, updatedAt",
    });
  }

  // ============ СНЕПШОТЫ (кэш данных) ============

  async saveSnapshot(tableName, data) {
    await this[tableName].clear();
    await this[tableName].bulkPut(data);
    await this.syncMeta.put({
      key: `lastSync_${tableName}`,
      value: new Date().toISOString(),
      updatedAt: Date.now(),
    });
  }

  async getSnapshot(tableName) {
    return await this[tableName].toArray();
  }

  async getLastSync(tableName) {
    const meta = await this.syncMeta.get(`lastSync_${tableName}`);
    return meta?.value || null;
  }

  // ============ OUTBOX (очередь офлайн) ============

  async addToOutbox({ type, action, payload }) {
    const record = {
      id: payload.id || uuidv4(), // UUID для записи
      type, // 'visit' | 'shift'
      action, // 'create' | 'update'
      payload, // Полные данные для отправки
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const localId = await this.outboxQueue.add(record);
    return { ...record, localId };
  }

  async getPendingOutbox() {
    return await this.outboxQueue.where("status").equals("pending").toArray();
  }

  async getAllOutbox() {
    return await this.outboxQueue.toArray();
  }

  async markSyncing(localId) {
    await this.outboxQueue.update(localId, { status: "syncing" });
  }

  async markSynced(localId) {
    await this.outboxQueue.delete(localId);
  }

  async markError(localId, errorMessage) {
    await this.outboxQueue.update(localId, {
      status: "error",
      error: errorMessage,
      errorAt: new Date().toISOString(),
    });
  }

  async clearOutbox() {
    await this.outboxQueue.clear();
  }

  async getPendingCount() {
    return await this.outboxQueue.where("status").equals("pending").count();
  }

  // ============ УТИЛИТЫ ============

  async clearAllData() {
    await this.services.clear();
    await this.todayVisits.clear();
    await this.todayShifts.clear();
    await this.usersSnapshot.clear();
    await this.outboxQueue.clear();
    await this.syncMeta.clear();
  }
}

// Singleton
export const offlineDB = new OfflineDatabase();
export default offlineDB;
