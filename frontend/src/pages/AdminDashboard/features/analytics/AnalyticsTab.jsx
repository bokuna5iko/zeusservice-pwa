// src/pages/AdminDashboard/Tabs/AnalyticsTab.jsx
import React from "react";
import { useAnalyticsData } from "./hooks/useAnalyticsData";
import ArchiveCalendarGrid from "./components/ArchiveCalendarGrid"; // 🚀 Импортируем наш новый календарь

const AnalyticsTab = ({ onSelectArchiveDate }) => {
  // Подключаем наш изолированный хук логики архивного календаря
  const { calendarShifts, loading } = useAnalyticsData();

  return (
    <div className="visits-tab-viewport">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      ></div>

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
