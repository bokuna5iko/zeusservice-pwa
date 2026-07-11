import React, { useState } from "react";

const INITIAL_PERFORMANCE = [
  { id: 1, name: "Димон", shifts: 24, washed: 184, avgTime: 21, bugs: 1 },
  { id: 2, name: "Лёха", shifts: 22, washed: 162, avgTime: 25, bugs: 2 },
  { id: 3, name: "Айтал", shifts: 18, washed: 145, avgTime: 19, bugs: 0 },
  { id: 4, name: "Ньургун", shifts: 20, washed: 130, avgTime: 23, bugs: 0 },
  { id: 5, name: "Тимур", shifts: 14, washed: 88, avgTime: 28, bugs: 4 },
];

const EfficiencySubTab = () => {
  const [team, setTeam] = useState(INITIAL_PERFORMANCE);
  const [sortField, setSortSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' | 'desc'

  const handleSort = (field) => {
    let order = "desc";
    if (sortField === field && sortOrder === "desc") {
      order = "asc";
    }
    setSortSortField(field);
    setSortOrder(order);

    const sortedTeam = [...team].sort((a, b) => {
      if (order === "asc") {
        return a[field] > b[field] ? 1 : -1;
      } else {
        return a[field] < b[field] ? 1 : -1;
      }
    });
    setTeam(sortedTeam);
  };

  return (
    <div className="analytics-fade-in-wrapper">
      <div className="analytics-section-title-row">
        <h3>📈 Командная выработка и KPI эффективности</h3>
        <span
          className="live-badge-pulse"
          style={{
            background: "rgba(168,85,247,0.1)",
            color: "#c084fc",
            borderColor: "rgba(168,85,247,0.3)",
          }}
        >
          📊 ЦИФРОВОЙ КОНТРОЛЬ
        </span>
      </div>

      {/* Лидерборд (Визуальный подиум Топ-3 мастеров месяца по объёму кассы) */}
      <div className="podium-top-masters-row">
        <div className="podium-card silver-place">
          <div className="podium-medal">2</div>
          <h4>Лёха</h4>
          <span className="podium-kpi">162 авто</span>
          <label>Выручка: 195к</label>
        </div>
        <div className="podium-card gold-place">
          <div className="podium-medal">👑</div>
          <h4>Димон</h4>
          <span className="podium-kpi">184 авто</span>
          <label>Выручка: 230к</label>
        </div>
        <div className="podium-card bronze-place">
          <div className="podium-medal">3</div>
          <h4>Айтал</h4>
          <span className="podium-kpi">145 авто</span>
          <label>Выручка: 180к</label>
        </div>
      </div>

      {/* Интерактивная сортируемая таблица выработки */}
      <div
        className="analytics-table-card content-group-box"
        style={{ marginTop: "20px" }}
      >
        <div className="table-caption-flex">
          <h4>Таблица сквозной выработки персонала</h4>
          <p className="tab-block-subtitle">
            Нажмите на заголовки столбцов для мгновенной сортировки команды
          </p>
        </div>

        <div className="arm-table-scroll-area" style={{ maxHeight: "400px" }}>
          <table className="arm-table">
            <thead>
              <tr>
                <th>Имя сотрудника</th>
                <th
                  className="sortable-th-header"
                  onClick={() => handleSort("shifts")}
                >
                  Отработано дней <i className="fas fa-sort"></i>
                </th>
                <th
                  className="sortable-th-header"
                  onClick={() => handleSort("washed")}
                >
                  Помыто авто (доля) <i className="fas fa-sort"></i>
                </th>
                <th
                  className="sortable-th-header"
                  onClick={() => handleSort("avgTime")}
                >
                  Ср. время на машину <i className="fas fa-sort"></i>
                </th>
                <th
                  className="sortable-th-header"
                  onClick={() => handleSort("bugs")}
                >
                  Косяки / Штрафы <i className="fas fa-sort"></i>
                </th>
              </tr>
            </thead>
            <tbody>
              {team.map((worker) => (
                <tr key={worker.id} className="fade-in">
                  <td
                    className="worker-table-name"
                    style={{ fontWeight: "700" }}
                  >
                    {worker.name}
                  </td>
                  <td style={{ color: "#cbd5e1" }}>{worker.shifts} смен</td>
                  <td>
                    <strong>{worker.washed} машин</strong>
                  </td>
                  <td style={{ color: "#38bdf8", fontWeight: "600" }}>
                    {worker.avgTime} мин.
                  </td>
                  <td>
                    <span
                      className={
                        worker.bugs > 0 ? "has-bugs-red" : "zero-bugs-green"
                      }
                    >
                      {worker.bugs === 0 ? "Идеально" : `${worker.bugs} шт.`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EfficiencySubTab;
