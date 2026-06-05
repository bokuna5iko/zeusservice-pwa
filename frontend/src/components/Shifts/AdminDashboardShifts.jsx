// src/components/Shifts/AdminDashboardShifts.jsx
import React, { useState, useEffect } from "react";
import { api } from "../../api/apiService"; // 🌟 ИСПРАВЛЕНО: Подключаем наш Axios API-мост
import "./AdminDashboardShifts.css"; // 🌟 ИСПРАВЛЕНО: Импортируем изолированные стили

const AdminDashboardShifts = ({ pendingCount, refreshTrigger }) => {
  const [todayWorkers, setTodayWorkers] = useState([]);

  useEffect(() => {
    const fetchTodayWorkers = async () => {
      try {
        const response = await api.getAdminCalendar();
        const todayStr = new Date().toISOString().split("T")[0];

        const activeToday = response.data.filter(
          (s) => s.date === todayStr && s.status === "approved",
        );
        setTodayWorkers(activeToday);
      } catch (err) {
        console.error("Ошибка загрузки сегодняшней смены на дашборде:", err);
      }
    };
    fetchTodayWorkers();
  }, [refreshTrigger]);

  return (
    <div className="profile-card admin-shifts-dashboard">
      <div className="dashboard-flex-layout">
        {/* Левая сторона: Счетчик */}
        <div className="db-left-counter-pane">
          <span className="db-pane-label">На рассмотрении</span>
          <h2
            className={`db-pending-number-text ${pendingCount > 0 ? "text-orange-neon" : "text-muted-gray"}`}
          >
            {pendingCount}{" "}
            {pendingCount === 1
              ? "заявка"
              : pendingCount > 1 && pendingCount < 5
                ? "заявки"
                : "заявок"}
          </h2>
        </div>

        {/* Правая сторона: Горизонтальный скролл */}
        <div className="db-right-workers-pane">
          <span className="db-pane-label">Сегодня в боксах</span>
          <div className="workers-horizontal-scroll">
            {todayWorkers.length > 0 ? (
              todayWorkers.map((w) => (
                <div key={w.id} className="scroll-avatar-pill">
                  <img
                    src={`/avatars/${w.avatar_url || "1.png"}`}
                    alt="avatar"
                  />
                  <span>{w.worker_name}</span>
                </div>
              ))
            ) : (
              <span className="no-workers-today-text">Смена не заполнена</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardShifts;
