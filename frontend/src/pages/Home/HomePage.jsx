
import React, { useContext } from 'react';
import { AuthContext } from "../../context/AuthContext";
import { QRCodeSVG } from 'qrcode.react';
import "./HomePage.css";

const HomePage = () => {
  const { user } = useContext(AuthContext);

  const totalSteps = 8;
  const currentVisits = user?.bonus_points ? Math.floor(user.bonus_points / 100) : 0;
  const progress = currentVisits % totalSteps;

  return (
    <div className="home-page">
      <div className="section-header">
        <h1>Моя лояльность</h1>
        <p>Ваш прогресс в Zeus Auto</p>
      </div>

      {/* БЛОК 1: Счётчик визитов */}
      <div className="card-section visit-counter-card">
        <div className="card-header">
          <span className="card-title">Карта визитов</span>
          <span className="card-subtitle">{progress} из {totalSteps} до подарка</span>
        </div>
        
        <div className="steps-grid">
          {[...Array(totalSteps)].map((_, i) => (
            <div 
              key={i} 
              className={`step-circle ${i < progress ? 'completed' : ''} ${i === totalSteps - 1 ? 'gift' : ''}`}
            >
              {i === totalSteps - 1 ? (
                <i className="fas fa-gift"></i>
              ) : (
                i < progress ? <i className="fas fa-check"></i> : i + 1
              )}
            </div>
          ))}
        </div>
      </div>

      {/* БЛОК 2: QR-код */}
      <div className="card-section qr-card">
        <div className="qr-wrapper">
          {user?.phone ? (
            <QRCodeSVG value={String(user.phone)} size={180} level={"H"} />
          ) : (
            <div className="loading-qr">Загрузка...</div>
          )}
        </div>
        <div className="qr-instruction">
          <h3>Ваш QR-код</h3>
          <p>Покажите его на кассе</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;