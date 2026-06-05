// src/pages/AdminShifts/AdminShiftsPage.jsx
import React, { useState, useEffect } from "react";
import "./AdminShiftsPage.css";
import AdminDashboardShifts from "../../components/Shifts/AdminDashboardShifts";
import AdminShiftAccordion from "../../components/Shifts/AdminShiftAccordion";
import { api } from "../../api/apiService"; // 🌟 Наш мост запросов

const AdminShiftsPage = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [stagedChanges, setStagedChanges] = useState([]);
  const [cooldownTime, setCooldownTime] = useState(0);

  // 🌟 ИСПРАВЛЕНО: Добавляем изолированный триггер сетевого обновления календаря
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (cooldownTime <= 0) return;
    const idx = setInterval(() => {
      setCooldownTime((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(idx);
  }, [cooldownTime]);

  const formatCooldown = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handlePublish = async () => {
    if (cooldownTime > 0 || stagedChanges.length === 0) return;

    try {
      // 🌟 ОТПРАВЛЯЕМ ПАКЕТ ИЗМЕНЕНИЙ ЧЕРЕЗ AXIOS API СЕРВИС
      await api.batchUpdateShifts(stagedChanges);

      setStagedChanges([]);
      setCooldownTime(300); // 5 минут локального кулдауна

      // 🌟 ИСПРАВЛЕНО: Увеличиваем триггер, заставляя аккордеон сделать ровно один чистый GET-запрос
      setRefreshTrigger((prev) => prev + 1);

      alert("Пакет изменений успешно опубликован на сервере!");
    } catch (err) {
      console.error("Ошибка публикации смен:", err);
      alert(err.response?.data?.message || "Ошибка пакетного сохранения смен");
    }
  };

  return (
    <div className="admin-shifts-page">
      <div className="page-center-container">
        <AdminDashboardShifts
          pendingCount={pendingCount}
          refreshTrigger={refreshTrigger}
        />

        <div className="admin-calendar-box">
          <h3 className="admin-calendar-title">Модерация рабочих смен</h3>
          <AdminShiftAccordion
            setPendingCount={setPendingCount}
            stagedChanges={stagedChanges}
            setStagedChanges={setStagedChanges}
            isCooldown={cooldownTime > 0}
            refreshTrigger={refreshTrigger} // 🌟 ИСПРАВЛЕНО: Передаем триггер сети в компонент аккордеона
          />
        </div>
      </div>

      {stagedChanges.length > 0 && (
        <div className="batch-publish-wrapper">
          <button
            className="batch-publish-btn"
            disabled={cooldownTime > 0}
            onClick={handlePublish}
          >
            <i className="fas fa-paper-plane"></i>
            {cooldownTime > 0
              ? `Опубликовать (Блокировка ${formatCooldown(cooldownTime)})`
              : `Опубликовать изменения (${stagedChanges.length})`}
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminShiftsPage;
