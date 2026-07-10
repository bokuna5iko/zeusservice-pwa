// src/pages/AdminDashboard/hooks/useArchiveCalendar.js
import { useState } from "react";

export const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export const useArchiveCalendar = (calendarShifts) => {
  // Называем состояние сразу currentMonthDate, чтобы код ниже читал его правильно
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const handlePrevMonth = () => {
    setCurrentMonthDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(
      currentMonthDate.getFullYear(),
      currentMonthDate.getMonth() + 1,
      1,
    );
    // Ограничиваем переход вперед текущим реальным месяцем, чтобы не листать в будущее
    if (nextMonth <= new Date()) {
      setCurrentMonthDate(nextMonth);
    }
  };

  // Метод сборки ячеек сетки (математика календаря)
  const getDaysGrid = () => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    // Первый день месяца и последний день месяца
    const firstMonthDay = new Date(year, month, 1);
    const lastMonthDay = new Date(year, month + 1, 0);

    const totalDays = lastMonthDay.getDate();

    // Корректируем день недели (0 - воскресенье в JS, переводим под Пн = 0)
    let startDayOfWeek = firstMonthDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const cells = [];

    // 1. Пустые ячейки для сдвига начала месяца
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ type: "empty", key: `empty-start-${i}` });
    }

    // 2. Реальные дни месяца
    for (let day = 1; day <= totalDays; day++) {
      // Ищем, была ли смена в этот конкретный день
      const matchedShift = calendarShifts.find((shift) => {
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

    // 3. Пустые заглушки в конце сетки до полного квадрата кратного 7
    const totalSlots = Math.ceil(cells.length / 7) * 7;
    const endEmptyCount = totalSlots - cells.length;
    for (let i = 0; i < endEmptyCount; i++) {
      cells.push({ type: "empty", key: `empty-end-${i}` });
    }

    return cells;
  };

  return {
    currentMonth: currentMonthDate, // Возвращаем под старым именем для совместимости с ArchiveCalendarGrid
    handlePrevMonth,
    handleNextMonth,
    getDaysGrid,
  };
};
