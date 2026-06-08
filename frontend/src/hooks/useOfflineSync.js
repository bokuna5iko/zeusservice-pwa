// frontend/src/hooks/useOfflineSync.js
import { useState, useEffect, useCallback, useRef } from "react";
import { offlineDB } from "../db/offlineDB";
import { syncOfflineData } from "../api/offlineFetch";
import { api } from "../api/apiService";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerType, setBannerType] = useState("offline"); // 'offline' | 'success' | 'error'
  const [bannerMessage, setBannerMessage] = useState("");

  const syncInProgress = useRef(false);

  // Обновление счётчика pending
  const updatePendingCount = useCallback(async () => {
    const count = await offlineDB.getPendingCount();
    setPendingCount(count);
    return count;
  }, []);

  // Показать баннер
  const showBannerMessage = useCallback((type, message, duration = 0) => {
    setBannerType(type);
    setBannerMessage(message);
    setShowBanner(true);

    if (duration > 0) {
      setTimeout(() => setShowBanner(false), duration);
    }
  }, []);

  // Скрыть баннер
  const hideBanner = useCallback(() => {
    setShowBanner(false);
  }, []);

  // Основная функция синхронизации
  const performSync = useCallback(async () => {
    if (syncInProgress.current || !navigator.onLine) return;

    syncInProgress.current = true;
    setIsSyncing(true);

    try {
      const result = await syncOfflineData(api);
      setLastSyncResult(result);
      await updatePendingCount();

      if (result.synced > 0) {
        showBannerMessage(
          "success",
          `✅ Синхронизировано записей: ${result.synced}`,
          3000,
        );
      }

      if (result.failed > 0) {
        showBannerMessage(
          "error",
          `⚠️ Ошибок синхронизации: ${result.failed}. Повторите позже.`,
          5000,
        );
      }

      return result;
    } catch (err) {
      console.error("[useOfflineSync] Ошибка синхронизации:", err);
      showBannerMessage("error", "❌ Ошибка синхронизации с сервером", 5000);
      return { synced: 0, failed: 0, error: err.message };
    } finally {
      setIsSyncing(false);
      syncInProgress.current = false;
    }
  }, [updatePendingCount, showBannerMessage]);

  // Слушатели сети
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const count = await updatePendingCount();

      if (count > 0) {
        showBannerMessage(
          "offline",
          `🔄 Восстановлено соединение. Синхронизация ${count} записей...`,
        );
        // Небольшая задержка для стабильности соединения
        setTimeout(() => performSync(), 1000);
      } else {
        showBannerMessage("success", "✅ Соединение восстановлено", 2000);
      }
    };

    const handleOffline = async () => {
      setIsOnline(false);
      const count = await updatePendingCount();
      showBannerMessage(
        "offline",
        `⚠️ Режим ЧП: Интернет отсутствует. Новые записи (${count}) сохраняются локально.`,
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Первичная проверка
    updatePendingCount();
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [performSync, updatePendingCount, showBannerMessage]);

  // Периодическая проверка (каждые 30 сек)
  useEffect(() => {
    const interval = setInterval(() => {
      updatePendingCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    showBanner,
    bannerType,
    bannerMessage,
    hideBanner,
    performSync,
    updatePendingCount,
  };
}

export default useOfflineSync;
