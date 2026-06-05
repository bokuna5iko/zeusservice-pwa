// src/App.jsx
import React, { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import Navigation from "./components/Navigation";
import LoginPage from "./pages/Login/LoginPage";

// Твои страницы пользователей
import HomePage from "./pages/Home/HomePage.jsx";
import HistoryPage from "./pages/History/HistoryPage.jsx";
import ProfilePage from "./pages/Profile/ProfilePages.jsx";

// Твои страницы администратора
import AdminHome from "./pages/AdminHome/AdminHome.jsx";
import AdminHistory from "./pages/AdminHistory/AdminHistory.jsx";
import AdminProfile from "./pages/AdminProfile/AdminProfile.jsx";
import AdminStatistics from "./pages/AdminStatistics/AdminStatistics.jsx";

// 🌟 ИСПРАВЛЕНО: Импортируем ОБЕ страницы смен
import WorkerShiftsPage from "./pages/WorkerShifts/WorkerShiftsPage.jsx";
import AdminShiftsPage from "./pages/AdminShifts/AdminShiftsPage.jsx";

function App() {
  const { user, activePage } = useContext(AuthContext);

  // Условие для неавторизованного пользователя
  if (!user) {
    return (
      <div className="app-shell">
        <main className="app-main">
          <LoginPage />
        </main>
      </div>
    );
  }

  // Условие для авторизованного пользователя
  return (
    <div className="app-shell">
      {/* Оболочка телефона */}
      <div className="app-main">
        <header className="app-header">
          <div className="header-content">
            <span className="app-logo">
              ZEUS <span>AUTO</span>
            </span>
          </div>
        </header>

        <main
          className="page-content"
          style={{
            flex: 1,
            overflowY: "auto", // Скролл разрешен ВСЕГДА
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

          {/* 🌟 ИСПРАВЛЕНО: Динамически переключаем экран Смен в зависимости от роли */}
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
