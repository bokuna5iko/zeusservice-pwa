
# Zeus Auto PWA – ветка `my-backend-v2`

Эта ветка содержит бэкенд со статистикой, учётом услуг и бонусов.  
Основной фронтенд (интерфейс пользователя) остаётся в папке `frontend`, новый код – в `backend/server.js` и SQL‑миграциях.

## 🚀 Быстрый старт (для фронтендера)

1. **Склонировать репозиторий и переключиться на ветку**
   ```bash
   git clone https://github.com/bokuna5iko/zeusservice-pwa.git
   cd zeusservice-pwa
   git checkout my-backend-v2```

## 2. Установить зависимости бэкенда

```bash
cd backend
npm install```
## 3. Настроить .env (пример значений):

```text
DATABASE_URL=postgresql://zeus_user:your_password@localhost:5432/zeus_auto_db
JWT_SECRET=very_long_secret_key_at_least_32_chars
REFRESH_SECRET=another_secret_key```

## 4. Применить изменения в БД
Выполнить SQL‑скрипт из backend/migrations/001_init_visits.sql (или скопировать DDL‑команды ниже):

```sql
-- Создание таблицы visits
CREATE TABLE IF NOT EXISTS visits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) DEFAULT 0,
    service VARCHAR(255),
    bonus_type VARCHAR(20),   -- NULL, 'discount', 'gift'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Добавление отсутствующих колонок (если таблица уже была)
ALTER TABLE visits ADD COLUMN IF NOT EXISTS service VARCHAR(255);
ALTER TABLE visits ADD COLUMN IF NOT EXISTS bonus_type VARCHAR(20);

-- Тестовые данные (опционально, для демонстрации метрик)
INSERT INTO visits (user_id, amount, service, created_at)
SELECT
    (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
    (random() * 1000 + 800)::int,
    CASE (random() * 3)::int
        WHEN 0 THEN 'Комплексная мойка'
        WHEN 1 THEN 'Мойка кузова'
        WHEN 2 THEN 'Химчистка салона'
        ELSE 'Полировка'
    END,
    NOW() - (random() * INTERVAL '30 days')
FROM generate_series(1, 150); 
```

## 5. Запустить бэкенд

``` bash
npm run dev
```

# Доступные API‑эндпоинты (изменённые)

##Статистика для админки

GET /api/admin/stats
Заголовок: Authorization: Bearer <access_token>
Ответ:

```json
{
  "totalVisits": 150,
  "monthlyVisits": 44,
  "repeatClients": 1,
  "avgCheck": "1319",
  "daily": [ { "day": "04.05", "count": 4 }, ... ]
}
```
totalVisits – всего обслуженных машин
monthlyVisits – за текущий месяц <br>
repeatClients – число пользователей, у которых >1 визита
avgCheck – средний чек (руб.) <br>
daily – массив по дням за последние 30 дней
Профиль пользователя <br>

GET /api/user/me 
Ответ (дополнен): <br>

``` json
{
  "userId": 1,
  "visitCount": 8,
  "lastVisitDate": "2026-05-04T22:37:23.013Z",
  "isEligibleForFreeWash": true,
  "nextBonusIn": 8,
  "phone": "79123456789",
  "name": "Иван",
  "role": "admin",
  "total_visits": 8,
  "next_bonus": { "type": "скидки", "remaining": 4 }
}
```
userId (Number) – идентификатор пользователя
visitCount – текущее количество визитов <br>
lastVisitDate (ISO‑строка или null)
isEligibleForFreeWash (Boolean) – true, если visitCount кратен 8 <br>
nextBonusIn – сколько визитов до ближайшего бонуса (скидка или подарок)
Начисление визита (админ) <br>

POST /api/admin/visits/add
Тело запроса: <br>

``` json
{
  "userId": 1,
  "amount": 1200,
  "service": "Комплексная мойка"
}
```

Ответ (обычный):

```json
{ "success": true, "total_visits": 5, "bonus": null }
```
Ответ (бонусный):

``` json
{ "success": true, "total_visits": 4, "bonus": { "type": "discount", "message": "Скидка 20%" } }
```
## 🗄️ Структура базы данных (новое) <br>

users — без изменений (id, phone, name, role, total_visits, last_visit, created_at)
refresh_tokens — без изменений <br>
visits — новая таблица для учёта каждой мойки:

id SERIAL PRIMARY KEY <br>
user_id INTEGER REFERENCES users(id)
amount DECIMAL(10,2) <br>
service VARCHAR(255)
bonus_type VARCHAR(20) (NULL, 'discount', 'gift') <br>
created_at TIMESTAMP
## 🔧 Что поменяли в коде

backend/server.js

Добавлен middleware authenticateToken (опциональный, не используется) <br>
Новый эндпоинт GET /api/admin/stats
Обновлён POST /api/admin/visits/add – принимает userId, amount, service; записывает визит в visits; автоматически определяет бонус <br>

Обновлён GET /api/user/me – возвращает дополнительные поля (userId, visitCount, lastVisitDate, isEligibleForFreeWash, nextBonusIn)
Файл frontend/js/api.js <br>

Базовый URL должен указывать на ваш бэкенд (по умолчанию http://localhost:3000/api)
Не забудьте временно изменить его при тестировании с телефона (ngrok или локальный IP) <br>

## 🧪 Проверка работы

Запустите бэкенд и фронтенд (как обычно).
Войдите как админ (например, номер 79001234567). <br>
Перейдите на вкладку «Админ».
Вызовите в консоли браузера: <br>

```javascript

fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }})
  .then(r => r.json())
  .then(console.log);
```
Должны увидеть ненулевые значения (если залили тестовые визиты). <br>
Проверьте начисление визита через форму – после успешного начисления в ответе может быть бонус.
В psql можно посмотреть SELECT * FROM visits ORDER BY created_at DESC LIMIT 5;. <br>
## 🔜 Что дальше

Фронтендер может оживить метрики в admin-page (id элементов admin-total-visits, admin-monthly-visits, admin-repeat-clients, admin-avg-check) и построить график по daily. <br>
Настроить автоматическое обновление access‑токена (refreshTokens) в файле api.js, чтобы избежать ошибок истечения.
Добавить push‑уведомления (клиентский sw.js, подписка, бэкенд‑отправка). <br>
В случае вопросов – пишите, всегда на связи. 



