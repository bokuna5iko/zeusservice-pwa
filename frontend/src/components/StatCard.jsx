import React from 'react';

const StatCard = ({ title, value, percent, desc, icon, colorClass }) => {
  const isPositive = percent >= 0;
  
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        <div className={`stat-icon-circle ${colorClass}`}>
          <i className={`fas ${icon}`}></i>
        </div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-footer">
        <span className={isPositive ? 'positive' : 'negative'}>
          {isPositive ? `↑ ${percent}%` : `↓ ${percent}%`}
        </span>
        <span style={{color: '#94a3b8'}}>{desc}</span>
      </div>
    </div>
  );
};

export default StatCard;