// backend/src/controllers/authController.js
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // 🌟 ДОБАВЛЕНО: Хеширование паролей

// 1. АВТОРИЗАЦИЯ ЧЕРЕЗ ЛОГИН И ПАРОЛЬ (С поддержкой сброса через NocoDB)
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Валидация входных данных
    if (!username || !password) {
      return res.status(400).json({ message: "Логин и пароль обязательны" });
    }

    // Ищем пользователя по username
    const result = await db.query("SELECT * FROM users WHERE username = $1", [
      username.trim(),
    ]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    if (!user.password_hash) {
      return res
        .status(400)
        .json({ message: "Для данного аккаунта пароль не установлен" });
    }

    const dbPassword = user.password_hash.trim();
    let isMatch = false;
    let mustResetPassword = false;

    // 🕵️‍♂️ УМНАЯ ПРОВЕРКА: Это хэш bcrypt или сырой текст из NocoDB?
    const isBcryptHash =
      dbPassword.startsWith("$2a$") || dbPassword.startsWith("$2b$");

    if (isBcryptHash) {
      // Сценарий А: Обычный хэш пароля. Сверяем через bcrypt
      isMatch = await bcrypt.compare(password, dbPassword);
    } else {
      // Сценарий Б: Артём сбросил пароль в NocoDB на обычный текст
      isMatch = password === dbPassword;
      mustResetPassword = true; // Выставляем флаг принудительной смены
    }

    if (!isMatch) {
      return res.status(400).json({ message: "Неверный логин или пароль" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "24h" },
    );

    // Отправляем расширенный объект пользователя + флаг mustResetPassword
    res.json({
      accessToken: token,
      mustResetPassword, // 🌟 Передаем флаг на фронтенд
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        phone: user.phone,
        role: user.role,
        visit_count: user.visit_count,
        total_visits: user.total_visits,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error("Ошибка в authController (login):", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// 2. ПОЛУЧЕНИЕ ПРОФИЛЯ (С постоянной защитой от обхода сброса пароля)
exports.getMe = async (req, res) => {
  try {
    // 🌟 Добавили password_hash в SQL-запрос, чтобы проверить его тип при F5
    const result = await db.query(
      "SELECT id, username, phone, name, role, password_hash, visit_count, total_visits, created_at FROM users WHERE id = $1",
      [req.user.id],
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // 🕵️‍♂️ Проверяем: если пароль в базе не bcrypt-хэш, значит Артём его сбросил
    const dbPassword = user.password_hash ? user.password_hash.trim() : "";
    const isBcryptHash =
      dbPassword.startsWith("$2a$") || dbPassword.startsWith("$2b$");
    const mustResetPassword = !isBcryptHash; // Если не хэш, то принудительно true

    res.json({
      mustResetPassword, // 🌟 Отдаем этот флаг фронтенду даже при обычном обновлении страницы!
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        phone: user.phone,
        role: user.role,
        visit_count: user.visit_count,
        total_visits: user.total_visits,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error("Ошибка получения профиля:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// 3. РЕГИСТРАЦИЯ С ХЕШИРОВАНИЕМ ПАРОЛЯ (Исправлено: запись NULL вместо текстовой заглушки для уникальности)
exports.register = async (req, res) => {
  try {
    const { name, username, password, phone } = req.body;

    if (!name || !username || !password) {
      return res
        .status(400)
        .json({ message: "Имя, логин и пароль обязательны" });
    }

    // Проверяем уникальность логина
    const candidate = await db.query(
      "SELECT * FROM users WHERE username = $1",
      [username.trim()],
    );
    if (candidate.rows[0]) {
      return res
        .status(400)
        .json({ message: "Пользователь с таким логином уже существует" });
    }

    // Хешируем пароль перед записью в БД
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 🌟 ИСПРАВЛЕНО: Вместо строки "Нет телефона" пишем NULL, чтобы не ломать уникальный индекс UNIQUE
    const safePhone = phone && phone.trim().length > 0 ? phone.trim() : null;

    // Сохраняем нового пользователя в базу данных
    const result = await db.query(
      `INSERT INTO users (name, username, password_hash, phone, role, visit_count, total_visits, created_at) 
             VALUES ($1, $2, $3, $4, $5, 0, 0, NOW()) 
             RETURNING *`,
      [name.trim(), username.trim(), hashedPassword, safePhone, "user"],
    );
    const newUser = result.rows[0];

    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "24h" },
    );

    res.status(201).json({
      accessToken: token,
      user: {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        phone: newUser.phone,
        role: newUser.role,
        visit_count: newUser.visit_count,
        total_visits: newUser.total_visits,
        created_at: newUser.created_at,
      },
    });
  } catch (err) {
    console.error("Ошибка в authController (register):", err);
    res.status(500).json({ message: "Ошибка сервера при регистрации" });
  }
};
