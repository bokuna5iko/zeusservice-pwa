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
function App() {
  const { user, activePage } = useContext(AuthContext);

  if (!user) {
    return (
      <div className="app-shell">
        <main className="app-main">
          <LoginPage />
        </main>
      </div>
    );
  }

  return (
  <div className="app-shell">
    {/* Оболочка телефона */}
    <div className="app-main"> 
      
      <header className="app-header">...</header>

      <div className="page-content" style={{ flex: 1, overflowY: 'auto' }}>
        {activePage === 'home' && <HomePage />}
        {activePage === 'history' && <HistoryPage />}
        {activePage === 'profile' && <ProfilePage />}
        {activePage === 'admin' && <AdminPage />}
      </div>

      <footer className="app-footer">
        <Navigation />
      </footer>

    </div>
  </div>
);
}

export default App;