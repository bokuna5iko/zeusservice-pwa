// src/App.jsx
import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "./context/AuthContext";
import Navigation from "./components/Navigation";
import LoginPage from "./pages/Login/LoginPage";

// Хук сервис-воркера из плагина vite-plugin-pwa
import { useRegisterSW } from "virtual:pwa-register/react";

// Твои страницы пользователей
import HomePage from "./pages/Home/HomePage.jsx";
import HistoryPage from "./pages/History/HistoryPage.jsx";
import ProfilePage from "./pages/Profile/ProfilePages.jsx";

// Твои страницы администратора
import AdminHome from "./pages/AdminHome/AdminHome.jsx";
import AdminHistory from "./pages/AdminHistory/AdminHistory.jsx";
import AdminProfile from "./pages/AdminProfile/AdminProfile.jsx";
import AdminStatistics from "./pages/AdminStatistics/AdminStatistics.jsx";

// Страницы смен
import WorkerShiftsPage from "./pages/WorkerShifts/WorkerShiftsPage.jsx";
import AdminShiftsPage from "./pages/AdminShifts/AdminShiftsPage.jsx";

// Главный компонент десктопного пульта управления
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard.jsx";

// Импортируем блокировщик для форсированного сброса пароля
import ForceResetPasswordModal from "./components/modals/ForceResetPasswordModal";

// Импортируем менеджер онбординга PWA
import PwaOnboardingManager from "./components/PwaOnboardingManager/PwaOnboardingManager";

function App() {
  const { user, activePage, mustResetPassword } = useContext(AuthContext);

  // СМАРТ-ОБНОВЛЕНИЯ: Инициализируем хуки плагина PWA с автопроверкой каждые 10 секунд
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (r) {
        r.update();
        setInterval(() => {
          r.update();
        }, 10000);
      }
    },
  });

  // Локальные стейты для UX-сценариев
  const [showHintBanner, setShowHintBanner] = useState(false); // Выезжающая плашка
  const [isSpinning, setIsSpinning] = useState(false); // Бешеное вращение при клике

  // Стейт контроля адаптивности под ПК/Планшеты в реальном времени
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // 🌟 ДОБАВЛЕНО: Глобальная ловушка нативного события установки для Android/Chrome
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Блокируем нативное всплывающее окно браузера по умолчанию
      e.preventDefault();
      // Сохраняем событие в глобальный объект window, чтобы менеджер шторки мог вызвать .prompt()
      window.deferredPrompt = e;
      console.log(
        "✅ Событие beforeinstallprompt успешно перехвачено и сохранено.",
      );
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
  }, []);

  // Эффект отслеживания изменения ширины экрана
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Эффект отслеживания появления новой версии (UX-подсказка на 5 секунд)
  useEffect(() => {
    if (needRefresh) {
      setShowHintBanner(true);
      const timer = setTimeout(() => {
        setShowHintBanner(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [needRefresh]);

  // Логика нажатия на светящуюся кнопку
  const handlePwaUpdate = () => {
    if (!needRefresh || isSpinning) return;

    setIsSpinning(true);

    setTimeout(() => {
      updateServiceWorker(true);
    }, 600);
  };

  // Условие для неавторизованного пользователя
  if (!user) {
    return (
      <div className="app-shell">
        <main className="app-main" style={{ position: "relative" }}>
          <LoginPage
            needRefresh={needRefresh}
            showHintBanner={showHintBanner}
            setShowHintBanner={setShowHintBanner}
            isSpinning={isSpinning}
            handlePwaUpdate={handlePwaUpdate}
          />
        </main>
      </div>
    );
  }

  // 🌟 ИСПРАВЛЕНО ДЛЯ ТЕСТИРОВАНИЯ АУДИТА: Разрешаем десктопный запуск пульта и для admin, и для owner!
  if ((user.role === "admin" || user.role === "owner") && windowWidth >= 1024) {
    return (
      <>
        <ForceResetPasswordModal />
        <AdminDashboard
          needRefresh={needRefresh}
          showHintBanner={showHintBanner}
          isSpinning={isSpinning}
          handlePwaUpdate={handlePwaUpdate}
        />
      </>
    );
  }

  // Условие для стандартного мобильного PWA (Экран < 1024px или для клиентов)
  return (
    <div className="app-shell">
      <ForceResetPasswordModal />

      {/* 🌟 ГЛОБАЛЬНЫЙ МЕНЕДЖЕР УСТАНОВКИ PWA (Абсолютный верхний слой) */}
      <PwaOnboardingManager />

      {/* Оболочка телефона */}
      <div className="app-main" style={{ position: "relative" }}>
        {/* ВСПЛЫВАЮЩАЯ UX-ПОДСКАЗКА: Выезжает из-под шапки при фиксации новой версии */}
        <div
          className={`pwa-smart-hint-banner ${showHintBanner ? "slide-down" : ""}`}
        >
          <i className="fas fa-info-circle"></i>
          <span>Доступна новая версия. Пожалуйста, обновитесь!</span>
        </div>

        <header className="app-header">
          <div
            className="header-content"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <span className="app-logo">
              ZEUS <span>AUTO</span>
            </span>

            {/* ГЛОБАЛЬНЫЙ СМАРТ-ИНДИКАТОР ОБНОВЛЕНИЙ В ШАПКЕ */}
            <button
              className={`global-smart-update-btn ${needRefresh ? "update-available" : ""} ${isSpinning ? "rapid-spinning" : ""}`}
              disabled={!needRefresh || isSpinning}
              onClick={handlePwaUpdate}
              title={
                needRefresh
                  ? "Доступно свежее update-обновление!"
                  : "Приложение актуальной версии"
              }
            >
              <i className="fas fa-sync-alt"></i>
              {needRefresh && (
                <span className="notification-pulsing-dot"></span>
              )}
            </button>
          </div>
        </header>

        <main
          className="page-content"
          style={{
            flex: 1,
            overflowY: "auto",
          }}
        >
          {/* Динамически подменяем Главную страницу в зависимости от роли (admin или owner) */}
          {activePage === "home" &&
            (user.role === "admin" || user.role === "owner" ? (
              <AdminHome />
            ) : (
              <HomePage />
            ))}

          {/* Динамически подменяем Историю в зависимости от роли */}
          {activePage === "history" &&
            (user.role === "admin" || user.role === "owner" ? (
              <AdminHistory />
            ) : (
              <HistoryPage />
            ))}

          {/* Динамически подменяем Профиль в зависимости от роли */}
          {activePage === "profile" &&
            (user.role === "admin" || user.role === "owner" ? (
              <AdminProfile />
            ) : (
              <ProfilePage />
            ))}

          {/* ПОДКЛЮЧАЕМ ЭКРАН СТАТИСТИКИ АДМИНИСТРАТОРА И ВЛАДЕЛЬЦА */}
          {(activePage === "stats" || activePage === "admin") &&
            (user.role === "admin" || user.role === "owner") && (
              <AdminStatistics />
            )}

          {/* Динамически переключаем экран Смен в зависимости от роли */}
          {activePage === "shifts" &&
            (user.role === "admin" || user.role === "owner" ? (
              <AdminShiftsPage />
            ) : (
              <WorkerShiftsPage />
            ))}
        </main>

        <footer className="app-footer">
          <Navigation />
        </footer>
      </div>
    </div>
  );
}

export default App;
