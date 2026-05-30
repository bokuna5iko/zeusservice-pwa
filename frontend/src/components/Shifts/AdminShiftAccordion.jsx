// src/components/Shifts/AdminShiftAccordion.jsx
import React, { useState, useEffect } from "react";
import { api } from "../../api/apiService"; // 🌟 Наш мост запросов

const AdminShiftAccordion = ({
  setPendingCount,
  stagedChanges,
  setStagedChanges,
}) => {
  const [rawShifts, setRawShifts] = useState([]);
  const [openCardDate, setOpenCardDate] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCalendarData = async () => {
    try {
      // 🌟 ЧИТАЕМ ДАННЫЕ ЧЕРЕЗ AXIOS СЕРВИС
      const response = await api.getAdminCalendar();
      setRawShifts(response.data);

      const pending = response.data.filter((s) => s.status === "pending");
      setPendingCount(pending.length);
    } catch (err) {
      console.error("Ошибка загрузки календаря админа:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, [stagedChanges]);

  const generateAdminWeeks = () => {
    const weeks = [];
    const today = new Date();
    const currentSunday = new Date(today);
    currentSunday.setDate(today.getDate() - today.getDay());

    const buildWeek = (sundayDate) => {
      const days = [];
      const labels = [
        "Воскресенье",
        "Понедельник",
        "Вторник",
        "Среда",
        "Четверг",
        "Пятница",
        "Суббота",
      ];
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

        days.push({
          dateStr: `${y}-${m}-${r}`,
          dayLabel: labels[i],
          dateDisplay: `${d.getDate()} ${months[d.getMonth()]}`,
        });
      }
      return days;
    };

    weeks.push({
      label: "Текущая рабочая неделя",
      days: buildWeek(currentSunday),
    });

    const nextSunday = new Date(currentSunday);
    nextSunday.setDate(currentSunday.getDate() + 7);
    weeks.push({
      label: "Следующая неделя графика",
      days: buildWeek(nextSunday),
    });

    return weeks;
  };

  const handleStageAction = (shiftId, newStatus) => {
    const filtered = stagedChanges.filter((c) => c.shiftId !== shiftId);
    setStagedChanges([...filtered, { shiftId, action: newStatus }]);
  };

  const getLimitColorClass = (count) => {
    if (count === 0) return "text-danger-red";
    if (count >= 6) return "text-success-green";
    return "text-warning-yellow";
  };

  if (loading) {
    return (
      <div className="accordion-loading">
        <i className="fas fa-spinner fa-spin"></i> Сборка сетки модерации...
      </div>
    );
  }

  const weeks = generateAdminWeeks();

  return (
    <div className="admin-accordion-wrapper">
      {weeks.map((week, wIdx) => (
        <div key={wIdx} className="admin-week-group">
          <span className="admin-week-label">{week.label}</span>

          <div className="admin-accordion-feed">
            {week.days.map((day) => {
              const dayShifts = rawShifts.filter((s) => s.date === day.dateStr);

              const approvedCount = dayShifts.filter((s) => {
                const staged = stagedChanges.find((c) => c.shiftId === s.id);
                return staged
                  ? staged.action === "approved"
                  : s.status === "approved";
              }).length;

              const newRequestsCount = dayShifts.filter((s) => {
                const staged = stagedChanges.find((c) => c.shiftId === s.id);
                return staged ? false : s.status === "pending";
              }).length;

              const isOpen = openCardDate === day.dateStr;

              return (
                <div
                  key={day.dateStr}
                  className={`admin-shift-accordion-card ${isOpen ? "open" : ""}`}
                >
                  <div
                    className="accordion-preview-header"
                    onClick={() => setOpenCardDate(isOpen ? null : day.dateStr)}
                  >
                    <div className="preview-left-meta">
                      <span className="preview-day-title">{day.dayLabel}</span>
                      <span className="preview-date-sub">
                        {day.dateDisplay}
                      </span>
                    </div>
                    <div className="preview-right-indicators">
                      <span
                        className={`fill-counter-badge ${getLimitColorClass(approvedCount)}`}
                      >
                        {approvedCount} / 6
                      </span>
                      {newRequestsCount > 0 && (
                        <span className="new-requests-dot">
                          +{newRequestsCount}
                        </span>
                      )}
                      <i className="fas fa-chevron-down accordion-arrow-icon"></i>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="accordion-expandable-content">
                      <div className="expand-body-padding">
                        <div className="limit-indicator-row">
                          <span>Заполнено мест в боксах:</span>
                          <strong
                            className={`limit-text-bold ${getLimitColorClass(approvedCount)}`}
                          >
                            {approvedCount} из 6 сотрудников зафиксировано
                          </strong>
                        </div>

                        <div className="moderation-workers-list">
                          {dayShifts.length > 0 ? (
                            dayShifts.map((shift) => {
                              const staged = stagedChanges.find(
                                (c) => c.shiftId === shift.id,
                              );
                              const currentStatus = staged
                                ? staged.action
                                : shift.status;

                              return (
                                <div
                                  key={shift.id}
                                  className="moderation-worker-item"
                                >
                                  <div className="worker-item-left">
                                    <img
                                      src={`/avatars/${shift.avatar_url || "1.png"}`}
                                      alt="av"
                                      className="mod-worker-avatar"
                                    />
                                    <span className="mod-worker-name">
                                      {shift.worker_name}
                                    </span>
                                  </div>

                                  <div className="moderation-control-buttons">
                                    {currentStatus === "approved" ? (
                                      <button
                                        className="mod-btn cancel-btn"
                                        onClick={() =>
                                          handleStageAction(
                                            shift.id,
                                            "rejected",
                                          )
                                        }
                                      >
                                        Oтозвать
                                      </button>
                                    ) : currentStatus === "rejected" ? (
                                      <button
                                        className="mod-btn approve-btn"
                                        onClick={() =>
                                          handleStageAction(
                                            shift.id,
                                            "approved",
                                          )
                                        }
                                      >
                                        Одобрить
                                      </button>
                                    ) : (
                                      <>
                                        <button
                                          className="mod-btn approve-btn"
                                          onClick={() =>
                                            handleStageAction(
                                              shift.id,
                                              "approved",
                                            )
                                          }
                                        >
                                          Одобрить
                                        </button>
                                        <button
                                          className="mod-btn reject-btn"
                                          onClick={() =>
                                            handleStageAction(
                                              shift.id,
                                              "rejected",
                                            )
                                          }
                                        >
                                          Отказать
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="no-shifts-day-placeholder">
                              Нет заявок или записей на этот день
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <style jsx="true">{`
        .admin-accordion-wrapper {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
          margin-top: 14px;
        }
        .admin-week-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .admin-week-label {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .admin-accordion-feed {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }
        .admin-shift-accordion-card {
          background: #1e293b;
          border-radius: 12px;
          border: 1px solid transparent;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }
        .admin-shift-accordion-card.open {
          border-color: #0ea5e9;
        }
        .accordion-preview-header {
          padding: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          user-select: none;
        }
        .preview-left-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .preview-day-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #f1f5f9;
        }
        .preview-date-sub {
          font-size: 0.8rem;
          color: #64748b;
        }
        .preview-right-indicators {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .fill-counter-badge {
          font-size: 0.85rem;
          font-weight: 700;
          background: rgba(15, 23, 42, 0.4);
          padding: 4px 10px;
          border-radius: 6px;
        }
        .text-danger-red {
          color: #ef4444;
        }
        .text-warning-yellow {
          color: #f59e0b;
        }
        .text-success-green {
          color: #10b981;
        }
        .new-requests-dot {
          background: #f59e0b;
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
        }
        .accordion-arrow-icon {
          color: #64748b;
          font-size: 0.85rem;
          transition: transform 0.25s ease;
        }
        .admin-shift-accordion-card.open .accordion-arrow-icon {
          transform: rotate(180deg);
          color: #0ea5e9;
        }
        .accordion-expandable-content {
          border-top: 1px dashed #334155;
          background: #0f172a;
          animation: fadeAccordion 0.2s ease;
        }
        @keyframes fadeAccordion {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .expand-body-padding {
          padding: 14px;
        }
        .limit-indicator-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #94a3b8;
          margin-bottom: 14px;
          border-bottom: 1px solid #1e293b;
          padding-bottom: 8px;
        }
        .limit-text-bold {
          font-weight: 700;
          font-size: 0.85rem;
        }
        .moderation-workers-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .moderation-worker-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          border-bottom: 1px solid rgba(51, 65, 85, 0.2);
          padding-bottom: 8px;
        }
        .moderation-worker-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .worker-item-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .mod-worker-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid #334155;
        }
        .mod-worker-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #e2e8f0;
        }
        .moderation-control-buttons {
          display: flex;
          gap: 6px;
        }
        .mod-btn {
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .mod-btn:active {
          opacity: 0.6;
        }
        .approve-btn {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .reject-btn {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .cancel-btn {
          background: #334155;
          color: #94a3b8;
          border: 1px solid #475569;
        }
        .no-shifts-day-placeholder {
          font-size: 0.85rem;
          color: #475569;
          font-style: italic;
          text-align: center;
          padding: 10px 0;
        }
        .accordion-loading {
          color: #64748b;
          font-style: italic;
          text-align: center;
          padding: 24px 0;
          font-size: 0.9rem;
        }
        .accordion-loading i {
          color: #0ea5e9;
          margin-right: 6px;
        }
      `}</style>
    </div>
  );
};

export default AdminShiftAccordion;
