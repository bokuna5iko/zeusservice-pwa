// src/pages/AdminDashboard/components/modals/ExpenseHistoryModal.jsx
import React from "react";

const ExpenseHistoryModal = ({
  isOpen,
  onClose,
  expensesList,
  loadingExpensesList,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content content-group-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "500px" }}
      >
        <h3 className="modal-title">
          <i className="fas fa-list-alt"></i> История расходов за смену
        </h3>

        <div
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            marginBottom: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {loadingExpensesList ? (
            <p style={{ textAlign: "center", color: "#64748b" }}>
              <i className="fas fa-spinner fa-spin"></i> Загрузка...
            </p>
          ) : expensesList.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "#64748b",
                padding: "20px 0",
              }}
            >
              Трат за текущую смену еще не зафиксировано.
            </p>
          ) : (
            expensesList.map((exp) => (
              <div
                key={exp.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  background: "#020617",
                  borderRadius: "8px",
                  border: "1px solid #1e293b",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <span style={{ fontWeight: "600", color: "#f8fafc" }}>
                    {exp.description}
                  </span>
                  <span style={{ fontSize: "11px", color: "#475569" }}>
                    {new Date(exp.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <span
                  style={{
                    color: "#f87171",
                    fontWeight: "700",
                    fontSize: "1.05rem",
                  }}
                >
                  -{exp.amount} ₽
                </span>
              </div>
            ))
          )}
        </div>

        <div className="modal-btn-row">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Закрыть окно
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseHistoryModal;
