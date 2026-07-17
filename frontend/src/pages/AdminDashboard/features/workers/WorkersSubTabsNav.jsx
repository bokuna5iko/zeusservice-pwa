// src/pages/AdminDashboard/features/workers/WorkersSubTabsNav.jsx
import React from "react";
import "./WorkersTab.css";

const WorkersSubTabsNav = ({ activeSubTab, setActiveSubTab }) => {
  return (
    <div className="arm-subtabs-navigation-bar">
      <button
        className={`arm-subtab-btn ${activeSubTab === "current" ? "active-subtab" : ""}`}
        onClick={() => setActiveSubTab("current")}
      >
        <i className="fas fa-id-card"></i> Текущая смена
      </button>
      <button
        className={`arm-subtab-btn ${activeSubTab === "photos" ? "active-subtab" : ""}`}
        onClick={() => setActiveSubTab("photos")}
      >
        <i className="fas fa-camera"></i> Лента Контроля
        <span className="subtab-counter-alert">3</span>
      </button>
      <button
        className={`arm-subtab-btn ${activeSubTab === "finances" ? "active-subtab" : ""}`}
        onClick={() => setActiveSubTab("finances")}
      >
        <i className="fas fa-wallet"></i> Рейтинг и Касса
      </button>
    </div>
  );
};

export default WorkersSubTabsNav;
