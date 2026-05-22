// src/components/CalculatorModal/CalculatorModal.jsx
import React, { useState, useEffect } from 'react';
import './CalculatorModal.css';

const CalculatorModal = ({ isOpen, onClose, clientData, isGuest, onSuccess }) => {
  const [allServices, setAllServices] = useState([]); // Все услуги из БД
  const [carClass, setCarClass] = useState(1); // Выбранный класс (1-5)
  const [selectedServiceId, setSelectedServiceId] = useState(''); // Выбранная услуга
  const [finalPrice, setFinalPrice] = useState(0); // Итоговая цена для отображения
  const [isManualPrice, setIsManualPrice] = useState(false); // Флаг ручного ввода цены
  const [paymentType, setPaymentType] = useState('Наличные'); // Тип оплаты
  const [loading, setLoading] = useState(false);
  const [successChecked, setSuccessChecked] = useState(false); // Для анимации зеленой галочки

  // Определяем номер визита для расчета лояльности
  const nextVisitNum = isGuest ? null : (clientData?.visit_count || 0) + 1;

  useEffect(() => {
    if (!isOpen) return;
    
    // Сбрасываем стейты при открытии модалки
    setSelectedServiceId('');
    setFinalPrice(0);
    setIsManualPrice(false);
    setSuccessChecked(false);
    setCarClass(1);

    // Подтягиваем услуги из БД
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/admin/services');
        const data = await res.json();
        setAllServices(data);
      } catch (err) {
        console.error('Ошибка загрузки услуг:', err);
      }
    };
    fetchServices();
  }, [isOpen, clientData]);

  // Фильтруем услуги под выбранный класс машины
  const filteredServices = allServices.filter(
    (s) => s.car_class === null || s.car_class === parseInt(carClass)
  );

  // Калькуляция цены при смене услуги или класса авто (для отображения администратору)
  useEffect(() => {
    if (isManualPrice || !selectedServiceId) return;

    const currentService = allServices.find((s) => s.id === parseInt(selectedServiceId));
    if (!currentService) return;

    let calculated = currentService.base_price;

    // Логика лояльности (визуальный просчет для админа)
    if (!isGuest) {
      if (nextVisitNum === 4) {
        calculated = Math.round(calculated * 0.8); // Скидка 20%
      } else if (nextVisitNum === 8) {
        calculated = 0; // Бесплатно
      }
    }

    setFinalPrice(calculated);
  }, [selectedServiceId, carClass, allServices, isManualPrice, isGuest, nextVisitNum]);

  const handleSubmit = async () => {
    // Проверка авторизованного клиента: теперь проверяем по id, полученному из QR/профиля
    if (!isGuest && !clientData?.id) {
      alert('Ошибка: Данные клиента не загружены (отсутствует ID)');
      return;
    }
    if (!selectedServiceId && !isManualPrice) {
      alert('Выберите услугу или введите цену вручную');
      return;
    }

    setLoading(true);

    try {
      // Идеальная синхронизация с visitController.js
      const res = await fetch('/api/admin/visits/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: isGuest ? null : clientData.id, // 🌟 ПЕРЕДАЕМ ИМЕННО ID (извлеченный из QR)
          serviceId: selectedServiceId ? parseInt(selectedServiceId) : null, // 🌟 ПЕРЕДАЕМ ID УСЛУГИ
          payment_type: paymentType,
          is_guest: isGuest,
          manual_price: isManualPrice ? finalPrice : null // Если ручная цена — передаем её
        })
      });

      if (res.ok) {
        setSuccessChecked(true); // Включаем микро-отклик (зеленую галочку)
        setTimeout(() => {
          onSuccess(); // Обновляем инфу на главной админа
          onClose();   // Закрываем модалку
        }, 1200);
      } else {
        const errData = await res.json();
        alert(errData.message || 'Ошибка при зачислении визита');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="calc-modal-overlay" onClick={onClose}>
      <div className="calc-modal-content" onClick={(e) => e.stopPropagation()}>
        
        {successChecked ? (
          <div className="calc-success-screen">
            <div className="success-checkmark-circle">
              <i className="fas fa-check"></i>
            </div>
            <h3>Визит зачислен!</h3>
            <p>{isGuest ? 'Гость оформлен' : `Счетчик лояльности: ${nextVisitNum === 8 ? 0 : nextVisitNum}/8`}</p>
          </div>
        ) : (
          <>
            <div className="calc-modal-header">
              <h2>
                {isGuest ? 'Оформление Гостя' : `Калькулятор: ${clientData?.name || 'Клиент'}`}
              </h2>
              <button className="calc-close-btn" onClick={onClose}>&times;</button>
            </div>

            <div className="calc-modal-body">
              {/* Информация о лояльности */}
              {!isGuest && (
                <div className="calc-loyalty-info-alert">
                  Текущий визит клиента: <strong>{nextVisitNum}-й</strong> 
                  {nextVisitNum === 4 && <span className="gift-text"> (Скидка 20%)</span>}
                  {nextVisitNum === 8 && <span className="gift-text"> (БЕСПЛАТНО)</span>}
                </div>
              )}

              {/* Выбор Класса машины */}
              <div className="calc-field-group">
                <label>Класс автомобиля</label>
                <div className="calc-class-selector">
                  {[1, 2, 3, 4, 5].map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      className={`calc-class-tab ${carClass === cls ? 'active' : ''}`}
                      onClick={() => {
                        setCarClass(cls);
                        if(!isManualPrice) setSelectedServiceId('');
                      }}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* Выбор услуги */}
              <div className="calc-field-group">
                <label>Выберите услугу</label>
                <select
                  className="calc-select"
                  value={selectedServiceId}
                  onChange={(e) => {
                    setSelectedServiceId(e.target.value);
                    setIsManualPrice(false);
                  }}
                >
                  <option value="">-- Нажмите для выбора услуги --</option>
                  {filteredServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.service_name} ({s.base_price} ₽)
                    </option>
                  ))}
                </select>
              </div>

              {/* Переключатель на ручной ввод */}
              <div className="manual-price-checkbox-row">
                <label>
                  <input
                    type="checkbox"
                    checked={isManualPrice}
                    onChange={(e) => {
                      setIsManualPrice(e.target.checked);
                      if(e.target.checked) setSelectedServiceId('');
                    }}
                  />
                  Ввести сумму вручную (нестандартная цена)
                </label>
              </div>

              {/* Поле цены / Вывод стоимости */}
              <div className="calc-field-group">
                <label>Итоговая стоимость к оплате</label>
                {isManualPrice ? (
                  <input
                    type="number"
                    className="calc-price-input"
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(parseInt(e.target.value) || 0)}
                  />
                ) : (
                  <div className="calc-price-display-box">
                    {selectedServiceId && !isGuest && (nextVisitNum === 4 || nextVisitNum === 8) && (
                      <span className="old-struck-price">
                        {allServices.find(s => s.id === parseInt(selectedServiceId))?.base_price} ₽
                      </span>
                    )}
                    <span className="current-calculated-price">{finalPrice} ₽</span>
                  </div>
                )}
              </div>

              {/* Выбор оплаты */}
              <div className="calc-field-group">
                <label>Тип оплаты</label>
                <div className="calc-radio-group">
                  <label className="calc-radio-label">
                    <input
                      type="radio"
                      name="payment_type"
                      value="Наличные"
                      checked={paymentType === 'Наличные'}
                      onChange={() => setPaymentType('Наличные')}
                    />
                    <span>Наличные</span>
                  </label>
                  <label className="calc-radio-label">
                    <input
                      type="radio"
                      name="payment_type"
                      value="Онлайн-перевод"
                      checked={paymentType === 'Онлайн-перевод'}
                      onChange={() => setPaymentType('Онлайн-перевод')}
                    />
                    <span>Онлайн-перевод</span>
                  </label>
                </div>
              </div>

              <button 
                className="calc-submit-btn" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Зачисление...' : 'Зачислить визит'}
              </button>

            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CalculatorModal;