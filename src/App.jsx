import { useState, useContext } from 'react'
import { AuthContext } from './context/AuthContext';
import './styles/base.css'
import './styles/layout.css'
import './styles/pages.css'
import './styles/components.css'

import Navigation from './components/Navigation'
import PointsGrid from './components/PointsGrid'
// Импортируем новые разделы
import History from './components/History'
import Profile from './components/Profile'
import Admin from './components/Admin'
import Login from './components/Login'

function App() {
  const { user, loading } = useContext(AuthContext);
  const [activePage, setActivePage] = useState('home');

  if (loading) return <div className="loader">Загрузка...</div>;

  // Если пользователя нет — показываем компонент Login
  if (!user) {
    return (
      <div className="app-container">
        <main className="content">
          <Login />
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">ZEUS <span>AUTO</span></div>
        <div className="user-info">Привет, {user.name || 'Клиент'}! 👋</div>
      </header>

      <main className="content">
        {activePage === 'home' && (
          <div className="page active">
            <section className="card">
               {/* Используем данные из контекста вместо userData */}
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
                <h3>Ваша лояльность</h3>
                <span className="badge">{user.visits_count || 0} / 8</span>
              </div>
              <PointsGrid visitsCount={user.visits_count || 0} />
            </section>
            
            <section className="card qr-section">
              <h3>Ваш QR-код</h3>
              <div className="qr-placeholder"><div className="qr-mock"></div></div>
              <p className="user-id">ID: {user.id}</p>
            </section>
          </div>
        )}

        {activePage === 'history' && <History />}
        {activePage === 'profile' && <Profile />}
        {activePage === 'admin' && <Admin />}
      </main>

      <Navigation activePage={activePage} setActivePage={setActivePage} />
    </div>
  );
}

export default App