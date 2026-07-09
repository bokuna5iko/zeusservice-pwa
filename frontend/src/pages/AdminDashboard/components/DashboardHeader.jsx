// src/pages/AdminDashboard/components/DashboardHeader.jsx
import React from "react";
import { useAdminDashboard } from "../context/AdminDashboardContext";
import "./DashboardHeader.css";

const DashboardHeader = () => {
  const {
    activeTab,
    shiftStatus,
    isArchiveMode,
    archivedShiftData,
    needRefresh,
    showHintBanner,
    isSpinning,
    handlePwaUpdate,
  } = useAdminDashboard();

  return (
    <>
      {/* 🌟 КНОПКА ОБНОВЛЕНИЯ ПУЛЬТА - показывает статус актуальности версии */}
      <div className="dashboard-header-controls">
        <button
          onClick={handlePwaUpdate}
          className={`pwa-update-btn ${needRefresh ? "needs-update" : "up-to-date"}`}
          disabled={!needRefresh}
        >
          <i className={`fas fa-sync-alt ${isSpinning ? "fa-spin" : ""}`}></i>
          <span>{needRefresh ? "Обновить пульт" : "Пульт актуален"}</span>
          {needRefresh && <span className="update-badge">!</span>}
        </button>
      </div>

      {/* 🌟 СМАРТ-БАННЕР УВЕДОМЛЕНИЙ ОБ ОБНОВЛЕНИИ */}
      {needRefresh && (
        <div className="update-notification-banner">
          <div className="update-banner-content">
            <div className="update-banner-icon">
              <i className="fas fa-sync-alt fa-spin"></i>
            </div>
            <div className="update-banner-text">
              <strong>Доступно обновление</strong>
              <p>
                Система зафиксировала новую версию. Рекомендуется обновить пульт
                управления для корректной работы.
              </p>
            </div>
            <button onClick={handlePwaUpdate} className="update-banner-btn">
              <i className="fas fa-redo"></i>
              Обновить сейчас
            </button>
          </div>
          <div className="update-banner-glow"></div>
        </div>
      )}
    </>
  );
};

export default DashboardHeader;
