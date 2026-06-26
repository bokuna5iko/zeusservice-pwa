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

// 🌟 ДОБАВЛЕНО: Импортируем новый главный компонент десктопного пульта управления
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard.jsx";

function App() {
  const { user, activePage } = useContext(AuthContext);

  // 🌟 СМАРТ-ОБНОВЛЕНИЯ: Инициализируем хуки плагина PWA с автопроверкой каждые 10 секунд
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

  // 🌟 ДОБАВЛЕНО: Стейт контроля адаптивности под ПК/Планшеты в реальном времени
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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

    setIsSpinning(true); // Включаем непрерывное быстрое вращение иконки

    // Небольшая задержка перед перезагрузкой для сочного визуального отклика
    setTimeout(() => {
      updateServiceWorker(true); // Очистка старого кэша и жесткий перезапуск страницы воркером
    }, 600);
  };

  // Условие для неавторизованного пользователя
  if (!user) {
    return (
      <div className="app-shell">
        <main className="app-main" style={{ position: "relative" }}>
          {/* 🌟 ПЕРЕДАЕМ СМАРТ-ОБНОВЛЕНИЯ ВНУТРЬ СТРАНИЦЫ ЛОГИНА */}
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

  // 🌟 ДОБАВЛЕНО: Условие умного десктопного роутинга (БЛОК 2 ТЗ)
  // Если авторизован админ и ширина экрана >= 1024px — монтируем пульт управления и пропсы обновлений
  if (user.role === "admin" && windowWidth >= 1024) {
    return (
      <AdminDashboard
        needRefresh={needRefresh}
        showHintBanner={showHintBanner}
        isSpinning={isSpinning}
        handlePwaUpdate={handlePwaUpdate}
      />
    );
  }

  // Условие для стандартного мобильного PWA (Экран < 1024px или для клиентов)
  return (
    <div className="app-shell">
      {/* Оболочка телефона */}
      <div className="app-main" style={{ position: "relative" }}>
        {/* 🌟 ВСПЛЫВАЮЩАЯ UX-ПОДСКАЗКА: Выезжает из-под шапки при фиксации новой версии */}
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

            {/* 🌟 ГЛОБАЛЬНЫЙ СМАРТ-ИНДИКАТОР ОБНОВЛЕНИЙ В ШАПКЕ */}
            <button
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
              {/* Пульсирующая оранжево-красная точка в углу кнопки */}
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
          {/* Динамически подменяем Главную страницу в зависимости от роли */}
          {activePage === "home" &&
            (user.role === "admin" ? <AdminHome /> : <HomePage />)}

          {/* Динамически подменяем Историю в зависимости от роли */}
          {activePage === "history" &&
            (user.role === "admin" ? <AdminHistory /> : <HistoryPage />)}

          {/* Динамически подменяем Профиль в зависимости от роли */}
          {activePage === "profile" &&
            (user.role === "admin" ? <AdminProfile /> : <ProfilePage />)}

          {/* ПОДКЛЮЧАЕМ ЭКРАН СТАТИСТИКИ АДМИНИСТРАТОРА */}
          {(activePage === "stats" || activePage === "admin") &&
            user.role === "admin" && <AdminStatistics />}

          {/* Динамически переключаем экран Смен в зависимости от роли */}
          {activePage === "shifts" &&
            (user.role === "admin" ? (
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
