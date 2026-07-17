// src/pages/AdminDashboard/components/CashDashboard.jsx
//Сюда уходит вся разметка верхних финансовых карточек кассы и кнопка расхода
import React from "react";

const CashDashboard = ({ liveShiftData, onAddExpenseClick, shiftStatus }) => {
  const totalRevenue =
    liveShiftData.cash + liveShiftData.card - liveShiftData.expenses;

  return (
    <section className="cash-dashboard-row">
      <div className="cash-mini-card">
        <span className="card-label">Касса (Всего)</span>
        <span className="card-num color-cyan">{totalRevenue} ₽</span>
      </div>
      <div className="cash-mini-card">
        <span className="card-label">Наличные</span>
        <span className="card-num">{liveShiftData.cash} ₽</span>
      </div>
      <div className="cash-mini-card">
        <span className="card-label">Безналичные</span>
        <span className="card-num">{liveShiftData.card} ₽</span>
      </div>
      <div
        className="cash-mini-card"
        onClick={onAddExpenseClick}
        style={{ cursor: "pointer", transition: "transform 0.2s" }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
        title="Нажмите, чтобы посмотреть историю трат"
      >
        <span className="card-label">Расходы дня 🔍</span>
        <span className="card-num color-red">{liveShiftData.expenses} ₽</span>
      </div>

      <button
        className="dashboard-add-expense-btn"
        onClick={() => onAddExpenseClick(true)} // Триггер на открытие модалки добавления трат
        disabled={shiftStatus === "closed"}
        style={
          shiftStatus === "closed"
            ? { opacity: 0.4, cursor: "not-allowed" }
            : {}
        }
      >
        <i className="fas fa-minus-circle"></i> Добавить расход
      </button>
    </section>
  );
};

export default CashDashboard;
