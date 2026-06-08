// src/pages/AdminHome/AdminHome.jsx
import React, { useState, useEffect } from "react";
import { offlineDB } from "../../db/offlineDB";
import "./AdminHome.css";
import CalculatorModal from "../../components/CalculatorModal/CalculatorModal";
// 1. ИМПОРТИРУЕМ НАШ НАСТОЯЩИЙ СКАНЕР
import AdminScanner from "../../components/AdminScanner/AdminScanner";

const AdminHome = () => {
  const [todayCount, setTodayCount] = useState(0);
  const [lastActions, setLastActions] = useState([]);

  // Состояния для модалок
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Константы плана (План Артема = 60)
  const milestones = [30, 60, 75, 90];
  const targetPlan = 60;

  // Функция сбора данных с бэкенда
  const fetchAdminData = async () => {
    try {
      // Сначала пробуем загрузить из сети
      const statsRes = await fetch("/api/admin/stats/today-count");
      const statsData = await statsRes.json();
      setTodayCount(statsData.today_count);

      const actionsRes = await fetch("/api/admin/stats/last-visits");
      const actionsData = await actionsRes.json();
      setLastActions(actionsData);

      // Сохраняем в IndexedDB для офлайна
      await offlineDB.saveSnapshot("todayVisits", actionsData);
    } catch (err) {
      console.error("Ошибка при сборе данных админа:", err);

      // Если офлайн — загружаем из IndexedDB
      if (!navigator.onLine) {
        console.log("[Offline] Загрузка из IndexedDB");
        const cachedVisits = await offlineDB.getSnapshot("todayVisits");
        if (cachedVisits.length > 0) {
          setLastActions(cachedVisits.slice(0, 3));
        }
      }
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const progressPercent = Math.min((todayCount / 90) * 100, 100);

  // 2. КЛИК ПО КНОПКЕ СКАНИРОВАНИЯ: Жестко зачищаем старые стейты клиента
  const handleQrButtonClick = () => {
    setSelectedClient(null);
    setIsGuestMode(false);
    setIsScannerOpen(true); // Открываем сканер!
  };

  // 3. СРАБОТАЕТ ПРИ УСПЕШНОМ СКАНИРОВАНИИ (Решение проблемы повторного открытия)
  const handleScanSuccess = (clientFromBackend) => {
    setIsScannerOpen(false); // Закрываем сканер

    // Сбрасываем стейт в null, чтобы React гарантированно зафиксировал изменение объекта
    setSelectedClient(null);
    setTimeout(() => {
      setSelectedClient(clientFromBackend); // Записываем новые данные клиента
      setIsCalcOpen(true); // Мгновенно открываем калькулятор!
    }, 50);
  };

  // 4. ФУНКЦИЯ ДЛЯ ПРАВИЛЬНОГО ЗАКРЫТИЯ КАЛЬКУЛЯТОРА И ОЧИСТКИ ПАМЯТИ
  const handleCloseCalculator = () => {
    setIsCalcOpen(false);
    setSelectedClient(null); // Полностью стираем клиента, чтобы следующее сканирование сработало стабильно
    setIsGuestMode(false);
  };

  // Клик по кнопке Гость
  const handleGuestClick = () => {
    setSelectedClient(null);
    setIsGuestMode(true);
    setIsCalcOpen(true);
  };

  return (
    <div className="admin-home-page">
      <div className="page-center-container">
        {/* КОНТЕЙНЕР №1: План на смену */}
        <div className="content-group-box plan-container">
          <div className="plan-header">
            <span className="section-title">План на смену</span>
            <span className="plan-counter">
              <strong>{todayCount}</strong> / {targetPlan} авто
            </span>
          </div>

          <div className="progress-timeline-wrapper">
            <div className="progress-track">
              <div
                className={`progress-bar-fill ${todayCount >= targetPlan ? "plan-completed" : ""}`}
                style={{ width: `${progressPercent}%` }}
              >
                <div className="progress-cursor"></div>
              </div>
            </div>

            <div className="milestones-labels">
              {milestones.map((m) => {
                const position = (m / 90) * 100;
                const isPassed = todayCount >= m;
                const isBonus = m > targetPlan;

                return (
                  <div
                    key={m}
                    className={`milestone-tick ${isPassed ? "passed" : ""} ${isBonus ? "bonus" : ""}`}
                    style={{ left: `${position}%` }}
                  >
                    <span className="tick-mark"></span>
                    <span className="tick-number">{m}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {todayCount >= targetPlan && (
            <div className="plan-badge-success">🎉 План Артема выполнен!</div>
          )}
        </div>

        {/* КОНТЕЙНЕР №2 & №3: Кнопки управления */}
        <div className="admin-actions-holder">
          <button className="qr-scan-btn-big" onClick={handleQrButtonClick}>
            <div className="qr-icon-inside">
              <i className="fas fa-qrcode"></i>
            </div>
            <span>Сканировать QR-код</span>
          </button>

          <button className="guest-add-btn-wide" onClick={handleGuestClick}>
            <i className="fas fa-user-secret"></i> Быстрое добавление (Гость)
          </button>
        </div>

        {/* КОНТЕЙНЕР №4: Лента последних действий */}
        <div className="content-group-box last-actions-container">
          <h3 className="section-title">Последние действия</h3>
          <div className="actions-list">
            {lastActions.length === 0 ? (
              <p className="no-actions-text">За сегодня действий еще не было</p>
            ) : (
              lastActions.map((action) => (
                <div key={action.id} className="action-history-card">
                  <div className="action-card-left">
                    <span className="action-client-name">
                      {action.client_name}
                    </span>
                    <span className="action-service-name">
                      {action.service_name}
                    </span>
                    <span className="action-time">
                      {new Date(action.created_at).toLocaleTimeString("ru-RU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="action-card-right">
                    <span className="action-price">{action.base_price} ₽</span>
                    {action.visit_number && (
                      <span className="action-visit-badge">
                        Визит: {action.visit_number}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Вызываем AdminScanner и передаем колбэк */}
      <AdminScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onClientScanned={handleScanSuccess}
      />

      {/* МОДАТАЛЬНОЕ ОКНО КАЛЬКУЛЯТОРА */}
      <CalculatorModal
        isOpen={isCalcOpen}
        onClose={handleCloseCalculator} // Используем правильную функцию закрытия и сброса
        clientData={selectedClient}
        isGuest={isGuestMode}
        onSuccess={() => {
          fetchAdminData();
          handleCloseCalculator(); // Очищаем стейты при успешном зачислении
        }}
      />
    </div>
  );
};

export default AdminHome;
