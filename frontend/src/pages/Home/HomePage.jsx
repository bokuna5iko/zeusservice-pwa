// src/pages/Home/HomePage.jsx
import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { QRCodeCanvas } from "qrcode.react";
import "./HomePage.css";
import PointsGrid from "../../components/PointsGrid/PointsGrid";
import PackageCards from "../../components/PackageCards/PackageCards"; // Импортируем блок пакетов

const HomePage = () => {
  const { user, refreshProfile } = useContext(AuthContext);
  const [isZoomed, setIsZoomed] = useState(false);
  const [qrValue, setQrValue] = useState(null);

  // СМАРТ-ОБНОВЛЕНИЕ ГРИДЫ: Стейты контроля синхронизации и защиты от спама
  const [isSyncing, setIsSyncing] = useState(false); // Идет ли запрос к Postgres
  const [cooldown, setCooldown] = useState(false); // Активна ли 10-сек блокировка кнопки

  // Автообновление QR-кода раз в 60 секунд
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

  // ОБРАБОТЧИК КНОПКИ ОБНОВЛЕНИЯ С ЗАЩИТОЙ НА 10 СЕКУНД
  const handleManualRefresh = async () => {
    if (isSyncing || cooldown) return;

    setIsSyncing(true);

    try {
      // Принудительно стучимся в сеть за свежими визитами из PostgreSQL
      await refreshProfile();
    } catch (err) {
      console.error("Ошибка обновления визитов:", err);
    } finally {
      setIsSyncing(false);
      setCooldown(true);

      // Включаем кулдаун ровно на 10 секунд перед следующим кликом
      setTimeout(() => {
        setCooldown(false);
      }, 10000);
    }
  };

  const toggleZoom = () => setIsZoomed(!isZoomed);

  return (
    <div className="home-page">
      <div className="page-center-container">
        {/* КОНТЕЙНЕР №1: Личный QR-код */}
        <div className="home-card qr-container-box content-group-box">
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
            {/* Флекс-контейнер для заголовка и смарт-кнопки */}
            <div className="loyalty-header-row">
              <h3 className="card-title">Прогресс лояльности</h3>

              {/* Смарт-кнопка обновления визитов */}
              <button
                type="button"
                className={`grid-sync-btn ${isSyncing ? "syncing" : ""} ${cooldown ? "cooldown-active" : ""}`}
                disabled={isSyncing || cooldown}
                onClick={handleManualRefresh}
                title={
                  cooldown ? "Подождите 10 секунд" : "Синхронизировать визиты"
                }
              >
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>

            {/* Вставляем нашу сетку кружочков */}
            <PointsGrid visitCount={user?.visit_count || 0} />

            <div className="loyalty-footer-hint">
              {user?.visit_count < 8
                ? `Осталось визитов до подарка: ${8 - user?.visit_count}`
                : "Подарок доступен!"}
            </div>
          </div>
        </div>

        {/* КОНТЕЙНЕР №2 Выгодные пакеты (В разработке) */}
        <PackageCards />
      </div>

      {/* Модальное окно для увеличенного QR */}
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
