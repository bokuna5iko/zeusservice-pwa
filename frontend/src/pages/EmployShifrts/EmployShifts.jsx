import React, { useState } from 'react';
import './EmployShifts.css';

const EmployeeShifts = () => {
  // Моковые данные для демонстрации всех 4 статусов на будущую неделю
  const [shifts, setShifts] = useState([
    { id: 1, date: ' Пн, 25 Мая', status: 'completed', pay: 3500 },
    { id: 2, date: ' Вт, 26 Мая', status: 'completed', pay: 4200 },
    { id: 3, date: ' Ср, 27 Мая', status: 'approved', pay: null },
    { id: 4, date: ' Чт, 28 Мая', status: 'pending', pay: null },
    { id: 5, date: ' Пт, 29 Мая', status: 'available', pay: null },
    { id: 6, date: ' Сб, 30 Мая', status: 'available', pay: null },
    { id: 7, date: ' Вс, 31 Мая', status: 'available', pay: null },
  ]);

  // Финансовый итог (сумма за отработанные смены)
  const weeklyEarnings = shifts
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + s.pay, 0);

  // Функция клика по кнопке "Претендовать"
  const handleClaimShift = (id) => {
    setShifts(prevShifts =>
      prevShifts.map(shift =>
        shift.id === id ? { ...shift, status: 'pending' } : shift
      )
    );
    // Тут в будущем будет fetch('/api/shifts/claim', { method: 'POST', ... })
  };

  return (
    <div className="employee-shifts-page">
      <div className="page-center-container">
        
        {/* БЛОК ИТОГО ЗА НЕДЕЛЮ */}
        <div className="content-group-box total-earnings-box">
          <div className="earnings-header">
            <span className="earnings-title">Заработок за неделю</span>
            <span className="earnings-period">Вс - Сб</span>
          </div>
          <div className="earnings-amount">
            {weeklyEarnings.toLocaleString('ru-RU')} ₽
          </div>
          <p className="earnings-subtitle">Учитываются только закрытые и проверенные смены</p>
        </div>

        {/* ЗАГОЛОВОК СПИСКА */}
        <div className="shifts-section-header">
          <h3 className="section-title">График смен (9:00 - 22:00)</h3>
          <span className="shifts-note">Выбор на следующую неделю</span>
        </div>

        {/* ЛЕНТА СМЕН / ДНЕЙ */}
        <div className="shifts-list">
          {shifts.map((shift) => (
            <div key={shift.id} className={`shift-card ${shift.status}`}>
              <div className="shift-card-left">
                <i className="far fa-calendar-alt calendar-icon"></i>
                <span className="shift-date">{shift.date}</span>
              </div>

              <div className="shift-card-right">
                {/* 1. ОТРАБОТАНО (COMPLETED) */}
                {shift.status === 'completed' && (
                  <div className="shift-status-completed">
                    <span className="pay-tag">+{shift.pay} ₽</span>
                    <span className="status-label">Отработано</span>
                  </div>
                )}

                {/* 2. УТВЕРЖДЕНО (APPROVED) */}
                {shift.status === 'approved' && (
                  <div className="shift-status-approved">
                    <i className="fas fa-check-circle"></i>
                    <span>В графике</span>
                  </div>
                )}

                {/* 3. НА РАССМОТРЕНИИ (PENDING) */}
                {shift.status === 'pending' && (
                  <div className="shift-status-pending">
                    <div className="pulse-dot"></div>
                    <span>Ждет одобрения</span>
                  </div>
                )}

                {/* 4. СВОБОДНО (AVAILABLE) */}
                {shift.status === 'available' && (
                  <button 
                    className="claim-shift-btn" 
                    onClick={() => handleClaimShift(shift.id)}
                  >
                    <i className="fas fa-plus"></i> Занять
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default EmployeeShifts;