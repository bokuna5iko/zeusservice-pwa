markdown
# Zeus Auto PWA

Приложение лояльности для автомойки. Состоит из двух частей:
- **frontend/** – статический PWA (интерфейс пользователя)
- **backend/** – Express API + PostgreSQL (авторизация, визиты)

## 🚀 Быстрый старт (локальная разработка)

### Требования
- Node.js (рекомендуется v20 LTS)
- PostgreSQL (v15 или выше)
- Git

### 1. Клонирование
```bash
git clone https://github.com/bokuna5iko/zeusservice-pwa.git
cd zeusservice-pwa
git checkout backend-integration
```
#### 2. Настройка базы данных

Убедись, что PostgreSQL запущен. Затем войди в psql под суперпользователем (обычно твой системный пользователь macOS) и выполни:

```sql
CREATE USER zeus_user WITH PASSWORD 'твой_пароль';
CREATE DATABASE zeus_auto_db OWNER zeus_user;
GRANT ALL PRIVILEGES ON DATABASE zeus_auto_db TO zeus_user;
\c zeus_auto_db
GRANT ALL ON SCHEMA public TO zeus_user;
-- Создание таблиц
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user',
    total_visits INTEGER DEFAULT 0,
    last_visit TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL
);
```
### 3. Настройка бэкенда

Перейди в папку backend:

``` bash
cd backend
```
Создай файл .env со следующим содержимым:

```text
DATABASE_URL=postgresql://zeus_user:твой_пароль@localhost:5432/zeus_auto_db
JWT_SECRET=очень_секретная_фраза_не_менее_32_символов
REFRESH_SECRET=другая_секретная_фраза
Установи зависимости и запусти сервер:
```
``` bash
npm install
npm run dev
Сервер запустится на http://localhost:3000. API готов принимать запросы.
```
### 4. Запуск фронтенда

Открой новый терминал, перейди в папку frontend из корня проекта:

```bash
cd ../frontend
```
Установи простой HTTP-сервер (если ещё не установлен):

```bash
npm install -g serve
```
Запусти фронтенд:

```bash
npx serve . -l 5000
``` 
Откроется адрес http://localhost:5000. Перейди по нему в браузере.

### 5. Тестирование

Введи номер телефона (любой, например +79123456789).<br>
Если номер новый – появится поле "Ваше имя". Введи имя и нажми «Создать аккаунт».
Если номер уже существует – авторизуешься сразу.<br>
После входа ты попадёшь на главную с карточкой визитов.
Перейди на вкладку «Профиль» – увидишь свои данные и кнопку «Выйти».<br>
Чтобы начислить визиты от имени администратора:<br>

В psql сделай своего пользователя админом:
```sql
UPDATE users SET role='admin' WHERE phone='79XXXXXXXXX';
```
В браузере на странице приложения открой консоль (F12) и скопируй accessToken:
console.log(localStorage.getItem('accessToken'));<br>
В терминале выполни (замени TOKEN и номер телефона):

```bash
curl -X POST http://localhost:3000/api/admin/visits/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ТВОЙ_ТОКЕН" \
  -d '{"phone":"79123456789"}'
```
Обнови страницу – прогресс-бар сдвинется.

### 🔄 Переключение между аккаунтами

Нажми «Выйти» в профиле, затем войди под другим номером.

### 🧪 Установка как PWA

Находясь на localhost:5000 с телефона в той же Wi-Fi сети, открой http://<IP_твоего_компьютера>:5000 и добавь страницу на домашний экран.

### 📁 Структура проекта

```text
/
├── frontend/          # PWA (HTML/CSS/JS)
│   ├── js/            # Логика (api.js, main.js, ui-controller.js)
│   ├── css/
│   ├── index.html
│   └── manifest.json
└── backend/           # Express API
    ├── server.js
    ├── package.json
    └── .env
```
### 🛠️ Используемые технологии

Frontend: Чистый JavaScript, PWA (Service Worker, Manifest)
Backend: Node.js, Express, jsonwebtoken, pg<br>
База данных: PostgreSQL
### 📌 Примечания

Нормализация номеров: все номера хранятся в формате 79XXXXXXXXX. При вводе автоматически добавляется +7.
Refresh-токены живут 90 дней, access-токены – 30 минут.<br>
Для безопасности не коммитьте .env и node_modules.
