import React, { useState, useContext } from "react";
import api from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import "./LoginPage.css";

const LoginPage = () => {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/auth/login", { phone });
      
      // Смотрим, где именно лежит юзер
      // Если бэкенд присылает { user: {...}, token: '...' }, берем response.data.user
      // Если бэкенд присылает сразу объект юзера, берем response.data
      const userData = response.data.user || response.data; 
      
      console.log("Данные для входа:", userData); 
      
      if (userData) {
        login(userData);
      } else {
        setError("Ошибка: Данные пользователя не получены");
      }
    } catch (err) {
      console.error("Ошибка при входе:", err);
      setError("Пользователь не найден");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>ZEUS <span>AUTO</span></h1>
          <span>Введите номер телефона для входа</span>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="input-group">
            <label>Телефон</label>
            <input
              type="tel"
              placeholder="79001234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-btn">Войти</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;