// src/pages/AdminDashboard/Tabs/AnalyticsTab.jsx
import React, { useState, useEffect } from "react";
import { api } from "../../../api/apiService";
import ArchiveCalendarGrid from "../components/ArchiveCalendarGrid"; // 🚀 Импортируем наш новый календарь

const AnalyticsTab = ({ onSelectArchiveDate }) => {
  const [calendarShifts, setCalendarShifts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getArchiveCalendar()
      // Переворачиваем массив смен наоборот, чтобы при совпадении логики
      // или вложенных массивов они обрабатывались в прямом календарном порядке
      .then((res) => {
        const shifts = res.data || [];
        setCalendarShifts(shifts.reverse());
      })
      .catch((err) => console.error("Ошибка чтения календаря:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="visits-tab-viewport">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ fontSize: "1.3rem", fontWeight: "700" }}>
          📅 Интерактивная календарная сетка закрытых смен
        </h2>
        <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
          Хаб истории автомойки ZEUS AUTO
        </span>
      </div>

      {loading ? (
        <div
          style={{ textAlign: "center", padding: "80px 0", color: "#64748b" }}
        >
          <i className="fas fa-spinner fa-spin fa-2x"></i>
          <p style={{ marginTop: "14px", fontWeight: "600" }}>
            Сборка календарных ячеек из базы данных...
          </p>
        </div>
      ) : (
        /* 🚀 Передаем управление выделенному компоненту сетки */
        <ArchiveCalendarGrid
          calendarShifts={calendarShifts}
          onSelectArchiveDate={onSelectArchiveDate}
        />
      )}
    </div>
  );
};

export default AnalyticsTab;
