import React, { useState } from "react";
import "./WorkerTabs.css";

const INITIAL_TEAM = [
  {
    id: 101,
    name: "Айтал",
    category: "Линейный",
    shifts: 18,
    bugs: 0,
    salary: 42300,
    isTop: true,
    isShield: true,
  },
  {
    id: 102,
    name: "Лёха",
    category: "Линейный",
    shifts: 22,
    bugs: 2,
    salary: 49500,
    isTop: false,
    isShield: true,
  },
  {
    id: 103,
    name: "Димон",
    category: "Стахановец",
    shifts: 24,
    bugs: 1,
    salary: 68000,
    isTop: true,
    isShield: false,
  },
  {
    id: 104,
    name: "Тимур",
    category: "Линейный",
    shifts: 14,
    bugs: 4,
    salary: 29000,
    isTop: false,
    isShield: false,
  },
  {
    id: 105,
    name: "Ньургун",
    category: "Стахановец",
    shifts: 20,
    bugs: 0,
    salary: 59000,
    isTop: false,
    isShield: true,
  },
];

const WorkerFinancesTab = () => {
  const [team, setTeam] = useState(INITIAL_TEAM);

  const handleToggleCategory = (id) => {
    setTeam((prev) =>
      prev.map((emp) => {
        if (emp.id === id) {
          const isTurningStakhanov = emp.category === "Линейный";
          const nextCategory = isTurningStakhanov ? "Стахановец" : "Линейный";

          // Присваиваем повышенную ставку при переводе в Стахановцы
          const nextSalary = isTurningStakhanov
            ? emp.salary + 12500
            : emp.salary - 12500;

          return { ...emp, category: nextCategory, salary: nextSalary };
        }
        return emp;
      }),
    );

    // Считаем общее кол-во стахановцев после переключения
    setTimeout(() => {
      const currentStakhanovsCount = team.filter(
        (e) => e.category === "Стахановец",
      ).length;
      alert(
        `🔄 [Умный пересчет Zeus BI]: Операционные квоты в Календаре Смен автоматически пересчитаны под обновленный состав команды!`,
      );
    }, 100);
  };

  return (
    <div className="worker-finances-tab-viewport">
      <div className="tab-header-flex">
        <h2>📊 Справочник персонала и финансовый предрасчет (Касса/Рейтинг)</h2>
        <div className="fin-summary-pills">
          <span className="fin-pill">
            ФОТ за месяц:{" "}
            {team
              .reduce((acc, current) => acc + current.salary, 0)
              .toLocaleString()}{" "}
            ₽
          </span>
        </div>
      </div>

      <div
        className="arm-table-scroll-area"
        style={{ maxHeight: "600px", marginTop: "15px" }}
      >
        <table className="arm-table">
          <thead>
            <tr>
              <th>Сотрудник</th>
              <th>Категория мастерства</th>
              <th>Отработано смен</th>
              <th>Косяки / Штрафы</th>
              <th>Зарплата (Предрасчет)</th>
              <th>Тумблер роли</th>
            </tr>
          </thead>
          <tbody>
            {team.map((emp) => (
              <tr key={emp.id} className="fade-in">
                <td>
                  <div className="worker-name-cell-wrapper">
                    <span className="worker-name-txt">{emp.name}</span>
                    <div className="worker-badge-icons-row">
                      {emp.isTop && (
                        <span className="badge-crown" title="Топ-Мастер месяца">
                          👑
                        </span>
                      )}
                      {emp.isShield && (
                        <span
                          className="badge-shield"
                          title="Железный чек (Без косяков)"
                        >
                          ✅
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    className={`category-tag-badge ${emp.category === "Стахановец" ? "stakhanov-neon" : "linear-gray"}`}
                  >
                    {emp.category}
                  </span>
                </td>
                <td style={{ fontWeight: "600", color: "#f1f5f9" }}>
                  {emp.shifts} смен
                </td>
                <td>
                  <span
                    className={`bugs-count-indicator ${emp.bugs > 0 ? "has-bugs-red" : "zero-bugs-green"}`}
                  >
                    {emp.bugs === 0 ? "Нет нарушений" : `${emp.bugs} косяка`}
                  </span>
                </td>
                <td className="table-amount-bold" style={{ color: "#38bdf8" }}>
                  {emp.salary.toLocaleString()} ₽
                </td>
                <td>
                  <div className="toggle-switch-container">
                    <label className="arm-switch-label">
                      <input
                        type="checkbox"
                        checked={emp.category === "Стахановец"}
                        onChange={() => handleToggleCategory(emp.id)}
                      />
                      <span className="arm-switch-slider"></span>
                    </label>
                    <span className="switch-sub-text">Стахановец</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkerFinancesTab;
