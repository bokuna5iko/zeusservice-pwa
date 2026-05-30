// src/components/Shifts/ShiftCalendarWorker.jsx
import React, { useState, useEffect } from "react";
import { api } from "../../api/apiService"; // 🌟 Импортируем наш чистый мост запросов

const ShiftCalendarWorker = ({ setWeeklyEarnings }) => {
  const [shiftsHistory, setShiftsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchShifts = async () => {
    try {
      // 🌟 ИСПОЛЬЗУЕМ СЕРВИС: Токен прикрепится автоматически в интерцепторе!
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
      // 🌟 ИСПОЛЬЗУЕМ СЕРВИС ПОДЕННОЙ ЗАПИСИ
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
                if (status === "approved") displayValue = "В графике";
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

      <style jsx="true">{`
        .worker-calendar-wrapper {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
          margin-top: 14px;
        }
        .week-block-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .week-timeline-title {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .days-cards-feed {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }
        .day-schedule-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #0f172a;
          border: 1px solid #1e293b;
          padding: 12px 14px;
          border-radius: 12px;
          box-sizing: border-box;
          width: 100%;
        }
        .day-schedule-row.status-completed {
          opacity: 0.55;
          background: #020617;
          border-style: dashed;
        }
        .day-schedule-row.status-rejected {
          border-color: rgba(239, 68, 68, 0.2);
          background: rgba(239, 68, 68, 0.02);
        }
        .day-meta-pane {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .day-name-badge {
          font-size: 0.95rem;
          font-weight: 700;
          color: #f1f5f9;
          width: 24px;
          text-align: left;
        }
        .day-date-text {
          font-size: 0.85rem;
          color: #64748b;
        }
        .enroll-shift-action-btn {
          background: #1e293b;
          border: 1px solid #334155;
          color: #38bdf8;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          min-width: 90px;
          text-align: center;
        }
        .status-badge-pill {
          font-size: 0.8rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
        }
        .pill-pending {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }
        .pill-approved {
          background: rgba(14, 165, 233, 0.1);
          color: #38bdf8;
          text-shadow: 0 0 6px rgba(56, 189, 248, 0.2);
        }
        .pill-rejected {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        .pill-completed {
          color: #10b981;
          font-size: 0.9rem;
          font-weight: 800;
        }
        .calendar-loading {
          color: #64748b;
          font-style: italic;
          text-align: center;
          padding: 20px 0;
          font-size: 0.9rem;
        }
        .calendar-loading i {
          color: #0ea5e9;
          margin-right: 6px;
        }
      `}</style>
    </div>
  );
};

export default ShiftCalendarWorker;
