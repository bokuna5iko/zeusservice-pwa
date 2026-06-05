# Архитектура проекта zeus-auto-app

Полная структура каталогов монорепозитория, включающая бэкенд, фронтенд и конфигурационные файлы инфраструктуры.

```text
zeus-auto-app/
├── backend/
│   ├── node_modules/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── ArchiveController.js
│   │   │   ├── authController.js
│   │   │   ├── serviceController.js
│   │   │   ├── StatisticsController.js
│   │   │   ├── userController.js
│   │   │   └── visitController.js
│   │   ├── middleware/
│   │   │   └── authMiddleware.js
│   │   └── routes/
│   │       ├── admin.js
│   │       ├── auth.js
│   │       ├── services.js
│   │       └── visits.js
│   ├── .env
│   ├── Dockerfile
│   ├── package-lock.json
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   ├── apiService.js
│   │   │   └── axios.js
│   │   ├── assets/
│   │   │   └── hero.png
│   │   ├── components/
│   │   │   ├── CalculatorModal├── 
│   │   │   ├── HistoryVisits├── 
│   │   │   ├── PointsGrid/
│   │   │   ├── PriceList/
│   │   │   ├── Navigation.jsx
│   │   │   └── StatCard.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── AdminHistory/
│   │   │   │   ├── AdminHistory.css
│   │   │   │   └── AdminHistory.jsx
│   │   │   ├── AdminHome/
│   │   │   │   ├── AdminHome.css
│   │   │   │   └── AdminHome.jsx
│   │   │   ├── AdminProfile/
│   │   │   │   ├── AdminProfile.css
│   │   │   │   └── AdminProfile.jsx
│   │   │   ├── AdminStatistics/
│   │   │   │   ├── AdminStatistics.css
│   │   │   │   └── AdminStatistics.jsx
│   │   │   ├── History/
│   │   │   │   ├── HistoryPage.css
│   │   │   │   └── HistoryPage.jsx
│   │   │   ├── Home/
│   │   │   │   ├── HomePage.css
│   │   │   │   └── HomePage.jsx
│   │   │   ├── Login/
│   │   │   │   ├── LoginPage.css
│   │   │   │   └── LoginPage.jsx
│   │   │   └── Profile/
│   │   │       ├── ProfilePages.css
│   │   │       └── ProfilePages.jsx
│   │   ├── styles/
│   │   │   ├── base.css
│   │   │   └── app.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   └── vite.config.js
└── nginx/
    └── ... (конфигурация веб-сервера / reverse-proxy)