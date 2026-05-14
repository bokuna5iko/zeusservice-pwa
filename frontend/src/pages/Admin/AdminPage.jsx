// src/pages/Admin/AdminPage.jsx
import React from 'react';
import './AdminPage.css'; // Шаг 4: Подключаем стили

const AdminPage = () => {
  return (
    <div className="admin-page-flow">
      <div className="section-header" style={{ textAlign: 'center', marginTop: '20px' }}>
        <h1>Панель управления</h1>
      </div>

      <div className="page-center-container">
        
        {/* Сетка 2x2 */}
        <div className="admin-grid">
          
          {/* КОНТЕЙНЕР №1: Визиты за день */}
          <div className="admin-card content-group-box">
            <div className="fill-zone">
              <i className="fas fa-car-side admin-icon blue"></i>
              <span className="admin-label">Визиты</span>
              {/* Место для данных: например, число 12 */}
              <h2 className="admin-value">0</h2>
            </div>
          </div>

          {/* КОНТЕЙНЕР №2: Выручка / Касса */}
          <div className="admin-card content-group-box">
            <div className="fill-zone">
              <i className="fas fa-wallet admin-icon green"></i>
              <span className="admin-label">Касса</span>
              {/* Место для данных: например, 15 400 ₽ */}
              <h2 className="admin-value">0 ₽</h2>
            </div>
          </div>

          {/* КОНТЕЙНЕР №3: Новые клиенты */}
          <div className="admin-card content-group-box">
            <div className="fill-zone">
              <i className="fas fa-user-plus admin-icon orange"></i>
              <span className="admin-label">Новые</span>
              {/* Место для данных: количество регистраций */}
              <h2 className="admin-value">0</h2>
            </div>
          </div>

          {/* КОНТЕЙНЕР №4: Средний чек */}
          <div className="admin-card content-group-box">
            <div className="fill-zone">
              <i className="fas fa-chart-line admin-icon purple"></i>
              <span className="admin-label">Ср. чек</span>
              {/* Место для данных: средний показатель */}
              <h2 className="admin-value">0 ₽</h2>
            </div>
          </div>

        </div>

        {/* Дополнительная кнопка сканера под сеткой (бонус для удобства) */}
        <button className="scan-btn-main">
          <i className="fas fa-qrcode"></i> Сканировать код
        </button>

      </div>
    </div>
  );
};

export default AdminPage;