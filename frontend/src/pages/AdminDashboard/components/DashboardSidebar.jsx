// src/pages/AdminDashboard/components/DashboardSidebar.jsx
import React from "react";
import { useAdminDashboard } from "../context/AdminDashboardContext";

const DashboardSidebar = () => {
  // Забираем нужные стейты и методы напрямую из контекста
  const {
    activeTab,
    setActiveTab,
    currentTime,
    shiftStatus,
    setShiftStatus,
    currentShiftRaw,
    isArchiveMode,
    setIsArchiveMode,
    archivedShiftData,
    setArchivedShiftData,
    targetClosingShiftId,
    setTargetClosingShiftId,
    setShowForgottenModal,
    setShowCloseReportModal,
  } = useAdminDashboard();

  // Инициация вечернего закрытия смены (оригинальная логика)
  const handleTriggerCloseShift = () => {
    const shiftId = currentShiftRaw?.id || targetClosingShiftId;
    if (!shiftId) return;

    if (
      window.confirm(
        "Вы уверены, что хотите закрыть смену? Данные кассы будут зафиксированы, а редактирование заблокировано.",
      )
    ) {
      setTargetClosingShiftId(shiftId);
      setShowForgottenModal(false); // Закрываем утреннюю блокировку, если закрывали её
      setShowCloseReportModal(true); // Открываем форму ввода нала
    }
  };

  // Выход из архива назад в реальность
  const handleExitArchiveMode = () => {
    setIsArchiveMode(false);
    setArchivedShiftData(null);
  };

  return (
    <aside
      className="dashboard-sidebar"
      style={isArchiveMode ? { borderRight: "2px solid #eab308" } : {}}
    >
      <div className="sidebar-brand">
        <h2>
          ZEUS <span>AUTO</span>
        </h2>
        <span className="brand-badge">АРМ Администратора 2.0</span>
      </div>

      {/* НАВИГАЦИОННОЕ МЕНЮ (МЕНЯЕТСЯ ЕСЛИ МЫ В РЕЖИМЕ АРХИВА) */}
      <nav className="sidebar-menu">
        {isArchiveMode ? (
          <div
            style={{
              padding: "10px",
              background: "rgba(234, 179, 8, 0.05)",
              border: "1px dashed #eab308",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                color: "#eab308",
                fontWeight: "700",
                display: "block",
                marginBottom: "10px",
              }}
            >
              ⚠️ РЕЖИМ АРХИВА
            </span>
            <button
              className="menu-item-btn active"
              style={{
                width: "100%",
                justifyContent: "center",
                background: "#eab308",
                color: "#020617",
              }}
            >
              <i className="fas fa-history"></i> Лента заездов
            </button>
            <button
              onClick={handleExitArchiveMode}
              className="sidebar-close-shift-btn"
              style={{
                marginTop: "16px",
                background: "#1e293b",
                borderColor: "#38bdf8",
                color: "#38bdf8",
              }}
            >
              <i className="fas fa-arrow-left"></i> Выйти из архива
            </button>
          </div>
        ) : (
          <>
            <button
              className={`menu-item-btn ${activeTab === "visits" ? "active" : ""}`}
              onClick={() => setActiveTab("visits")}
            >
              <i className="fas fa-list-alt"></i> <span>Лента визитов</span>
            </button>
            <button
              className={`menu-item-btn ${activeTab === "workers" ? "active" : ""}`}
              onClick={() => setActiveTab("workers")}
            >
              <i className="fas fa-user-friends"></i>{" "}
              <span>Работа с персоналом</span>
            </button>
            <button
              className={`menu-item-btn ${activeTab === "simulator" ? "active" : ""}`}
              onClick={() => setActiveTab("simulator")}
            >
              <i className="fas fa-mobile-alt"></i>{" "}
              <span>Мобильная админка</span>
            </button>

            {/* Кнопка перехода в Архив смен в самом низу меню */}
            <button
              className={`menu-item-btn ${activeTab === "archive" ? "active" : ""}`}
              onClick={() => setActiveTab("archive")}
              style={{
                marginTop: "auto",
                borderTop: "1px solid #1e293b",
                paddingTop: "20px",
                color: activeTab === "archive" ? "#38bdf8" : "#64748b",
              }}
            >
              <i className="fas fa-archive"></i>{" "}
              <span style={{ fontWeight: "700" }}>
                📦 Архив смен (Календарь)
              </span>
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        {shiftStatus === "open" && !isArchiveMode && (
          <button
            className="sidebar-close-shift-btn"
            onClick={handleTriggerCloseShift}
          >
            <i className="fas fa-power-off"></i> Закрыть смену (22:00)
          </button>
        )}
        <div className="live-clock" style={{ marginTop: "12px" }}>
          <i className="far fa-clock"></i>{" "}
          <span>{currentTime.toLocaleTimeString("ru-RU")}</span>
        </div>
        <div className="live-date">
          <span>
            {currentTime.toLocaleDateString("ru-RU", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
