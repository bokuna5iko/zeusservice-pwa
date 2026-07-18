// src/components/PriceListModal.jsx
import React, { useState, useEffect } from "react";
import { api } from "../api/apiService.js";
import "./PriceListModal.css";

// Карточки классов с народными примерами и путями к созданным иконкам
const CLASS_CAR_EXAMPLES = [
  {
    id: 1,
    name: "Класс 1",
    examples: "Vitz, Fit, Demio",
    icon: "fas fa-car-side",
    image: "/assets/classes/class1.png",
  },
  {
    id: 2,
    name: "Класс 2",
    examples: "Premio, Chaser, Fielder",
    icon: "fas fa-car",
    image: "/assets/classes/class2.png",
  },
  {
    id: 3,
    name: "Класс 3",
    examples: "Rx300, Crown 200, Wish10",
    icon: "fas fa-suv",
    image: "/assets/classes/class3.png",
  },
  {
    id: 4,
    name: "Класс 4",
    examples: "tlc200, Noah, Tank 500",
    icon: "fas fa-truck-pickup",
    image: "/assets/classes/class4.png",
  },
  {
    id: 5,
    name: "Класс 5",
    examples: "Hiace, Tundra, Jac, Escalade",
    icon: "fas fa-shuttle-van",
    image: "/assets/classes/class5.png",
  },
];

const PriceListModal = ({ isOpen, onClose, userCarClass = 3 }) => {
  const [activeClass, setActiveClass] = useState(1);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAutoFocused, setIsAutoFocused] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchServices = async () => {
        setLoading(true);
        try {
          const res = await api.getServices();
          if (res && res.data) {
            setServices(res.data);
          }
        } catch (err) {
          console.error("Ошибка загрузки прайс-листа:", err);
          setServices([]);
        } finally {
          setLoading(false);
        }
      };

      fetchServices();
      if (userCarClass) {
        setActiveClass(userCarClass);
      }
    }
  }, [isOpen, userCarClass]);

  if (!isOpen) return null;

  const toggleAccordion = (id) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const filteredServices = services.filter(
    (s) => Number(s.car_class || s.car_type_id) === activeClass,
  );

  return (
    <div className="price-modal-overlay" onClick={onClose}>
      <div className="price-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Шапка модального окна */}
        <div className="price-modal-header">
          <h2>Прейскурант услуг</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* СТРОКА ПОИСКА (Визуальная заглушка) */}
        <div className="price-search-container-stub">
          <i className="fas fa-search search-icon-stub"></i>
          <input
            type="text"
            placeholder="Введите марку вашей машины..."
            disabled
            className="price-input-stub"
          />
        </div>

        {/* ПЛАШКА АВТО-ФОКУСА */}
        {isAutoFocused && userCarClass && (
          <div className="auto-focus-alert-banner">
            <div className="alert-banner-flex">
              <i className="fas fa-info-circle text-cyan"></i>
              <span>
                Показываем цены для вашего класса авто (Класс {userCarClass})
              </span>
            </div>
            <button
              className="banner-dismiss-btn"
              onClick={() => setIsAutoFocused(false)}
            >
              &times;
            </button>
          </div>
        )}

        {/* 🏎️ ГОРИЗОНТАЛЬНЫЙ СКРОЛЛ-БАР КЛАССОВ С ЖИВЫМИ КАРТИНКАМИ */}
        <div className="class-scroll-bar-wrapper">
          {CLASS_CAR_EXAMPLES.map((cls) => (
            <div
              key={cls.id}
              className={`class-card-tab ${activeClass === cls.id ? "active-neon-tab" : ""}`}
              onClick={() => setActiveClass(cls.id)}
            >
              <div className="class-card-header">
                <span>{cls.name}</span>
                <i className={`${cls.icon} tab-class-icon`}></i>
              </div>

              {/* 🌟 ИСПРАВЛЕНО: Рендерим твою реальную картинку класса автомобиля */}
              <div className="car-silhouette-placeholder">
                <img
                  src={cls.image}
                  alt={cls.name}
                  className="car-class-silhouette-img"
                />
              </div>

              <p className="class-card-examples-text">{cls.examples}</p>
            </div>
          ))}
        </div>

        {/* СПИСОК УСЛУГ И ДИНАМИЧЕСКИХ ЦЕН */}
        <div className="price-list-scroll">
          <section className="price-group">
            <h3 className="group-title">
              Доступные услуги для Класса {activeClass}
            </h3>

            {loading ? (
              <div className="price-list-loading-notice">
                <i className="fas fa-spinner fa-spin text-cyan"></i>
                <p>Синхронизация прайс-листа с PostgreSQL...</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="price-list-empty-fallback">
                <i className="fas fa-folder-open"></i>
                <p>В базе данных пока нет услуг для Класса {activeClass}.</p>
                <span className="demo-hint-text">
                  (Добавьте их через NocoDB в таблицу services)
                </span>
              </div>
            ) : (
              filteredServices.map((item) => (
                <div
                  key={item.id}
                  className={`price-item-card ${openAccordion === item.id ? "open" : ""}`}
                >
                  <div
                    className="price-item-main-row"
                    onClick={() => toggleAccordion(item.id)}
                  >
                    <div className="service-main-info-block">
                      <span className="service-title-text">
                        {item.service_name}
                      </span>
                      <i
                        className={`fas fa-chevron-down arrow-indicator ${openAccordion === item.id ? "up" : ""}`}
                      ></i>
                    </div>
                    <span className="service-price-neon">
                      {Number(
                        item.base_price || item.price || 0,
                      ).toLocaleString()}{" "}
                      ₽
                    </span>
                  </div>
                  <div className="service-expanded-details-drawer">
                    <p>
                      {item.description ||
                        "Описание услуги настраивается в NocoDB."}
                    </p>
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default PriceListModal;
