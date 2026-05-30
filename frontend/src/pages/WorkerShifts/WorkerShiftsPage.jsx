// src/pages/WorkerShifts/WorkerShiftsPage.jsx
import React, { useState, useEffect } from "react";
import "./WorkerShiftsPage.css";
import FinancialTracker from "../../components/Shifts/FinancialTracker";
import ShiftCalendarWorker from "../../components/Shifts/ShiftCalendarWorker";

const WorkerShiftsPage = () => {
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);
  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    <div className="worker-shifts-page">
      <div className="page-center-container">
        {/* БЛОК №1: Финансовый трекер */}
        <FinancialTracker earnings={weeklyEarnings} />

        {/* БЛОК №2: Информационный хелпер */}
        <div
          className="shifts-helper-card"
          onClick={() => setShowHelpModal(true)}
        >
          <div className="helper-left">
            <i className="fas fa-info-circle animate-pulse-blue"></i>
            <div className="helper-text-block">
              <span className="helper-title">Правила и тарифы смен</span>
              <span className="helper-subtitle">
                Нажмите, чтобы узнать подробнее
              </span>
            </div>
          </div>
          <i className="fas fa-chevron-right arrow-muted"></i>
        </div>

        {/* БЛОК №3: Лента смен (Календарь бесконечной ленты) */}
        <div className="calendar-section-box">
          <div className="calendar-header-row">
            <h3 className="calendar-box-title">Ваш рабочий график</h3>
            <button className="archive-shifts-btn">
              <i className="fas fa-archive"></i> Архив смен
            </button>
          </div>
          <ShiftCalendarWorker setWeeklyEarnings={setWeeklyEarnings} />
        </div>
      </div>

      {/* МОДАЛКА: ТАРИФНАЯ СЕТКА И ПРАВИЛА */}
      {showHelpModal && (
        <div
          className="shifts-modal-overlay"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="shifts-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="shifts-close-modal"
              onClick={() => setShowHelpModal(false)}
            >
              &times;
            </button>
            <div className="shifts-modal-body">
              <h2 className="shifts-modal-title">
                <i className="fas fa-calculator text-blue"></i> Сетка расчета
                заработка
              </h2>
              <p className="shifts-modal-hint">
                Сумма рассчитывается ежедневно в 23:00 на основе общего
                количества вымытых машин всей автомойкой:
              </p>

              <div className="rates-table-grid">
                <div className="rate-row-item">
                  <span className="rate-label">Меньше 30 машин за сутки</span>
                  <span className="rate-value text-gray-neon">
                    2 000 ₽ (Гарант)
                  </span>
                </div>
                <div className="rate-row-item">
                  <span className="rate-label">От 30 до 44 машин за сутки</span>
                  <span className="rate-value text-green-neon">3 000 ₽</span>
                </div>
                <div className="rate-row-item">
                  <span className="rate-label">От 45 до 59 машин за сутки</span>
                  <span className="rate-value text-green-neon">3 500 ₽</span>
                </div>
                <div className="rate-row-item">
                  <span className="rate-label">От 60 до 74 машин за сутки</span>
                  <span className="rate-value text-green-neon">4 000 ₽</span>
                </div>
                <div className="rate-row-item">
                  <span className="rate-label">От 75 машин и более</span>
                  <span className="rate-value text-green-neon">4 500 ₽</span>
                </div>
              </div>

              <h4 className="rules-sub-title">
                <i className="fas fa-calendar-check text-blue"></i> Правила
                подачи заявок:
              </h4>
              <ul className="rules-list-items">
                <li>
                  Запись на следующую неделю открывается автоматически{" "}
                  <strong>каждую пятницу</strong>.
                </li>
                <li>
                  Вы можете подать заявку на любой свободный день. Она получит
                  статус «Ждет одобрения».
                </li>
                <li>
                  После проверки администрацией статус изменится на «В графике».
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerShiftsPage;
