import React from 'react';

const PointsGrid = ({ visitsCount }) => {
  // Создаем массив из 8 элементов (наша шкала лояльности)
  const points = Array.from({ length: 8 }, (_, i) => i + 1);

  return (
    <div className="points-grid">
      {points.map((point) => {
        // Если номер точки меньше или равен количеству визитов — она активна
        const isActive = point <= visitsCount;
        const isGift = point === 8; // 8-й визит — подарок

        return (
          <div key={point} className={`point-item ${isActive ? 'active' : ''}`}>
            <div className="point-icon">
              {isGift ? (
                <i className="fas fa-gift"></i>
              ) : (
                <i className={`fas ${isActive ? 'fa-check' : 'fa-car'}`}></i>
              )}
            </div>
            <span className="point-number">{point}</span>
          </div>
        );
      })}
    </div>
  );
};

export default PointsGrid;