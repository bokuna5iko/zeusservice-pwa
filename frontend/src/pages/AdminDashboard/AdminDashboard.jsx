// src/pages/AdminDashboard/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { api } from "../../api/apiService"; // 🌟 Импортируем наше API
import { io } from "socket.io-client";
import VisitsTab from "./Tabs/VisitsTab.jsx";
import WorkersTab from "./Tabs/WorkersTab.jsx";
import SimulatorTab from "./Tabs/SimulatorTab.jsx";
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

  // 🌟 Живые стейты смены с бэкенда
  const [shiftStatus, setShiftStatus] = useState("loading"); // 'loading', 'not_started', 'open', 'closed'
  const [currentShiftRaw, setCurrentShiftRaw] = useState(null);

  useEffect(() => {
    // Подключаемся к бэкенду. Используем тот же базовый URL, что и в axios
    const socketUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const socket = io(socketUrl);

    socket.on("connect", () => {
      console.log("🔌 Сокет-соединение с бэком установлено!");
      // Отправляем сигнал, что этот клиент — админ, и его надо слать реалтайм логи
      socket.emit("join_admin_room");
    });

    // Ловим тестовое или реальное системное событие обновления ленты
    socket.on("visit_update", (data) => {
      console.log("🌟 Получено живое сокет-событие:", data);
      // Сюда на следующем шаге мы повесим вызов обновления таблиц
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Живые часы
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 🌟 Загрузка статуса смены из БД при старте пульта
  const fetchShiftStatus = async () => {
    try {
      const response = await api.getWorkShiftStatus();
      setShiftStatus(response.data.status);
      setCurrentShiftRaw(response.data.shift);
    } catch (err) {
      console.error("Ошибка получения статуса смены:", err);
      setShiftStatus("not_started");
    }
  };

  useEffect(() => {
    fetchShiftStatus();
  }, []);

  // 🌟 Обработчик ручного открытия смены на пульте
  const handleOpenShift = async () => {
    try {
      const response = await api.openWorkShift();
      setShiftStatus("open");
      setCurrentShiftRaw(response.data.shift);
    } catch (err) {
      alert(err.response?.data?.message || "Не удалось открыть смену");
    }
  };

  // 🌟 Обработчик принудительного закрытия смены (в 22:00)
  const handleCloseShift = async () => {
    if (
      !window.confirm(
        "Вы уверены, что хотите закрыть смену? Это заблокирует кассу и редактирование за сегодня!",
      )
    )
      return;
    try {
      const response = await api.closeWorkShift();
      setShiftStatus("closed");
      setCurrentShiftRaw(response.data.shift);
    } catch (err) {
      alert(err.response?.data?.message || "Не удалось закрыть смену");
    }
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

      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <h2>
            ZEUS <span>AUTO</span>
          </h2>
          <span className="brand-badge">АРМ Администратора 2.0</span>
        </div>

        <nav className="sidebar-menu">
          <button
            className={`menu-item-btn ${activeTab === "visits" ? "active" : ""}`}
            onClick={() => setActiveTab("visits")}
          >
            <i className="fas fa-list-alt"></i>
            <span>Лента визитов</span>
          </button>
          <button
            className={`menu-item-btn ${activeTab === "workers" ? "active" : ""}`}
            onClick={() => setActiveTab("workers")}
          >
            <i className="fas fa-user-friends"></i>
            <span>Работа с персоналом</span>
          </button>
          <button
            className={`menu-item-btn ${activeTab === "simulator" ? "active" : ""}`}
            onClick={() => setActiveTab("simulator")}
          >
            <i className="fas fa-mobile-alt"></i>
            <span>Мобильная админка</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          {/* 🌟 КНОПКА ЗАКРЫТИЯ СМЕНЫ В САЙДБАРЕ (АКТИВНА ТОЛЬКО ЕСЛИ СМЕНА ОТКРЫТА) */}
          {shiftStatus === "open" && (
            <button
              className="sidebar-close-shift-btn"
              onClick={handleCloseShift}
            >
              <i className="fas fa-power-off"></i> Закрыть смену (22:00)
            </button>
          )}
          <div className="live-clock" style={{ marginTop: "12px" }}>
            <i className="far fa-clock"></i>
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
        <header className="dashboard-top-bar">
          <div className="top-bar-left">
            <h1 className="current-tab-title">
              {activeTab === "visits" && "Управление текущим потоком машин"}
              {activeTab === "workers" && "Контроль сотрудников на смене"}
              {activeTab === "simulator" &&
                "Интегрированный симулятор смартфона"}
              <span className={`top-status-badge ${shiftStatus}`}>
                {shiftStatus === "open" ? "● Смена Открыта" : "● Смена Закрыта"}
              </span>
            </h1>
          </div>

          <div className="top-bar-right">
            <button
              className={`global-smart-update-btn ${needRefresh ? "update-available" : ""} ${isSpinning ? "rapid-spinning" : ""}`}
              disabled={!needRefresh || isSpinning}
              onClick={handlePwaUpdate}
            >
              <i className="fas fa-sync-alt"></i>
              <span>{needRefresh ? "Обновить АРМ" : "Пульт актуален"}</span>
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
          {/* 🌟 Передаем реальный статус и данные смены вниз в табы */}
          {activeTab === "visits" && (
            <VisitsTab
              shiftStatus={shiftStatus}
              initialShiftData={currentShiftRaw}
              onOpenShift={handleOpenShift}
            />
          )}
          {activeTab === "workers" && <WorkersTab shiftStatus={shiftStatus} />}
          {activeTab === "simulator" && <SimulatorTab />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
