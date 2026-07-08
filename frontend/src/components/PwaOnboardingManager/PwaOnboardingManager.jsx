// src/components/PwaOnboardingManager/PwaOnboardingManager.jsx
import React, { useState, useEffect } from "react";
import "./PwaOnboardingManager.css";

const PwaOnboardingManager = ({ forceOpenPlatform = null }) => {
  const [visible, setVisbile] = useState(false);
  const [platform, setPlatform] = useState(null); // 'android' | 'ios' | null

  useEffect(() => {
    // 1. Проверяем режим отображения. Если уже запущено как PWA (standalone) — полностью блокируем баннеры
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone;
    if (isStandalone && !forceOpenPlatform) return;

    // 2. Проверяем localStorage на защиту от раздражения (7 дней)
    const dismissedTime = localStorage.getItem("zeus_pwa_prompt_dismissed");
    if (dismissedTime && !forceOpenPlatform) {
      const diffDays =
        (Date.now() - Number(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (diffDays < 7) return; // Если прошло меньше 7 дней — не рендеримся
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

    // 4. Запускаем умный таймер задержки в 1.5 секунды перед плавным показом (Вариант Б ТЗ)
    const timer = setTimeout(
      () => {
        setVisbile(true);
      },
      forceOpenPlatform ? 50 : 1500,
    );

    return () => clearTimeout(timer);
  }, [forceOpenPlatform]);

  const handleDismiss = () => {
    setVisbile(false);
    // Фиксируем таймстамп закрытия на 7 дней
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
      setVisbile(false);
    } else {
      // Запасной сценарий, если браузер сжёг или ещё не сгенерировал нативный промпт
      alert(
        "Для установки нажмите на три точки (меню) в правом верхнем углу браузера и выберите «Добавить на гл. экран» или «Установить».",
      );
      handleDismiss();
    }
  };

  if (!platform || !visible) return null;

  return (
    <>
      {/* 🤖 СЦЕНАРИЙ АНДРОИД: Bottom Sheet (Выезжающая шторка) */}
      {platform === "android" && (
        <div className="pwa-android-sheet animate-slide-up">
          <div className="pwa-sheet-neon-edge"></div>
          <div className="pwa-sheet-body">
            <h3>Добавить Zeus Auto на экран "Домой"</h3>
            <p>
              Карта лояльности будет открываться мгновенно даже без интернета, а
              приложение вовремя предупредит об акциях и очередях.
            </p>
            <button
              type="button"
              className="btn-pwa-install-android"
              onClick={handleAndroidInstall}
            >
              Установить приложение
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

      {/* 🍏 СЦЕНАРИЙ iOS: Floating Safari-подсказка со стрелочкой вниз */}
      {platform === "ios" && (
        <div className="pwa-ios-banner animate-fade-in">
          <button
            type="button"
            className="pwa-ios-close-btn"
            onClick={handleDismiss}
          >
            &times;
          </button>
          <p className="pwa-ios-instruction">
            Установите приложение в 2 клика для мгновенного доступа к карте
          </p>

          {/* Минималистичный CSS-степпер "Живая иконка" (Пункт 4 ТЗ) */}
          <div className="pwa-ios-steps">
            <div className="pwa-ios-step step-pulse">
              <i className="fas fa-share-square"></i>
              <span>1. Нажмите «Поделиться»</span>
            </div>
            <div className="pwa-ios-step">
              <i className="fas fa-plus-square"></i>
              <span>2. Выберите «На экран Домой»</span>
            </div>
          </div>

          {/* Треугольный маркер-указатель, смотрящий строго вниз на кнопку Safari */}
          <div className="pwa-ios-pointer-arrow"></div>
        </div>
      )}
    </>
  );
};

export default PwaOnboardingManager;
