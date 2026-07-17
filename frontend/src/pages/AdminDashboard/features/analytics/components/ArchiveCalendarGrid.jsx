// src/pages/AdminDashboard/components/ArchiveCalendarGrid.jsx
import React from "react";
import "./ArchiveCalendarGrid.css";
import { Button } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
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
    <div className="zeus-calendar-container">
      {/* Навигация по месяцам */}
      <div className="zeus-calendar-header">
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={handlePrevMonth}
          className="calendar-nav-btn"
        >
          Назад
        </Button>
        <h3 className="calendar-current-month">
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <Button
          type="text"
          onClick={handleNextMonth}
          className="calendar-nav-btn"
        >
          Вперед <RightOutlined />
        </Button>
      </div>

      {/* Дни недели (Пн - Вс) */}
      <div className="calendar-weekdays-grid">
        {WEEKDAYS.map((day) => (
          <div key={day} className="calendar-weekday-item">
            {day}
          </div>
        ))}
      </div>

      {/* Основная сетка ячеек */}
      <div className="calendar-days-grid">
        {cells.map((cell) => {
          if (cell.type === "empty") {
            return <div key={cell.key} className="calendar-cell-empty" />;
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
              className={`calendar-day-cell ${hasShift ? "has-shift" : "no-shift"}`}
            >
              <span className="cell-day-number">{cell.dayNumber}</span>

              {hasShift ? (
                <div className="cell-stats-block">
                  <span className="stat-cars">
                    🚗 {cell.shift.total_cars_count} шт.
                  </span>
                  <span className="stat-revenue">
                    {finalRevenue.toLocaleString("ru-RU")} ₽
                  </span>

                  {diff !== 0 && (
                    <span
                      className={`stat-diff-badge ${diff > 0 ? "surplus" : "shortage"}`}
                    >
                      {diff > 0 ? `+${diff} ₽` : `${diff} ₽`}
                    </span>
                  )}
                </div>
              ) : (
                <span className="cell-empty-notice">нет смен</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ArchiveCalendarGrid;
