import React, { useState, useContext } from 'react'; // Добавили useContext
import { AuthContext } from '../../context/AuthContext'; // Импортировали контекст
import './LoginPage.css';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const { login } = useContext(AuthContext); // Достаем функцию входа

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Теперь вместо простого console.log вызываем вход из контекста
    // Передаем объект с телефоном, как ожидает наш AuthContext
    login({ phone: phone }); 
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>ZEUS <span>AUTO</span></h1>
        <p>Введите номер телефона для входа в систему лояльности</p>
        
        <form onSubmit={handleLogin}>
          <div className="input-group">
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
  );
};

export default LoginPage;