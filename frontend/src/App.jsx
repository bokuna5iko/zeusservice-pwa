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
            <span className="app-logo">ZEUS <span>AUTO</span></span>
          </div>
        </header>

        <main className="page-content" style={{ flex: 1, overflowY: 'auto' }}>
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

          {/* 2. ПОДКЛЮЧАЕМ ЭКРАН СТАТИСТИКИ АДМИНИСТРАТОРА
            Проверяем оба id ('stats' или старый 'admin'), чтобы страница точно 
            открылась, смотря какое имя вкладки прописано у тебя в Navigation.jsx
          */}
          {(activePage === 'stats' || activePage === 'admin') && user.role === 'admin' && (
            <AdminStatistics />
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