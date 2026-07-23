import React from "react";
import { privacyPolicySections, PD_CONSENT_VERSION, POLICY_META } from "../../constants/privacyPolicy";
import "./PrivacyPolicyModal.css";

const PrivacyPolicyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="privacy-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="privacy-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="privacy-modal-title"
        aria-modal="true"
      >
        <header className="privacy-modal-header">
          <h2 id="privacy-modal-title">Политика конфиденциальности</h2>
          <button
            type="button"
            className="privacy-modal-close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <i className="fas fa-times"></i>
          </button>
        </header>

        <div className="privacy-modal-body">
          <p className="privacy-modal-meta">
            Версия: {PD_CONSENT_VERSION} · действует с {POLICY_META.effectiveDate}
          </p>
          {privacyPolicySections.map((section) => (
            <section key={section.title} className="privacy-section">
              <h3>{section.title}</h3>
              <p>{section.text}</p>
            </section>
          ))}
        </div>

        <footer className="privacy-modal-footer">
          <button type="button" className="privacy-modal-btn" onClick={onClose}>
            Закрыть
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
