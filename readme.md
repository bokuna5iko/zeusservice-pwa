🛠 Документация проекта Zeus-Auto (после рефакторинга)
🏗 Общая архитектура
Мы перешли от монолитной структуры (где всё было в одном файле) к модульной. Теперь каждая часть кода отвечает за свою задачу. Это позволяет двум людям работать над проектом одновременно, не мешая друг другу.

📂 Бэкенд (backend/src/)
Теперь сервер не «свалка кода», а структурированный конвейер.

config/db.js: Единственная точка подключения к базе данных MySQL. Все остальные модули берут готовое соединение отсюда.

middleware/auth.js: «Пограничник». Проверяет JWT-токен. Если токена нет или он просрочен, запрос дальше не идет.

routes/: «Адресная книга». Здесь прописаны только пути (URL) и какой контроллер должен на них ответить.

auth.js — вход/регистрация.

admin.js — статистика и управление.

visits.js — работа с клиентами и мойками.

controllers/: «Мозги». Здесь лежит сама логика: расчет бонусов, проверка паролей, SQL-запросы.

server.js: «Диспетчер». Он только запускает сервер и подключает маршруты из папки routes.

🎨 Фронтенд (frontend/js/)
Фронтенд теперь общается с сервером через посредника, а не напрямую.

api.js: Главный «пульт управления». Все функции fetch живут только здесь. Если адрес сервера изменится, мы поменяем его только в одной строке здесь.

ui.js: Отвечает за кнопки, формы и переключение страниц. Он вызывает функции из api.js и показывает результат пользователю.

scanner.js: Изолированный модуль для работы с камерой. Считал QR-код -> передал данные в api.js.

🔄 Как проходит запрос (Пример: Начисление визита)
Frontend: Камера в scanner.js видит код и говорит: «Эй, api.js, начисли визит пользователю №5».

API Client: api.js берет токен из памяти, упаковывает его в заголовок и отправляет POST запрос на /api/user/add.

Backend Routes: server.js видит запрос и отдает его в routes/visits.js.

Middleware: auth.js проверяет, что это залогиненный сотрудник, а не хакер.

Controller: visitController.js делает запрос в базу, считает, не 8-я ли это мойка, и возвращает ответ.

Frontend UI: ui.js получает ответ и рисует красивое уведомление: «Поздравляем! Бесплатная мойка!».

Команда для бд что бы проверить метрики:
/* 1. СОЗДАЕМ ТЕСТОВЫХ ПОЛЬЗОВАТЕЛЕЙ (если их еще нет) */
-- Добавляем пользователя №2
INSERT INTO users (id, phone, name, role) 
VALUES (2, '79990000002', 'Тест Вчерашний', 'user')
ON CONFLICT (id) DO NOTHING;

-- Добавляем пользователя №3
INSERT INTO users (id, phone, name, role) 
VALUES (3, '79990000003', 'Тест Новичок', 'user')
ON CONFLICT (id) DO NOTHING;


/* 2. ИМИТИРУЕМ ВЧЕРА (для сравнения темпа) */
-- Вчерашний «новичок» (для Блока 3)
INSERT INTO visits (user_id, service_id, service_type, price, created_at) 
VALUES (2, 1, 'Тест Вчера', 1500, NOW() - interval '1 day' - interval '1 hour');

-- Вчерашняя выручка и клиент (для Блока 1 и 4)
INSERT INTO visits (user_id, service_id, service_type, price, created_at) 
VALUES (1, 1, 'Тест Вчера', 2000, NOW() - interval '1 day' - interval '2 hours');


/* 3. ИМИТИРУЕМ СЕГОДНЯ */
-- Сегодняшний «новичок» (Блок 3 — впервые приехал сегодня)
INSERT INTO visits (user_id, service_id, service_type, price, created_at) 
VALUES (3, 1, 'Тест Новичок', 1000, NOW() - interval '10 minutes');

-- Сегодняшний визит старого клиента (Блок 1 и 4)
INSERT INTO visits (user_id, service_id, service_type, price, created_at) 
VALUES (1, 1, 'Тест Сегодня', 3000, NOW() - interval '5 minutes');


/* 4. ИМИТИРУЕМ «ПОСТОЯННИКА» (Блок 2) */
-- Добавляем пользователю №1 визиты в этом месяце, чтобы он стал лояльным (>4 визитов)
INSERT INTO visits (user_id, service_id, service_type, price, created_at) VALUES (1, 1, 'Тест Лояльность', 100, NOW() - interval '2 days');
INSERT INTO visits (user_id, service_id, service_type, price, created_at) VALUES (1, 1, 'Тест Лояльность', 100, NOW() - interval '3 days');
INSERT INTO visits (user_id, service_id, service_type, price, created_at) VALUES (1, 1, 'Тест Лояльность', 100, NOW() - interval '4 days');
INSERT INTO visits (user_id, service_id, service_type, price, created_at) VALUES (1, 1, 'Тест Лояльность', 100, NOW() - interval '5 days');

Скрипт для миграции базы данных:

DO $$ 
BEGIN 
    -- 1. Проверяем и добавляем колонку price в таблицу visits, если её нет
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='visits' AND column_name='price'
    ) THEN
        ALTER TABLE visits ADD COLUMN price NUMERIC(10, 2) DEFAULT 0;
        RAISE NOTICE 'Колонка price добавлена в таблицу visits';
    ELSE
        RAISE NOTICE 'Колонка price уже существует';
    END IF;

    -- 2. Проверяем и добавляем колонку service_type, если её нет (для названий услуг)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='visits' AND column_name='service_type'
    ) THEN
        ALTER TABLE visits ADD COLUMN service_type VARCHAR(255);
        RAISE NOTICE 'Колонка service_type добавлена в таблицу visits';
    END IF;

    -- 3. Убеждаемся, что колонка created_at имеет значение по умолчанию (для корректных дат)
    ALTER TABLE visits ALTER COLUMN created_at SET DEFAULT NOW();

END $$;