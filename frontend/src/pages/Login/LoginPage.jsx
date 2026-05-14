// src/pages/Login/LoginPage.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './LoginPage.css'; // Шаг 4: Подключаем стили

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const { login } = useContext(AuthContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Вызываем функцию входа, передавая введенный номер
    login({ phone });
  };

  return (
    <div className="login-page">
      <div className="page-center-container">
        
        {/* КОНТЕЙНЕР №1: Форма авторизации */}
        <div className="login-card content-group-box">
          <div className="fill-zone">
            <h1 className="login-logo">ZEUS <span>AUTO</span></h1>
            <p className="login-subtitle">Введите номер телефона для входа</p>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="input-wrapper">
                <i className="fas fa-phone"></i>
                <input
                  type="tel"
                  placeholder="7 (999) 000-00-00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="login-btn">
                Войти
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;