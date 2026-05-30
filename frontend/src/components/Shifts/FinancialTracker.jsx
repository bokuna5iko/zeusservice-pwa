// src/components/Shifts/FinancialTracker.jsx
import React from "react";

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

      <style jsx="true">{`
        .financial-tracker-box {
          background: linear-gradient(
            135deg,
            #0f172a 0%,
            #1e1b4b 100%
          ) !important;
          border-color: #312e81 !important;
        }
        .finance-label {
          font-size: 0.8rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        .finance-amount-display {
          margin: 6px 0;
          font-size: 1.8rem;
          font-weight: 800;
          color: #10b981;
          text-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
        }
        .finance-period-hint {
          margin: 0;
          font-size: 0.75rem;
          color: #64748b;
        }
      `}</style>
    </div>
  );
};

export default FinancialTracker;
