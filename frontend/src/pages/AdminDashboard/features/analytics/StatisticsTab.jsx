// src/pages/AdminDashboard/Tabs/StatisticsTab.jsx
import React, { useState } from "react";
// 🌟 ИСПРАВЛЕНО: Явно добавили расширения .jsx для стабильной сборки на Linux-сервере
import FinanceSubTab from "./FinanceSubTab.jsx";
import VisitsSubTab from "./VisitsSubTab.jsx";
import EfficiencySubTab from "./EfficiencySubTab.jsx";
import "./StatisticsTab.css";

const StatisticsTab = () => {
  // 'finance' | 'visits' | 'efficiency'
  const [activeSubTab, setActiveSubTab] = useState("finance");

  return (
    <div className="analytics-main-viewport">
      {/* Горизонтальный навигационный неоновый бар подтабов */}
      <div className="arm-subtabs-navigation-bar">
        <button
          className={`arm-subtab-btn ${activeSubTab === "finance" ? "active-subtab" : ""}`}
          onClick={() => setActiveSubTab("finance")}
        >
          <i className="fas fa-wallet text-cyan"></i> Касса и Тренды
        </button>
        <button
          className={`arm-subtab-btn ${activeSubTab === "visits" ? "active-subtab" : ""}`}
          onClick={() => setActiveSubTab("visits")}
        >
          <i className="fas fa-car text-blue"></i> Поток и Услуги
        </button>
        <button
          className={`arm-subtab-btn ${activeSubTab === "efficiency" ? "active-subtab" : ""}`}
          onClick={() => setActiveSubTab("efficiency")}
        >
          <i className="fas fa-chart-line text-purple"></i> Выработка и KPI
        </button>
      </div>

      {/* Контент подтабов */}
      <div className="analytics-subtab-content-container">
        {activeSubTab === "finance" && <FinanceSubTab />}
        {activeSubTab === "visits" && <VisitsSubTab />}
        {activeSubTab === "efficiency" && <EfficiencySubTab />}
      </div>
    </div>
  );
};

export default StatisticsTab;
