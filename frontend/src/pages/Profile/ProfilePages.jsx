import React, { useState, useContext, useEffect} from 'react';
import { AuthContext } from '../../context/AuthContext';
import './ProfilePages.css';
import PriceListModal from "../../components/PriceList/PriceListModal";
const ProfilePage = () => {
  const { user, setUser } = useContext(AuthContext); // Достаем юзера и функцию обновления
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName]= useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'prices' или 'settings' или null
  const [isDarkMode, setIsDarkMode] = useState(false); // Для темы

  useEffect(() => {
    if (user?.name) {
      setNewName(user.name);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login'; // Простой редирект на выход
  };

  const avatars = ['1.png'];

  // Функция сохранения (Имя или Аватар)
  const updateProfile = async (field, value) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ [field]: value })
      });

      if (response.ok) {
        // Обновляем данные в контексте, чтобы изменения применились везде
        setUser({ ...user, [field]: value });
        if (field === 'name') setIsEditingName(false);
        if (field === 'avatar_url') setShowAvatarPicker(false);
      }
    } catch (error) {
      console.error('Ошибка обновления:', error);
    }
  };

  return (
    <div className={`profile-page ${isDarkMode ? 'dark-theme' : ''}`}>
      <div className="page-center-container">
        
        {/* КОНТЕЙНЕР №1: Личные данные */}
        <div className="profile-card main-info-box content-group-box">
          <div className="fill-zone profile-header-content">
            
            {/* 1. Аватар */}
            <div className="avatar-section">
              <div className="avatar-wrapper" onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
                <img 
                  src={`/avatars/${user?.avatar_url || '1.png'}`} 
                  alt="Avatar" 
                  className="profile-avatar" 
                />
                <div className="avatar-edit-badge"><i className="fas fa-camera"></i></div>
              </div>
              
              {showAvatarPicker && (
                <div className="avatar-picker">
                  {avatars.map(img => (
                    <img 
                      key={img} 
                      src={`/avatars/${img}`} 
                      className="picker-img" 
                      onClick={() => updateProfile('avatar_url', img)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 2. Имя */}
            <div className="profile-info-row">
              <label>Ваше имя</label>
              <div className="input-with-action">
                {isEditingName ? (
                  <>
                    <input 
                      value={newName} 
                      onChange={(e) => setNewName(e.target.value)}
                      className="profile-input"
                    />
                    <button className="save-btn" onClick={() => updateProfile('name', newName)}>
                      <i className="fas fa-check"></i>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="profile-value">{user?.name}</span>
                    <button className="edit-btn" onClick={() => setIsEditingName(true)}>
                      <i className="fas fa-pen"></i>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 3. Телефон */}
            <div className="profile-info-row">
              <label>Номер телефона</label>
              <div className="profile-value disabled">{user?.phone}</div>
            </div>

            {/* 4. Марка машины */}
            <div className="profile-info-row">
              <label>Автомобиль</label>
              <div className="car-brand-badge">
                 <i className="fas fa-car"></i>
                 <span>{user?.car_brand || 'Добавить авто'}</span>
              </div>
            </div>

          </div>
        </div>

         {/* КОНТЕЙНЕР №2: Статистика и Статус */}
        <div className="profile-card stats-box content-group-box">
          <div className="fill-zone">
            <h3 className="section-title">Ваша активность</h3>
            
            <div className="stats-grid">
              {/* 1. Мой статус */}
              <div className="stat-item">
                <div className="stat-label">Мой статус</div>
                <div className="stat-value status-badge">Постоянный клиент</div>
              </div>

              {/* 2. Общее количество визитов */}
              <div className="stat-item">
                <div className="stat-label">Всего визитов</div>
                <div className="stat-value">{user?.total_visits || 0}</div>
              </div>

              {/* 3. Дата регистрации */}
              <div className="stat-item">
                <div className="stat-label">В клубе с</div>
                <div className="stat-value">
                  {user?.created_at 
                    ? new Date(user.created_at).toLocaleDateString('ru-RU') 
                    : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* КОНТЕЙНЕР №3: Меню действий */}
        <div className="profile-card actions-box content-group-box">
          <div className="fill-zone">
            
            {/* 1. Прейскурант */}
            <div className="action-item" onClick={() => setActiveModal('prices')}>
              <div className="action-left">
                <i className="fas fa-list-alt"></i>
                <span>Прейскурант</span>
              </div>
              <i className="fas fa-chevron-right"></i>
            </div>

            {/* 2. Настройки */}
            <div className="action-item" onClick={() => setActiveModal('settings')}>
              <div className="action-left">
                <i className="fas fa-cog"></i>
                <span>Настройки</span>
              </div>
              <i className="fas fa-chevron-right"></i>
            </div>

            {/* 3. Выход */}
            <div className="action-item logout" onClick={handleLogout}>
              <div className="action-left">
                <i className="fas fa-sign-out-alt"></i>
                <span>Выйти из аккаунта</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 1. ПРЕЙСКУРАНТ (Новый отдельный компонент) */}
      <PriceListModal 
        isOpen={activeModal === 'prices'} 
        onClose={() => setActiveModal(null)} 
      />

      {/* 2. НАСТРОЙКИ (Оставляем в универсальном оверлее, пока не вынесли в отдельный файл) */}
      {activeModal === 'settings' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setActiveModal(null)}>&times;</button>
            
            <div className="modal-body">
              <h2>Настройки</h2>
              <div className="setting-row">
                <span>Тёмная тема</span>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={isDarkMode} 
                    onChange={() => setIsDarkMode(!isDarkMode)} 
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>
          
        </div>
      )}
</div>
  )
}
export default ProfilePage;