// src/components/Navigation.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Navigation = () => {
  const { activePage, setActivePage, user } = useContext(AuthContext);

  // Динамически формируем меню в зависимости от роли пользователя
  const getNavItems = () => {
    if (user?.role === 'admin') {
      return [
        { id: 'home', label: 'Главная', icon: 'fa-th-large' },
        { id: 'history', label: 'История', icon: 'fa-history' },
        { id: 'stats', label: 'Статистика', icon: 'fa-chart-line' },
        { id: 'profile', label: 'Профиль', icon: 'fa-user' },
      ];
    }
    
    if (user?.role === 'worker') {
      return [
        { id: 'home', label: 'Главная', icon: 'fa-qrcode' },
        { id: 'shifts', label: 'Смены', icon: 'fa-calendar-alt' }, // Наша новая вкладка для работников!
        { id: 'history', label: 'История', icon: 'fa-history' },
        { id: 'profile', label: 'Профиль', icon: 'fa-user' },
      ];
    }

    // Дефолтное меню для обычного клиента
    return [
      { id: 'home', label: 'Главная', icon: 'fa-qrcode' },
      { id: 'history', label: 'История', icon: 'fa-history' },
      { id: 'profile', label: 'Победа', icon: 'fa-user' },
    ];
  };

  const navItems = getNavItems();

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