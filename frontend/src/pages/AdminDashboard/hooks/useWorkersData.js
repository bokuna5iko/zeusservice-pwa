// src/pages/AdminDashboard/hooks/useWorkersData.js
import { useState } from "react";

// Фиксированный процент заработка мойщика (пресет для автоматического расчета)
export const WORKER_PERCENT = 30;

// Локальный пресет сотрудников (заглушка из ТЗ)
const INITIAL_WORKERS = [
  { id: 1, name: "Андрей", active: true, carsWashed: 5, totalVolume: 4500 },
  { id: 2, name: "Антон", active: false, carsWashed: 0, totalVolume: 0 },
  { id: 3, name: "Дмитрий", active: true, carsWashed: 8, totalVolume: 8200 },
  { id: 4, name: "Роман", active: false, carsWashed: 0, totalVolume: 0 },
  { id: 5, name: "Сергей", active: true, carsWashed: 4, totalVolume: 3100 },
];

export const useWorkersData = () => {
  const [workers, setWorkers] = useState(INITIAL_WORKERS);

  // Переключение чекбокса выхода сотрудника на смену
  const toggleWorkerStatus = (id) => {
    setWorkers((prev) =>
      prev.map((w) => (w.id === id ? { ...w, active: !w.active } : w)),
    );
  };

  return {
    workers,
    toggleWorkerStatus,
  };
};
