const pool = require('../config/db');
const jwt = require('jsonwebtoken');

// 1. Вход в систему
exports.login = async (req, res) => {
    const { phone } = req.body;
    try {
        // Выбираем всё (*), включая поле name
        const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Пользователь с таким номером не найден' });
        }

        // Генерируем токен
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: '24h' }
        );

        // Отправляем данные (включая name) сразу при логине
        res.json({ 
            token, 
            role: user.role,
            name: user.name, // Убедись, что в БД колонка называется именно name
            userId: user.id
        });
    } catch (err) {
        console.error('Ошибка при входе:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

// 2. ПОЛУЧЕНИЕ ПРОФИЛЯ (ЭТОГО У ТЕБЯ НЕ ХВАТАЛО)
// Эта функция вызывается фронтендом (api.getProfile) при каждой загрузке страницы
exports.getMe = async (req, res) => {
    try {
        // req.user.id берется из middleware авторизации (который проверяет токен)
        const result = await pool.query(
            'SELECT id, phone, name, role, visit_count, total_visits FROM users WHERE id = $1',
            [req.user.id]
        );
        
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        // Отправляем полные данные пользователя на фронтенд
        res.json({
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            visit_count: user.visit_count,   // Для кружочков (0-7)
            total_visits: user.total_visits, // Для общей статистики в профиле
            last_visit: user.last_visit      // Дата последнего заезда
        });
    } catch (err) {
        console.error('Ошибка получения профиля:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};
