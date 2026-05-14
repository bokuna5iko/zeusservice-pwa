import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('home');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    
    if (savedUser && savedUser !== "undefined") {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        // Если восстановили админа, сразу кидаем в админку
        if (parsedUser.role === 'admin') setActivePage('admin');
      } catch (e) {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    // Временный "хак" для тестов: если вводим любой номер, 
    // создаем объект пользователя
    const userToSave = {
      phone: userData.phone || '79990000000',
      name: 'Александр', // Тестовое имя
      role: 'admin',      // Ставим admin, чтобы видеть все вкладки
      visits: 3          // Тестовое кол-во визитов
    };

    setUser(userToSave);
    localStorage.setItem('user', JSON.stringify(userToSave));

    if (userToSave.role === 'admin') {
      setActivePage('admin');
    } else {
      setActivePage('home');
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setActivePage('home');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      activePage, 
      setActivePage 
    }}>
      {children}
    </AuthContext.Provider>
  );
};