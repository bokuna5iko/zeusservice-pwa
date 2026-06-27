// src/pages/AdminDashboard/Tabs/AnalyticsTab.jsx
import React, { useState, useEffect } from "react";
import { api } from "../../../api/apiService";

const AnalyticsTab = ({ onSelectArchiveDate }) => {
  const [calendarShifts, setCalendarShifts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getArchiveCalendar()
      .then((res) => setCalendarShifts(res.data || []))
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
          marginBottom: "10px",
        }}
      >
        <h2 style={{ fontSize: "1.3rem", fontWeight: "700" }}>
          📅 Календарный архив закрытых операционных смен
        </h2>
        <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
          Режим просмотра истории
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "50px", color: "#64748b" }}>
          <i className="fas fa-spinner fa-spin fa-2x"></i>{" "}
          <p style={{ marginTop: "10px" }}>Загрузка исторического хаба...</p>
        </div>
      ) : calendarShifts.length === 0 ? (
        <div className="tab-placeholder">
          Архив пуст. Закрытые смены появятся здесь автоматически.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {calendarShifts.map((shift) => {
            const dateObj = new Date(shift.shift_date);
            const totalCash = parseFloat(shift.cash_total || 0);
            const totalCard = parseFloat(shift.card_total || 0);
            const expenses = parseFloat(shift.expenses_total || 0);
            const finalRevenue = totalCash + totalCard - expenses;
            const diff = parseFloat(shift.cash_difference || 0);

            return (
              <div
                key={shift.id}
                className="content-group-box"
                onClick={() => {
                  console.log("=== КЛИК ПО ПЛИТКЕ АРХИВА ===");
                  console.log("Данные смены, по которой кликнули:", shift);
                  onSelectArchiveDate(shift);
                }}
                style={{
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "14px",
                  padding: "20px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#38bdf8";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#1e293b";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #1e293b",
                    paddingBottom: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    style={{
                      fontWeight: "700",
                      fontSize: "1.1rem",
                      color: "#f8fafc",
                    }}
                  >
                    {dateObj.toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "#94a3b8",
                      background: "#1e293b",
                      padding: "4px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    {dateObj.getFullYear()} г.
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    fontSize: "13px",
                  }}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "#64748b" }}>Помыто авто:</span>
                    <span style={{ fontWeight: "600" }}>
                      {shift.total_cars_count} шт.
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "#64748b" }}>Чистая выручка:</span>
                    <span style={{ fontWeight: "700", color: "#38bdf8" }}>
                      {finalRevenue} ₽
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "#64748b" }}>Сверка сейфа:</span>
                    {diff === 0 ? (
                      <span style={{ color: "#22c55e", fontWeight: "600" }}>
                        Идеально
                      </span>
                    ) : diff > 0 ? (
                      <span style={{ color: "#eab308", fontWeight: "600" }}>
                        Излишек +{diff} ₽
                      </span>
                    ) : (
                      <span style={{ color: "#ef4444", fontWeight: "600" }}>
                        Недостача {diff} ₽
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "14px",
                    paddingTop: "10px",
                    borderTop: "1px dashed #1e293b",
                    fontSize: "12px",
                    color: "#64748b",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  Нажмите для просмотра деталей 🔍
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AnalyticsTab;
