// src/pages/Profile/ProfilePage.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './ProfilePages.css'; // Шаг 4: Подключаем стили

const ProfilePage = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="profile-page">
      <div className="section-header" style={{ textAlign: 'center', marginTop: '20px' }}>
        <h1>Профиль</h1>
      </div>

      <div className="page-center-container">
        
        {/* КОНТЕЙНЕР №1: Личные данные (ID и телефон) */}
        <div className="profile-card profile-identity-box content-group-box">
          <div className="fill-zone">
            <div className="avatar-placeholder">
              <i className="fas fa-user fa-2x"></i>
            </div>
            {/* Сюда будем рендерить имя и телефон из БД */}
            <h2 className="user-name">{user?.name || 'Клиент'}</h2>
            <p className="user-phone">{user?.phone || '+7 (---) --- -- --'}</p>
          </div>
        </div>

        {/* КОНТЕЙНЕР №2: Статус и Бонусы */}
        <div className="profile-card profile-loyalty-box content-group-box">
          <div className="fill-zone">
            {/* Сюда пойдут данные о ранге (напр. "Бронза") и дата регистрации */}
            <h3 className="stats-title">Мой статус</h3>
            <div className="status-badge">Постоянный клиент</div>
            <p className="visit-counter">Визитов: {user?.visits || 0}</p>
          </div>
        </div>

        {/* КОНТЕЙНЕР №3: Настройки и Выход */}
        <div className="profile-card profile-actions-box content-group-box">
          <div className="fill-zone">
            {/* Кнопки управления аккаунтом */}
            <button className="action-btn settings-btn">
              <i className="fas fa-cog"></i> Настройки
            </button>
            <button onClick={logout} className="action-btn logout-btn-red">
              <i className="fas fa-sign-out-alt"></i> Выйти из аккаунта
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;