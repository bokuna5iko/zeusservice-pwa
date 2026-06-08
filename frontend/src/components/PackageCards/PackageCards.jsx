// src/components/PackageCards/PackageCards.jsx
import React from "react";
import "./PackageCards.css";

const PackageCards = () => {
  return (
    <div className="package-container content-group-box">
      {/* 🌟 ДОБАВЛЕНО: Матовый защитный оверлей "В разработке" поверх всего блока */}
      <div className="package-overlay">
        <span className="overlay-badge">
          <i className="fas fa-tools"></i> В разработке
        </span>
      </div>

      {/* Шапка контейнера */}
      <div className="package-header">
        <h3 className="package-title">
          Выгодные пакеты <i className="fas fa-fire fire-icon"></i>
        </h3>
      </div>

      {/* Сетка карточек (🌟 ИСПРАВЛЕНО: Теперь выстраиваются в один ряд) */}
      <div className="package-grid">
        {/* Карточка 1 (Featured - ХИТ) */}
        <div className="package-card card-featured">
          <span className="card-badge">ХИТ</span>

          <div className="card-icon-wrapper">
            <i className="fas fa-car"></i>
          </div>

          <h4 className="card-title-text">10 моек</h4>
          <p className="card-description">2-х фазная</p>

          <div className="card-price-block">
            <span className="price-current">6 800 ₽</span>
            <span className="price-old">8 000 ₽</span>
          </div>
        </div>

        {/* Карточка 2 (Standard) */}
        <div className="package-card card-standard">
          <div className="card-icon-wrapper">
            <i className="fas fa-sparkles"></i>
          </div>

          <h4 className="card-title-text">Комплекс</h4>
          <p className="card-description">Коврики+днище</p>

          <div className="card-price-block">
            <span className="price-standard">1 500 ₽</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageCards;
