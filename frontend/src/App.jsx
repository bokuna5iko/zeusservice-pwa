import React, { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Navigation from './components/Navigation';
import LoginPage from './pages/Login/LoginPage';

// Твои страницы
import HomePage from "./pages/Home/HomePage.jsx"; 
import HistoryPage from "./pages/History/HistoryPage.jsx";
import ProfilePage from "./pages/Profile/ProfilePages.jsx";
import AdminProfile from "./pages/AdminProfile/AdminProfile.jsx";
import AdminHome from "./pages/AdminHome/AdminHome.jsx";
import AdminHistory from "./pages/AdminHistory/AdminHistory.jsx";
import EmployShifts from "./pages/EmployShifrts/EmployShifts.jsx";

// 1. Импортируем новую страницу статистики
import AdminStatistics from "./pages/AdminStatistics/AdminStatistics.jsx";

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
            {/* css */}
            <span className="app-logo">ZEUS <span>AUTO</span></span>
          </div>
        </header>

        <main 
          className={`page-content ${(activePage === 'home' && user.role !== 'admin') || activePage === 'profile' ? 'no-scroll' : ''}`} 
          style={{ 
            flex: 1, 
            overflowY: (activePage === 'home' && user.role !== 'admin') || activePage === 'profile' ? 'hidden' : 'auto' 
          }}
         >
          {/* Динамически подменяем Главную страницу в зависимости от роли */}
          {activePage === 'home' && (
            user.role === 'admin' ? <AdminHome /> : <HomePage />
          )}
  
          {/* Динамически подменяем Историю в зависимости от роли */}
          {activePage === 'history' && (
            user.role === 'admin' ? <AdminHistory /> : <HistoryPage />
          )}

          {/* Динамически подменяем Профиль в зависимости от роли */}
          {activePage === 'profile' && (
            user.role === 'admin' ? <AdminProfile /> : <ProfilePage />
          )}

          {/* 2. ПОДКЛЮЧАЕМ ЭКРАН СТАТИСТИКИ АДМИНИСТРАТОРА */}
          {(activePage === 'stats' || activePage === 'admin') && user.role === 'admin' && (
            <AdminStatistics />
          )}

          {/* 🌟 3. ПОДКЛЮЧАЕМ ЭКРАН СМЕН ДЛЯ РАБОТНИКА
              Проверяем, что выбрана страница 'shifts' и у пользователя роль 'worker' */}
          {activePage === 'shifts' && user.role === 'worker' && (
            <EmployShifts />
          )}
        </main>

        <footer className="app-footer">
          <Navigation />
        </footer>

      </div>
    </div>
  );
}

export default App;