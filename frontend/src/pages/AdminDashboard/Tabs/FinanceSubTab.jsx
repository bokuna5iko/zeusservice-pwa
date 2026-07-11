import React, { useState } from "react";

const DATA_MONTH = [
  { label: "Пн", total: 45000, height: "75%" },
  { label: "Вт", total: 38000, height: "63%" },
  { label: "Ср", total: 52000, height: "86%" },
  { label: "Чт", total: 41000, height: "68%" },
  { label: "Пт", total: 60000, height: "100%" },
  { label: "Сб", total: 58000, height: "96%" },
  { label: "Вс", total: 49000, height: "81%" },
];

const DATA_WEEK = [
  { label: "Вчера", total: 58000, height: "96%" },
  { label: "Сегодня", total: 60000, height: "100%" },
];

const FinanceSubTab = () => {
  const [period, setPeriod] = useState("month"); // 'week' | 'month' | 'season'
  const currentChartData = period === "week" ? DATA_WEEK : DATA_MONTH;

  return (
    <div className="analytics-fade-in-wrapper">
      {/* Блок селектора периодов */}
      <div className="analytics-section-title-row">
        <h3>💰 Финансовая сводка и кассовые тренды</h3>
        <div className="period-pills-selector">
          <button
            className={period === "week" ? "active-pill" : ""}
            onClick={() => setPeriod("week")}
          >
            Неделя
          </button>
          <button
            className={period === "month" ? "active-pill" : ""}
            onClick={() => setPeriod("month")}
          >
            Месяц
          </button>
          <button
            className={period === "season" ? "active-pill" : ""}
            onClick={() => setPeriod("season")}
          >
            Сезон
          </button>
        </div>
      </div>

      {/* KPI карточки */}
      <div className="analytics-kpi-grid">
        <div className="kpi-card content-group-box border-cyan">
          <span className="kpi-title">Выручка за период</span>
          <span className="kpi-value-highlight">420,000 ₽</span>
          <span className="kpi-sub-trend text-green">
            <i className="fas fa-arrow-up"></i> +14.2% к прошлому мес.
          </span>
        </div>
        <div className="kpi-card content-group-box border-purple">
          <span className="kpi-title">Фонд оплаты труда (ФОТ)</span>
          <span className="kpi-value-highlight">168,000 ₽</span>
          <span className="kpi-sub-text">40% от общего объема выручки</span>
        </div>
        <div className="kpi-card content-group-box border-blue">
          <span className="kpi-title">Средний чек заезда</span>
          <span className="kpi-value-highlight">1,250 ₽</span>
          <span className="kpi-sub-trend text-cyan">
            Цель: 1,400 ₽ за счет допов
          </span>
        </div>
      </div>

      {/* CSS-столбчатый интерактивный график */}
      <div className="analytics-chart-box content-group-box">
        <h4>
          Динамика выручки по дням цикла (
          {period === "week" ? "Текущие дни" : "Отрезок месяца"})
        </h4>
        <div className="css-bar-chart-canvas">
          {currentChartData.map((bar, idx) => (
            <div key={idx} className="chart-column-bar-group">
              <div className="bar-value-tooltip">
                {bar.total.toLocaleString()} ₽
              </div>
              <div className="bar-pillar-fill" style={{ height: bar.height }}>
                <div className="neon-bar-glowing-top"></div>
              </div>
              <span className="bar-axis-label">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinanceSubTab;
