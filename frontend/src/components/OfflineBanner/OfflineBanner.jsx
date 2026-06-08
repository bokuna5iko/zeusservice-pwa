// frontend/src/components/OfflineBanner/OfflineBanner.jsx
import React from "react";
import "./OfflineBanner.css";

const OfflineBanner = ({
  show,
  type = "offline",
  message,
  pendingCount = 0,
  onClose,
}) => {
  if (!show) return null;

  const bannerClass = `offline-banner ${type}`;

  return (
    <div className={bannerClass}>
      <div className="banner-content">
        <span className="banner-icon">
          {type === "offline" && "⚠️"}
          {type === "success" && "✅"}
          {type === "error" && "❌"}
        </span>
        <span className="banner-text">
          {message ||
            (type === "offline"
              ? `⚠️ Режим ЧП: Интернет отсутствует. Новые записи (${pendingCount}) сохраняются локально.`
              : type === "success"
                ? "✅ Все данные успешно синхронизированы с базой"
                : "❌ Ошибка синхронизации")}
        </span>
      </div>
      {type !== "offline" && (
        <button className="banner-close" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
};

export default OfflineBanner;
