// src/pages/History/HistoryPage.jsx
import React from 'react';
import './HistoryPage.css'; // Шаг 4: Подключаем стили

const HistoryPage = () => {
  return (
    <div className="history-page">
    

      <div className="page-center-container">
        
        {/* КОНТЕЙНЕР №1: Сводная информация */}
        <div className="history-card history-summary-box content-group-box">
          <div className="fill-zone">
            {/* Сюда будем рендерить общую статистику (например, "Всего визитов: 12") */}
            <h3 style={{ margin: 0 }}>Общая статистика</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Данные за всё время</p>
          </div>
        </div>

        {/* КОНТЕЙНЕР №2: Основной список визитов */}
        <div className="history-card history-main-list content-group-box">
          <div className="fill-zone">
            {/* Сюда будем мапать (map) массив данных из бэкенда */}
            <h3 style={{ marginBottom: '10px' }}>Последние заезды</h3>
            <div className="data-placeholder">Список посещений пуст...</div>
          </div>
        </div>

        {/* КОНТЕЙНЕР №3: Дополнительная информация или легенда */}
        <div className="history-card history-footer-info content-group-box">
          <div className="fill-zone">
            {/* Сюда можно вынести фильтры или пояснения к услугам */}
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
              Нужна помощь с историей заказов? 
              <br /> Обратитесь к администратору.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HistoryPage;