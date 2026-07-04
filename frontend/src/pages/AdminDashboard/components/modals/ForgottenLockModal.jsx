// src/pages/AdminDashboard/components/modals/ForgottenLockModal.jsx
import React from "react";

const ForgottenLockModal = ({ isOpen, shiftData, onTriggerClose }) => {
  if (!isOpen || !shiftData) return null;

  const formattedDate = new Date(shiftData.shift_date).toLocaleDateString(
    "ru-RU",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 9999, background: "rgba(2, 6, 23, 0.95)" }}
    >
      <div
        className="modal-content content-group-box"
        style={{
          maxWidth: "550px",
          textAlign: "center",
          border: "1px solid #ef4444",
        }}
      >
        <h2 style={{ color: "#ef4444", marginBottom: "16px" }}>
          <i className="fas fa-exclamation-triangle"></i> Внимание! Блокировка
          АРМ
        </h2>
        <p
          style={{
            color: "#94a3b8",
            fontSize: "15px",
            lineHeight: "1.6",
            marginBottom: "24px",
          }}
        >
          Обнаружена старая незакрытая смена за <strong>{formattedDate}</strong>
          . Персонал ушёл домой и забыл сдать кассу. Новый рабочий день не может
          быть начат, пока вы принудительно не закроете прошлую смену.
        </p>

        <div
          style={{
            background: "#0f172a",
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "24px",
            textAlign: "left",
            fontSize: "14px",
          }}
        >
          <div style={{ marginBottom: "8px" }}>
            ● <span style={{ color: "#94a3b8" }}>Дата старта:</span>{" "}
            {formattedDate}
          </div>
          <div>
            ● <span style={{ color: "#94a3b8" }}>Текущий статус кассы:</span>{" "}
            Заблокирована до сдачи отчета
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={onTriggerClose}
          style={{
            background: "#ef4444",
            width: "100%",
            padding: "14px",
            fontWeight: "700",
          }}
        >
          <i className="fas fa-power-off"></i> Сдать кассу за{" "}
          {new Date(shiftData.shift_date).toLocaleDateString("ru-RU")}
        </button>
      </div>
    </div>
  );
};

export default ForgottenLockModal;
