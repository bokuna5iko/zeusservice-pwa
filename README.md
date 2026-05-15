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

