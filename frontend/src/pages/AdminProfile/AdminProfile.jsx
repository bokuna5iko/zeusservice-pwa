import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './AdminProfile.css';
import PriceListModal from "../../components/PriceList/PriceListModal";

const AdminProfile = () => {
  const { user } = useContext(AuthContext); // Достаем текущего администратора из контекста
  const [activeModal, setActiveModal] = useState(null); // Состояния: 'prices' | 'kb' | 'theme' | null
  const { logout } = useContext(AuthContext)
  
  const handleLogout = () => {
  // Вызываем глобальный метод из контекста, который очистит правильный accessToken
  // и красиво переключит экран приложения без жесткой перезагрузки страницы
  logout(); 
};

  return (
    <div className="admin-profile-page">
      <div className="page-center-container">
        
        {/* ==========================================================================
            КОНТЕЙНЕР №1: ШАПКА ПРОФИЛЯ (ЛИЧНЫЕ ДАННЫЕ)
            ========================================================================== */}
        <div className="admin-profile-card content-group-box">
          <div className="admin-avatar-section">
            <div className="admin-avatar-wrapper">
              {/* Дефолтная иконка-заглушка вместо редактируемой аватарки */}
              <i className="fas fa-user-shield admin-default-avatar"></i>
            </div>
          </div>

          <div className="admin-info-rows-group">
            {/* ФИО */}
            <div className="admin-profile-row">
              <label className="admin-row-label">ФИО Администратора</label>
              <div className="admin-row-value">{user?.name || 'Загрузка...'}</div>
            </div>

            {/* Телефон */}
            <div className="admin-profile-row">
              <label className="admin-row-label">Номер телефона</label>
              <div className="admin-row-value">{user?.phone ? `+${user.phone}` : '—'}</div>
            </div>

            {/* Роль */}
            <div className="admin-profile-row">
              <label className="admin-row-label">Роль в системе</label>
              <div className="admin-role-badge">Админ</div>
            </div>
          </div>
        </div>

        {/* ==========================================================================
            КОНТЕЙНЕР №2: РАБОЧЕЕ МЕНЮ (СПИСОК КНОПОК)
            ========================================================================== */}
        <div className="admin-profile-card content-group-box admin-menu-box">
          
          {/* 1. Полный прейскурант */}
          <div className="admin-menu-item" onClick={() => setActiveModal('prices')}>
            <div className="admin-menu-left">
              <i className="fas fa-list-alt admin-menu-icon"></i>
              <span>Полный прейскурант</span>
            </div>
            <i className="fas fa-chevron-right admin-menu-arrow"></i>
          </div>

          {/* 2. База знаний */}
          <div className="admin-menu-item" onClick={() => setActiveModal('kb')}>
            <div className="admin-menu-left">
              <i className="fas fa-book-reader admin-menu-icon"></i>
              <span>База знаний</span>
            </div>
            <i className="fas fa-chevron-right admin-menu-arrow"></i>
          </div>

          {/* 3. Техподдержка */}
          <div className="admin-menu-item" onClick={() => window.open('https://t.me/hi_i_am_sozu', '_blank')}>
            <div className="admin-menu-left">
              <i className="fas fa-headset admin-menu-icon"></i>
              <span>Техподдержка</span>
            </div>
            <i className="fas fa-chevron-right admin-menu-arrow"></i>
          </div>

          {/* 4. Выбор темы */}
          <div className="admin-menu-item" onClick={() => setActiveModal('theme')}>
            <div className="admin-menu-left">
              <i className="fas fa-paint-brush admin-menu-icon"></i>
              <span>Выбор темы</span>
            </div>
            <i className="fas fa-chevron-right admin-menu-arrow"></i>
          </div>

        </div>

        {/* ==========================================================================
            КОНТЕЙНЕР №3: СИСТЕМНАЯ КНОПКА (ВЫХОД)
            ========================================================================== */}
        <button className="admin-logout-btn" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i>
          <span>Выйти из аккаунта</span>
        </button>

      </div>

      {/* ==========================================================================
          МОДАЛЬНЫЕ ОКНА СТРАНИЦЫ
          ========================================================================== */}

      {/* 1. Прейскурант (Твой готовый компонент, адаптированный под стили) */}
      <PriceListModal 
        isOpen={activeModal === 'prices'} 
        onClose={() => setActiveModal(null)} 
      />

      {/* 2. Модалка: База знаний (Инструкции "для 10-летнего ребёнка") */}
      {activeModal === 'kb' && (
        <div className="admin-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setActiveModal(null)}>&times;</button>
            
            <div className="admin-modal-header">
              <h3><i className="fas fa-graduation-cap"></i> Шпаргалка для работы</h3>
            </div>
            
            <div className="admin-modal-body text-instructions">
              <div className="kb-step-card">
                <h4>1. Как отсканировать клиента?</h4>
                <p>Зайди на <strong>Главный экран</strong> и нажми на большую круглую кнопку со сканером. Включится камера. Наведи её на экран телефона клиента (там должен быть открыт его QR-код). Приложение пикнет и само откроет его профиль!</p>
              </div>

              <div className="kb-step-card">
                <h4>2. Что делать, если у клиента 4-й или 8-й визит?</h4>
                <p>Когда ты отсканируешь код, приложение само подскажет, какой это заезд. <br />
                   • Если <strong>4-й визит</strong> — посчитай ему услугу ровно за <strong>половину цены (Скидка 50%)</strong>.<br />
                   • Если <strong>8-й визит</strong> — это праздник! Мы моем машину <strong>абсолютно БЕСПЛАТНО</strong>. <br />
                   После этого обязательно нажми кнопку «Подтвердить заезд» на экране.</p>
              </div>

              <div className="kb-step-card">
                <h4>3. Как записать гостя без QR-кода?</h4>
                <p>Если у клиента старый телефон, нет интернета или он не хочет скачивать приложение — всё в порядке! На <strong>Главном экране</strong> нажми маленькую кнопку <strong>«Оформить гостя»</strong>. Просто руками выбери тип его машины, нужную услугу, способ оплаты и нажми «Создать». Готово!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Модалка: Выбор темы (Пустой шелл-каркас) */}
      {activeModal === 'theme' && (
        <div className="admin-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setActiveModal(null)}>&times;</button>
            
            <div className="admin-modal-header">
              <h3><i className="fas fa-palette"></i> Цветовая тема</h3>
            </div>
            
            <div className="admin-modal-body empty-shell">
              <div className="shell-placeholder-notice">
                <i className="fas fa-tools animate-pulse"></i>
                <p>Раздел настроек оформления находится в разработке.</p>
                <span>Сейчас по умолчанию активна фирменная темная тема панели администратора.</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminProfile;