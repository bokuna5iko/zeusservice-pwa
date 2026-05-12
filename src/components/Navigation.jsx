import React from 'react';

// Нам нужно передать два "пропса": какая страница активна и функцию для её смены
const Navigation = ({ activePage, setActivePage }) => {
  
  // Список вкладок, чтобы не дублировать код
  const navItems = [
    { id: 'home', label: 'Главная', icon: '🏠' },
    { id: 'history', label: 'История', icon: '📋' },
    { id: 'profile', label: 'Профиль', icon: '👤' },
    { id: 'admin', label: 'Админ', icon: '⚙️' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <div 
          key={item.id}
          className={`nav-item ${activePage === item.id ? 'active' : ''}`}
          onClick={() => setActivePage(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </nav>
  );
};

export default Navigation;