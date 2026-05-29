// src/pages/Home/HomePage.jsx
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import './HomePage.css';
import PointsGrid from '../../components/PointsGrid/PointsGrid';

const HomePage = () => {
  const { user } = useContext(AuthContext);
  const [isZoomed, setIsZoomed] = useState(false);
  // 🌟 Добавляем стейт для хранения динамической безопасной строки QR-кода
  const [qrValue, setQrValue] = useState('Загрузка кода...');

  // 🌟 ЛОГИКА ДИНАМИЧЕСКОГО ОБНОВЛЕНИЯ QR С СЕРВЕРА
  useEffect(() => {
    if (!user) return;

    const fetchSecureQr = async () => {
      try {
        // Достаем токен авторизации клиента (из ProfilePages мы знаем, что он лежит в 'token')
        const token = localStorage.getItem('token');
        
        const res = await fetch('/api/qr/generate', {
          method: 'GET',
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });

        const data = await res.json();
        if (data.success && data.qrString) {
          setQrValue(data.qrString); // Сажаем безопасную строку userId:timestamp:hash в QR
        }
      } catch (err) {
        console.error('Ошибка при получении динамического QR:', err);
        setQrValue('Ошибка загрузки кода');
      }
    };

    // Вызываем генерацию сразу при открытии вкладки
    fetchSecureQr();

    // 🌟 Запускаем интервал: каждые 60 секунд запрашиваем бэк и обновляем QR-код
    const intervalId = setInterval(fetchSecureQr, 60000);

    // Зачищаем интервал при уходе со страницы
    return () => clearInterval(intervalId);
  }, [user]);

  const toggleZoom = () => setIsZoomed(!isZoomed);

  return (
    <div className="home-page">
      <div className="page-center-container">
        
        {/* КОНТЕЙНЕР №1: Личный QR-код */}
        <div className={`home-card qr-container-box content-group-box ${isZoomed ? 'zoomed' : ''}`}>
          <div className="fill-zone">
            <p className="qr-label">Ваш идентификатор</p>
            
            {/* Обертка для клика */}
            <div className="qr-wrapper" onClick={toggleZoom}>
              <QRCodeCanvas 
                value={qrValue} 
                size={180} 
                bgColor={"#ffffff"}
                fgColor={"#1e3c72"}
                level={"H"}
                includeMargin={true}
              />
            </div>

            <h3 className="user-display-name">{user?.name || 'Загрузка...'}</h3>
          </div>
        </div>

        {/* КОНТЕЙНЕР №2: Статус лояльности */}
        <div className="home-card loyalty-progress-box content-group-box">
          <div className="fill-zone">
            <h3 className="card-title">Progress лояльности</h3>
    
             {/* Вставляем сетку */}
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
                <span className="value">{user?.role === 'admin' ? 'Админ' : 'Клиент'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ШАГ 2: Модальное окно для увеличенного QR */}
      {isZoomed && (
        <div className="qr-modal-overlay" onClick={toggleZoom}>
          <div className="qr-modal-content">
             <QRCodeCanvas 
                value={qrValue} 
                size={280} // 🌟 ИСПРАВЛЕНО: Увеличили размер до 280 для идеального сканирования
                bgColor={"#ffffff"}
                fgColor={"#000000"} // Черный цвет для максимального контраста под камерой
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