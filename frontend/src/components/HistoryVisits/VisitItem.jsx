// src/components/History/VisitItem.jsx
import React, { useState } from 'react';
import './VisitItem.css';

const VisitItem = ({ visit }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Форматирование даты: 15.05 - 23:25
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month} - ${hours}:${minutes}`;
  };

  // Логика расчета скидки (на основе того, что мы обсуждали: 4-й - 20%, 8-й - 100%)
  const calculateDiscountedPrice = (price, visitNum) => {
    if (visitNum === 8) return 0;
    if (visitNum === 4) return price * 0.8;
    return price;
  };

  const discountedPrice = calculateDiscountedPrice(visit.base_price, visit.visit_number);

  return (
    <div className={`visit-card ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
      {/* 1. УПРОЩЁННАЯ ФОРМА */}
      <div className="visit-header">
        <span className="visit-date">{formatDate(visit.created_at)}</span>
        <span className="visit-service">{visit.service_name}</span>
        <span className="visit-price-simple">{discountedPrice} ₽</span>
        <i className={`fas fa-chevron-down arrow ${isOpen ? 'rotate' : ''}`}></i>
      </div>

      {/* 2. РАСШИРЕННАЯ ФОРМА */}
      <div className="visit-details">
        <div className="details-content">
          <div className="detail-row">
            <span className="detail-label">Стоимость:</span>
            <span className="detail-value">
              {visit.visit_number === 4 || visit.visit_number === 8 ? (
                <>
                  <span className="old-price">{visit.base_price} ₽</span> 
                  <span className="new-price"> {discountedPrice} ₽ </span>
                  <span className="discount-tag">
                    ({visit.visit_number === 8 ? '100%' : '20%'})
                  </span>
                </>
              ) : (
                `${visit.base_price} ₽`
              )}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Визит:</span>
            <span className="detail-value">{visit.visit_number} из 8</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Автомобиль:</span>
            <span className="detail-value">{visit.car_name || 'Не указан'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitItem;