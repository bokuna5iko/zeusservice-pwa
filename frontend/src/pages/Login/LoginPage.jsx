// src/pages/Login/LoginPage.jsx
import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import "./LoginPage.css";

// 🌟 Вспомогательная функция форматирования строки в маску +7 (XXX) XXX-XX-XX
const formatDigits = (digits) => {
  if (digits.length <= 1) return "+7 (";

  let res = "+7 (";
  res += digits.substring(1, 4);
  if (digits.length > 4) res += ") " + digits.substring(4, 7);
  if (digits.length > 7) res += "-" + digits.substring(7, 9);
  if (digits.length > 9) res += "-" + digits.substring(9, 11);

  return res;
};

const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false); // false = Вход, true = Регистрация
  const [phone, setPhone] = useState("+7 ("); // Стартовое состояние с маской
  const [name, setName] = useState("");
  const [shakeInput, setShakeInput] = useState(false); // Стейт для триггера анимации ошибки Shake

  const { login, register, loading, error } = useContext(AuthContext);

  // Извлечение чистых цифр из маски для валидации и отправки на бэк
  const getRawDigits = (formattedStr) => {
    return formattedStr.replace(/\D/g, "");
  };

  // Метод запуска анимации покачивания инпута при ошибке
  const triggerErrorAnimation = () => {
    setShakeInput(true);
    setTimeout(() => {
      setShakeInput(false);
    }, 500); // Сбрасываем через полсекунды
  };

  // 1. Обработка ввода (Фильтр символов, маска, ограничение длины)
  const handlePhoneChange = (e) => {
    const input = e.target.value;
    let digits = input.replace(/\D/g, ""); // Жесткий символьный фильтр (только цифры)

    // Гарантируем, что строка всегда начинается строго с семерки
    if (digits.length === 0 || !digits.startsWith("7")) {
      digits = "7" + digits.replace(/^8/, ""); // Если стерли или ввели 8 — подменяем на 7
    }

    // Ограничение длины: строго 11 цифр
    digits = digits.slice(0, 11);

    setPhone(formatDigits(digits));
  };

  // 2. Блокировка удаления префикса +7 через Backspace
  const handleKeyDown = (e) => {
    if (e.key === "Backspace" && e.target.selectionStart <= 4) {
      e.preventDefault();
    }
  };

  // 3. Запрет перемещения курсора левее префикса +7 при клике или фокусе
  const handleCursorConstraint = (e) => {
    if (e.target.selectionStart < 4) {
      e.target.setSelectionRange(phone.length, phone.length);
    }
  };

  // 4. Триггер ошибки при потере фокуса (Incomplete Blur)
  const handleBlur = () => {
    const rawLen = getRawDigits(phone).length;
    if (rawLen > 1 && rawLen < 11) {
      triggerErrorAnimation();
    }
  };

  // 5. Умная обработка вставки из буфера обмена (Paste)
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    let cleaned = pastedData.replace(/\D/g, ""); // Чистим от скобок, пробелов и тире

    if (cleaned.startsWith("8")) {
      cleaned = "7" + cleaned.substring(1);
    } else if (!cleaned.startsWith("7")) {
      cleaned = "7" + cleaned;
    }

    cleaned = cleaned.slice(0, 11);
    setPhone(formatDigits(cleaned));
  };

  // Кнопка-крестик полной очистки
  const handleClearInput = () => {
    setPhone("+7 (");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const rawPhone = getRawDigits(phone);

    // Валидация перед отправкой
    if (rawPhone.length < 11) {
      triggerErrorAnimation();
      return;
    }

    if (isRegister) {
      if (register) {
        register({ name, phone: rawPhone });
      } else {
        console.log("Отправка регистрации:", { name, phone: rawPhone });
      }
    } else {
      login({ phone: rawPhone }); // Отправляем чистые 11 цифр на сервер
    }
  };

  const isPhoneComplete = getRawDigits(phone).length === 11;
  // Кнопка активна только когда телефон заполнен полностью (+ имя в случае регистрации)
  const isFormValid = isRegister
    ? isPhoneComplete && name.trim().length > 0
    : isPhoneComplete;

  return (
    <div className="login-page">
      <div className="page-center-container">
        <div className="login-card content-group-box">
          <div className="fill-zone">
            <h1 className="login-logo">
              ZEUS <span>AUTO</span>
            </h1>

            <div className="auth-toggle-tabs">
              <button
                type="button"
                className={`toggle-tab ${!isRegister ? "active" : ""}`}
                onClick={() => setIsRegister(false)}
                disabled={loading}
              >
                Вход
              </button>
              <button
                type="button"
                className={`toggle-tab ${isRegister ? "active" : ""}`}
                onClick={() => setIsRegister(true)}
                disabled={loading}
              >
                Регистрация
              </button>
            </div>

            <p className="login-subtitle">
              {isRegister
                ? "Заполните данные для создания аккаунта"
                : "Введите номер телефона для входа"}
            </p>

            {error && <div className="login-error-msg">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
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

              {/* Поле телефона с тройной UX-защитой и анимацией shake-error */}
              <div
                className={`input-wrapper ${shakeInput ? "shake-error" : ""}`}
              >
                <i className="fas fa-phone"></i>
                <input
                  type="tel"
                  inputMode="tel" // Жесткий вызов исключительно цифровой клавиатуры на iOS/Android
                  value={phone}
                  onChange={handlePhoneChange}
                  onKeyDown={handleKeyDown}
                  onClick={handleCursorConstraint}
                  onFocus={handleCursorConstraint}
                  onBlur={handleBlur}
                  onPaste={handlePaste}
                  disabled={loading}
                  required
                />

                {/* Иконка-крестик очистки инпута (появляется, когда ввели что-то кроме +7) */}
                {getRawDigits(phone).length > 1 && (
                  <button
                    type="button"
                    className="clear-input-cross"
                    onClick={handleClearInput}
                    disabled={loading}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="login-btn"
                disabled={!isFormValid || loading}
              >
                {loading
                  ? "Проверка..."
                  : isRegister
                    ? "Создать аккаунт"
                    : "Войти"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
