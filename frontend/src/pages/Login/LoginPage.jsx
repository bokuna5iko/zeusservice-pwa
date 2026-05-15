// src/pages/Login/LoginPage.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const { login, loading, error } = useContext(AuthContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Очищаем номер от лишних символов перед отправкой, если нужно
    login({ phone });
  };

  return (
    <div className="login-page">
      <div className="page-center-container">
        <div className="login-card content-group-box">
          <div className="fill-zone">
            <h1 className="login-logo">ZEUS <span>AUTO</span></h1>
            <p className="login-subtitle">Введите номер телефона для входа</p>

            {/* Вывод ошибки из контекста */}
            {error && <div className="login-error-msg">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="input-wrapper">
                <i className="fas fa-phone"></i>
                <input
                  type="tel"
                  placeholder="79990000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading} // Блокируем ввод при загрузке
                  required
                />
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Проверка...' : 'Войти'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;