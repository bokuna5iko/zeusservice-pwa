// src/components/CalculatorModal/CalculatorModal.jsx
import React, { useState, useEffect } from "react";
import "./CalculatorModal.css";

const CalculatorModal = ({
  isOpen,
  onClose,
  clientData,
  isGuest,
  onSuccess,
}) => {
  const [allServices, setAllServices] = useState([]); // Все услуги из БД
  const [carClass, setCarClass] = useState(1); // Выбранный класс (1-5)
  const [selectedServiceId, setSelectedServiceId] = useState(""); // Выбранная основная услуга
  const [selectedAddons, setSelectedAddons] = useState([]); // Выбранные доп. услуги (массив объектов)
  const [finalPrice, setFinalPrice] = useState(0); // Итоговая цена для отображения
  const [isManualPrice, setIsManualPrice] = useState(false); // Флаг ручного ввода цены
  const [paymentType, setPaymentType] = useState("Наличные"); // Тип оплаты
  const [loading, setLoading] = useState(false);
  const [successChecked, setSuccessChecked] = useState(false); // Для анимации зеленой галочки
  const [manualCarBrand, setManualCarBrand] = useState("");

  const nextVisitNum = isGuest ? null : (clientData?.visit_count || 0) + 1;

  // Подтягиваем услуги из БД при открытии модалки
  useEffect(() => {
    if (!isOpen) return;

    setSelectedServiceId("");
    setSelectedAddons([]);
    setFinalPrice(0);
    setIsManualPrice(false);
    setSuccessChecked(false);
    setCarClass(1);
    setManualCarBrand("");

    const fetchServices = async () => {
      try {
        const res = await fetch("/api/admin/services");
        const data = await res.json();
        setAllServices(data);
      } catch (err) {
        console.error("Ошибка загрузки услуг:", err);
      }
    };
    fetchServices();
  }, [isOpen]);

  // Фильтруем основные пакетные услуги под выбранный класс машины (исключаем null)
  const filteredMainServices = allServices.filter(
    (s) => s.car_class === parseInt(carClass),
  );

  // Вытаскиваем самодостаточные доп. услуги (где car_class === null)
  const availableAddons = allServices.filter((s) => s.car_class === null);

  // Переключатель чекбокса доп. услуги
  const handleToggleAddon = (addon) => {
    setSelectedAddons((prev) => {
      const isAlreadySelected = prev.some((item) => item.id === addon.id);
      if (isAlreadySelected) {
        return prev.filter((item) => item.id !== addon.id);
      } else {
        // Формируем структуру объекта допки, которую ожидает Пульт Управления
        return [
          ...prev,
          {
            id: addon.id,
            service_name: addon.service_name,
            price: addon.base_price,
            employee_id: null,
          },
        ];
      }
    });
  };

  // Калькуляция цены при смене базовой услуги, класса авто или доп. услуг
  useEffect(() => {
    if (isManualPrice) return;

    let baseAmount = 0;
    if (selectedServiceId) {
      const currentService = allServices.find(
        (s) => s.id === parseInt(selectedServiceId),
      );
      if (currentService) {
        baseAmount = parseFloat(currentService.base_price);
      }
    }

    // Считаем сумму выбранных допок
    let addonsAmount = 0;
    selectedAddons.forEach((addon) => {
      addonsAmount += parseFloat(addon.price || 0);
    });

    // Полная сумма без скидок
    let totalRaw = baseAmount + addonsAmount;

    // Применяем скидку лояльности (на всю сумму, включая допки, согласно ответу 1)
    if (!isGuest) {
      if (nextVisitNum === 4) {
        totalRaw = Math.round(totalRaw * 0.8); // Скидка 20%
      } else if (nextVisitNum === 8) {
        totalRaw = 0; // Бесплатно
      }
    }

    setFinalPrice(totalRaw);
  }, [
    selectedServiceId,
    selectedAddons,
    carClass,
    allServices,
    isManualPrice,
    isGuest,
    nextVisitNum,
  ]);

  const handleSubmit = async () => {
    console.log("=== 🔍 КЛИК НА ФРОНТЕНДЕ: handleSubmit в калькуляторе ===");
    console.log("isGuest:", isGuest, "clientData:", clientData);
    console.log(
      "selectedServiceId:",
      selectedServiceId,
      "selectedAddons:",
      selectedAddons,
    );

    if (!isGuest && !clientData?.id) {
      alert("Ошибка: Данные клиента не загружены (отсутствует ID)");
      return;
    }
    if (!selectedServiceId && !isManualPrice) {
      alert("Выберите основную услугу или введите цену вручную");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");

      const res = await fetch("/api/admin/visits/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          userId: isGuest ? null : clientData.id,
          serviceId: selectedServiceId ? parseInt(selectedServiceId) : null,
          payment_type: paymentType,
          is_guest: isGuest,
          manual_price: isManualPrice ? finalPrice : null,
          manual_car_brand: manualCarBrand.trim() || null,
          additional_services: selectedAddons, // 🌟 Отправляем массив доп. услуг на бэкенд!
        }),
      });

      if (res.ok) {
        setSuccessChecked(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        const errData = await res.json();
        alert(errData.message || "Ошибка при зачислении визита");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка соединения с сервером");
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
            <p>
              {isGuest
                ? "Гость оформлен"
                : `Счетчик лояльности: ${nextVisitNum === 8 ? 0 : nextVisitNum}/8`}
            </p>
          </div>
        ) : (
          <>
            <div className="calc-modal-header">
              <h2>
                {isGuest
                  ? "Оформление Гостя"
                  : `Калькулятор: ${clientData?.name || "Клиент"}`}
              </h2>
              <button className="calc-close-btn" onClick={onClose}>
                &times;
              </button>
            </div>

            <div className="calc-modal-body">
              {!isGuest && (
                <div className="calc-loyalty-info-alert">
                  Текущий визит клиента: <strong>{nextVisitNum}-й</strong>
                  {nextVisitNum === 4 && (
                    <span className="gift-text"> (Скидка 20%)</span>
                  )}
                  {nextVisitNum === 8 && (
                    <span className="gift-text"> (БЕСПЛАТНО)</span>
                  )}
                  {clientData?.car_brand && (
                    <div
                      style={{
                        marginTop: "6px",
                        color: "#38bdf8",
                        fontSize: "12px",
                      }}
                    >
                      <i className="fas fa-car"></i> Марка в профиле:{" "}
                      <strong>{clientData.car_brand}</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="calc-field-group">
                <label>Марка авто / Краткое имя (Заполняет Админ)</label>
                <input
                  type="text"
                  className="calc-price-input"
                  placeholder="Пример: Camry 555, Белый BMW, Probox"
                  value={manualCarBrand}
                  onChange={(e) => setManualCarBrand(e.target.value)}
                />
              </div>

              <div className="calc-field-group">
                <label>Класс автомобиля</label>
                <div className="calc-class-selector">
                  {[1, 2, 3, 4, 5].map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      className={`calc-class-tab ${carClass === cls ? "active" : ""}`}
                      onClick={() => {
                        setCarClass(cls);
                        if (!isManualPrice) setSelectedServiceId("");
                      }}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              <div className="calc-field-group">
                <label>Выберите основную услугу</label>
                <select
                  className="calc-select"
                  value={selectedServiceId}
                  onChange={(e) => {
                    setSelectedServiceId(e.target.value);
                    setIsManualPrice(false);
                  }}
                >
                  <option value="">-- Нажмите для выбора услуги --</option>
                  {filteredMainServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.service_name} ({s.base_price} ₽)
                    </option>
                  ))}
                </select>
              </div>

              {/* 🌟 ДОБАВЛЕНО: Блок выбора дополнительных услуг (Пункт 2 ТЗ) */}
              {!isManualPrice &&
                selectedServiceId &&
                availableAddons.length > 0 && (
                  <div className="calc-field-group pwa-addons-section">
                    <label className="addons-section-title">
                      <i className="fas fa-plus-circle text-cyan"></i>{" "}
                      Дополнительные услуги
                    </label>
                    <div className="pwa-addons-grid">
                      {availableAddons.map((addon) => {
                        const isChecked = Array.isArray(window.temp)
                          ? false
                          : !!selectedAddons.some(
                              (item) => item.id === addon.id,
                            );
                        return (
                          <label
                            key={addon.id}
                            className={`pwa-addon-card-label ${isChecked ? "checked" : ""}`}
                          >
                            <div className="addon-checkbox-left">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleAddon(addon)}
                              />
                              <span className="addon-name">
                                {addon.service_name}
                              </span>
                            </div>
                            <span className="addon-price">
                              +{addon.base_price} ₽
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

              <div className="manual-price-checkbox-row">
                <label>
                  <input
                    type="checkbox"
                    checked={isManualPrice}
                    onChange={(e) => {
                      setIsManualPrice(e.target.checked);
                      if (e.target.checked) {
                        setSelectedServiceId("");
                        setSelectedAddons([]);
                      }
                    }}
                  />
                  Ввести сумму вручную (нестандартная цена)
                </label>
              </div>

              <div className="calc-field-group">
                <label>Итоговая стоимость к оплате</label>
                {isManualPrice ? (
                  <input
                    type="number"
                    className="calc-price-input"
                    value={finalPrice}
                    onChange={(e) =>
                      setFinalPrice(parseInt(e.target.value) || 0)
                    }
                  />
                ) : (
                  <div className="calc-price-display-box">
                    {selectedServiceId &&
                      !isGuest &&
                      (nextVisitNum === 4 || nextVisitNum === 8) && (
                        <span className="old-struck-price">
                          {parseFloat(
                            allServices.find(
                              (s) => s.id === parseInt(selectedServiceId),
                            )?.base_price || 0,
                          ) +
                            selectedAddons.reduce(
                              (sum, a) => sum + parseFloat(a.price),
                              0,
                            )}{" "}
                          ₽
                        </span>
                      )}
                    <span className="current-calculated-price">
                      {finalPrice} ₽
                    </span>
                  </div>
                )}
              </div>

              <div className="calc-field-group">
                <label>Тип оплаты</label>
                <div className="calc-radio-group">
                  <label className="calc-radio-label">
                    <input
                      type="radio"
                      name="payment_type"
                      value="Наличные"
                      checked={paymentType === "Наличные"}
                      onChange={() => setPaymentType("Наличные")}
                    />
                    <span>Наличные</span>
                  </label>
                  <label className="calc-radio-label">
                    <input
                      type="radio"
                      name="payment_type"
                      value="Онлайн-перевод"
                      checked={paymentType === "Онлайн-перевод"}
                      onChange={() => setPaymentType("Онлайн-перевод")}
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
                {loading ? "Зачисление..." : "Зачислить визит"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CalculatorModal;
