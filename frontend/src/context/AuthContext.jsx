// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import { api } from "../api/apiService";

export const AuthContext = createContext();

const API_URL = "/api/auth";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🌟 ИСПРАВЛЕНО: Standalone метод принудительного обновления данных профиля из PostgreSQL
  const refreshProfile = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const response = await api.getProfile();
      setUser(response.data); // Мгновенно обновляем стейт юзера (кружочки, ранг, бонусы)
    } catch (err) {
      console.error("Ошибка при фоновом обновлении профиля:", err);
      // Если токен тотально протух — разлогиниваем
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("accessToken");
        setUser(null);
      }
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Используем наш вынесенный метод при первичном монтировании приложения
        await refreshProfile();
      } catch (err) {
        console.error("Ошибка сессии:", err);
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Ошибка входа");

      localStorage.setItem("accessToken", data.accessToken);
      setUser(data.user);
      setActivePage("home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Ошибка регистрации");

      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
      }
      setUser(data.user);
      setActivePage("home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
    setActivePage("home");
  };

  return (
    // 🌟 ИСПРАВЛЕНО: Прокидываем метод refreshProfile в глобальный доступ
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        activePage,
        setActivePage,
        refreshProfile,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
