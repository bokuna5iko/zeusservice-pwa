Чтобы ты свободно чувствовал себя в **Query Tool** (pgAdmin) и не зависел от интерфейса, вот твой «джентльменский набор» команд. Эти команды покроют 99% твоих нужд при разработке.

### 1. Просмотр данных (SELECT)

Самое частое действие.

- **Посмотреть всё из таблицы:**
    
    SQL
    
    ```
    SELECT * FROM users;
    ```
    
- **Посмотреть только конкретные колонки (чтобы не рябило в глазах):**
    
    SQL
    
    ```
    SELECT id, phone, role FROM users;
    ```
    
- **Найти конкретного человека по номеру:**
    
    SQL
    
    ```
    SELECT * FROM users WHERE phone = '+79243608890';
    ```
    
- **Посмотреть последние 5 визитов (сортировка по времени):**
    
    SQL
    
    ```
    SELECT * FROM visits ORDER BY created_at DESC LIMIT 5;
    ```
    

---

### 2. Изменение данных (UPDATE)

Важно: всегда используй `WHERE`, иначе изменишь данные **у всех** пользователей сразу.

- **Изменить количество визитов:**
    
    SQL
    
    ```
    UPDATE users SET total_visits = 7 WHERE id = 1;
    ```
    
- **Сделать пользователя админом:**
    
    SQL
    
    ```
    UPDATE users SET role = 'admin' WHERE phone = '+79243608890';
    ```
    

---

### 3. Удаление (DELETE)

- **Удалить конкретный визит по его ID:**
    
    SQL
    
    ```
    DELETE FROM visits WHERE id = 10;
    ```
    
- **Очистить таблицу визитов (осторожно!):**
    
    SQL
    
    ```
    TRUNCATE TABLE visits;
    ```
    

---

### 4. Шпаргалка по структуре (Полезно, когда забыл имена колонок)

Если не хочешь лазить по дереву папок слева:

- **Список всех таблиц в базе:**
    
    SQL
    
    ```
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
    ```
    
- **Список всех колонок в конкретной таблице:**
    
    SQL
    
    ```
    SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';
    ```
    

---

### 5. Полезные хитрости

- **Посчитать, сколько всего пользователей в базе:**
    
    SQL
    
    ```
    SELECT count(*) FROM users;
    ```
    
- **Узнать сумму всех покупок (выручку):**
    
    SQL
    
    ```
    SELECT sum(amount) FROM visits;
    ```