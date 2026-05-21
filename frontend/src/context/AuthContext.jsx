import React, { createContext, useState, useEffect } from 'react';
import { api } from '../api/apiService';

export const AuthContext = createContext();

// Вынесем базовый URL, чтобы менять его в одном месте
const API_URL = '/api/auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState('home');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

useEffect(() => {
  const checkAuth = async () => {
    // 1. Читаем ПРАВИЛЬНЫЙ токен, который ждет твой apiService и друг в Docker
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // 2. Вызываем метод из apiService. Наш интерцептор сам прикрепит токен!
      const response = await api.getProfile();
      
      // В Axios данные ответа всегда лежат в поле .data
      setUser(response.data);
    } catch (err) {
      console.error('Ошибка сессии:', err);
      // Если токен протух или бэк вернул ошибку — чистим токен
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  checkAuth();
}, []);

const login = async (credentials) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка входа');
      }

      // ❌ БЫЛО: localStorage.setItem('token', data.accessToken);
      //  СТАЛО (пишем под правильным ключом):
      localStorage.setItem('accessToken', data.accessToken);
      
      setUser(data.user); 
      setActivePage('home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    setActivePage('home');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, activePage, setActivePage, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};