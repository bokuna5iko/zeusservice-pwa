// src/components/Shifts/FinancialTracker.jsx
import React from "react";
import "./FinancialTracker.css"; // 🌟 ИСПРАВЛЕНО: Подключаем изолированные стили фичи

const FinancialTracker = ({ earnings }) => {
  return (
    <div className="profile-card financial-tracker-box">
      <div className="fill-zone">
        <span className="finance-label">Заработок за текущую неделю</span>
        <h2 className="finance-amount-display">
          {earnings.toLocaleString("ru-RU")} ₽
        </h2>
        <p className="finance-period-hint">
          Расчетный период: Воскресенье — Суббота
        </p>
      </div>
    </div>
  );
};

export default FinancialTracker;
