const pool = require('../config/db');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { phone } = req.body; // Получаем только номер
    try {
        const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
        const user = result.rows[0];

        // Если пользователя с таким номером нет в базе
        if (!user) {
            return res.status(401).json({ message: 'Пользователь с таким номером не найден' });
        }

        // ПАРОЛЬ БОЛЬШЕ НЕ ПРОВЕРЯЕМ
        // Генерируем токен, как и раньше
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: '24h' }
        );

        res.json({ token, role: user.role });
    } catch (err) {
        console.error('Ошибка при входе:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};