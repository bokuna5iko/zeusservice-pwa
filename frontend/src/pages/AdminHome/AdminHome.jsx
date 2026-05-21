import React, { useState, useEffect } from 'react';
import './AdminHome.css';
import CalculatorModal from '../../components/CalculatorModal/CalculatorModal';
// 👇 1. ИМПОРТИРУЕМ НАШ НАСТОЯЩИЙ СКАНЕР (Тут всё верно)
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
      const statsRes = await fetch('/api/admin/stats/today-count');
      const statsData = await statsRes.json();
      setTodayCount(statsData.today_count);

      const actionsRes = await fetch('/api/admin/stats/last-visits');
      const actionsData = await actionsRes.json();
      setLastActions(actionsData);
    } catch (err) {
      console.error('Ошибка при сборе данных админа:', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const progressPercent = Math.min((todayCount / 90) * 100, 100);

  // 👇 2. МЕНЯЕМ КЛИК: Теперь кнопка открывает сканер, а не калькулятор с фейком
  const handleQrButtonClick = () => {
    setSelectedClient(null);
    setIsGuestMode(false);
    setIsScannerOpen(true); // Открываем сканер!
  };

  // 👇 3. СРАБОТАЕТ ПРИ УСПЕШНОМ СКАНИРОВАНИИ:
  const handleScanSuccess = (clientFromBackend) => {
    setIsScannerOpen(false);          // Закрываем сканер
    setSelectedClient(clientFromBackend); // Кладим реальные данные (name, phone, visit_count)
    setIsCalcOpen(true);              // Мгновенно открываем калькулятор для этого юзера!
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
                className={`progress-bar-fill ${todayCount >= targetPlan ? 'plan-completed' : ''}`} 
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
                    className={`milestone-tick ${isPassed ? 'passed' : ''} ${isBonus ? 'bonus' : ''}`}
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
          {/* Привязали функцию открытия сканера */}
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
                    <span className="action-client-name">{action.client_name}</span>
                    <span className="action-service-name">{action.service_name}</span>
                    <span className="action-time">
                      {new Date(action.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="action-card-right">
                    <span className="action-price">{action.base_price} ₽</span>
                    {action.visit_number && (
                      <span className="action-visit-badge">Визит: {action.visit_number}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 👇 4. ИСПРАВЛЕНО: Теперь вызывается правильный AdminScanner и проп onClientScanned */}
      <AdminScanner 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onClientScanned={handleScanSuccess}
      />

      {/* КОНТЕЙНЕР №5: Модалка калькулятора */}
      <CalculatorModal 
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        clientData={selectedClient} // Передаем данные отсканированного юзера
        isGuest={isGuestMode}
        onSuccess={fetchAdminData}
      />
    </div>
  );
};

export default AdminHome;