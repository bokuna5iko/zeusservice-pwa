import React from "react";
import "./PersonalDataConsent.css";

const PersonalDataConsent = ({ checked, onChange, disabled, onOpenPolicy }) => {
  return (
    <label className={`pd-consent-label ${disabled ? "disabled" : ""}`}>
      <input
        type="checkbox"
        className="pd-consent-checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        required
      />
      <span className="pd-consent-text">
        Я даю согласие на обработку персональных данных и принимаю{" "}
        <button
          type="button"
          className="pd-consent-link"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenPolicy();
          }}
        >
          политику конфиденциальности
        </button>
      </span>
    </label>
  );
};

export default PersonalDataConsent;
