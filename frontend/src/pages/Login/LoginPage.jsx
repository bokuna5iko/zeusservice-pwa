// src/pages/Login/LoginPage.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false); // false = Вход, true = Регистрация
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  
  // Достаем из контекста нужные методы. 
  // В будущем в AuthContext можно добавить метод register, а пока сделаем общую заглушку
  const { login, register, loading, error } = useContext(AuthContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isRegister) {
      // Если твой контекст пока не поддерживает register, временно юзаем заглушку или тот же login
      if (register) {
        register({ name, phone });
      } else {
        console.log('Отправка регистрации:', { name, phone });
        // login({ phone }); // Или как настроите с бэкендером
      }
    } else {
      login({ phone });
    }
  };

  return (
    <div className="login-page">
      <div className="page-center-container">
        
        {/* Используем наш фирменный класс content-group-box */}
        <div className="login-card content-group-box">
          <div className="fill-zone">
            
            {/* Твой кастомный логотип */}
            <h1 className="login-logo">ZEUS <span>AUTO</span></h1>

            {/* 🌟 ПЕРЕКЛЮЧАТЕЛЬ: Вход / Регистрация */}
            <div className="auth-toggle-tabs">
              <button 
                type="button"
                className={`toggle-tab ${!isRegister ? 'active' : ''}`}
                onClick={() => setIsRegister(false)}
                disabled={loading}
              >
                Вход
              </button>
              <button 
                type="button"
                className={`toggle-tab ${isRegister ? 'active' : ''}`}
                onClick={() => setIsRegister(true)}
                disabled={loading}
              >
                Регистрация
              </button>
            </div>

            <p className="login-subtitle">
              {isRegister ? 'Заполните данные для создания аккаунта' : 'Введите номер телефона для входа'}
            </p>

            {/* Вывод ошибки из контекста */}
            {error && <div className="login-error-msg">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              
              {/* 🌟 ПОЛЕ ИМЕНИ: Рендерится только в режиме регистрации */}
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

              {/* Поле телефона (есть всегда) */}
              <div className="input-wrapper">
                <i className="fas fa-phone"></i>
                <input
                  type="tel"
                  placeholder="79990000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Кнопка отправки с лоадером */}
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Проверка...' : (isRegister ? 'Создать аккаунт' : 'Войти')}
              </button>

            </form>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default LoginPage;