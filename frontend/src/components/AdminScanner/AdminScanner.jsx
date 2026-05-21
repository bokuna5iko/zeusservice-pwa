import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { api } from '../../api/apiService'; // Твой правильный Axios сервис
import './AdminScanner.css'; 

// 👇 1. Добавляем пропсы isOpen и onClose для управления модалкой
const AdminScanner = ({ isOpen, onClose, onClientScanned }) => {
  const [scanError, setScanError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 👇 2. Если модалка закрыта — камеру не инициализируем
    if (!isOpen) return; 

    setScanError(null);
    setLoading(false);

    // Конфигурация сканера
    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,             // Скорость сканирования (кадры в сек)
      qrbox: { width: 250, height: 250 }, // Рамка прицела
      rememberLastUsedCamera: true
    });

    const onScanSuccess = async (decodedText) => {
      if (!decodedText) return;
      
      // Останавливаем сканер, чтобы избежать дублирующих запросов
      scanner.clear();
      setLoading(true);
      setScanError(null);

      try {
        // Твоя отличная проверка на метод
        const response = await api.getUserByQr 
          ? await api.getUserByQr(decodedText) 
          : await api.get(`/admin/users/verify/${decodedText}`);
        
        // Передаем данные клиента в родительский компонент, который откроет калькулятор
        onClientScanned(response.data);
      } catch (err) {
        console.error(err);
        setScanError(err.response?.data?.message || 'Ошибка проверки QR-кода');
        
        // 👇 Вместо window.location.reload() закрываем модалку через 3 секунды,
        // чтобы админ мог нажать кнопку снова, не ломая стейт всей страницы
        setTimeout(() => {
          onClose();
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    const onScanFailure = (error) => {
      // Камера сканирует непрерывно, ошибки фокуса нормальны
    };

    scanner.render(onScanSuccess, onScanFailure);

    // 👇 3. Обязательно глушим камеру при закрытии модалки (размонтировании)
    return () => {
      scanner.clear().catch(err => console.error('Ошибка остановки сканера', err));
    };
  }, [isOpen, onClientScanned, onClose]);

  // 👇 4. Если закрыто — ничего не рендерим
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
          
          {/* Твой контейнер для видеопотока */}
          <div id="qr-reader" className="qr-reader-box"></div>

          {loading && <div className="scanner-status loading">Проверка клиента в базе...</div>}
          {scanError && <div className="scanner-status error">❌ {scanError}</div>}
        </div>

      </div>
    </div>
  );
};

export default AdminScanner;