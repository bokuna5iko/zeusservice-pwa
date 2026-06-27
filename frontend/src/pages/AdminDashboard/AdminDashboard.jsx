// src/pages/AdminDashboard/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { api } from "../../api/apiService";
import { io } from "socket.io-client";
import VisitsTab from "./Tabs/VisitsTab.jsx";
import WorkersTab from "./Tabs/WorkersTab.jsx";
import SimulatorTab from "./Tabs/SimulatorTab.jsx";
import AnalyticsTab from "./Tabs/AnalyticsTab.jsx";

// Импортируем наши новые защитные модалки управления сменными циклами
import ForgottenLockModal from "./components/modals/ForgottenLockModal";
import ShiftReportModal from "./components/modals/ShiftReportModal";

import "./AdminDashboard.css";
import "./Tabs/WorkersTab.css";

const AdminDashboard = ({
  needRefresh,
  showHintBanner,
  isSpinning,
  handlePwaUpdate,
}) => {
  const [activeTab, setActiveTab] = useState("visits");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Состояния сменного бизнес-цикла
  const [shiftStatus, setShiftStatus] = useState("loading"); // loading, not_started, open, closed, forgotten_lock
  const [currentShiftRaw, setCurrentShiftRaw] = useState(null);

  // Режим Архива (Просмотра прошедших дней)
  const [isArchiveMode, setIsArchiveMode] = useState(false);
  const [archivedShiftData, setArchivedShiftData] = useState(null);

  // Состояния триггеров модалок
  const [showForgottenModal, setShowForgottenModal] = useState(false);
  const [showCloseReportModal, setShowCloseReportModal] = useState(false);
  const [targetClosingShiftId, setTargetClosingShiftId] = useState(null);

  // Живые часы
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Синхронизация статуса смены с базой
  const fetchShiftStatus = async () => {
    try {
      const response = await api.getWorkShiftStatus();
      setShiftStatus(response.data.status);
      setCurrentShiftRaw(response.data.shift);

      if (response.data.status === "forgotten_lock") {
        setTargetClosingShiftId(response.data.shift.id);
        setShowForgottenModal(true);
      }
    } catch (err) {
      console.error("Ошибка получения статуса смены:", err);
      setShiftStatus("not_started");
    }
  };

  useEffect(() => {
    fetchShiftStatus();
  }, []);

  // Вебсокет-соединение
  useEffect(() => {
    const socketUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const socket = io(socketUrl);
    socket.on("connect", () => {
      socket.emit("join_admin_room");
    });
    return () => socket.disconnect();
  }, []);

  // Открытие смены
  const handleOpenShift = async () => {
    try {
      const response = await api.openWorkShift();
      setShiftStatus("open");
      setCurrentShiftRaw(response.data.shift);
    } catch (err) {
      alert(err.response?.data?.message || "Не удалось открыть смену");
    }
  };

  // Инициация вечернего закрытия смены
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

  // Коллбэк успешной сдачи кассы и архивации с бэка
  const handleArchiveSuccess = () => {
    setShowCloseReportModal(false);
    fetchShiftStatus(); // Перезапрашиваем статус дня — база выдаст либо closed, либо разрешит открыть новую смену
  };

  // Вход в архивный просмотр за конкретную дату
  const handleEnterArchiveReadOnly = (shift) => {
    setArchivedShiftData(shift);
    setIsArchiveMode(true);
    setActiveTab("visits"); // Меняем вкладку на ленту визитов

    setArchivedShiftData(shift);
    setIsArchiveMode(true);
    setActiveTab("visits"); // Перекидываем на таб таблицы, но в режиме Read-Only
  };

  // Выход из архива назад в реальность
  const handleExitArchiveMode = () => {
    setIsArchiveMode(false);
    setArchivedShiftData(null);
  };

  if (shiftStatus === "loading") {
    return (
      <div className="admin-stats-loading">Синхронизация АРМ с кассой...</div>
    );
  }

  return (
    <div className="admin-dashboard-layout">
      <div
        className={`pwa-smart-hint-banner ${showHintBanner ? "slide-down" : ""}`}
      >
        <i className="fas fa-info-circle"></i>
        <span>
          Система зафиксировала update. Рекомендуется обновить пульт управления!
        </span>
      </div>

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

              {/* Изолированная кнопка перехода в Архив смен в самом низу меню */}
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
              })}
            </span>
          </div>
        </div>
      </aside>

      <div className="dashboard-main-container">
        {/* КРИТИЧЕСКАЯ ПЛАШКА ДЛЯ РЕЖИМА АРХИВА (ТОЛЬКО ЧТЕНИЕ) */}
        {isArchiveMode && (
          <div
            style={{
              background: "#eab308",
              color: "#020617",
              padding: "10px 24px",
              fontWeight: "800",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "14px",
            }}
          >
            <span>
              ⚠️ ПРОСМОТР АРХИВНОЙ СМЕНЫ ОТ{" "}
              {new Date(archivedShiftData.shift_date).toLocaleDateString(
                "ru-RU",
              )}{" "}
              — ИЗМЕНЕНИЯ ЗАБЛОКИРОВАНЫ
            </span>
            <button
              onClick={handleExitArchiveMode}
              style={{
                background: "#020617",
                color: "#eab308",
                border: "none",
                padding: "6px 14px",
                borderRadius: "6px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Вернуться в текущую смену ↩️
            </button>
          </div>
        )}

        <header className="dashboard-top-bar">
          <div className="top-bar-left">
            <h1 className="current-tab-title">
              {activeTab === "visits" &&
                (isArchiveMode
                  ? `Архив заездов за ${new Date(archivedShiftData.shift_date).toLocaleDateString("ru-RU")}`
                  : "Управление текущим потоком машин")}
              {activeTab === "workers" && "Контроль сотрудников на смене"}
              {activeTab === "simulator" &&
                "Интегрированный симулятор смартфона"}
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
            {/* 🌟 СМАРТ-ОБНОВЛЕНИЕ АРМ: Полностью синхронизировано с логикой из App.jsx */}
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

              {/* Пульсирующая оранжево-красная точка-уведомление в углу кнопки */}
              {needRefresh && (
                <span className="notification-pulsing-dot"></span>
              )}
            </button>

            <div className="admin-profile-badge">
              <div className="avatar-box">A</div>
              <span>Администратор</span>
            </div>
          </div>
        </header>

        <main className="dashboard-content-viewport">
          {activeTab === "visits" && (
            <VisitsTab
              // Если мы в режиме архива, принудительно шлем статус 'closed', чтобы скрыть все кнопки редактирования и добавления трат
              shiftStatus={isArchiveMode ? "closed" : shiftStatus}
              /* 🌟 ИСПРАВЛЕНО: Теперь обязательно прокидываем shift_date, чтобы таблица знала, какой день загрузить! */
              initialShiftData={
                isArchiveMode
                  ? {
                      id: archivedShiftData.id,
                      shift_date: archivedShiftData.shift_date, // Добавили!
                      cash_total: archivedShiftData.cash_total,
                      card_total: archivedShiftData.card_total,
                      expenses_total: archivedShiftData.expenses_total,
                    }
                  : currentShiftRaw
              }
              onOpenShift={handleOpenShift}
            />
          )}
          {activeTab === "workers" && (
            <WorkersTab shiftStatus={isArchiveMode ? "closed" : shiftStatus} />
          )}
          {activeTab === "simulator" && <SimulatorTab />}
          {activeTab === "archive" && (
            <AnalyticsTab onSelectArchiveDate={handleEnterArchiveReadOnly} />
          )}
        </main>
      </div>

      {/* ЗАЩИТНЫЕ УПРАВЛЯЮЩИЕ МОДАЛКИ СМЕННОГО ЦИКЛА */}
      <ForgottenLockModal
        isOpen={showForgottenModal}
        shiftData={currentShiftRaw}
        onTriggerClose={handleTriggerCloseShift}
      />
      <ShiftReportModal
        isOpen={showCloseReportModal}
        shiftId={targetClosingShiftId}
        onClose={() => setShowCloseReportModal(false)}
        onArchiveSuccess={handleArchiveSuccess}
      />
    </div>
  );
};

export default AdminDashboard;
