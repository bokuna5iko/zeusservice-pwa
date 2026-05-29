// src/pages/Profile/ProfilePage.jsx
import React, { useState, useContext, useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { AuthContext } from "../../context/AuthContext";
import "./ProfilePages.css";
import PriceListModal from "../../components/PriceList/PriceListModal";

const ProfilePage = () => {
  const { user, setUser, logout } = useContext(AuthContext);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'prices' или 'kb' или null

  // ИНИЦИАЛИЗИРУЕМ СИСТЕМУ ОБНОВЛЕНИЯ PWA
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (r) {
        r.update();
        setInterval(() => {
          r.update();
        }, 10000);
      }
    },
  });

  useEffect(() => {
    if (user?.name) {
      setNewName(user.name);
    }
  }, [user]);

  const handlePwaUpdate = async () => {
    try {
      await updateServiceWorker(true);
      setTimeout(() => {
        window.location.reload();
      }, 400);
    } catch (err) {
      window.location.reload();
    }
  };

  const updateProfile = async (field, value) => {
    try {
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      const response = await fetch("/api/user/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        setUser({ ...user, [field]: value });
        if (field === "name") setIsEditingName(false);
        if (field === "avatar_url") setShowAvatarPicker(false);
      }
    } catch (error) {
      console.error("Ошибка обновления профиля:", error);
    }
  };

  // 🌟 ИСПРАВЛЕНО: Теперь здесь прописаны все доступные аватарки!
  const avatars = ["1.png", "2.png", "3.png"];

  return (
    <div className="client-profile-page">
      <div className="page-center-container">
        {/* КОНТЕЙНЕР №1: Личные данные пользователя */}
        <div className="profile-card main-info-box content-group-box">
          <div className="fill-zone profile-header-content">
            {/* Аватарка с динамическим выводом */}
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

            {/* Телефон */}
            <div className="profile-info-row">
              <label className="profile-field-label">Номер телефона</label>
              <div className="profile-value disabled">
                <i className="fas fa-phone-alt"></i> {user?.phone || "—"}
              </div>
            </div>

            {/* Автомобиль */}
            <div className="profile-info-row">
              <label className="profile-field-label">Основной автомобиль</label>
              <div className="profile-car-brand-pill">
                <i className="fas fa-car"></i>
                <span>{user?.car_brand || "Добавить авто"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ПЛАШКА ОБНОВЛЕНИЯ PWA */}
        {needRefresh && (
          <div className="pwa-update-banner">
            <div className="pwa-update-text">
              <i className="fas fa-sync-alt fa-spin"></i>
              <span>Доступна новая версия Zeus Auto!</span>
            </div>
            <button className="pwa-update-btn" onClick={handlePwaUpdate}>
              Обновить приложение
            </button>
          </div>
        )}

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
              href="https://2gis.ru"
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
                  каждые 8 заездов:
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
