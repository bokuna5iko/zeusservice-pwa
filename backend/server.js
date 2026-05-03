require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// Нормализация номера телефона
function normalizePhone(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('8')) {
        cleaned = '7' + cleaned.substring(1);
    } else if (!cleaned.startsWith('7') && cleaned.length == 10) {
        cleaned = '7' + cleaned;
    }
    return cleaned;
}

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Функция-прокладка для проверки токена (Middleware)
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user; // Сохраняем данные из токена (id и роль) в запрос
        next();
    });
}

// Проверка существования пользователя
app.post('/api/auth/check', async (req, res) => {
    const { phone: rawPhone } = req.body;
    const phone = normalizePhone(rawPhone);
    if (!phone) return res.status(400).json({ error: 'Номер обязателен' });

    try {
        const userResult = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
        res.json({ exists: userResult.rows.length > 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Авторизация / регистрация
app.post('/api/auth', async (req, res) => {
    const { phone: rawPhone, name } = req.body;
    const phone = normalizePhone(rawPhone);
    if (!phone) return res.status(400).json({ error: 'Номер обязателен' });

    try {
        let userResult = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
        let user;

        if (userResult.rows.length === 0) {
            userResult = await pool.query(
                'INSERT INTO users (phone, name, role) VALUES ($1, $2, $3) RETURNING *',
                [phone, name || 'Клиент', 'user']
            );
            user = userResult.rows[0];
        } else {
            user = userResult.rows[0];
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                phone: user.phone,
                name: user.name,
                role: user.role,
                total_visits: user.total_visits
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// --- ОБНОВЛЕННЫЙ ПРОФИЛЬ (iserId, visitCount, lastVisitdate) ---
app.get('/api/user/me', authenticateToken, async (req, res) => {
    try {
        // Достаем userId именно так, как он записан в токене (из функции generateAccessToken)
        const userId = req.user.userId; 

        const userResult = await pool.query(
            'SELECT id, phone, name, role, total_visits, last_visit FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const user = userResult.rows[0];
        const isEligibleForFree = user.total_visits > 0 && user.total_visits % 8 === 0;

        res.json({
            userId: user.id,
            phone: user.phone,
            name: user.name,
            role: user.role,
            visitCount: user.total_visits || 0,
            lastVisitDate: user.last_visit,
            isEligibleForFreeWash: isEligibleForFree,
            nextBonusIn: 8 - (user.total_visits % 8) === 0 ? 8 : 8 - (user.total_visits % 8)
        });

    } catch (err) {
        console.error('Ошибка профиля:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Обновление токенов
app.post('/api/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.sendStatus(401);

    try {
        const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
        const tokenRow = await pool.query(
            'SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2',
            [refreshToken, payload.userId]
        );
        if (!tokenRow.rows.length) return res.sendStatus(403);

        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [payload.userId]);
        if (!userResult.rows.length) return res.sendStatus(404);

        const user = userResult.rows[0];
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);

        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) {
        return res.sendStatus(403);
    }
});

// Начисление визита (админ) — теперь по userId
app.post('/api/admin/visits/add', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        
        // Проверка, что это действительно админ
        if (payload.role !== 'admin') return res.sendStatus(403);

        // Получаем userId (так как фронтенд шлет { userId: ... })
        const { userId } = req.body; 
        
        if (!userId) {
            return res.status(400).json({ error: 'ID пользователя обязателен' });
        }

        // Обновляем запись, используя первичный ключ (id)
        const updateResult = await pool.query(
            'UPDATE users SET total_visits = total_visits + 1, last_visit = NOW() WHERE id = $1 RETURNING total_visits',
            [userId]
        );

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь с таким ID не найден' });
        }

        res.json({ 
            success: true, 
            total_visits: updateResult.rows[0].total_visits 
        });

    } catch (err) {
        console.error('Ошибка в админ-панели:', err);
        return res.sendStatus(500);
    }
});

// Генерация токенов (вспомогательные)
function generateAccessToken(user) {
    return jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '30m' }
    );
}

function generateRefreshToken(user) {
    const token = jwt.sign(
        { userId: user.id },
        process.env.REFRESH_SECRET,
        { expiresIn: '90d' }
    );
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    pool.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, token, expiresAt]
    );
    return token;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Zeus API запущен на http://localhost:${PORT}`);
});
