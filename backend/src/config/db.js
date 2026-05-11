const { Pool } = require('pg');
require('dotenv').config();

// Используем либо строку подключения (для Supabase/Render), либо отдельные переменные
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, 
    // Если DATABASE_URL нет, можно прописать параметры отдельно:
    // user: process.env.DB_USER,
    // host: process.env.DB_HOST,
    // database: process.env.DB_NAME,
    // password: process.env.DB_PASSWORD,
    // port: process.env.DB_PORT || 5432,
});

module.exports = {
    // Обертка для совместимости с нашим кодом
    query: (text, params) => pool.query(text, params),
};