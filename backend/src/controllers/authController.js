// backend/src/controllers/authController.js
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { normalizePhone } = require("../utils/phoneUtils");
const { generateCode, sendSms } = require("../services/smsService");
const {
  requirePersonalDataConsent,
  getPdConsentFields,
} = require("../db/initSmsAuth");

const SMS_CODE_TTL_MINUTES = Number(process.env.SMS_CODE_TTL_MINUTES) || 5;
const SMS_RESEND_COOLDOWN_SEC = Number(process.env.SMS_RESEND_COOLDOWN_SEC) || 60;
const SMS_MAX_VERIFY_ATTEMPTS = 5;

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || "secret123",
    { expiresIn: "24h" },
  );
}

function formatUserResponse(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    phone: user.phone,
    role: user.role,
    visit_count: user.visit_count,
    total_visits: user.total_visits,
    created_at: user.created_at,
    car_brand: user.car_brand || null,
    avatar_url: user.avatar_url || "1.png",
    pd_consent_at: user.pd_consent_at || null,
    pd_consent_version: user.pd_consent_version || null,
  };
}

function usernameFromPhone(phone) {
  return `u${phone}`;
}

function phoneLookupVariants(normalizedPhone) {
  const variants = new Set([normalizedPhone]);
  if (normalizedPhone.startsWith("7") && normalizedPhone.length === 11) {
    variants.add(normalizedPhone.slice(1));
    variants.add(`8${normalizedPhone.slice(1)}`);
    variants.add(`+${normalizedPhone}`);
  }
  return [...variants];
}

async function findUserByPhone(normalizedPhone) {
  const variants = phoneLookupVariants(normalizedPhone);
  const result = await db.query(
    `SELECT * FROM users
     WHERE phone IS NOT NULL
       AND phone <> ''
       AND deleted_at IS NULL
       AND phone = ANY($1::text[])`,
    [variants],
  );
  return result.rows[0] || null;
}

/** Сброс пароля нужен только если админ задал временный текстовый пароль в NocoDB */
function mustForcePasswordReset(passwordHash) {
  if (!passwordHash || !String(passwordHash).trim()) {
    return false;
  }
  const hash = String(passwordHash).trim();
  return !(hash.startsWith("$2a$") || hash.startsWith("$2b$"));
}

// 1. АВТОРИЗАЦИЯ ЧЕРЕЗ ЛОГИН И ПАРОЛЬ (С поддержкой сброса через NocoDB)
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Валидация входных данных
    if (!username || !password) {
      return res.status(400).json({ message: "Логин и пароль обязательны" });
    }

    // Ищем пользователя по username
    const result = await db.query("SELECT * FROM users WHERE username = $1 AND deleted_at IS NULL", [
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

    const token = signToken(user);

    res.json({
      accessToken: token,
      mustResetPassword,
      user: formatUserResponse(user),
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
      "SELECT id, username, phone, name, role, password_hash, visit_count, total_visits, created_at, car_brand, avatar_url, pd_consent_at, pd_consent_version FROM users WHERE id = $1 AND deleted_at IS NULL",
      [req.user.id],
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // 🕵️‍♂️ Проверяем: временный текстовый пароль из NocoDB (не SMS и не bcrypt)
    const mustResetPassword = mustForcePasswordReset(user.password_hash);

    res.json({
      mustResetPassword,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        phone: user.phone,
        role: user.role,
        visit_count: user.visit_count,
        total_visits: user.total_visits,
        created_at: user.created_at,
        car_brand: user.car_brand || null,
        avatar_url: user.avatar_url || "1.png",
        pd_consent_at: user.pd_consent_at || null,
        pd_consent_version: user.pd_consent_version || null,
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

    if (!requirePersonalDataConsent(req.body, res)) return;

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
    const { pdConsentAt, pdConsentVersion } = getPdConsentFields();

    const result = await db.query(
      `INSERT INTO users (name, username, password_hash, phone, role, visit_count, total_visits, created_at, pd_consent_at, pd_consent_version) 
             VALUES ($1, $2, $3, $4, $5, 0, 0, NOW(), $6, $7) 
             RETURNING *`,
      [
        name.trim(),
        username.trim(),
        hashedPassword,
        safePhone,
        "user",
        pdConsentAt,
        pdConsentVersion,
      ],
    );
    const newUser = result.rows[0];

    const token = signToken(newUser);

    res.status(201).json({
      accessToken: token,
      user: formatUserResponse(newUser),
    });
  } catch (err) {
    await db.query("ROLLBACK").catch(() => {}); // На случай, если в будущем обернешь в транзакцию
    console.error("Ошибка в authController (register):", err);
    res.status(500).json({ message: "Ошибка сервера при регистрации" });
  }
};

// 4. ОТПРАВКА SMS-КОДА
exports.sendSmsCode = async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const mode = req.body.mode === "register" ? "register" : "login";

    if (!phone) {
      return res.status(400).json({ message: "Некорректный номер телефона" });
    }

    if (mode === "register" && !requirePersonalDataConsent(req.body, res)) return;

    const existingUser = await findUserByPhone(phone);
    if (mode === "register" && existingUser) {
      return res.status(409).json({
        message: "Этот номер уже зарегистрирован. Перейдите на вкладку «Вход».",
        code: "PHONE_ALREADY_REGISTERED",
      });
    }
    if (mode === "login" && !existingUser) {
      return res.status(404).json({
        message: "Пользователь не найден. Пройдите регистрацию.",
        code: "USER_NOT_FOUND",
      });
    }

    const recent = await db.query(
      `SELECT created_at FROM sms_codes
       WHERE phone = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [phone],
    );

    if (recent.rows[0]) {
      const elapsedSec =
        (Date.now() - new Date(recent.rows[0].created_at).getTime()) / 1000;
      if (elapsedSec < SMS_RESEND_COOLDOWN_SEC) {
        const waitSec = Math.ceil(SMS_RESEND_COOLDOWN_SEC - elapsedSec);
        return res.status(429).json({
          message: `Повторная отправка через ${waitSec} сек.`,
          retryAfterSec: waitSec,
        });
      }
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + SMS_CODE_TTL_MINUTES * 60 * 1000);

    await db.query("DELETE FROM sms_codes WHERE phone = $1", [phone]);
    await db.query(
      `INSERT INTO sms_codes (phone, code, expires_at) VALUES ($1, $2, $3)`,
      [phone, code, expiresAt],
    );

    await sendSms(phone, code);

    const isDev = (process.env.SMS_PROVIDER || "dev").toLowerCase() === "dev";

    res.json({
      message: isDev
        ? "Код отправлен (dev: смотрите лог сервера)"
        : "Код отправлен на ваш номер",
      phone,
      expiresInSec: SMS_CODE_TTL_MINUTES * 60,
      devMode: isDev,
    });
  } catch (err) {
    console.error("Ошибка sendSmsCode:", err.message);
    res.status(500).json({
      message: err.message || "Не удалось отправить SMS-код",
    });
  }
};

// 5. ПРОВЕРКА SMS-КОДА (вход или регистрация)
exports.verifySmsCode = async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const code = String(req.body.code || "").trim();
    const name = req.body.name ? String(req.body.name).trim() : null;
    const mode = req.body.mode === "register" ? "register" : "login";

    if (!phone) {
      return res.status(400).json({ message: "Некорректный номер телефона" });
    }
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: "Код должен состоять из 6 цифр" });
    }

    const codeResult = await db.query(
      `SELECT * FROM sms_codes
       WHERE phone = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [phone],
    );
    const smsRecord = codeResult.rows[0];

    if (!smsRecord) {
      return res.status(400).json({ message: "Сначала запросите код" });
    }

    if (new Date(smsRecord.expires_at) < new Date()) {
      await db.query("DELETE FROM sms_codes WHERE id = $1", [smsRecord.id]);
      return res.status(400).json({ message: "Код истёк. Запросите новый." });
    }

    if (smsRecord.attempts >= SMS_MAX_VERIFY_ATTEMPTS) {
      await db.query("DELETE FROM sms_codes WHERE id = $1", [smsRecord.id]);
      return res
        .status(400)
        .json({ message: "Превышено число попыток. Запросите новый код." });
    }

    if (smsRecord.code !== code) {
      await db.query(
        "UPDATE sms_codes SET attempts = attempts + 1 WHERE id = $1",
        [smsRecord.id],
      );
      return res.status(400).json({ message: "Неверный код" });
    }

    await db.query("DELETE FROM sms_codes WHERE phone = $1", [phone]);

    const user = await findUserByPhone(phone);

    if (user) {
      if (mode === "register") {
        return res.status(409).json({
          message: "Этот номер уже зарегистрирован. Перейдите на вкладку «Вход».",
          code: "PHONE_ALREADY_REGISTERED",
        });
      }

      const token = signToken(user);
      return res.json({
        accessToken: token,
        isNewUser: false,
        mustResetPassword: false,
        user: formatUserResponse(user),
      });
    }

    if (mode === "login") {
      return res.status(404).json({
        message: "Пользователь не найден. Пройдите регистрацию.",
        code: "USER_NOT_FOUND",
      });
    }

    if (!name || name.length < 2) {
      return res.status(400).json({
        message: "Для регистрации укажите имя",
        code: "NAME_REQUIRED",
      });
    }

    if (!requirePersonalDataConsent(req.body, res)) return;

    const username = usernameFromPhone(phone);
    const usernameCheck = await db.query(
      "SELECT id, phone FROM users WHERE username = $1",
      [username],
    );
    if (usernameCheck.rows[0]) {
      return res.status(409).json({
        message: "Аккаунт с этим телефоном уже существует. Войдите через «Вход».",
        code: "PHONE_ALREADY_REGISTERED",
      });
    }

    const { pdConsentAt, pdConsentVersion } = getPdConsentFields();

    const insertResult = await db.query(
      `INSERT INTO users (name, username, password_hash, phone, role, visit_count, total_visits, created_at, pd_consent_at, pd_consent_version)
       VALUES ($1, $2, NULL, $3, $4, 0, 0, NOW(), $5, $6)
       RETURNING *`,
      [name, username, phone, "user", pdConsentAt, pdConsentVersion],
    );
    const newUser = insertResult.rows[0];

    const token = signToken(newUser);
    return res.status(201).json({
      accessToken: token,
      isNewUser: true,
      mustResetPassword: false,
      user: formatUserResponse(newUser),
    });
  } catch (err) {
    console.error("Ошибка verifySmsCode:", err);

    if (err.code === "23505") {
      return res.status(400).json({
        message: "Этот номер уже зарегистрирован. Войдите через «Вход».",
      });
    }

    res.status(500).json({ message: "Ошибка проверки кода" });
  }
};
