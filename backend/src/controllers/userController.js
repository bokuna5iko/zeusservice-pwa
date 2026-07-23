// controllers/userController.js
const db = require("../config/db");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const {
  requirePersonalDataConsent,
  getPdConsentFields,
  PD_CONSENT_VERSION,
} = require("../db/initSmsAuth");

function formatUserForResponse(user) {
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

exports.generateQrString = async (req, res) => {
  try {
    const userId = req.user.id;
    const timestamp = Math.floor(Date.now() / 1000);
    const secretKey =
      process.env.QR_SECRET_KEY || "zeus_auto_super_secret_salt_2026";

    const hash = crypto
      .createHash("sha256")
      .update(`${userId}${timestamp}${secretKey}`)
      .digest("hex");

    const qrString = `${userId}:${timestamp}:${hash}`;

    res.json({ success: true, qrString });
  } catch (err) {
    console.error("Ошибка при генерации строки QR:", err);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при генерации QR-кода",
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar_url, car_brand } = req.body;
    const userId = req.user.id;

    await db.query(
      "UPDATE users SET name = COALESCE($1, name), avatar_url = COALESCE($2, avatar_url), car_brand = COALESCE($3, car_brand) WHERE id = $4 AND deleted_at IS NULL",
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
    const userId = req.user.id;

    if (!newPassword || newPassword.trim().length < 4) {
      return res
        .status(400)
        .json({ message: "Пароль должен быть не менее 4 символов" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword.trim(), salt);

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

exports.acceptPrivacyPolicy = async (req, res) => {
  try {
    if (!requirePersonalDataConsent(req.body, res)) return;

    const userId = req.user.id;
    const { pdConsentAt, pdConsentVersion } = getPdConsentFields();

    const result = await db.query(
      `UPDATE users SET pd_consent_at = $1, pd_consent_version = $2
       WHERE id = $3 AND deleted_at IS NULL
       RETURNING id, username, phone, name, role, visit_count, total_visits, created_at, car_brand, avatar_url, pd_consent_at, pd_consent_version`,
      [pdConsentAt, pdConsentVersion, userId],
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    res.json({
      success: true,
      mustAcceptPrivacyPolicy: false,
      currentPdConsentVersion: PD_CONSENT_VERSION,
      user: formatUserForResponse(user),
    });
  } catch (err) {
    console.error("Ошибка acceptPrivacyPolicy:", err);
    res.status(500).json({ message: "Не удалось сохранить согласие" });
  }
};

exports.withdrawConsentAndDeleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await db.query(
      "SELECT id, role, deleted_at FROM users WHERE id = $1",
      [userId],
    );
    const user = userResult.rows[0];

    if (!user || user.deleted_at) {
      return res.status(404).json({ message: "Аккаунт не найден" });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        message: "Администраторский аккаунт нельзя удалить через приложение",
      });
    }

    const deletedUsername = `deleted_${userId}_${Date.now()}`;

    await db.query(
      `UPDATE users SET
        name = $1,
        phone = NULL,
        username = $2,
        password_hash = NULL,
        car_brand = NULL,
        avatar_url = '1.png',
        pd_consent_withdrawn_at = NOW(),
        deleted_at = NOW()
       WHERE id = $3`,
      ["Удалённый пользователь", deletedUsername, userId],
    );

    res.json({
      success: true,
      message: "Согласие отозвано, персональные данные удалены",
    });
  } catch (err) {
    console.error("Ошибка withdrawConsentAndDeleteAccount:", err);
    res.status(500).json({ message: "Не удалось удалить аккаунт" });
  }
};
