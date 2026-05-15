import React from 'react';
import './PointsGrid.css';

const PointsGrid = ({ visitCount }) => {
  const totalPoints = 8;
  
  return (
    <div className="points-grid">
      {[...Array(totalPoints)].map((_, index) => {
        const pointIndex = index + 1;
        const isActive = pointIndex <= visitCount;
        
        // Определяем типы ячеек
        const isDiscount = pointIndex === 4;
        const isFreeWash = pointIndex === 8;

        return (
          <div 
            key={pointIndex} 
            className={`point-item 
              ${isActive ? 'active' : ''} 
              ${isDiscount ? 'discount-step' : ''} 
              ${isFreeWash ? 'free-step' : ''}`
            }
          >
            <div className="point-content">
              {isDiscount && !isActive && <span>20%</span>}
              {isFreeWash && !isActive && <i className="fas fa-gift"></i>}
              {isActive && <i className="fas fa-check"></i>}
              {!isActive && !isDiscount && !isFreeWash && <span>{pointIndex}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PointsGrid;