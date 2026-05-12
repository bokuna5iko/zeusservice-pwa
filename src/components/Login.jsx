import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(phone, password);
      // Если логин успешен, AuthContext обновит состояние, 
      // и App.jsx сам переключит экран
    } catch (err) {
      alert('Ошибка входа: проверьте данные');
    }
  };

  return (
    <div className="page active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <section className="card" style={{ width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Вход в Zeus Auto</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Телефон</label>
            <input 
              type="tel" 
              className="input-field" 
              placeholder="+7 (999) 000-00-00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Пароль</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-auth" style={{ width: '100%' }}>
            Войти
          </button>
        </form>
      </section>
    </div>
  );
};

export default Login;