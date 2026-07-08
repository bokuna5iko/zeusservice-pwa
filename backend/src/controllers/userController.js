// controllers/userController.js
const db = require("../config/db");
const crypto = require("crypto"); // 🌟 ДОБАВЛЕНО: Нативный модуль для работы с хэшированием SHA-256
const bcrypt = require("bcryptjs");

// 🌟 БЛОК №1: Эндпоинт генерации безопасной динамической строки для QR-кода клиента
exports.generateQrString = async (req, res) => {
  try {
    const userId = req.user.id; // Извлекаем ID залогиненного пользователя из JWT мидлвара
    const timestamp = Math.floor(Date.now() / 1000); // Текущий UNIX-timestamp в секундах

    // Достаем секретную соль из .env (с безопасным дефолтным значением на случай сброса конфига)
    const secretKey =
      process.env.QR_SECRET_KEY || "zeus_auto_super_secret_salt_2026";

    // Генерируем уникальный хэш по формуле из ТЗ
    const hash = crypto
      .createHash("sha256")
      .update(`${userId}${timestamp}${secretKey}`) // 🌟 ИСПРАВЛЕНО: Теперь тут железно текстовая склейка! "21780049609..."
      .digest("hex");

    // Собираем финальную защищенную строку
    const qrString = `${userId}:${timestamp}:${hash}`;

    // Возвращаем её на фронтенд клиента
    res.json({ success: true, qrString });
  } catch (err) {
    console.error("Ошибка при генерации строки QR:", err);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при генерации QR-кода",
    });
  }
};

// БЛОК №2: Существующее обновление профиля
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar_url, car_brand } = req.body;
    const userId = req.user.id;

    await db.query(
      "UPDATE users SET name = COALESCE($1, name), avatar_url = COALESCE($2, avatar_url), car_brand = COALESCE($3, car_brand) WHERE id = $4",
      [name, avatar_url, car_brand, userId],
    );

    res.json({ message: "Профиль обновлен" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user.id; // Вытащено из мидлвары authenticateToken

    if (!newPassword || newPassword.trim().length < 4) {
      return res
        .status(400)
        .json({ message: "Пароль должен быть не менее 4 символов" });
    }

    // Хешируем новый безопасный постоянный пароль
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword.trim(), salt);

    // Перезаписываем ячейку в PostgreSQL безопасным хэшем
    await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      hashedPassword,
      userId,
    ]);

    res.json({ success: true, message: "Пароль успешно обновлен!" });
  } catch (err) {
    console.error("Ошибка в userController (changePassword):", err);
    res.status(500).json({ message: "Ошибка сервера при обновлении пароля" });
  }
};
