// src/pages/Login/LoginPage.jsx
import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import PersonalDataConsent from "../../components/PersonalDataConsent/PersonalDataConsent";
import PrivacyPolicyModal from "../../components/PrivacyPolicyModal/PrivacyPolicyModal";
import "./LoginPage.css";

const RESEND_COOLDOWN_SEC = 60;

const LoginPage = ({
  needRefresh,
  showHintBanner,
  setShowHintBanner,
  isSpinning,
  handlePwaUpdate,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [authMethod, setAuthMethod] = useState("login");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [phoneStep, setPhoneStep] = useState("phone");
  const [smsCode, setSmsCode] = useState("");
  const [devMode, setDevMode] = useState(false);
  const [resendSec, setResendSec] = useState(0);
  const [pdConsent, setPdConsent] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const { login, register, sendSmsCode, verifySmsCode, loading, error } =
    useContext(AuthContext);

  useEffect(() => {
    if (resendSec <= 0) return;
    const timer = setInterval(() => {
      setResendSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSec]);

  const resetPhoneFlow = () => {
    setPhoneStep("phone");
    setSmsCode("");
    setDevMode(false);
    setResendSec(0);
  };

  const switchAuthMethod = (method) => {
    setAuthMethod(method);
    resetPhoneFlow();
  };

  const switchRegisterMode = (registerMode) => {
    setIsRegister(registerMode);
    setPdConsent(false);
    resetPhoneFlow();
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (isRegister) {
      register({
        name,
        username,
        password,
        phone: phone.trim() || null,
        personalDataConsent: pdConsent,
      });
    } else {
      login({ username, password });
    }
  };

  const handleSendSms = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    if (isRegister && name.trim().length < 2) return;

    if (isRegister && !pdConsent) return;

    try {
      const data = await sendSmsCode(
        phone.trim(),
        isRegister ? "register" : "login",
        isRegister ? pdConsent : false,
      );
      setPhoneStep("code");
      setDevMode(Boolean(data.devMode));
      setResendSec(RESEND_COOLDOWN_SEC);
    } catch (err) {
      if (err.response?.data?.code === "USER_NOT_FOUND") {
        switchRegisterMode(true);
      }
      if (err.response?.data?.code === "PHONE_ALREADY_REGISTERED") {
        switchRegisterMode(false);
      }
    }
  };

  const handleVerifySms = async (e) => {
    e.preventDefault();
    if (smsCode.length !== 6) return;

    try {
      await verifySmsCode({
        phone: phone.trim(),
        code: smsCode,
        name: isRegister ? name.trim() : undefined,
        mode: isRegister ? "register" : "login",
        personalDataConsent: isRegister ? pdConsent : false,
      });
    } catch (err) {
      if (err.response?.data?.code === "USER_NOT_FOUND") {
        switchRegisterMode(true);
        resetPhoneFlow();
      }
      if (err.response?.data?.code === "PHONE_ALREADY_REGISTERED") {
        switchRegisterMode(false);
        resetPhoneFlow();
      }
    }
  };

  const isPasswordFormValid = isRegister
    ? name.trim().length > 0 &&
      username.trim().length > 0 &&
      password.length >= 4 &&
      pdConsent
    : username.trim().length > 0 && password.length > 0;

  const isPhoneSendValid =
    phone.trim().length >= 10 &&
    (!isRegister || (name.trim().length >= 2 && pdConsent));

  const isSmsCodeValid = smsCode.length === 6;

  return (
    <div
      className="login-page-wrapper"
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      <div
        className={`pwa-smart-hint-banner ${showHintBanner ? "slide-down" : ""}`}
      >
        <i className="fas fa-info-circle"></i>
        <span>Доступна новая версия приложения. Обновитесь!</span>
      </div>

      <div className="login-pwa-anchor">
        <button
          type="button"
          className={`global-smart-update-btn ${needRefresh ? "update-available" : ""} ${isSpinning ? "rapid-spinning" : ""}`}
          disabled={!needRefresh || isSpinning}
          onClick={handlePwaUpdate}
          title={
            needRefresh
              ? "Доступно свежее обновление!"
              : "Приложение актуальной версии"
          }
        >
          <i className="fas fa-sync-alt"></i>
          {needRefresh && <span className="notification-pulsing-dot"></span>}
        </button>
      </div>

      <div className="login-card content-group-box">
        <div className="fill-zone">
          <h1 className="login-logo">
            ZEUS <span>AUTO</span>
          </h1>

          <div className="auth-toggle-tabs">
            <button
              type="button"
              className={`toggle-tab ${!isRegister ? "active" : ""}`}
              onClick={() => switchRegisterMode(false)}
              disabled={loading}
            >
              Вход
            </button>
            <button
              type="button"
              className={`toggle-tab ${isRegister ? "active" : ""}`}
              onClick={() => switchRegisterMode(true)}
              disabled={loading}
            >
              Регистрация
            </button>
          </div>

          <div className="method-toggle-container">
            <button
              type="button"
              className={`method-btn ${authMethod === "login" ? "selected" : ""}`}
              onClick={() => switchAuthMethod("login")}
            >
              <i className="fas fa-key"></i> По логину
            </button>
            <button
              type="button"
              className={`method-btn ${authMethod === "phone" ? "selected" : ""}`}
              onClick={() => switchAuthMethod("phone")}
            >
              <i className="fas fa-phone"></i> По телефону
            </button>
          </div>

          {error && <div className="login-error-msg">{error}</div>}

          {authMethod === "phone" ? (
            <div className="phone-auth-flow">
              {phoneStep === "phone" ? (
                <form onSubmit={handleSendSms} className="login-form">
                  <p className="login-subtitle">
                    {isRegister
                      ? "Регистрация по номеру телефона"
                      : "Вход по SMS-коду"}
                  </p>

                  {isRegister && (
                    <div className="input-wrapper">
                      <i className="fas fa-user"></i>
                      <input
                        type="text"
                        placeholder="Ваше имя"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                  )}

                  <div className="input-wrapper">
                    <i className="fas fa-phone"></i>
                    <input
                      type="tel"
                      placeholder="+7 (900) 123-45-67"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                      autoComplete="tel"
                      required
                    />
                  </div>

                  {isRegister && (
                    <PersonalDataConsent
                      checked={pdConsent}
                      onChange={setPdConsent}
                      disabled={loading}
                      onOpenPolicy={() => setIsPrivacyOpen(true)}
                    />
                  )}

                  <button
                    type="submit"
                    className="login-btn"
                    disabled={!isPhoneSendValid || loading}
                  >
                    {loading ? "Отправка..." : "Получить код"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifySms} className="login-form">
                  <p className="login-subtitle">
                    Код отправлен на {phone}
                  </p>

                  {devMode && (
                    <div className="sms-dev-hint">
                      <i className="fas fa-flask"></i>
                      Dev-режим: код в логе backend-сервера
                    </div>
                  )}

                  <div className="input-wrapper">
                    <i className="fas fa-shield-alt"></i>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="6-значный код"
                      value={smsCode}
                      onChange={(e) =>
                        setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      disabled={loading}
                      autoComplete="one-time-code"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="login-btn"
                    disabled={
                      !isSmsCodeValid ||
                      loading ||
                      (isRegister && !pdConsent)
                    }
                  >
                    {loading
                      ? "Проверка..."
                      : isRegister
                        ? "Зарегистрироваться"
                        : "Войти"}
                  </button>

                  <div className="sms-actions-row">
                    <button
                      type="button"
                      className="sms-link-btn"
                      onClick={resetPhoneFlow}
                      disabled={loading}
                    >
                      Изменить номер
                    </button>
                    <button
                      type="button"
                      className="sms-link-btn"
                      onClick={handleSendSms}
                      disabled={loading || resendSec > 0}
                    >
                      {resendSec > 0
                        ? `Повтор через ${resendSec}с`
                        : "Отправить снова"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="login-form">
              <p className="login-subtitle">
                {isRegister
                  ? "Заполните данные для создания аккаунта"
                  : "Введите учетные данные для доступа в систему"}
              </p>

              {isRegister && (
                <div className="input-wrapper">
                  <i className="fas fa-user"></i>
                  <input
                    type="text"
                    placeholder="Ваше имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              )}

              <div className="input-wrapper">
                <i className="fas fa-at"></i>
                <input
                  type="text"
                  placeholder="Логин (username)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="input-wrapper">
                <i className="fas fa-lock"></i>
                <input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
              </div>

              {isRegister && (
                <PersonalDataConsent
                  checked={pdConsent}
                  onChange={setPdConsent}
                  disabled={loading}
                  onOpenPolicy={() => setIsPrivacyOpen(true)}
                />
              )}

              <button
                type="submit"
                className="login-btn"
                disabled={!isPasswordFormValid || loading}
              >
                {loading
                  ? "Проверка..."
                  : isRegister
                    ? "Создать аккаунт"
                    : "Войти"}
              </button>
            </form>
          )}
        </div>
      </div>

      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </div>
  );
};

export default LoginPage;
