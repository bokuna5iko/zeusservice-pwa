// src/pages/AdminDashboard/hooks/useArchiveCalendar.js
import { useState } from "react";

export const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export const useArchiveCalendar = (calendarShifts) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handlePrevMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1,
    );
    // Ограничиваем переход вперед текущим реальным месяцем, чтобы не листать в будущее
    if (nextMonth <= new Date()) {
      setCurrentMonth(nextMonth);
    }
  };

  // Метод сборки ячеек сетки (математика календаря)
  const getDaysGrid = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Первый день месяца и общее количество дней в месяце
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const totalDays = lastDayOfMonth.getDate();
    // Корректируем день недели (0 - воскресенье в JS, переводим под Пн = 0)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const cells = [];

    // 1. Пустые ячейки для сдвига начала месяца
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ type: "empty", key: `empty-${i}` });
    }

    // 2. Реальные дни месяца
    for (let day = 1; day <= totalDays; day++) {
      // Ищем, была ли смена в этот конкретный день
      const matchedShift = calendarShifts?.find((shift) => {
        const shiftDate = new Date(shift.shift_date);
        return (
          shiftDate.getFullYear() === year &&
          shiftDate.getMonth() === month &&
          shiftDate.getDate() === day
        );
      });

      cells.push({
        type: "day",
        dayNumber: day,
        shift: matchedShift || null,
        key: `day-${day}`,
      });
    }

    return cells;
  };

  return {
    currentMonth,
    handlePrevMonth,
    handleNextMonth,
    getDaysGrid,
  };
};
