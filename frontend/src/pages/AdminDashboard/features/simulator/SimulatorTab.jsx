// src/pages/AdminDashboard/Tabs/SimulatorTab.jsx
import React from "react";
import { useSimulatorState } from "../hooks/useSimulatorState";
import "./SimulatorTab.css";

const SimulatorTab = () => {
  // Подключаем наш изолированный хук логики симулятора девайса
  const { phoneScreen, changeScreen } = useSimulatorState();

  return (
    <div className="simulator-tab-viewport">
      <div className="simulator-instructions">
        <h3>
          <i className="fas fa-info-circle"></i> Пульт управления устройством
        </h3>
        <p>
          Перед вами интерактивный фрейм мобильной версии. Все действия,
          совершаемые внутри этого контура, синхронизируются с базой данных PWA
          в реальном времени.
        </p>

        <div className="simulator-quick-nav">
          <span className="nav-group-label">Быстрый переход:</span>
          <button
            className={`sim-nav-btn ${phoneScreen === "home" ? "active" : ""}`}
            onClick={() => changeScreen("home")}
          >
            Главная
          </button>
          <button
            className={`sim-nav-btn ${phoneScreen === "history" ? "active" : ""}`}
            onClick={() => changeScreen("history")}
          >
            История
          </button>
          <button
            className={`sim-nav-btn ${phoneScreen === "scanner" ? "active" : ""}`}
            onClick={() => changeScreen("scanner")}
          >
            QR-Сканер
          </button>
        </div>
      </div>

      {/* 📱 КОРПУС СМАРТФОНА (РЕАЛИЗАЦИЯ ФРЕЙМА ИЗ ТЗ) */}
      <div className="smartphone-frame">
        <div className="phone-notch"></div>
        <div className="phone-screen-content">
          {/* Внутренняя мобильная шапка */}
          <header className="phone-app-header">
            <span className="phone-logo">
              ZEUS <span>AUTO</span>
            </span>
            <i className="fas fa-wifi phone-status-icon"></i>
          </header>

          {/* Контентная зона симулятора */}
          <main className="phone-app-main">
            {phoneScreen === "home" && (
              <div className="phone-screen-pane fade-in">
                <div className="phone-metric-strip">
                  <div className="p-chip">👥 142 Общих</div>
                  <div className="p-chip">⚡ 12 В очереди</div>
                </div>
                <div className="phone-action-card">
                  <h4>Быстрый заезд</h4>
                  <p>Готовность к сканированию карты лояльности клиента</p>
                  <button
                    className="phone-accent-btn"
                    onClick={() => changeScreen("scanner")}
                  >
                    <i className="fas fa-qrcode"></i> Включить камеру
                  </button>
                </div>
              </div>
            )}

            {phoneScreen === "history" && (
              <div className="phone-screen-pane fade-in">
                <h4>Последние логи заездов</h4>
                <div className="phone-logs-list">
                  <div className="p-log-item">
                    <span>Toyota Camry (у777хх)</span>
                    <small>14:22</small>
                  </div>
                  <div className="p-log-item">
                    <span>BMW X5 (о001оо)</span>
                    <small>13:05</small>
                  </div>
                  <div className="p-log-item">
                    <span>Hyundai Solaris (а123аа)</span>
                    <small>11:40</small>
                  </div>
                </div>
              </div>
            )}

            {phoneScreen === "scanner" && (
              <div className="phone-screen-pane fade-in phone-scanner-mock">
                <div className="scanner-target-box">
                  <div className="scanner-laser-line"></div>
                  <i className="fas fa-camera scanner-bg-icon"></i>
                </div>
                <p>
                  Наведите камеру смартфона на QR-код клиента для начисления
                  визита
                </p>
                <button
                  className="phone-cancel-btn"
                  onClick={() => changeScreen("home")}
                >
                  Закрыть сканер
                </button>
              </div>
            )}
          </main>

          {/* Внутренний мобильный таббар */}
          <footer className="phone-app-footer">
            <button
              className={phoneScreen === "home" ? "active" : ""}
              onClick={() => changeScreen("home")}
            >
              <i className="fas fa-home"></i>
            </button>
            <button
              className={phoneScreen === "scanner" ? "active" : ""}
              onClick={() => changeScreen("scanner")}
            >
              <i className="fas fa-qrcode"></i>
            </button>
            <button
              className={phoneScreen === "history" ? "active" : ""}
              onClick={() => changeScreen("history")}
            >
              <i className="fas fa-history"></i>
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default SimulatorTab;
