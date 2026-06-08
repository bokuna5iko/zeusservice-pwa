// src/pages/Home/HomePage.jsx
import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { QRCodeCanvas } from "qrcode.react";
import "./HomePage.css";
import PointsGrid from "../../components/PointsGrid/PointsGrid";

const HomePage = () => {
  // 🌟 Достаем метод ручного обновления профиля из контекста
  const { user, refreshProfile } = useContext(AuthContext);
  const [isZoomed, setIsZoomed] = useState(false);
  const [qrValue, setQrValue] = useState(null);

  // 🌟 СТЭЙТЫ ДЛЯ МЕХАНИКИ PULL-TO-REFRESH
  const [startY, setStartY] = useState(0); // Точка касания пальца
  const [pullDistance, setPullDistance] = useState(0); // Расстояние свайпа в пикселях
  const [isRefreshing, setIsRefreshing] = useState(false); // Идет ли сетевой запрос

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

  // 🌟 ОБРАБОТЧИКИ НАДТИВНЫХ ТАЧ-ЖЕСТОВ СМАРТФОНА
  const handleTouchStart = (e) => {
    // Начинаем отслеживать жест только если скролл находится на самом верху страницы
    if (window.scrollY === 0 && !isRefreshing) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (window.scrollY > 0 || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;

    if (diff > 0) {
      // Применяем упругое логарифмическое сопротивление (резист), чтобы экран тянулся плавно
      const resistance = Math.min(diff * 0.4, 74);
      setPullDistance(resistance);
    }
  };

  const handleTouchEnd = async () => {
    if (isRefreshing) return;

    // Если экран оттянули вниз больше чем на 55px — запускаем принудительный рефреш
    if (pullDistance > 55) {
      setIsRefreshing(true);
      setPullDistance(55); // Фиксируем спиннер в активном положении

      try {
        // Атакуем базу данных Postgres живым HTTP-запросом через Network Only
        await refreshProfile();
      } catch (err) {
        console.error(err);
      } finally {
        // Плавно возвращаем верстку в исходное положение без резких прыжков
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 400);
      }
    } else {
      // Если натянули мало — просто плавно прячем плашку обратно
      setPullDistance(0);
    }
  };

  const toggleZoom = () => setIsZoomed(!isZoomed);

  return (
    // Навешиваем тач-слушатели на корневой див страницы
    <div
      className="home-page"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 🌟 ВЫЕЗЖАЮЩИЙ ТЕМНЫЙ НЕОНОВЫЙ СПИННЕР ОБНОВЛЕНИЯ */}
      <div
        className={`pull-to-refresh-loader ${isRefreshing ? "refreshing" : ""}`}
        style={{
          transform: `translateY(${pullDistance}px)`,
          opacity: pullDistance > 10 ? 1 : 0,
        }}
      >
        <div className="ptr-spinner-circle">
          <i className={`fas fa-sync-alt ${isRefreshing ? "fa-spin" : ""}`}></i>
        </div>
      </div>

      {/* Контентная оболочка, которая плавно сдвигается вниз вслед за спиннером */}
      <div
        className="page-center-container ptr-anim-content"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isRefreshing ? "none" : "transform 0.3s ease-out",
        }}
      >
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
            <h3 className="card-title">Progress лояльности</h3>
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
