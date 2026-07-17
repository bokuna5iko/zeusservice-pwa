import React, { useState } from "react";

const CARS_ALL = [
  { rank: 1, brand: "Toyota", count: 120, width: "100%", class: "text-cyan" },
  {
    rank: 2,
    brand: "Kia / Hyundai",
    count: 95,
    width: "80%",
    class: "text-blue",
  },
  { rank: 3, brand: "Honda", count: 64, width: "54%", class: "text-purple" },
  {
    rank: 4,
    brand: "Mercedes-Benz",
    count: 32,
    width: "27%",
    class: "text-gray",
  },
];

const CARS_PREMIUM = [
  {
    rank: 1,
    brand: "Mercedes-Benz",
    count: 32,
    width: "100%",
    class: "text-purple",
  },
  { rank: 2, brand: "BMW", count: 28, width: "88%", class: "text-cyan" },
  { rank: 3, brand: "Lexus", count: 24, width: "75%", class: "text-blue" },
];

const VisitsSubTab = () => {
  const [filter, setFilter] = useState("all"); // 'all' | 'premium'
  const currentCars = filter === "premium" ? CARS_PREMIUM : CARS_ALL;

  return (
    <div className="analytics-fade-in-wrapper">
      <div className="analytics-section-title-row">
        <h3>🏎️ Поток автомобилей и структура услуг</h3>
        <div className="period-pills-selector">
          <button
            className={filter === "all" ? "active-pill" : ""}
            onClick={() => setFilter("all")}
          >
            Все заезды
          </button>
          <button
            className={filter === "premium" ? "active-pill" : ""}
            onClick={() => setFilter("premium")}
          >
            Только Премиум
          </button>
        </div>
      </div>

      <div className="analytics-two-columns-layout">
        {/* Доли услуг (Имитация Pie Chart через CSS-кольцо и список) */}
        <div className="analytics-left-card content-group-box">
          <h4>Доли категорий услуг в кассе</h4>
          <div className="pseudo-pie-chart-container">
            <div className="pseudo-pie-donut">
              <div className="donut-center-text">
                <span>311</span>
                <label>машин</label>
              </div>
            </div>
            <div className="pie-legend-list">
              <div className="legend-item">
                <span className="dot-cyan"></span> Комплексы (60%)
              </div>
              <div className="legend-item">
                <span className="dot-blue"></span> Экспресс / Сбив (25%)
              </div>
              <div className="legend-item">
                <span className="dot-purple"></span> Трехфазная / Допы (15%)
              </div>
            </div>
          </div>
        </div>

        {/* Топ марок машин с прогресс-барами */}
        <div className="analytics-right-card content-group-box">
          <h4>Рейтинг популярности автомобильных брендов</h4>
          <div className="rating-bars-list">
            {currentCars.map((car) => (
              <div key={car.rank} className="rating-bar-row">
                <div className="rating-bar-info">
                  <span>
                    {car.rank}. {car.brand}
                  </span>
                  <strong className={car.class}>{car.count} шт.</strong>
                </div>
                <div className="rating-bar-track-bg">
                  <div
                    className={`rating-bar-fill-progress ${car.class === "text-cyan" ? "bg-cyan" : car.class === "text-purple" ? "bg-purple" : "bg-blue"}`}
                    style={{ width: car.width }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Информер «Пиковые часы» нагрузки */}
      <div
        className="analytics-chart-box content-group-box"
        style={{ marginTop: "20px" }}
      >
        <h4>🕒 Суточная загрузка боксов по часам (Пиковые интервалы)</h4>
        <div className="css-bar-chart-canvas" style={{ height: "160px" }}>
          {["08:00", "11:00", "14:00", "17:00", "20:00", "23:00"].map(
            (time, idx) => {
              const heights = ["25%", "65%", "45%", "95%", "100%", "30%"];
              return (
                <div key={idx} className="chart-column-bar-group">
                  <div
                    className="bar-pillar-fill"
                    style={{
                      height: heights[idx],
                      background:
                        idx === 4 || idx === 3 ? "#ef4444" : "#1e293b",
                    }}
                  >
                    {idx === 4 && (
                      <div
                        className="bar-value-tooltip"
                        style={{ opacity: 1, top: "-30px" }}
                      >
                        ПИК СМЕНЫ
                      </div>
                    )}
                  </div>
                  <span className="bar-axis-label">{time}</span>
                </div>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitsSubTab;
