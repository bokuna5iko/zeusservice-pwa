const db = require('../config/db');


exports.updateProfile = async (req, res) => {
    try {
        const { name, avatar_url, car_brand } = req.body;
        const userId = req.user.id;

        await db.query(
            'UPDATE users SET name = COALESCE($1, name), avatar_url = COALESCE($2, avatar_url), car_brand = COALESCE($3, car_brand) WHERE id = $4',
            [name, avatar_url, car_brand, userId]
        );

        res.json({ message: 'Профиль обновлен' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};