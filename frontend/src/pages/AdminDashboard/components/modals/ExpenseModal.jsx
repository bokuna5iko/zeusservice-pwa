// src/pages/AdminDashboard/components/modals/ExpenseModal.jsx
import React, { useState } from "react";

const ExpenseModal = ({ isOpen, onClose, onSave, loadingExpense }) => {
  const [expenseAmount, setAmount] = useState("");
  const [expenseComment, setComment] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!expenseAmount || !expenseComment) return;

    // Передаем данные наверх и функцию очистки полей в случае успеха
    onSave(Number(expenseAmount), expenseComment, () => {
      setAmount("");
      setComment("");
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
      <div
        className="modal-content content-group-box"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="modal-title">
          <i className="fas fa-wallet"></i> Учесть расход из кассы
        </h3>
        <form onSubmit={handleSubmit} className="arm-modal-form">
          <div className="arm-input-group">
            <label>Сумма трат (₽)</label>
            <input
              type="number"
              placeholder="450"
              value={expenseAmount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loadingExpense}
              required
            />
          </div>
          <div className="arm-input-group">
            <label>Описание</label>
            <input
              type="text"
              placeholder="Закупка автошампуня"
              value={expenseComment}
              onChange={(e) => setComment(e.target.value)}
              disabled={loadingExpense}
              required
            />
          </div>
          <div className="modal-btn-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loadingExpense}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loadingExpense}
            >
              Зафиксировать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;
