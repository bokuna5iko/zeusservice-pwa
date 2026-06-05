// src/components/Shifts/ShiftCalendarWorker.jsx
import React, { useState, useEffect } from "react";
import { api } from "../../api/apiService"; // 🌟 Наш чистый мост запросов
import "./ShiftCalendarWorker.css"; // 🌟 ИСПРАВЛЕНО: Подключаем изолированные стили календаря

const ShiftCalendarWorker = ({ setWeeklyEarnings }) => {
  const [shiftsHistory, setShiftsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchShifts = async () => {
    try {
      const response = await api.getWorkerShifts();
      setShiftsHistory(response.data);
      calculateCurrentWeekEarnings(response.data);
    } catch (err) {
      console.error("Ошибка загрузки смен:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  // Вычисление заработка за текущую неделю (Воскресенье - Суббота)
  const calculateCurrentWeekEarnings = (historyData) => {
    const today = new Date();
    const currentDayNum = today.getDay();

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDayNum);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    let total = 0;
    historyData.forEach((shift) => {
      const shiftDate = new Date(shift.date);
      if (
        shiftDate >= startOfWeek &&
        shiftDate <= endOfWeek &&
        shift.status === "completed"
      ) {
        total += parseFloat(shift.earnings || 0);
      }
    });
    setWeeklyEarnings(total);
  };

  // Генерация недель по принципу бесконечной ленты iOS
  const generateCalendarWeeks = () => {
    const weeks = [];
    const today = new Date();
    const currentDayNum = today.getDay();

    const currentSunday = new Date(today);
    currentSunday.setDate(today.getDate() - currentDayNum);

    const buildWeekDays = (sundayDate) => {
      const days = [];
      const labels = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
      const months = [
        "Янв",
        "Фев",
        "Мар",
        "Апр",
        "Май",
        "Июн",
        "Июл",
        "Авг",
        "Сен",
        "Окт",
        "Ноя",
        "Дек",
      ];

      for (let i = 0; i < 7; i++) {
        const d = new Date(sundayDate);
        d.setDate(sundayDate.getDate() + i);

        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const r = String(d.getDate()).padStart(2, "0");
        const dateStr = `${y}-${m}-${r}`;

        days.push({
          dateKey: dateStr,
          dayLabel: labels[i],
          dateDisplay: `${d.getDate()} ${months[d.getMonth()]}`,
          isPast: d.toDateString() !== today.toDateString() && d < today,
        });
      }
      return days;
    };

    weeks.push({
      label: "Текущая неделя",
      days: buildWeekDays(currentSunday),
    });

    if (currentDayNum >= 5) {
      const nextSunday = new Date(currentSunday);
      nextSunday.setDate(currentSunday.getDate() + 7);
      weeks.push({
        label: "Предстоящая неделя (Запись)",
        days: buildWeekDays(nextSunday),
      });
    }

    return weeks;
  };

  const handleEnroll = async (dateStr) => {
    setActionLoading(dateStr);
    try {
      await api.requestShift(dateStr);
      await fetchShifts();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Ошибка подачи заявки");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="calendar-loading">
        <i className="fas fa-spinner fa-spin"></i> Сборка ленты графика...
      </div>
    );
  }

  const shiftMap = {};
  shiftsHistory.forEach((s) => {
    shiftMap[s.date] = s;
  });

  const weeks = generateCalendarWeeks();

  return (
    <div className="worker-calendar-wrapper">
      {weeks.map((week, wIdx) => (
        <div key={wIdx} className="week-block-container">
          <span className="week-timeline-title">{week.label}</span>

          <div className="days-cards-feed">
            {week.days.map((day) => {
              const serverShift = shiftMap[day.dateKey];
              let status = "available";
              let displayValue = "Записаться";

              if (serverShift) {
                status = serverShift.status;
                if (status === "pending") displayValue = "Ждет одобрения";
                if (status === "approved") displayValue = "Одобрено";
                if (status === "rejected") displayValue = "Отказано";
                if (status === "completed")
                  displayValue = `${parseInt(serverShift.earnings)} ₽`;
              }

              if (day.isPast && status === "available") return null;

              return (
                <div
                  key={day.dateKey}
                  className={`day-schedule-row status-${status}`}
                >
                  <div className="day-meta-pane">
                    <span className="day-name-badge">{day.dayLabel}</span>
                    <span className="day-date-text">{day.dateDisplay}</span>
                  </div>

                  <div className="day-status-action-pane">
                    {status === "available" ? (
                      <button
                        className="enroll-shift-action-btn"
                        disabled={actionLoading === day.dateKey}
                        onClick={() => handleEnroll(day.dateKey)}
                      >
                        {actionLoading === day.dateKey ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          "Записаться"
                        )}
                      </button>
                    ) : (
                      <span className={`status-badge-pill pill-${status}`}>
                        {displayValue}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShiftCalendarWorker;
