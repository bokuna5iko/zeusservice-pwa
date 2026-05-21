import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext' // Импортируем провайдер
import './styles/base.css'

// 👇 Добавляем автоматическую регистрацию Service Worker от нашего плагина
import { registerSW } from 'virtual:pwa-register'
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider> {/* Оборачиваем здесь! */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
)