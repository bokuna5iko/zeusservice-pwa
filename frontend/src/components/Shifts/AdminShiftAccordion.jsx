// src/components/Shifts/AdminShiftAccordion.jsx
import React, { useState, useEffect } from "react";
import { api } from "../../api/apiService";
import "./AdminShiftAccordion.css";

const AdminShiftAccordion = ({
  setPendingCount,
  stagedChanges,
  setStagedChanges,
  isCooldown,
  refreshTrigger, // 🌟 Принимаем триггер из пропсов
}) => {
  const [rawShifts, setRawShifts] = useState([]);
  const [openCardDate, setOpenCardDate] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCalendarData = async () => {
    try {
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
  }, [refreshTrigger]);

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

              // Проверяем, есть ли измененные черновики в рамках этого дня
              const isDayModified = dayShifts.some((s) =>
                stagedChanges.some((c) => c.shiftId === s.id),
              );

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
                      {/* 🌟 Если день изменен локально, добавляем маркер непубликации */}
                      <span
                        className={`fill-counter-badge ${getLimitColorClass(approvedCount)}`}
                      >
                        {approvedCount} / 6{" "}
                        {isDayModified && (
                          <span className="staged-marker-dot">*</span>
                        )}
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
                          <div className="limit-right-status">
                            <strong
                              className={`limit-text-bold ${getLimitColorClass(approvedCount)}`}
                            >
                              {approvedCount} из 6 зафиксировано
                            </strong>
                            {isDayModified && (
                              <span className="unsaved-day-label">
                                (есть изменения)
                              </span>
                            )}
                          </div>
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
                                  className={`moderation-worker-item ${staged ? "staged-row-highlight" : ""}`}
                                >
                                  <div className="worker-item-left">
                                    <img
                                      src={`/avatars/${shift.avatar_url || "1.png"}`}
                                      alt="av"
                                      className="mod-worker-avatar"
                                    />
                                    <div className="worker-name-block">
                                      <span className="mod-worker-name">
                                        {shift.worker_name}
                                      </span>
                                      {/* 🌟 ВЫВОДИМ БЭЙДЖ ЧЕРНОВИКА, ЕСЛИ СТАТУС СМЕНИЛИ ЛОКАЛЬНО */}
                                      {staged && (
                                        <span className="staged-draft-pill">
                                          Черновик
                                        </span>
                                      )}
                                    </div>
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
                                        Отозвать
                                      </button>
                                    ) : (
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
    </div>
  );
};

export default AdminShiftAccordion;
