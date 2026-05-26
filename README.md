# Скрипт для создания и проверки нужных таблиц в posgreSQL

-- 1. Таблица users
```
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20),
    name VARCHAR(100),
    role VARCHAR(20),
    total_visits INTEGER DEFAULT 0,
    last_visit TIMESTAMP WITHOUT TIME ZONE,
    visit_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
-- 2. Таблица services
```
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100),
    base_price INTEGER
);
```
-- 3. Таблица refresh_tokens
```
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    token TEXT,
    expires_at TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_user_tokens FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```
-- 4. Таблица visits
```
CREATE TABLE IF NOT EXISTS visits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    amount NUMERIC(10,2),
    service VARCHAR(255),
    bonus_type VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    service_type VARCHAR(100),
    admin_id INTEGER,
    service_id INTEGER,
    price INTEGER,
    visit_number INTEGER,
    CONSTRAINT fk_user_visits FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_service_visits FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
);

21.05
Админка: Починили роутинг, авторизацию (401/404) и вывели честные, очищенные от строк данные из PostgreSQL прямо на графики и карточки.

Клиентская часть: Избавились от ручных fetch, перевели историю визитов на Axios-интерцептор (убрали 403) и связали handleLogout с единым контекстом авторизации, чтобы сессия сбрасывалась без жестких перезагрузок.# CI test
# CI test

23.05
🛠 Что сделано в рамках этого спринта:

    Починили Бэкенд (Auth):

        Решили проблему с падением register из-за отсутствующего столбца bonus_points (убрали его из INSERT, но оставили заглушку 0 в JSON для фронтенда, чтобы ничего не сломать).

        Починили конфликт уникальности users_pkey (ошибка 23505). Сбросили и выровняли SEQUENCE автоинкремента id под реальный максимум в базе данных.

    Синхронизировали Глобальные Стили (base.css):

        Перевели глобальный :root на полноценные тёмные неоновые переменные.

        Перекрасили корпус виртуального телефона (.app-main) в ультра-тёмный #020617, убрав дефолтный светлый фон.

        Адаптировали общие карточки (.content-group-box) под тёмную тему.

    Реконструировали Интерфейс Клиента (HomePage.css & PointsGrid.css):

        Главная карта пользователя переведена в глубокий slate-формат с аккуратными границами.

        Сетка визитов (.point-item) полностью избавилась от светлых пятен. Неактивные шаги теперь уходят вглубь экрана, пройденные подсвечиваются неоновым синим, а бонусные шаги (20% и подарок) получили свои уникальные стили и акцентное свечение.

        Текстовая иерархия доведена до ума: заголовок стал строгим и системным, а счетчик оставшихся визитов превратился в красивый неоновый инфо-бейдж.# Test runner Tue May 26 05:57:56 AM UTC 2026
# Test staging deploy Tue May 26 06:13:08 AM UTC 2026


Проверочка
