import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('home'); // По умолчанию на главную

  useEffect(() => {
    // Проверяем, залогинен ли пользователь при загрузке
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser && savedUser !== "undefined") {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Ошибка парсинга пользователя:", e);
        localStorage.clear(); // Если данные битые, лучше очистить всё
      }
    }
    setLoading(false);
  }, []);

  // userData теперь единственный аргумент, так как токен обычно лежит внутри него
  const login = (userData) => {
    if (!userData) {
      console.error("Ошибка: попытка входа без данных пользователя");
      return;
    }

    console.log("Данные успешно приняты контекстом:", userData);

    // Сохраняем пользователя в стейт
    setUser(userData);

    // Сохраняем в localStorage (токен берем из userData, если он там есть)
    if (userData.token) {
      localStorage.setItem('accessToken', userData.token);
    }
    localStorage.setItem('user', JSON.stringify(userData));

    // Умная переадресация: админа на пульт, юзера на главную к QR
    if (userData.role === 'admin') {
      setActivePage('admin');
    } else {
      setActivePage('home');
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
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