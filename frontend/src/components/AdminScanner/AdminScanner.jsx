// src/components/AdminScanner/AdminScanner.jsx
import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../../api/apiService'; 
import './AdminScanner.css'; 

const AdminScanner = ({ isOpen, onClose, onClientScanned }) => {
  const [scanError, setScanError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return; 

    setScanError(null);
    loading && setLoading(false);

    const html5Qrcode = new Html5Qrcode("qr-reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    const onScanSuccess = async (decodedText) => {
      if (!decodedText) return;
      
      setLoading(true);
      setScanError(null);

      // 1. ПАРСИНГ СТРОКИ QR-КОДА (Ожидаем формат "ID:YYYY-MM-DD")
      const qrParts = decodedText.split(':');
      const clientId = qrParts[0];
      const qrDateSeed = qrParts[1];

      // Получаем сегодняшнюю дату для сверки (в том же формате, что у клиента)
      const todayDate = new Date().toISOString().split('T')[0];

      // 2. ВАЛИДАЦИЯ ДАТЫ (Защита от скриншотов)
      if (!clientId || !qrDateSeed || qrDateSeed !== todayDate) {
        setScanError('Срок действия QR-кода истек. Попросите клиента обновить экран.');
        setLoading(false);
        return; 
      }

      try {
        // Останавливаем камеру ПЕРЕД запросом к бэку, чтобы освободить устройство
        await html5Qrcode.stop();

        // 3. ЗАПРОС НА БЭКЕНД: Передаем только ЧИСТЫЙ проверенный ID клиента
        const response = await api.get(`/admin/users/verify/${clientId}`);
        
        // Передаем данные клиента дальше в AdminHome -> CalculatorModal
        onClientScanned(response.data);
      } catch (err) {
        console.error(err);
        setScanError(err.response?.data?.message || 'Пользователь не найден или ошибка сервера');
        
        // Если ошибка бэкенда — глушим камеру и закрываем окно через 3 сек
        html5Qrcode.stop().catch(() => {});
        setTimeout(() => { onClose(); }, 3000);
      } finally {
        setLoading(false);
      }
    };

    // Запускаем заднюю камеру автоматически
    html5Qrcode.start(
      { facingMode: "environment" }, 
      config,
      onScanSuccess,
      () => { /* фоновые ошибки сканирования игнорируем */ }
    ).catch(err => {
      console.error("Не удалось запустить камеру:", err);
      setScanError("Камера недоступна или заблокирована");
    });

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
          <div id="qr-reader" className="qr-reader-box"></div>
          {loading && <div className="scanner-status loading">Проверка клиента в базе...</div>}
          {scanError && <div className="scanner-status error"> {scanError}</div>}
        </div>
      </div>
    </div>
  );
};

export default AdminScanner;