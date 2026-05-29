// src/components/AdminScanner/AdminScanner.jsx
import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../../api/apiService'; // Используем наш проверенный apiService
import './AdminScanner.css'; 

const AdminScanner = ({ isOpen, onClose, onClientScanned }) => {
  const [scanError, setScanError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return; 

    setScanError(null);
    setLoading(false);

    const html5Qrcode = new Html5Qrcode("qr-reader");
    let isStopping = false; // Защита от двойной остановки камеры

    // 🌟 ШАГ 1: Динамическая функция расчета адаптивного окна сканирования (qrbox)
    // Она берет реальные размеры видеопотока на экране и выделяет под сканирование ровно 70% площади.
    // Больше админу не придется ловить ювелирные миллиметры — код будет считываться легко!
    const qrboxFunction = (viewfinderWidth, viewfinderHeight) => {
      const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
      const qrboxSize = Math.floor(minEdge * 0.70); // 70% от меньшей стороны
      
      // Страховка: окно не должно быть меньше 200px и больше 350px
      const finalSize = Math.max(200, Math.min(350, qrboxSize));
      
      return {
        width: finalSize,
        height: finalSize
      };
    };

    // 🌟 ШАГ 2: Новая разогнанная конфигурация сканера
    const config = { 
      fps: 25, // ИСПРАВЛЕНО: Подняли с 10 до 25 кадров в секунду. Дрожание рук больше не смажет кубики QR!
      qrbox: qrboxFunction, // ИСПРАВЛЕНО: Заменили жесткий размер на адаптивную функцию
      aspectRatio: 1.0 // Просим браузер выдать квадратное соотношение сторон для точности холста
    };

    const onScanSuccess = async (decodedText) => {
      if (!decodedText || isStopping) return;
      
      setLoading(true);
      setScanError(null);

      // 1. ПАРСИНГ СТРОКИ QR-КОДА ("ID:YYYY-MM-DD")
      const qrParts = decodedText.split(':');
      const clientId = qrParts[0];
      const qrDateSeed = qrParts[1];

      const todayDate = new Date().toISOString().split('T')[0];

      // 2. ВАЛИДАЦИЯ ДАТЫ (Защита от скриншотов)
      if (!clientId || !qrDateSeed || qrDateSeed !== todayDate) {
        setScanError('Срок действия QR-кода истек. Попросите клиента обновить экран.');
        setLoading(false);
        return; 
      }

      try {
        // Устанавливаем флаг и тушим камеру до запроса к серверу
        isStopping = true;
        await html5Qrcode.stop();

        // 3. ОТПРАВКА ЗАПРОСА ЧЕРЕЗ ОБНОВЛЕННЫЙ API SERVICE
        const response = await api.verifyUserByQr(clientId);
        
        // Передаем чистые данные (.data из axios) наверх в AdminHome
        onClientScanned(response.data);

      } catch (err) {
        console.error("Ошибка при проверке QR:", err);
        // Вытаскиваем ошибку из axios или берем дефолтную
        setScanError(err.response?.data?.message || 'Пользователь не найден или ошибка сервера');
        
        // Окно закроется через 3 секунды, чтобы админ успел прочитать ошибку
        setTimeout(() => { onClose(); }, 3000);
      } finally {
        setLoading(false);
      }
    };

    // Запускаем заднюю камеру с дополнительными подсказками для автофокуса
    html5Qrcode.start(
      { facingMode: "environment" }, 
      config,
      onScanSuccess,
      () => { /* Игнорируем фоновые промахи камеры */ }
    ).catch(err => {
      console.error("Не удалось запустить камеру:", err);
      setScanError("Камера недоступна или заблокирована. Проверьте разрешения в настройках iOS/Safari.");
    });

    // Деструктор при закрытии крестиком
    return () => {
      if (html5Qrcode.isScanning && !isStopping) {
        html5Qrcode.stop().catch(err => console.error('Ошибка остановки камеры', err));
      }
    };
  }, [isOpen, onClientScanned, onClose]);

  if (!isOpen) return null; 

  return (
    <div className="scanner-modal-overlay" onClick={onClose}>
      <div className="scanner-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="scanner-modal-header">
          <h2>Сканирование QR-кода клиента</h2>
          <button className="scanner-close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="scanner-modal-body">
          <p className="scanner-subtitle">Наведите камеру на QR-код в приложении клиента</p>
          
          {/* Контейнер ридера */}
          <div id="qr-reader" className="qr-reader-box"></div>
          
          {loading && <div className="scanner-status loading">Проверка клиента в базе...</div>}
          {scanError && <div className="scanner-status error">❌ {scanError}</div>}
        </div>
      </div>
    </div>
  );
};

export default AdminScanner;