import React, { useState, useEffect } from 'react';
import api from "../../api/axios";
import './AdminPage.css';      // Импорт стилей в конце

// Вспомогательный компонент для красивой карточки метрики
const StatCard = ({ title, value, percent, desc, icon, colorClass }) => (
  <div className="stat-card-v2">
    <div className={`stat-icon-circle ${colorClass}`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <div className="stat-content">
      <div className="stat-label">{title}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-footer">
        <span className={`stat-percent ${percent >= 0 ? 'up' : 'down'}`}>
          {percent >= 0 ? `+${percent}` : percent}%
        </span>
        <span className="stat-desc">{desc}</span>
      </div>
    </div>
  </div>
);

const AdminPage = () => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Заглушка для статистики (потом свяжем с бэкендом)
  const [stats, setStats] = useState({
    todayUsers: 8,
    userChange: 12,
    retentionRate: 65,
    retentionChange: 5,
    totalVisits: 3,
    visitsChange: -2,
    totalRevenue: 4500,
    revenueChange: 8
  });

  const handleAddVisit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/add-visit', { phone, service_name: 'Мойка кузова', points: 100 });
      setMessage({ text: 'Визит успешно добавлен!', type: 'success' });
      setPhone('');
    } catch (err) {
      setMessage({ text: 'Ошибка: пользователь не найден', type: 'error' });
    }
  };

  return (
    <div className="admin-page-flow">
      {/* СЕГМЕНТ 1: МЕТРИКИ (Твои любимые 4 блока) */}
      <div className="section-header">
        <h1>Панель управления</h1>
        <p>Статистика к этому часу</p>
      </div>

      <div className="stats-grid-v2">
        <StatCard 
          title="Клиенты сегодня" 
          value={stats.todayUsers} 
          percent={stats.userChange}
          desc="вчера"
          icon="fa-users"
          colorClass="blue"
        />
        <StatCard 
          title="Возврат" 
          value={`${stats.retentionRate}%`} 
          percent={stats.retentionChange}
          desc="постоянники"
          icon="fa-redo"
          colorClass="green"
        />
        <StatCard 
          title="Новые" 
          value={stats.totalVisits} 
          percent={stats.visitsChange}
          desc="приток"
          icon="fa-user-plus"
          colorClass="purple"
        />
        <StatCard 
          title="Выручка" 
          value={`${stats.totalRevenue.toLocaleString()} ₽`} 
          percent={stats.revenueChange}
          desc="вчера"
          icon="fa-wallet"
          colorClass="orange"
        />
      </div>

      {/* СЕГМЕНТ 2: УПРАВЛЕНИЕ ВИЗИТАМИ */}
      <div className="section-header" style={{marginTop: '30px'}}>
        <h2>Действия</h2>
      </div>

      <div className="card-section admin-action-card">
        <form onSubmit={handleAddVisit} className="admin-form">
          <div className="form-group">
            <label>Номер телефона клиента</label>
            <input 
              type="tel" 
              placeholder="79001234567" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="action-btn">
            <i className="fas fa-plus-circle"></i> Начислить визит
          </button>
        </form>
        {message.text && (
          <div className={`alert ${message.type}`}>{message.text}</div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;