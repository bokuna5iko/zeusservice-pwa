// src/App.jsx
import React, { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Navigation from './components/Navigation';
import LoginPage from './pages/Login/LoginPage';

// Твои новые страницы
import HomePage from "./pages/Home/HomePage.jsx"; 
import HistoryPage from "./pages/History/HistoryPage.jsx";
import ProfilePage from "./pages/Profile/ProfilePages.jsx";
import AdminPage from "./pages/Admin/AdminPage.jsx";
import AdminHome from "./pages/AdminHome/AdminHome.jsx";
function App() {
  const { user, activePage } = useContext(AuthContext);

// 1. Условие для неавторизованного пользователя
  if (!user) {
    return (
      <div className="app-shell">
        <main className="app-main">
          <LoginPage />
        </main>
      </div>
    );
  }

// 2. Условие для авторизованного пользователя
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
          
          {activePage === 'history' && <HistoryPage />}
          {activePage === 'profile' && <ProfilePage />}
          {activePage === 'admin' && <AdminPage />}
        </main>

        <footer className="app-footer">
          <Navigation />
        </footer>

      </div>
    </div>
  );
}

export default App;