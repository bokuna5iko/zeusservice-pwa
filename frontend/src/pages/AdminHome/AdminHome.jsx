import React, { useState, useEffect } from 'react';
import './AdminHome.css';
import CalculatorModal from '../../components/CalculatorModal/CalculatorModal';

const AdminHome = () => {
  const [todayCount, setTodayCount] = useState(0);
  const [lastActions, setLastActions] = useState([]);
  
  // Состояния для модалки калькулятора
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [mockClient, setMockClient] = useState(null);

  // Константы плана (План Артема = 60)
  const milestones = [30, 60, 75, 90];
  const targetPlan = 60;

  // Функция сбора данных с бэкенда
  const fetchAdminData = async () => {
    try {
      const statsRes = await fetch('http://localhost:3000/api/admin/stats/today-count');
      const statsData = await statsRes.json();
      setTodayCount(statsData.today_count);

      const actionsRes = await fetch('http://localhost:3000/api/admin/stats/last-visits');
      const actionsData = await actionsRes.json();
      setLastActions(actionsData);
    } catch (err) {
      console.error('Ошибка при сборе данных админа:', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Расчет процента заполнения шкалы (ВАЖНО: объявлено ДО рендеринга и кнопок)
  const progressPercent = Math.min((todayCount / 90) * 100, 100);

  // Клик по кнопке QR-сканирования (Заглушка со скидкой 4-го визита)
  const handleQrScanMock = () => {
    setMockClient({
      name: 'Алексей (Тест QR)',
      phone: '79245975867', 
      visit_count: 3 // 3 визита в базе означает, что текущий будет 4-м
    });
    setIsGuestMode(false);
    setIsCalcOpen(true);
  };

  // Клик по кнопке Гость
  const handleGuestClick = () => {
    setMockClient(null);
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
            
            {/* Метки на шкале */}
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
          <button className="qr-scan-btn-big" onClick={handleQrScanMock}>
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

      {/* КОНТЕЙНЕР №5: Модалка калькулятора */}
      <CalculatorModal 
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        clientData={mockClient}
        isGuest={isGuestMode}
        onSuccess={fetchAdminData}
      />
    </div>
  );
};

export default AdminHome;