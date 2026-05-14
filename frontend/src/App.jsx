import React, { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import LoginPage from './pages/Login/LoginPage';
import HomePage from './pages/Home/HomePage';
import HistoryPage from './pages/History/HistoryPage';
import ProfilePage from './pages/Profile/ProfilePage';
import AdminPage from './pages/Admin/AdminPage';
import Navigation from './components/Navigation';
import './App.css'; // Важно, чтобы здесь были правила центровки

function App() {
  const { user, loading, activePage } = useContext(AuthContext);

  const getPageComponent = React.useCallback(() => {
    if (user?.role === 'admin' && (activePage === 'home' || activePage === 'admin')) {
      return <AdminPage />;
    }
    switch (activePage) {
      case 'home': return <HomePage />;
      case 'history': return <HistoryPage />;
      case 'profile': return <ProfilePage />;
      default: return <HomePage />;
    }
  }, [activePage, user?.role]);

  if (loading) return (
    <div className="loading-screen">
      <div className="loader"></div>
      <p>Загрузка Zeus Auto...</p>
    </div>
  );

  // Страница логина остается на весь экран (как мы делали раньше)
  if (!user) return <LoginPage />;

  return (
    <div className="app-shell">
      {/* Шапка внутри 400px */}
      <header className="app-header">
        <div className="header-content">
          <span className="logo-text">ZEUS <span>AUTO</span></span>
          <div className="user-badge">
            <i className={`fas ${user.role === 'admin' ? 'fa-user-shield' : 'fa-circle-user'}`}></i>
          </div>
        </div>
      </header>

      {/* Контент внутри 400px */}
      <main className="app-main">
        <div className="page-wrapper" key={activePage}>
          {getPageComponent()}
        </div>
      </main>

      {/* Навигация привязана к низу этих же 400px */}
      <footer className="app-footer">
        <Navigation />
      </footer>
    </div>
  );
}

export default App;