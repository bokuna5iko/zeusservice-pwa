// src/pages/AdminDashboard/Tabs/WorkersTab.jsx
import React, { useState } from "react";
import { useWorkersData, WORKER_PERCENT } from "./hooks/useWorkersData";

// 🌟 ДОБАВЛЕНО: Импортируем наши новые модули контроля персонала
import WorkerPhotosTab from "./WorkerPhotosTab";
import WorkerFinancesTab from "./WorkerFinancesTab";

const WorkersTab = () => {
  // Подключаем наш изолированный хук логики персонала
  const { workers, toggleWorkerStatus } = useWorkersData();

  // 🌟 ДОБАВЛЕНО: Стейт управления внутренними подтабами
  // 'current' - Текущая смена, 'photos' - Фотоотчеты, 'finances' - База и Расчет
  const [activeSubTab, setActiveSubTab] = useState("current");

  return (
    <div className="workers-main-hub-viewport">
      {/* 🌟 ДОБАВЛЕНО: Горизонтальное неоновое меню подтабов */}
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

      {/* РЕНДЕР ПОДТАБА №1: ТЕКУЩАЯ СМЕНА */}
      {activeSubTab === "current" && (
        <div className="workers-tab-viewport fade-in">
          {/* СЕКЦИЯ 1: УПРАВЛЕНИЕ ВЫХОДАМИ НА СМЕНУ */}
          <section className="workers-attendance-box content-group-box">
            <h3 className="tab-block-title">
              <i className="fas fa-user-check"></i> Заступили на смену сегодня
            </h3>
            <p className="tab-block-subtitle">
              Отметьте галочками сотрудников, которые физически находятся в
              боксах
            </p>

            <div className="attendance-checkbox-grid">
              {workers.map((w) => (
                <label
                  key={w.id}
                  className={`attendance-chip ${w.active ? "checked" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={w.active}
                    onChange={() => toggleWorkerStatus(w.id)}
                  />
                  <span className="chip-custom-checkbox"></span>
                  <span className="chip-name">{w.name}</span>
                </label>
              ))}
            </div>
          </section>

          {/* СЕКЦИЯ 2: СТАТИСТИКА ВЫРАБОТКИ И ЗАРПЛАТЫ */}
          <section className="workers-stats-table-box content-group-box">
            <h3 className="tab-block-title">
              <i className="fas fa-calculator"></i> Выработка и расчет заработка
              (Текущий день)
            </h3>

            <div className="visits-table-wrapper">
              <table className="arm-table">
                <thead>
                  <tr>
                    <th>Имя сотрудника</th>
                    <th>Статус</th>
                    <th>Помыто машин (13ч)</th>
                    <th>Общий объем (₽)</th>
                    <th>Текущая ставка</th>
                    <th>Заработок за day (₽)</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((w) => {
                    // Расчет индивидуальной зарплаты на основе % выработки
                    const dailySalary = Math.round(
                      (w.totalVolume * WORKER_PERCENT) / 100,
                    );

                    return (
                      <tr
                        key={w.id}
                        className={!w.active ? "row-disabled" : ""}
                      >
                        <td className="worker-table-name">{w.name}</td>
                        <td>
                          <span
                            className={`status-pill ${w.active ? "status-online" : "status-offline"}`}
                          >
                            {w.active ? "В боксе" : "Выходной"}
                          </span>
                        </td>
                        <td>
                          <strong>{w.carsWashed}</strong>
                        </td>
                        <td>{w.totalVolume} ₽</td>
                        <td>{WORKER_PERCENT}% от объема</td>
                        <td className="salary-cell">
                          {w.active ? `${dailySalary} ₽` : "0 ₽"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* 🌟 РЕНДЕР ПОДТАБА №2: ФОТООТЧЕТЫ */}
      {activeSubTab === "photos" && (
        <div className="fade-in">
          <WorkerPhotosTab />
        </div>
      )}

      {/* 🌟 РЕНДЕР ПОДТАБА №3: БАЗА И РАСЧЕТ */}
      {activeSubTab === "finances" && (
        <div className="fade-in">
          <WorkerFinancesTab />
        </div>
      )}
    </div>
  );
};

export default WorkersTab;
