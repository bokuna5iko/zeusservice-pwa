import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/apiService'; // Импортируем наш новый API сервис

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]); // Добавляем состояние для истории визитов
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Функция для загрузки данных пользователя и истории
  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      const profileResponse = await api.getProfile();
      setUser(profileResponse.data);

      const historyResponse = await api.getHistory();
      setHistory(historyResponse.data);

      // Проверяем роль и скрываем админку, если пользователь не админ
      const navAdmin = document.getElementById('nav-admin'); // Это временное решение, лучше использовать React-роутинг
      if (navAdmin) {
        navAdmin.style.display = (profileResponse.data.role === 'admin') ? 'flex' : 'none';
      }

    } catch (err) {
      console.error('Ошибка загрузки данных пользователя:', err);
      // Если токен недействителен или есть другие ошибки, выходим
      logout(); // Используем локальный logout, который не вызывает navigate
    } finally {
      setLoading(false);
    }
  }, [navigate]); // Добавляем navigate в зависимости, хотя logout внутри не использует navigate напрямую

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Здесь мы не вызываем setLoading(true) снова, так как он уже есть в loadUserData
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [loadUserData]); // Зависимость от loadUserData

  const login = async (phone) => { // Убрали password, так как его нет в доноре
    setLoading(true);
    try {
      const res = await api.login(phone);
      if (res.data && res.data.token) {
        localStorage.setItem('accessToken', res.data.token);
        // После успешного входа, загружаем все данные пользователя
        await loadUserData();
        navigate('/'); // Перенаправляем на главную страницу
      } else {
        // Здесь можно вывести сообщение об ошибке, если API вернул success: false
        throw new Error(res.data.message || 'Ошибка входа');
      }
    } catch (err) {
      console.error('Ошибка логина:', err);
      // alert(err.message || 'Ошибка входа'); // Можно добавить более user-friendly уведомление
      setUser(null);
      localStorage.removeItem('accessToken');
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    setUser(null);
    setHistory([]); // Очищаем историю при выходе
    navigate('/auth'); // Перенаправляем на страницу авторизации
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, history, loading, login, logout, loadUserData }}>
      {children}
    </AuthContext.Provider>
  );
};