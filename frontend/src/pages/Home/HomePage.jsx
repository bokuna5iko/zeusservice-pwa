// src/pages/Home/HomePage.jsx
import React, { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { QRCodeCanvas } from "qrcode.react";
import "./HomePage.css";
import PointsGrid from "../../components/PointsGrid/PointsGrid";

const HomePage = () => {
  const { user, refreshProfile } = useContext(AuthContext);
  const [isZoomed, setIsZoomed] = useState(false);
  const [qrValue, setQrValue] = useState(null);

  // СТЭЙТЫ ДЛЯ АНИМАЦИИ ИНТЕРФЕЙСА
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ссылки на элементы для нативного внедрения непассивных слушателей
  const pageRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const fetchSecureQr = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch("/api/user/generate", {
          method: "GET",
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });

        const data = await res.json();
        if (data.success && data.qrString) {
          setQrValue(data.qrString);
        }
      } catch (err) {
        console.error("Ошибка при получении динамического QR:", err);
        setQrValue("Ошибка загрузки кода");
      }
    };

    fetchSecureQr();
    const intervalId = setInterval(fetchSecureQr, 60000);
    return () => clearInterval(intervalId);
  }, [user]);

  // 🌟 МОБИЛЬНЫЙ ЖЕСТ ДВИЖОК С ВЫСОКОЙ ТОЧНОСТЬЮ ОТКЛИКА
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;

    let startY = 0;
    let isTracking = false;

    const handleTouchStart = (e) => {
      const scrollContainer = document.querySelector(".page-content");
      // 🌟 ТРЮК №1: Зазор в 3 пикселя для борьбы с мобильными субпикселями Retina-экранов
      const isAtTop = scrollContainer ? scrollContainer.scrollTop <= 3 : true;

      if (isAtTop && !isRefreshing) {
        startY = e.touches[0].clientY;
        isTracking = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isTracking || isRefreshing) return;

      const scrollContainer = document.querySelector(".page-content");
      const isAtTop = scrollContainer ? scrollContainer.scrollTop <= 3 : true;

      if (!isAtTop) {
        isTracking = false;
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      if (diff > 0) {
        // 🌟 ТРЮК №2: Жестко глушим стандартный резиновый отскок браузера (Safari/Chrome).
        // Теперь смартфон слушается только наш код и не обрывает тач-событие!
        if (e.cancelable) e.preventDefault();

        const resistance = Math.min(diff * 0.4, 60);
        setPullDistance(resistance);
      }
    };

    const handleTouchEnd = async () => {
      if (!isTracking || isRefreshing) return;
      isTracking = false;

      // Снизили порог срабатывания до 40px для большего комфорта на маленьких экранах
      if (pullDistance > 40) {
        setIsRefreshing(true);
        setPullDistance(45);

        try {
          await refreshProfile(); // Живой Network Only пинг в PostgreSQL
        } catch (err) {
          console.error(err);
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          }, 400);
        }
      } else {
        setPullDistance(0);
      }
    };

    // Монтируем слушатели нативно с флагом { passive: false }, побеждая ограничения WebKit iOS
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, refreshProfile]);

  const toggleZoom = () => setIsZoomed(!isZoomed);

  return (
    <div className="home-page" ref={pageRef}>
      {/* Спиннер парит над контентом */}
      <div
        className={`pull-to-refresh-loader ${isRefreshing ? "refreshing" : ""}`}
        style={{
          transform: `translate3d(-50%, ${pullDistance}px, 0)`,
          opacity: pullDistance > 12 ? 1 : 0,
        }}
      >
        <div className="ptr-spinner-circle">
          <i className={`fas fa-sync-alt ${isRefreshing ? "fa-spin" : ""}`}></i>
        </div>
      </div>

      {/* Оболочка контента */}
      <div className="page-center-container">
        {/* КОНТЕЙНЕР №1: Личный QR-код */}
        <div
          className={`home-card qr-container-box content-group-box ${isZoomed ? "zoomed" : ""}`}
        >
          <div className="fill-zone">
            <p className="qr-label">Ваш QR</p>
            <div className="qr-wrapper" onClick={qrValue ? toggleZoom : null}>
              {qrValue ? (
                <QRCodeCanvas
                  value={qrValue}
                  size={180}
                  bgColor={"#ffffff"}
                  fgColor={"#1e3c72"}
                  level={"H"}
                  includeMargin={true}
                />
              ) : (
                <div className="qr-loading-placeholder">
                  <i className="fas fa-sync-alt fa-spin"></i>
                  <span>Генерация ключа...</span>
                </div>
              )}
            </div>
            <h3 className="user-display-name">{user?.name || "Загрузка..."}</h3>
          </div>
        </div>

        {/* КОНТЕЙНЕР №2: Статус лояльности */}
        <div className="home-card loyalty-progress-box content-group-box">
          <div className="fill-zone">
            <h3 className="card-title">Прогресс лояльности</h3>
            <PointsGrid visitCount={user?.visit_count || 0} />
            <div className="loyalty-footer-hint">
              {user?.visit_count < 8
                ? `Осталось визитов до подарка: ${8 - user?.visit_count}`
                : "Подарок доступен!"}
            </div>
          </div>
        </div>

        {/* КОНТЕЙНЕР №3: Бонусный баланс */}
        <div className="home-card balance-info-box content-group-box">
          <div className="fill-zone">
            <div className="balance-row">
              <div className="balance-item">
                <span className="label">Бонусы</span>
                <span className="value">{user?.bonus_points || 0} ₽</span>
              </div>
              <div className="balance-divider"></div>
              <div className="balance-item">
                <span className="label">Ранг</span>
                <span className="value">
                  {user?.role === "admin" ? "Админ" : "Клиент"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно QR */}
      {isZoomed && (
        <div className="qr-modal-overlay" onClick={toggleZoom}>
          <div className="qr-modal-content">
            <QRCodeCanvas
              value={qrValue}
              size={280}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"H"}
              includeMargin={true}
            />
            <p>Предъявите код администратору</p>
            <small>Нажмите, чтобы закрыть</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
