import React, { StrictMode } from 'react'; // Добавили React для надежности
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';

// ИМПОРТ СТИЛЕЙ — это критически важно здесь!
// Если их нет в App.jsx, они должны быть здесь
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/pages.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);