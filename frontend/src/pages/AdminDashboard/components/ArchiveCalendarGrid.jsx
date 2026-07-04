// src/pages/AdminDashboard/components/ArchiveCalendarGrid.jsx
import React from "react";
import { useArchiveCalendar, WEEKDAYS } from "../hooks/useArchiveCalendar";

const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const ArchiveCalendarGrid = ({ calendarShifts, onSelectArchiveDate }) => {
  // Подключаем наш изолированный хук календарной арифметики
  const { currentMonth, handlePrevMonth, handleNextMonth, getDaysGrid } =
    useArchiveCalendar(calendarShifts);

  const cells = getDaysGrid();

  return (
    <div
      className="calendar-wrapper"
      style={{
        background: "#0f172a",
        borderRadius: "16px",
        padding: "24px",
        border: "1px solid #1e293b",
      }}
    >
      {/* Навигация по месяцам */}
      <div
        className="calendar-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <button
          className="btn-secondary"
          onClick={handlePrevMonth}
          style={{ padding: "8px 16px", fontSize: "14px" }}
        >
          <i className="fas fa-chevron-left"></i> ◀ Назад
        </button>
        <h3
          style={{
            fontSize: "1.2rem",
            fontWeight: "800",
            color: "#f8fafc",
            minWidth: "180px",
            textAlign: "center",
          }}
        >
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          className="btn-secondary"
          onClick={handleNextMonth}
          style={{ padding: "8px 16px", fontSize: "14px" }}
        >
          Вперед ▶ <i className="fas fa-chevron-right"></i>
        </button>
      </div>
      {/* Дни недели (Пн - Вс) */}
      <div
        className="weekdays-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "10px",
          textAlign: "center",
          marginBottom: "12px",
        }}
      >
        {WEEKDAYS.map(
          (
            day, // 🌟 Заменили WEEK_DAYS на WEEKDAYS
          ) => (
            <div
              key={day}
              style={{
                color: "#64748b",
                fontWeight: "700",
                fontSize: "13px",
                paddingBottom: "6px",
                borderBottom: "1px solid #1e293b",
              }}
            >
              {day}
            </div>
          ),
        )}
      </div>

      {/* Основная сетка ячеек */}
      <div
        className="days-calendar-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "12px",
        }}
      >
        {cells.map((cell) => {
          if (cell.type === "empty") {
            return (
              <div
                key={cell.key}
                style={{
                  background: "rgba(15, 23, 42, 0.3)",
                  border: "1px dashed #1e293b",
                  borderRadius: "10px",
                  aspectRatio: "1/1",
                  opacity: 0.2,
                }}
              />
            );
          }

          const hasShift = !!cell.shift;
          let finalRevenue = 0;
          let diff = 0;

          if (hasShift) {
            const totalCash = parseFloat(cell.shift.cash_total || 0);
            const totalCard = parseFloat(cell.shift.card_total || 0);
            const expenses = parseFloat(cell.shift.expenses_total || 0);
            finalRevenue = totalCash + totalCard - expenses;
            diff = parseFloat(cell.shift.cash_difference || 0);
          }

          return (
            <div
              key={cell.key}
              onClick={() => hasShift && onSelectArchiveDate(cell.shift)}
              style={{
                background: hasShift ? "#1e293b" : "#090d16",
                border: hasShift ? "1px solid #334155" : "1px solid #111827",
                borderRadius: "12px",
                aspectRatio: "1/1",
                padding: "10px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                cursor: hasShift ? "pointer" : "default",
                transition: "all 0.2s",
                position: "relative",
              }}
              className={hasShift ? "interactive-calendar-cell" : ""}
              onMouseEnter={(e) => {
                if (hasShift) {
                  e.currentTarget.style.borderColor = "#38bdf8";
                  e.currentTarget.style.transform = "scale(1.03)";
                }
              }}
              onMouseLeave={(e) => {
                if (hasShift) {
                  e.currentTarget.style.borderColor = "#334155";
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "800",
                  color: hasShift ? "#fff" : "#334155",
                  alignSelf: "flex-start",
                }}
              >
                {cell.dayNumber}
              </span>

              {hasShift ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    width: "100%",
                    textAlign: "right",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#94a3b8",
                      fontWeight: "600",
                    }}
                  >
                    🚗 {cell.shift.total_cars_count} шт.
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#4ade80",
                      fontWeight: "800",
                    }}
                  >
                    {finalRevenue} ₽
                  </span>

                  {diff !== 0 && (
                    <span
                      style={{
                        fontSize: "9px",
                        color: diff > 0 ? "#eab308" : "#ef4444",
                        fontWeight: "700",
                      }}
                    >
                      {diff > 0 ? "излишек" : "минус"}
                    </span>
                  )}
                </div>
              ) : (
                <span
                  style={{
                    fontSize: "10px",
                    color: "#1e293b",
                    textAlign: "center",
                    width: "100%",
                    fontWeight: "600",
                  }}
                >
                  нет смен
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ArchiveCalendarGrid;
