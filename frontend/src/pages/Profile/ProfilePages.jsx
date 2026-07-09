// src/pages/Profile/ProfilePage.jsx
import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import "./ProfilePages.css";
import PriceListModal from "../../components/PriceList/PriceListModal";

// 🌟 ДОБАВЛЕНО: Импортируем менеджер установки для резервного входа
import PwaOnboardingManager from "../../components/PwaOnboardingManager/PwaOnboardingManager";

const ProfilePage = () => {
  // 🌟 ИСПРАВЛЕНО: Теперь деструктурируем setUser из контекста!
  const { user, setUser, logout } = useContext(AuthContext);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  // 🌟 Новые стейты для интерактивного редактирования авто
  const [isEditingCar, setIsEditingCar] = useState(false);
  const [newCarBrand, setNewCarBrand] = useState("");

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'prices' | 'kb' | null

  // 🌟 ДОБАВЛЕНО: Стейты для резервного управления PWA из профиля
  const [isPwaInstalled, setIsPwaInstalled] = useState(true);
  const [showNotificationDot, setShowNotificationDot] = useState(false);
  const [forcePlatform, setForcePlatform] = useState(null); // 'android' | 'ios' | null

  // 🌟 Синхронизация полей с данными из базы данных и проверка статуса PWA
  useEffect(() => {
    if (user?.name) {
      setNewName(user.name);
    }
    if (user?.car_brand) {
      setNewCarBrand(user.car_brand);
    }

    // 🌟 Проверка: если открыто уже как PWA — пункт установки не нужен
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone;
    setIsPwaInstalled(isStandalone);

    if (!isStandalone) {
      // 🌟 Проверяем, скрыл ли пользователь баннер на главной на 7 дней
      const dismissedTime = localStorage.getItem("zeus_pwa_prompt_dismissed");
      if (dismissedTime) {
        const diffDays =
          (Date.now() - Number(dismissedTime)) / (1000 * 60 * 60 * 24);
        if (diffDays < 7) {
          // 🌟 Баннер на главной скрыт по тайм-ауту ➔ зажигаем неоновую точку в профиле!
          setShowNotificationDot(true);
        }
      } else {
        setShowNotificationDot(true);
      }
    }
  }, [user]);

  // 🌟 ДОБАВЛЕНО: Обработчик клика по пункту меню установки PWA
  const handleTriggerPwaInstall = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();

    // 🌟 Для тестов на ПК (десктопах) или Android принудительно отдаем 'android'
    const isIOS = /iphone|ipad|ipod/.test(userAgent);

    // 🌟 Передаем принудительный триггер ОС в менеджер онбординга
    setForcePlatform(isIOS ? "ios" : "android");

    // 🌟 Погашаем неоновую точку-маркер, так как пользователь нажал на пункт
    setShowNotificationDot(false);
  };

  // 🌟 ИСПРАВЛЕНО: Функция обновления профиля с правильным использованием setUser
  const updateProfile = async (field, value) => {
    console.log(`🔄 Обновление профиля: ${field} = ${value}`);

    if (!value || String(value).trim() === "") {
      alert("Поле не может быть пустым");
      return;
    }

    try {
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");

      console.log("📤 Отправка запроса...");

      const response = await fetch("/api/user/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: value }),
      });

      console.log("📥 Ответ получен:", response.status);

      if (response.ok) {
        console.log("✅ Успешно сохранено в БД");

        // 🌟 ИСПРАВЛЕНО: Теперь setUser доступен и работает!
        setUser({ ...user, [field]: value });

        // 🌟 Закрываем режим редактирования
        if (field === "name") setIsEditingName(false);
        if (field === "avatar_url") setShowAvatarPicker(false);
        if (field === "car_brand") {
          setIsEditingCar(false);
          console.log("✅ Автомобиль сохранён:", value);
        }
      } else {
        const errorData = await response.json();
        console.error("❌ Ошибка:", errorData);
        alert(
          `Ошибка сохранения: ${errorData.message || "Неизвестная ошибка"}`,
        );
      }
    } catch (error) {
      console.error("❌ Критическая ошибка:", error);
      alert("Ошибка соединения с сервером");
    }
  };

  const avatars = ["1.png", "2.png", "3.png"];

  return (
    <div className="client-profile-page">
      <div className="page-center-container">
        {/* КОНТЕЙНЕР №1: Личные данные пользователя */}
        <div className="profile-card main-info-box content-group-box">
          <div className="fill-zone profile-header-content">
            {/* Аватарка */}
            <div className="avatar-section">
              <div
                className="avatar-wrapper"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              >
                <img
                  src={`/avatars/${user?.avatar_url || "1.png"}`}
                  alt="Avatar"
                  className="profile-avatar"
                />
                <div className="avatar-edit-badge">
                  <i className="fas fa-camera"></i>
                </div>
              </div>

              {showAvatarPicker && (
                <div className="avatar-picker">
                  {avatars.map((img) => (
                    <img
                      key={img}
                      src={`/avatars/${img}`}
                      className="picker-img"
                      alt="picker"
                      onClick={() => updateProfile("avatar_url", img)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Поле имени */}
            <div className="profile-info-row">
              <label className="profile-field-label">Ваше имя</label>
              <div className="input-with-action">
                {isEditingName ? (
                  <div className="edit-input-wrapper">
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="profile-input"
                      maxLength={30}
                    />
                    <button
                      className="profile-save-btn"
                      onClick={() => updateProfile("name", newName)}
                    >
                      <i className="fas fa-check"></i>
                    </button>
                  </div>
                ) : (
                  <div className="display-value-wrapper">
                    <span className="profile-value">
                      {user?.name || "Не указано"}
                    </span>
                    <button
                      className="profile-edit-btn"
                      onClick={() => setIsEditingName(true)}
                    >
                      <i className="fas fa-pen"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 🌟 Зона автомобиля - улучшенный интерфейс редактирования */}
            <div className="profile-section">
              <label className="profile-label">
                <i className="fas fa-car"></i> Основной автомобиль
              </label>
              {isEditingCar ? (
                <div className="edit-car-section">
                  <div className="input-with-icon">
                    <i className="fas fa-car-side input-icon"></i>
                    <input
                      type="text"
                      value={newCarBrand}
                      onChange={(e) => setNewCarBrand(e.target.value)}
                      className="profile-input car-input"
                      placeholder="Например: Toyota Camry"
                      maxLength={40}
                      autoFocus
                    />
                  </div>
                  <div className="car-edit-buttons">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingCar(false);
                        setNewCarBrand(user?.car_brand || "");
                      }}
                      className="profile-btn profile-btn-cancel"
                    >
                      <i className="fas fa-times"></i> Отмена
                    </button>
                    <button
                      type="button"
                      onClick={() => updateProfile("car_brand", newCarBrand)}
                      className="profile-btn profile-btn-save"
                    >
                      <i className="fas fa-check"></i> Сохранить
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`profile-value car-field ${!user?.car_brand ? "empty-car" : ""}`}
                  onClick={() => setIsEditingCar(true)}
                >
                  <i
                    className={`fas ${user?.car_brand ? "fa-car" : "fa-plus-circle"}`}
                  ></i>
                  <span>{user?.car_brand || "Добавить автомобиль"}</span>
                  <i className="fas fa-chevron-right edit-indicator"></i>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* КОНТЕЙНЕР №2: Статистика активности */}
        <div className="profile-card stats-box content-group-box">
          <div className="fill-zone">
            <h3 className="profile-section-title">Ваша активность</h3>

            <div className="stats-grid">
              <div className="profile-stat-item">
                <span className="stat-label">Мой статус</span>
                <span className="profile-status-badge">Постоянный клиент</span>
              </div>

              <div className="profile-stat-item">
                <span className="stat-label">Всего визитов</span>
                <span className="stat-value-highlight">
                  {user?.total_visits || 0}
                </span>
              </div>

              <div className="profile-stat-item">
                <span className="stat-label">В клубе с</span>
                <span className="stat-value-text">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("ru-RU")
                    : "27.05.2026"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* КОНТЕЙНЕР №3: Меню действий */}
        <div className="profile-card actions-box content-group-box">
          <div className="fill-zone">
            {/* 🌟 Резервный пункт меню установки PWA */}
            {!isPwaInstalled && (
              <div
                className="profile-action-item pwa-menu-item"
                onClick={handleTriggerPwaInstall}
              >
                <div className="action-left" style={{ position: "relative" }}>
                  <i className="fas fa-mobile-alt text-blue"></i>
                  <span>Установить приложение</span>
                  {showNotificationDot && (
                    <span
                      className="notification-pulsing-dot"
                      style={{ left: "18px", top: "-2px" }}
                    ></span>
                  )}
                </div>
                <i className="fas fa-chevron-right arrow-gray"></i>
              </div>
            )}

            <div
              className="profile-action-item"
              onClick={() => setActiveModal("prices")}
            >
              <div className="action-left">
                <i className="fas fa-list-alt text-blue"></i>
                <span>Прейскурант</span>
              </div>
              <i className="fas fa-chevron-right arrow-gray"></i>
            </div>

            <div
              className="profile-action-item"
              onClick={() => setActiveModal("kb")}
            >
              <div className="action-left">
                <i className="fas fa-book-reader text-blue"></i>
                <span>База знаний</span>
              </div>
              <i className="fas fa-chevron-right arrow-gray"></i>
            </div>

            <a
              href="https://2gis.ru/yakutsk/geo/70000001111507207/129.723198,62.047054"
              target="_blank"
              rel="noopener noreferrer"
              className="profile-action-item navigation-link"
            >
              <div className="action-left">
                <i className="fas fa-map-marker-alt text-blue"></i>
                <span>Как добраться?</span>
              </div>
              <i className="fas fa-chevron-right arrow-gray"></i>
            </a>

            <div className="profile-action-item logout-row" onClick={logout}>
              <div className="action-left">
                <i className="fas fa-sign-out-alt text-red"></i>
                <span>Выйти из аккаунта</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* МОДАЛКА №1: ПРЕЙСКУРАНТ */}
      <PriceListModal
        isOpen={activeModal === "prices"}
        onClose={() => setActiveModal(null)}
      />

      {/* 🌟 ИСПРАВЛЕНО: Менеджер примонтирован всегда и сбрасывает стейт через onClose */}
      <PwaOnboardingManager
        forceOpenPlatform={forcePlatform}
        onClose={() => setForcePlatform(null)}
      />

      {/* МОДАЛКА №2: БАЗА ЗНАНИЙ */}
      {activeModal === "kb" && (
        <div
          className="profile-modal-overlay"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="profile-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="profile-close-modal"
              onClick={() => setActiveModal(null)}
            >
              &times;
            </button>

            <div className="profile-modal-body text-instructions">
              <h2 className="modal-title-text">
                <i className="fas fa-graduation-cap"></i> Памятка клуба
                лояльности
              </h2>

              <div className="kb-step-card">
                <h4>1. Как зафиксировать свой заезд?</h4>
                <p>
                  Перед оплатой услуг на кассе откройте вкладку{" "}
                  <strong>«Моя карта»</strong> и покажите ваш персональный
                  QR-код администратору. Он моментально отсканирует его, и визит
                  запишется на вашу карту за долю секунды!
                </p>
              </div>

              <div className="kb-step-card">
                <h4>2. Какие бонусы я получаю в цикле?</h4>
                <p>
                  Наша программа лояльности автоматически рассчитывает скидки
                  каждывые 8 заездов:
                  <br />• На <strong>4-й визит</strong> система активирует для
                  вас гарантированную <strong>скидку 20%</strong> на текущую
                  мойку.
                  <br />• На <strong>8-й визит</strong> происходит магия
                  лояльности — мы моем вашу машину{" "}
                  <strong>абсолютно БЕСПЛАТНО!</strong>
                  <br />
                  После получения подарка цикл автоматически обновляется.
                </p>
              </div>

              <div className="kb-step-card">
                <h4>3. Что делать, если неверно указан автомобиль?</h4>
                <p>
                  Если марка вашей машины изменилась или в поле профиля
                  отображается статус «Добавить авто» — просто сообщите
                  актуальные данные нашему администратору при следующем визите.
                  Он внесет изменения в единую базу данных за пару кликов.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
