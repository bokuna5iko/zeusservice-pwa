// src/pages/Login/LoginPage.jsx
import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import "./LoginPage.css";

// 🌟 ИСПРАВЛЕНО: Принимаем пропсы PWA-обновлений из App.jsx
const LoginPage = ({
  needRefresh,
  showHintBanner,
  setShowHintBanner,
  isSpinning,
  handlePwaUpdate,
}) => {
  const [isRegister, setIsRegister] = useState(false); // false = Вход, true = Регистрация
  const [authMethod, setAuthMethod] = useState("login"); // 'login' = по логину, 'phone' = по телефону

  // Стейты под систему авторизации
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(""); // Поле скрыто на фронтенде, по умолчанию пустая строка

  const { login, register, loading, error } = useContext(AuthContext);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isRegister) {
      if (register) {
        // 🌟 ИСПРАВЛЕНО: Передаем пустую строку или null, чтобы на бэке сработал NULL-предохранитель
        register({ name, username, password, phone: phone.trim() || null });
      }
    } else {
      if (login) {
        login({ username, password });
      }
    }
  };

  // Валидация полей
  const isFormValid = isRegister
    ? name.trim().length > 0 &&
      username.trim().length > 0 &&
      password.length >= 4
    : username.trim().length > 0 && password.length > 0;

  return (
    <div
      className="login-page-wrapper"
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      {/* 🌟 ВСПЛЫВАЮЩАЯ UX-ПОДСКАЗКА ДЛЯ СТРАНИЦЫ ЛОГИНА */}
      <div
        className={`pwa-smart-hint-banner ${showHintBanner ? "slide-down" : ""}`}
      >
        <i className="fas fa-info-circle"></i>
        <span>Доступна новая версия бизнеса. Обновитесь!</span>
      </div>

      {/* 🌟 КНОПКА ОБНОВЛЕНИЯ: Позиционируется абсолютно в углу карточки или страницы */}
      <div className="login-pwa-anchor">
        <button
          type="button"
          className={`global-smart-update-btn ${needRefresh ? "update-available" : ""} ${isSpinning ? "rapid-spinning" : ""}`}
          disabled={!needRefresh || isSpinning}
          onClick={handlePwaUpdate}
          title={
            needRefresh
              ? "Доступно свежее обновление!"
              : "Приложение актуальной версии"
          }
        >
          <i className="fas fa-sync-alt"></i>
          {needRefresh && <span className="notification-pulsing-dot"></span>}
        </button>
      </div>

      <div className="login-card content-group-box">
        <div className="fill-zone">
          <h1 className="login-logo">
            ZEUS <span>AUTO</span>
          </h1>

          {/* ВЕРХНИЕ ТАБЫ: Вход / Регистрация */}
          <div className="auth-toggle-tabs">
            <button
              type="button"
              className={`toggle-tab ${!isRegister ? "active" : ""}`}
              onClick={() => setIsRegister(false)}
              disabled={loading}
            >
              Вход
            </button>
            <button
              type="button"
              className={`toggle-tab ${isRegister ? "active" : ""}`}
              onClick={() => setIsRegister(true)}
              disabled={loading}
            >
              Регистрация
            </button>
          </div>

          {/* ВНУТРЕННИЕ ПЕРЕКЛЮЧАТЕЛИ: По телефону / По логину */}
          <div className="method-toggle-container">
            <button
              type="button"
              className={`method-btn ${authMethod === "login" ? "selected" : ""}`}
              onClick={() => setAuthMethod("login")}
            >
              <i className="fas fa-key"></i> По логину
            </button>
            <button
              type="button"
              className={`method-btn ${authMethod === "phone" ? "selected" : ""}`}
              onClick={() => setAuthMethod("phone")}
            >
              <i className="fas fa-phone"></i> По телефону
            </button>
          </div>

          {error && <div className="login-error-msg">{error}</div>}

          {/* Если выбран телефон — блокируем вход */}
          {authMethod === "phone" ? (
            <div className="phone-blocked-notice">
              <div className="blocked-icon-box">
                <i className="fas fa-lock"></i>
              </div>
              <h3>Вход по телефону недоступен</h3>
              <p>
                Авторизация через СМС временно отключена технической поддержкой.
                Пожалуйста, используйте вкладку <strong>«По логину»</strong>.
              </p>
            </div>
          ) : (
            /* Если выбран логин — выводим форму */
            <form onSubmit={handleSubmit} className="login-form">
              <p className="login-subtitle">
                {isRegister
                  ? "Заполните данные для создания аккаунта"
                  : "Введите учетные данные для доступа в систему"}
              </p>

              {isRegister && (
                <div className="input-wrapper">
                  <i className="fas fa-user"></i>
                  <input
                    type="text"
                    placeholder="Ваше имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              )}

              <div className="input-wrapper">
                <i className="fas fa-at"></i>
                <input
                  type="text"
                  placeholder="Логин (username)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="input-wrapper">
                <i className="fas fa-lock"></i>
                <input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
              </div>

              {/* 🌟 ИСПРАВЛЕНО: Инпут телефона полностью скрыт с экрана (display: "none"), 
                  чтобы не собирать ПДн и не усложнять регистрацию на этапе релиза */}
              {isRegister && (
                <div className="input-wrapper" style={{ display: "none" }}>
                  <i className="fas fa-phone"></i>
                  <input
                    type="text"
                    placeholder="Телефон"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}

              <button
                type="submit"
                className="login-btn"
                disabled={!isFormValid || loading}
              >
                {loading
                  ? "Проверка..."
                  : isRegister
                    ? "Создать аккаунт"
                    : "Войти"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
