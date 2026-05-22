import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode'; // 👈 Меняем Scanner на чистый Html5Qrcode
import { api } from '../../api/apiService'; 
import './AdminScanner.css'; 

const AdminScanner = ({ isOpen, onClose, onClientScanned }) => {
  const [scanError, setScanError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return; 

    setScanError(null);
    setLoading(false);

    // 1. Создаем экземпляр чистого сканера, привязанного к ID
    const html5Qrcode = new Html5Qrcode("qr-reader");

    // 2. Конфигурация камеры
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    const onScanSuccess = async (decodedText) => {
      if (!decodedText) return;
      
      setLoading(true);
      setScanError(null);

      try {
        // Останавливаем камеру ПЕРЕД запросом к бэку, чтобы освободить устройство
        await html5Qrcode.stop();

        const response = await api.getUserByQr 
          ? await api.getUserByQr(decodedText) 
          : await api.get(`/admin/users/verify/${decodedText}`);
        
        onClientScanned(response.data);
      } catch (err) {
        console.error(err);
        setScanError(err.response?.data?.message || 'Ошибка проверки QR-кода');
        
        // Если ошибка — выключаем камеру и закрываем окно через 3 сек
        html5Qrcode.stop().catch(() => {});
        setTimeout(() => { onClose(); }, 3000);
      } finally {
        setLoading(false);
      }
    };

    // 3. Запускаем заднюю камеру автоматически без лишних кнопок выборщика
    html5Qrcode.start(
      { facingMode: "environment" }, // Использовать заднюю камеру смартфона
      config,
      onScanSuccess,
      () => { /* фоновые ошибки сканирования игнорируем */ }
    ).catch(err => {
      console.error("Не удалось запустить камеру:", err);
      setScanError("Камера недоступна или заблокирована");
    });

    // 4. Глушим камеру при закрытии модалки крестиком
    return () => {
      if (html5Qrcode.isScanning) {
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
          
          {/* Контейнер для видеопотока */}
          <div id="qr-reader" className="qr-reader-box"></div>

          {loading && <div className="scanner-status loading">Проверка клиента в базе...</div>}
          {scanError && <div className="scanner-status error">❌ {scanError}</div>}
        </div>

      </div>
    </div>
  );
};

export default AdminScanner;