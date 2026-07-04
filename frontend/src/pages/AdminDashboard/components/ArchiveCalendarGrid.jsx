// src/pages/AdminDashboard/components/ArchiveCalendarGrid.jsx
import React, { useState } from "react";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
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
  // Базовый стейт на текущую дату (для старта календаря)
  const [currentDate, setCurrentTime] = useState(new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0 - 11

  // Переключатели месяцев
  const handlePrevMonth = () => {
    setCurrentTime(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentTime(new Date(currentYear, currentMonth + 1, 1));
  };

  // 🧠 Математика календаря:
  // 1. Сколько дней в текущем месяце
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // 2. С какого дня недели начинается месяц (0 - Вс, 1 - Пн... 6 - Сб)
  let startDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  // Переводим на человеческий стандарт (Пн - 0, Вт - 1... Вс - 6)
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  // Генерируем массив ячеек сетки
  const calendarCells = [];

  // А. Заполняем пустые дни-заглушки до начала месяца
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push({ type: "empty", key: `empty-start-${i}` });
  }

  // Б. Заполняем реальные дни месяца (от 1 до daysInMonth)
  for (let day = 1; day <= daysInMonth; day++) {
    // Ищем, есть ли в нашем массиве смен с бэкенда смена на этот день
    // Важно: сравниваем год, месяц и число локально, защищаясь от таймзон!
    const matchingShift = calendarShifts.find((shift) => {
      const shiftDate = new Date(shift.shift_date);
      return (
        shiftDate.getFullYear() === currentYear &&
        shiftDate.getMonth() === currentMonth &&
        shiftDate.getDate() === day
      );
    });

    calendarCells.push({
      type: "day",
      dayNumber: day,
      shift: matchingShift || null,
      key: `day-cell-${day}`,
    });
  }

  // В. Заполняем пустые заглушки в конце сетки до полного квадрата кратного 7
  const totalSlots = Math.ceil(calendarCells.length / 7) * 7;
  const endEmptyCount = totalSlots - calendarCells.length;
  for (let i = 0; i < endEmptyCount; i++) {
    calendarCells.push({ type: "empty", key: `empty-end-${i}` });
  }

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
      {/* Шапка календаря с кнопками переключения месяцев */}
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
          {MONTHS[currentMonth]} {currentYear}
        </h3>
        <button
          className="btn-secondary"
          onClick={handleNextMonth}
          style={{ padding: "8px 16px", fontSize: "14px" }}
        >
          Вперед ▶ <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      {/* Сетка дней недели (Пн - Вс) */}
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
        {WEEKDAYS.map((day) => (
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
        ))}
      </div>

      {/* Глобальная сетка календаря */}
      <div
        className="days-calendar-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "12px",
        }}
      >
        {calendarCells.map((cell) => {
          if (cell.type === "empty") {
            // Рисуем пустой некликабельный серый квадрат-заглушку
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

          // Если это реальный день месяца
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
              {/* Число месяца */}
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

              {/* Операционная мини-сводка, если в этот день была закрытая смена */}
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

                  {/* Крохотный индикатор сверки кассы */}
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
