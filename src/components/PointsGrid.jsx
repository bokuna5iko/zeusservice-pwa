import React from 'react';

const PointsGrid = ({ visitsCount = 3 }) => {
  const totalPoints = 8; // Всего 8 моек в цикле
  
  return (
    <div className="points-grid">
      {[...Array(totalPoints)].map((_, index) => {
        const step = index + 1;
        const isCompleted = step <= visitsCount;
        const isNext = step === visitsCount + 1;
        const isGift = step === 8;

        return (
          <div 
            key={step} 
            className={`point ${isCompleted ? 'active' : ''} ${isNext ? 'next-visit' : ''}`}
          >
            {isCompleted ? '✓' : (isGift ? '🎁' : step)}
          </div>
        );
      })}
    </div>
  );
};

export default PointsGrid;