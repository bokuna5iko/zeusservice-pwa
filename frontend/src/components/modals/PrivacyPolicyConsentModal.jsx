import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { api } from "../../api/apiService";
import PersonalDataConsent from "../PersonalDataConsent/PersonalDataConsent";
import PrivacyPolicyModal from "../PrivacyPolicyModal/PrivacyPolicyModal";
import "./PrivacyPolicyConsentModal.css";

const PrivacyPolicyConsentModal = () => {
  const {
    user,
    mustAcceptPrivacyPolicy,
    mustResetPassword,
    setMustAcceptPrivacyPolicy,
    setUser,
    logout,
    currentPdConsentVersion,
  } = useContext(AuthContext);

  const [consentChecked, setConsentChecked] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!mustAcceptPrivacyPolicy || mustResetPassword || !user) return null;

  const previousVersion = user.pd_consent_version;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!consentChecked) {
      setError("Необходимо принять политику конфиденциальности");
      return;
    }

    setLoading(true);
    try {
      const response = await api.acceptPrivacyPolicy();
      setUser(response.data.user);
      setMustAcceptPrivacyPolicy(false);
      setConsentChecked(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Не удалось сохранить согласие. Попробуйте снова.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="privacy-consent-overlay">
        <div className="privacy-consent-card">
          <div className="privacy-consent-icon-box">
            <i className="fas fa-file-contract"></i>
          </div>

          <h2>Обновилась политика конфиденциальности</h2>
          <p className="privacy-consent-subtitle">
            {previousVersion ? (
              <>
                Вы ранее принимали версию <strong>{previousVersion}</strong>.
                Актуальная версия — <strong>{currentPdConsentVersion}</strong>.
              </>
            ) : (
              <>
                Для продолжения работы с приложением необходимо принять
                политику конфиденциальности версии{" "}
                <strong>{currentPdConsentVersion}</strong>.
              </>
            )}
          </p>

          <form onSubmit={handleSubmit} className="privacy-consent-form">
            {error && (
              <div className="privacy-consent-error">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}

            <PersonalDataConsent
              checked={consentChecked}
              onChange={setConsentChecked}
              disabled={loading}
              onOpenPolicy={() => setShowPolicy(true)}
            />

            <button
              type="submit"
              className="btn-privacy-consent-submit"
              disabled={!consentChecked || loading}
            >
              {loading ? "Сохранение..." : "Принять и продолжить"}
            </button>

            <button
              type="button"
              className="btn-privacy-consent-logout"
              onClick={logout}
              disabled={loading}
            >
              Выйти из аккаунта
            </button>
          </form>
        </div>
      </div>

      <PrivacyPolicyModal
        isOpen={showPolicy}
        onClose={() => setShowPolicy(false)}
      />
    </>
  );
};

export default PrivacyPolicyConsentModal;
