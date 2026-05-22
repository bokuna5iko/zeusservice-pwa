const db = require('../config/db');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { phone } = req.body;
        const result = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '24h' }
        );

        // Отправляем расширенный объект пользователя
        res.json({
            accessToken: token,
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                role: user.role,
                bonus_points: user.bonus_points,
                visit_count: user.visit_count, 
                total_visits: user.total_visits,
                created_at: user.created_at
            }
        });
    } catch (err) {
        console.error('Ошибка в authController:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};;

// 2. ПОЛУЧЕНИЕ ПРОФИЛЯ
// Эта функция вызывается фронтендом (api.getProfile) при каждой загрузке страницы
exports.getMe = async (req, res) => {
    try {
        // req.user.id берется из middleware авторизации (который проверяет токен)
        const result = await db.query(
            'SELECT id, phone, name, role, visit_count, total_visits, created_at FROM users WHERE id = $1',
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
            last_visit: user.last_visit,      // Дата последнего заезда
            created_at: user.created_at
        });
    } catch (err) {
        console.error('Ошибка получения профиля:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

// 3. РЕГИСТРАЦИЯ НОВОГО ПОЛЬЗОВАТЕЛЯ (Исправленная версия)
exports.register = async (req, res) => {
    try {
        const { name, phone } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ message: 'Имя и номер телефона обязательны' });
        }

        const candidate = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
        if (candidate.rows[0]) {
            return res.status(400).json({ message: 'Пользователь с таким номером уже существует' });
        }

        // 🌟 ИСПРАВЛЕНИЕ: Убрали bonus_points из структуры INSERT, так как столбца нет в БД
        const result = await db.query(
            `INSERT INTO users (name, phone, role, visit_count, total_visits) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [name, phone, 'user', 0, 0]
        );
        const newUser = result.rows[0];

        const token = jwt.sign(
            { id: newUser.id, role: newUser.role },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            accessToken: token,
            user: {
                id: newUser.id,
                name: newUser.name,
                phone: newUser.phone,
                role: newUser.role,
                bonus_points: 0, // 🌟 Возвращаем просто 0 фронтенду, чтобы не было undefined
                visit_count: newUser.visit_count, 
                total_visits: newUser.total_visits,
                created_at: newUser.created_at
            }
        });

    } catch (err) {
        console.error('Ошибка в authController (register):', err);
        res.status(500).json({ message: 'Ошибка сервера при регистрации' });
    }
};