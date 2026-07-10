// src/components/modals/ForceResetPasswordModal.jsx
import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { api } from "../../api/apiService";
import "./ForceResetPasswordModal.css"; // Стили добавим ниже

const ForceResetPasswordModal = () => {
  const { mustResetPassword, setMustResetPassword, logout } =
    useContext(AuthContext);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Если флаг false, компонент ничего не рендерит и не мешает
  if (!mustResetPassword) return null;

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 4) {
      setError("Новый пароль должен содержать не менее 4 символов");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(false);
    try {
      setLoading(true);
      // Стучимся на созданный нами эндпоинт бэкенда
      await api.changePassword(newPassword.trim());

      alert("Пароль успешно защищён! Добро пожаловать.");
      // Снимаем блокировку на фронте
      setMustResetPassword(false);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Не удалось обновить пароль. Попробуйте снова.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="force-reset-overlay">
      <div className="force-reset-card">
        <div className="force-reset-icon-box">
          <i className="fas fa-shield-alt animate-pulse"></i>
        </div>

        <h2>Безопасность аккаунта</h2>
        <p className="force-reset-subtitle">
          Вам был установлен временный пароль администратором. Пожалуйста,
          придумайте новый постоянный пароль для защиты вашего профиля.
        </p>

        <form onSubmit={handlePasswordSubmit} className="force-reset-form">
          {error && (
            <div className="force-reset-error-msg">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          <div className="force-input-group">
            <label>Новый постоянный пароль</label>
            <input
              type="password"
              placeholder="Минимум 4 символа"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="force-input-group">
            <label>Повторите новый пароль</label>
            <input
              type="password"
              placeholder="Сверка совпадения"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="btn-force-submit" disabled={loading}>
            {loading ? "Сохранение в БД..." : "Зафиксировать новый пароль"}
          </button>

          <button
            type="button"
            className="btn-force-logout"
            onClick={logout}
            disabled={loading}
          >
            Выйти из аккаунта
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForceResetPasswordModal;
