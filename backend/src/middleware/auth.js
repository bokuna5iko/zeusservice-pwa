const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Доступ запрещен (токен отсутствует)' });

    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, user) => {
        if (err) return res.status(403).json({ message: 'Неверный или просроченный токен' });
        req.user = user;
        next();
    });
};

// В файле backend/src/middleware/auth.js

const adminOnly = (req, res, next) => {
    // После authenticateToken у нас в req.user лежат данные из базы
    if (req.user && req.user.role === 'admin') {
        next(); // Всё ок, пропускаем к контроллеру
    } else {
        res.status(403).json({ 
            message: 'Доступ запрещен: у вас нет прав администратора' 
        });
    }
};

// Не забудь добавить её в exports в конце файла
module.exports = { 
    authenticateToken, 
    adminOnly 
};