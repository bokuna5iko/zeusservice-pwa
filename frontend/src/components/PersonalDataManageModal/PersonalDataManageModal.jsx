import React, { useState } from "react";
import "./PersonalDataManageModal.css";

const PersonalDataManageModal = ({
  isOpen,
  onClose,
  pdConsentAt,
  onWithdrawAndDelete,
  loading,
}) => {
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const consentDate = pdConsentAt
    ? new Date(pdConsentAt).toLocaleString("ru-RU")
    : null;

  const handleClose = () => {
    setConfirmed(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirmed) return;
    await onWithdrawAndDelete();
    setConfirmed(false);
  };

  return (
    <div className="pd-manage-overlay" onClick={handleClose} role="presentation">
      <div
        className="pd-manage-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="pd-manage-header">
          <h2>Мои персональные данные</h2>
          <button
            type="button"
            className="pd-manage-close"
            onClick={handleClose}
            aria-label="Закрыть"
          >
            <i className="fas fa-times"></i>
          </button>
        </header>

        <div className="pd-manage-body">
          <p className="pd-manage-meta">
            Согласие на обработку персональных данных дано:{" "}
            <strong>
              {consentDate || "не зафиксировано"}
            </strong>
          </p>

          <section className="pd-manage-section">
            <h3>Отзыв согласия и удаление аккаунта</h3>
            <p>
              По 152-ФЗ вы можете отозвать согласие на обработку персональных
              данных. Программа лояльности работает только при вашем согласии,
              поэтому отзыв означает удаление аккаунта.
            </p>
            <p>
              После подтверждения мы удалим (обезличим) ваши персональные
              данные: имя, телефон, автомобиль. История визитов сохранится в
              обезличенном виде для бухгалтерского учёта автомойки.
            </p>
          </section>

          <form onSubmit={handleSubmit} className="pd-manage-form">
            <label className="pd-manage-confirm">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                disabled={loading}
              />
              <span>
                Я понимаю, что отзыв согласия приведёт к удалению аккаунта и
                выходу из приложения
              </span>
            </label>

            <button
              type="submit"
              className="pd-manage-delete-btn"
              disabled={!confirmed || loading}
            >
              {loading
                ? "Удаление..."
                : "Отозвать согласие и удалить аккаунт"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PersonalDataManageModal;
