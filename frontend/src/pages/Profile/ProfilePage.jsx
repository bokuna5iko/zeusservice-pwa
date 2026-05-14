
import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="profile-page">
      <div className="section-header">
        <h1>Профиль</h1>
        <p>Управление вашим аккаунтом</p>
      </div>

      <div className="card-section user-info-card">
        <div className="user-avatar-large">
          <i className="fas fa-user-circle"></i>
        </div>
        <div className="user-details">
          <h2>{user?.name || 'Клиент'}</h2>
          <p>{user?.phone}</p>
        </div>
      </div>

      <button className="logout-btn" onClick={logout}>
        <i className="fas fa-sign-out-alt"></i> Выйти из системы
      </button>
    </div>
  );
};

export default ProfilePage;