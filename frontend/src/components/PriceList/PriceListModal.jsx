import React, { useState } from 'react';
import './PriceListModal.css';

const priceData = {
  classBased: [
    {
      id: "wash_2phase",
      title: "2-х фазная мойка",
      description: "Мойка эмульсией; Мойка пенным шампунем; Полная сушка кузова; Чернение резины.",
      prices: { 1: 800, 2: 900, 3: 1000, 4: 1100, 5: 1200 }
    },
    {
      id: "standard_plus",
      title: "Стандарт + коврики",
      description: "Бесконтактная мойка кузова; Промывка резиновых ковриков; Сушка порогов и зеркал.",
      prices: { 1: 600, 2: 700, 3: 800, 4: 900, 5: 1000 }
    },
    {
      id: "complex",
      title: "Комплексная мойка",
      description: "2-х фазная мойка; Уборка салона пылесосом; Влажная уборка пластика; Мойка стекол изнутри.",
      prices: { 1: 1500, 2: 1800, 3: 2100, 4: 2400, 5: 2700 }
    },
    {
      id: "chassis",
      title: "Мойка днища",
      description: "Промывка нижней части автомобиля специализированной насадкой.",
      prices: { 1: 500, 2: 500, 3: 600, 4: 700, 5: 800 }
    }
  ],
  fixed: [
    { id: "moto", title: "Мойка мотоцикла", description: "Деликатная мойка узлов и агрегатов.", price: "от 500 ₽" },
    { id: "engine", title: "Мойка двигателя", description: "Чистка составами-диэлектриками и консервация.", price: "2500 ₽" },
    { id: "dry_clean", title: "Химчистка (1 элемент)", description: "Глубокая очистка ткани или кожи спецсоставами.", price: "от 1000 ₽" },
    { id: "vacuum", title: "Пылесос салона", description: "Тщательная уборка пола, сидений и багажника.", price: "400 ₽" }
  ]
};

const PriceListModal = ({ isOpen, onClose }) => {
  const [activeClass, setActiveClass] = useState(1);
  const [openAccordion, setOpenAccordion] = useState(null);

  if (!isOpen) return null;

  const toggleAccordion = (id) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <div className="price-modal-overlay" onClick={onClose}>
      <div className="price-modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="price-modal-header">
          <h2>Прейскурант услуг</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Sticky Tabs */}
        <div className="class-selector-sticky">
          {[1, 2, 3, 4, 5].map((cls) => (
            <button 
              key={cls}
              className={`class-tab ${activeClass === cls ? 'active' : ''}`}
              onClick={() => setActiveClass(cls)}
            >
              {cls} класс
            </button>
          ))}
        </div>

        <div className="price-list-scroll">
          {/* Группа 1: Зависимые от класса */}
          <section className="price-group">
            <h3 className="group-title">Основные услуги</h3>
            {priceData.classBased.map((item) => (
              <div key={item.id} className={`price-item ${openAccordion === item.id ? 'open' : ''}`}>
                <div className="price-item-main" onClick={() => toggleAccordion(item.id)}>
                  <div className="service-info">
                    <span className="service-title">{item.title}</span>
                    <i className={`fas fa-chevron-down arrow ${openAccordion === item.id ? 'up' : ''}`}></i>
                  </div>
                  <span className="service-price animated-price">
                    {item.prices[activeClass]} ₽
                  </span>
                </div>
                <div className="service-details">
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </section>

          {/* Группа 2: Фиксированные */}
          <section className="price-group">
            <h3 className="group-title">Дополнительно</h3>
            {priceData.fixed.map((item) => (
              <div key={item.id} className={`price-item fixed-item ${openAccordion === item.id ? 'open' : ''}`}>
                <div className="price-item-main" onClick={() => toggleAccordion(item.id)}>
                  <div className="service-info">
                    <span className="service-title">{item.title}</span>
                    <i className={`fas fa-chevron-down arrow ${openAccordion === item.id ? 'up' : ''}`}></i>
                  </div>
                  <span className="service-price">{item.price}</span>
                </div>
                <div className="service-details">
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
};

export default PriceListModal;