import React, { useContext, memo } from 'react';
import { AuthContext } from '../context/AuthContext';

const Navigation = memo(() => {
  const { user, activePage, setActivePage } = useContext(AuthContext);

  const navItems = [
    { id: 'home', label: 'Главная', icon: 'fa-home' },
    { id: 'history', label: 'История', icon: 'fa-history' },
    { id: 'profile', label: 'Профиль', icon: 'fa-user' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Админ', icon: 'fa-user-shield' });
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
});

export default Navigation;