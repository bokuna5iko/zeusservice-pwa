// src/pages/AdminDashboard/shared/modals/CancelVisitModal.jsx
import React, { useState, useEffect } from "react";

const CancelVisitModal = ({ isOpen, onClose, visit, onSave, loading }) => {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");

  // Сбрасываем поля при каждом открытии для нового визита
  useEffect(() => {
    if (isOpen) {
      setReason("Ошибка ввода / Тестовый заезд"); // значение по умолчанию
      setComment("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 🌟 ДОБАВЛЕНО ПО ТЗ: Валидация кнопки отправки
  // Кнопка заблокирована (disabled), если:
  // 1. Причина пустая или содержит меньше 5 символов
  // 2. Выбрано "Другое", но подробный комментарий пустой или содержит менее 5 символов
  const isOtherReason = reason === "Другое (указать в комменте)";
  const isInvalidReason = !reason || reason.trim().length < 5;
  const isInvalidCommentForOther =
    isOtherReason && (!comment || comment.trim().length < 5);

  const isButtonDisabled =
    loading || isInvalidReason || isInvalidCommentForOther;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isButtonDisabled) return;

    // Передаем причину и подробный комментарий в родительский метод onSubmit бэкенда
    onSave(reason, comment);
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-window content-group-box"
        style={{ maxWidth: "450px" }}
      >
        <div className="modal-header">
          <h3>
            <i className="fas fa-ban" style={{ color: "#ef4444" }}></i> Отмена
            заезда
          </h3>
          <button type="button" className="modal-close-x" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body-form">
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-muted)",
              marginBottom: "15px",
            }}
          >
            Вы собираетесь отменить визит автомобиля{" "}
            <strong>
              {visit?.manual_car_brand || visit?.car_brand || "Авто"}
            </strong>
            . Данное действие вычтет стоимость заезда из текущей смены.
          </p>

          <div className="form-field-group">
            <label>Причина отмены заезда *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="modal-input-field"
              style={{
                width: "100%",
                padding: "8px",
                background: "#0f172a",
                color: "#fff",
                border: "1px solid #334155",
                borderRadius: "6px",
              }}
            >
              <option value="Ошибка ввода / Тестовый заезд">
                Ошибка ввода / Тестовый заезд
              </option>
              <option value="Отказ клиента (очередь/время)">
                Отказ клиента (очередь/время)
              </option>
              <option value="Отказ клиента (цена)">Отказ клиента (цена)</option>
              <option value="Конфликтная ситуация">Конфликтная ситуация</option>
              <option value="Другое (указать в комменте)">
                Другое (указать в комменте)
              </option>
            </select>
          </div>

          <div className="form-field-group" style={{ marginTop: "15px" }}>
            <label>Подробный комментарий {isOtherReason ? "*" : ""}</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                isOtherReason
                  ? "Обязательно введите детали отмены (минимум 5 символов)..."
                  : "Введите детали отмены..."
              }
              rows="3"
              className="modal-input-field"
              required={isOtherReason} // Делаем поле HTML-required, если выбрано "Другое"
              style={{
                width: "100%",
                padding: "8px",
                background: "#0f172a",
                color: "#fff",
                border:
                  isOtherReason && isInvalidCommentForOther
                    ? "1px solid #ef4444"
                    : "1px solid #334155",
                borderRadius: "6px",
                resize: "none",
              }}
            />
            {isOtherReason && isInvalidCommentForOther && (
              <span
                style={{
                  color: "#ef4444",
                  fontSize: "11px",
                  marginTop: "4px",
                  display: "block",
                }}
              >
                Для данной причины необходимо подробно расписать комментарий (от
                5 символов)
              </span>
            )}
          </div>

          <div
            className="modal-footer-actions"
            style={{
              marginTop: "20px",
              display: "flex",
              gap: "10px",
              justifyContent:
                "flex-end" /* 🌟 ИСПРАВЛЕНО: Было justify-content через дефис */,
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn-danger"
              style={{
                background: isButtonDisabled ? "#334155" : "#ef4444",
                color: isButtonDisabled ? "#64748b" : "#fff",
                cursor: isButtonDisabled ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
              disabled={isButtonDisabled}
            >
              {loading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                "Зафиксировать отказ"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelVisitModal;
