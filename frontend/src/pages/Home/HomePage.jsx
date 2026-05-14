// src/pages/Home/HomePage.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react'; // Готовим импорт для QR
import './HomePage.css'; // Шаг 4: Подключаем стили

const HomePage = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="home-page">
      <div className="section-header" style={{ textAlign: 'center', marginTop: '20px' }}>
        <h1>ZEUS AUTO</h1>
      </div>

      <div className="page-center-container">
        
        {/* КОНТЕЙНЕР №1: Личный QR-код */}
        <div className="home-card qr-container-box content-group-box">
          <div className="fill-zone">
            <p className="qr-label">Ваш идентификатор</p>
            <div className="qr-wrapper">
              {/* Сюда будет генерироваться QR на основе телефона или ID */}
              <QRCodeCanvas 
                value={user?.phone || "0000000000"} 
                size={180}
                bgColor={"#ffffff"}
                fgColor={"#1e3c72"}
                level={"H"}
              />
            </div>
            <h3 className="user-display-name">{user?.name || 'Гость'}</h3>
          </div>
        </div>

        {/* КОНТЕЙНЕР №2: Статус лояльности (Визиты) */}
        <div className="home-card loyalty-progress-box content-group-box">
          <div className="fill-zone">
            <h3 className="card-title">До бесплатной мойки</h3>
            {/* Сюда в будущем вставим компонент PointsGrid */}
            <div className="progress-placeholder">
              <span className="visits-count">{user?.visits || 0} / 6</span>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${((user?.visits || 0) / 6) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* КОНТЕЙНЕР №3: Бонусный баланс / Акции */}
        <div className="home-card balance-info-box content-group-box">
          <div className="fill-zone">
            <div className="balance-row">
              <div className="balance-item">
                <span className="label">Бонусы</span>
                <span className="value">500 ₽</span>
              </div>
              <div className="balance-divider"></div>
              <div className="balance-item">
                <span className="label">Ранг</span>
                <span className="value">Gold</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomePage;