// src/components/Navigation.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Navigation = () => {
  const { activePage, setActivePage, user } = useContext(AuthContext);

  const navItems = [
    { id: 'home', label: 'Главная', icon: 'fa-qrcode' },
    { id: 'history', label: 'История', icon: 'fa-history' },
    { id: 'profile', label: 'Профиль', icon: 'fa-user' },
  ];

  // Если пользователь — админ, добавляем кнопку админки
  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Админ', icon: 'fa-shield-alt' });
  }

  return (
    <nav className="nav-container">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`nav-btn ${activePage === item.id ? 'active' : ''}`}
          onClick={() => setActivePage(item.id)}
        >
          <i className={`fas ${item.icon}`}></i>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default Navigation;