const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res
      .status(401)
      .json({ message: "Доступ запрещен (токен отсутствует)" });

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your_jwt_secret_key",
    (err, user) => {
      if (err)
        return res
          .status(403)
          .json({ message: "Неверный или просроченный токен" });
      req.user = user;
      next();
    },
  );
};

const adminOnly = (req, res, next) => {
  console.log("🔍 [DEBUG] Проверка прав. req.user:", req.user);

  if (req.user && (req.user.role === "admin" || req.user.role === "owner")) {
    next();
  } else {
    console.log("❌ [DEBUG] Доступ запрещен для роли:", req.user?.role);
    res.status(403).json({
      message: "Доступ запрещен: у вас нет прав администратора или владельца",
    });
  }
};

// Не забудь добавить её в exports в конце файла
module.exports = {
  authenticateToken,
  adminOnly,
};
