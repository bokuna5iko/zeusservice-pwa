// src/pages/AdminDashboard/components/modals/ShiftReportModal.jsx
import React from "react";
import { useShiftReport } from "../../hooks/useShiftReport";

const ShiftReportModal = ({ isOpen, shiftId, onClose, onArchiveSuccess }) => {
  // Подключаем наш изолированный хук логики отчета
  const {
    loadingReport,
    reportData,
    actualCash,
    setActualCash,
    submitting,
    handleSubmitShift,
  } = useShiftReport(isOpen, shiftId, onArchiveSuccess, onClose);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div
        className="modal-content content-group-box"
        style={{ maxWidth: "500px" }}
      >
        <h3 className="modal-title" style={{ color: "#38bdf8" }}>
          <i className="fas fa-file-invoice-dollar"></i> Финансовый отчет и
          закрытие дня
        </h3>

        {loadingReport ? (
          <p
            style={{ textAlign: "center", color: "#64748b", padding: "20px 0" }}
          >
            <i className="fas fa-spinner fa-spin"></i> Сбор операционных данных
            из БД...
          </p>
        ) : reportData ? (
          <form onSubmit={handleSubmitShift} className="arm-modal-form">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginBottom: "20px",
                background: "#020617",
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid #1e293b",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Помыто машин:</span>
                <span style={{ fontWeight: "700" }}>
                  {reportData.carsCount} шт.
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Расчетный нал (Касса):</span>
                <span style={{ fontWeight: "700", color: "#4ade80" }}>
                  {reportData.cashCalculated} ₽
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>
                  Расчетный безнал (СБП/Карты):
                </span>
                <span style={{ fontWeight: "700", color: "#38bdf8" }}>
                  {reportData.cardCalculated} ₽
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: "1px solid #1e293b",
                  paddingTop: "8px",
                }}
              >
                <span style={{ color: "#64748b" }}>Операционные расходы:</span>
                <span style={{ fontWeight: "700", color: "#f87171" }}>
                  -{reportData.expensesTotal} ₽
                </span>
              </div>
            </div>

            <div className="arm-input-group">
              <label style={{ color: "#f8fafc", marginBottom: "4px" }}>
                Фактический нал в сейфе (Ручная сверка):
              </label>
              <input
                type="number"
                placeholder="Впишите сумму из кассового ящика"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                disabled={submitting}
                style={{
                  background: "#020617",
                  border: "1px solid #ef4444",
                  padding: "12px",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                required
              />
              <span
                style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}
              >
                Система автоматически посчитает разницу и выявит излишек или
                недостачу.
              </span>
            </div>

            <div className="modal-btn-row" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ background: "#22c55e", color: "#020617" }}
                disabled={submitting}
              >
                {submitting ? "Архивация..." : "Запереть кассу и уйти"}
              </button>
            </div>
          </form>
        ) : (
          <p style={{ color: "#f87171" }}>Не удалось сформировать отчет.</p>
        )}
      </div>
    </div>
  );
};

export default ShiftReportModal;
