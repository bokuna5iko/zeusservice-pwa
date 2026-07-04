// src/pages/AdminDashboard/Tabs/WorkersTab.jsx
import React, { useState } from "react";

// Фиксированный процент заработка мойщика (пресет для автоматического расчета)
const WORKER_PERCENT = 30;

// Локальный пресет сотрудников (заглушка из ТЗ)
const INITIAL_WORKERS = [
  { id: 1, name: "Андрей", active: true, carsWashed: 5, totalVolume: 4500 },
  { id: 2, name: "Антон", active: false, carsWashed: 0, totalVolume: 0 },
  { id: 3, name: "Дмитрий", active: true, carsWashed: 8, totalVolume: 8200 },
  { id: 4, name: "Роман", active: false, carsWashed: 0, totalVolume: 0 },
  { id: 5, name: "Сергей", active: true, carsWashed: 4, totalVolume: 3100 },
];

const WorkersTab = () => {
  const [workers, setWorkers] = useState(INITIAL_WORKERS);

  // Переключение чекбокса выхода сотрудника на смену
  const toggleWorkerStatus = (id) => {
    setWorkers((prev) =>
      prev.map((w) => (w.id === id ? { ...w, active: !w.active } : w)),
    );
  };

  return (
    <div className="workers-tab-viewport">
      {/* СЕКЦИЯ 1: УПРАВЛЕНИЕ ВЫХОДАМИ НА СМЕНУ */}
      <section className="workers-attendance-box content-group-box">
        <h3 className="tab-block-title">
          <i className="fas fa-user-check"></i> Заступили на смену сегодня
        </h3>
        <p className="tab-block-subtitle">
          Отметьте галочками сотрудников, которые физически находятся в боксах
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
                <th>Заработок за день (₽)</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w) => {
                // Расчет индивидуальной зарплаты на основе % выработки
                const dailySalary = Math.round(
                  (w.totalVolume * WORKER_PERCENT) / 100,
                );

                return (
                  <tr key={w.id} className={!w.active ? "row-disabled" : ""}>
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
  );
};

export default WorkersTab;
