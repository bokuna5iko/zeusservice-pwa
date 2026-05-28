import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext' // Импортируем провайдер
import './styles/base.css'

// 🌟 ИСПРАВЛЕНО: Убрали ручной вызов registerSW, так как теперь 
// за регистрацию и отслеживание полностью отвечает хук useRegisterSW в Профиле!

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)