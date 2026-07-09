// src/components/PwaOnboardingManager/PwaOnboardingManager.jsx
import React, { useState, useEffect } from "react";
import "./PwaOnboardingManager.css";

const PwaOnboardingManager = ({ forceOpenPlatform = null }) => {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState(null); // 'android' | 'ios' | null

  useEffect(() => {
    // 1. Проверяем режим отображения. Если уже запущено как PWA (standalone) — блокируем баннеры
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone;
    if (isStandalone && !forceOpenPlatform) return;

    // 2. Проверяем localStorage на защиту от раздражения (7 дней)
    const dismissedTime = localStorage.getItem("zeus_pwa_prompt_dismissed");
    if (dismissedTime && !forceOpenPlatform) {
      const diffDays =
        (Date.now() - Number(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (diffDays < 7) return;
    }

    // 3. Вычисляем платформу пользователя
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    let currentPlatform = null;
    if (isIOS) currentPlatform = "ios";
    else if (isAndroid) currentPlatform = "android";

    // Поддержка ручного вызова из вкладки "Профиль"
    if (forceOpenPlatform) {
      currentPlatform = forceOpenPlatform;
    }

    if (!currentPlatform) return; // Десктопы пропускаем

    setPlatform(currentPlatform);

    // 4. Запускаем умный таймер задержки показа
    const timer = setTimeout(
      () => {
        setVisible(true);
      },
      forceOpenPlatform ? 50 : 1500,
    );

    return () => clearTimeout(timer);
  }, [forceOpenPlatform]);

  const handleDismiss = () => {
    setVisible(false);
    if (!forceOpenPlatform) {
      localStorage.setItem("zeus_pwa_prompt_dismissed", Date.now().toString());
    }
  };

  const handleAndroidInstall = async () => {
    const promptEvent = window.deferredPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      console.log(`Результат установки Android PWA: ${outcome}`);
      window.deferredPrompt = null;
      setVisible(false);
    } else {
      alert(
        "Для установки нажмите на три точки (меню) в правом верхнем углу браузера и выберите «Добавить на гл. экран» или «Установить».",
      );
      handleDismiss();
    }
  };

  if (!platform || !visible) return null;

  return (
    // 🌟 ОВЕРЛЕЙ-ЗАДНИК: Заблюривает всё приложение принудительно
    <div
      className="pwa-onboarding-blur-overlay animate-fade-in"
      onClick={handleDismiss}
    >
      {/* 🤖 СЦЕНАРИЙ АНДРОИД: Центрированная карточка установки */}
      {platform === "android" && (
        <div
          className="pwa-center-modal animate-scale-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pwa-modal-neon-edge"></div>
          <div className="pwa-modal-body">
            <div className="pwa-app-icon-container">
              <i className="fas fa-layer-group text-cyan"></i>
            </div>
            <h3>Установка Zeus Auto</h3>
            <p>
              Карта лояльности будет открываться мгновенно даже без интернета, а
              приложение вовремя предупредит об акциях и очередях на мойке.
            </p>
            <button
              type="button"
              className="btn-pwa-install-android"
              onClick={handleAndroidInstall}
            >
              Установить на экран
            </button>
            <button
              type="button"
              className="btn-pwa-dismiss-text"
              onClick={handleDismiss}
            >
              Оставить в браузере
            </button>
          </div>
        </div>
      )}

      {/* 🍏 СЦЕНАРИЙ iOS: Плавающий Safari-баннер со стрелочкой к нижней панели */}
      {platform === "ios" && (
        <div className="pwa-ios-fullscreen-wrapper" onClick={handleDismiss}>
          <div
            className="pwa-ios-banner-fixed animate-slide-up-ios"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="pwa-ios-close-btn"
              onClick={handleDismiss}
            >
              &times;
            </button>
            <h3>Установка на iPhone / iPad</h3>
            <p className="pwa-ios-instruction">
              Добавьте приложение на экран «Домой» в 2 простых шага:
            </p>

            <div className="pwa-ios-steps">
              <div className="pwa-ios-step step-pulse">
                <div className="step-number-icon">1</div>
                <i className="fas fa-share-square"></i>
                <span>
                  Нажмите кнопку <strong>«Поделиться»</strong> на нижней панели
                  Safari.
                </span>
              </div>
              <div className="pwa-ios-step">
                <div className="step-number-icon">2</div>
                <i className="fas fa-plus-square"></i>
                <span>
                  Прокрутите меню и выберите <strong>«На экран "Домой"»</strong>
                  .
                </span>
              </div>
            </div>

            {/* Треугольный маркер-указатель, смотрящий строго вниз на кнопку Safari */}
            <div className="pwa-ios-pointer-arrow"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PwaOnboardingManager;
