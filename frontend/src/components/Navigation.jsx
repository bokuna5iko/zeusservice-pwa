// src/components/Navigation.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Navigation = () => {
  const { activePage, setActivePage, user } = useContext(AuthContext);

  // Динамически формируем меню в зависимости от роли пользователя
  const navItems = user?.role === 'admin'
    ? [
        { id: 'home', label: 'Главная', icon: 'fa-th-large' }, // Иконка дашборда для админа
        { id: 'history', label: 'История', icon: 'fa-history' },
        { id: 'profile', label: 'Профиль', icon: 'fa-user' },
      ]
    : [
        { id: 'home', label: 'Моя карта', icon: 'fa-qrcode' }, // Иконка QR для клиента
        { id: 'history', label: 'История', icon: 'fa-history' },
        { id: 'profile', label: 'Профиль', icon: 'fa-user' },
      ];

  // Если у тебя остаётся старая страница управления "Админ", пушим её для роли admin
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