// src/pages/AdminDashboard/components/DashboardHeader.jsx
import React from "react";
import { useAdminDashboard } from "../context/AdminDashboardContext";

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
      {/* СМАРТ-БАННЕР УВЕДОМЛЕНИЙ ОБ ОБНОВЛЕНИИ */}
      <div
        className={`pwa-smart-hint-banner ${showHintBanner ? "slide-down" : ""}`}
      >
        <i className="fas fa-info-circle"></i>
        <span>
          Система зафиксировала update. Рекомендуется обновить пульт управления!
        </span>
      </div>

      <header className="dashboard-top-bar">
        <div className="top-bar-left">
          <h1 className="current-tab-title">
            {activeTab === "visits" &&
              (isArchiveMode
                ? `Архив заездов за ${new Date(archivedShiftData.shift_date).toLocaleDateString("ru-RU")}`
                : "Управление текущим потоком машин")}
            {activeTab === "workers" && "Контроль сотрудников на смене"}
            {activeTab === "simulator" && "Интегрированный симулятор смартфона"}
            {activeTab === "archive" && "Исторический хаб автомойки"}

            {!isArchiveMode && (
              <span className={`top-status-badge ${shiftStatus}`}>
                {shiftStatus === "open"
                  ? "● Смена Открыта"
                  : shiftStatus === "forgotten_lock"
                    ? "● Касса заблокирована"
                    : "● Смена Закрыта"}
              </span>
            )}
          </h1>
        </div>

        <div className="top-bar-right">
          {/* КНОПКА СМАРТ-ОБНОВЛЕНИЯ АРМ */}
          <button
            className={`global-smart-update-btn ${needRefresh ? "update-available" : ""} ${isSpinning ? "rapid-spinning" : ""}`}
            disabled={!needRefresh || isSpinning}
            onClick={handlePwaUpdate}
            title={
              needRefresh
                ? "Доступно свежее обновление пульта!"
                : "Система пульта актуальна"
            }
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: needRefresh && !isSpinning ? "pointer" : "default",
            }}
          >
            <i className="fas fa-sync-alt"></i>
            <span>{needRefresh ? "Обновить АРМ" : "Пульт актуален"}</span>

            {/* Пульсирующая оранжево-красная точка-уведомление */}
            {needRefresh && <span className="notification-pulsing-dot"></span>}
          </button>

          <div className="admin-profile-badge">
            <div className="avatar-box">A</div>
            <span>Администратор</span>
          </div>
        </div>
      </header>
    </>
  );
};

export default DashboardHeader;
