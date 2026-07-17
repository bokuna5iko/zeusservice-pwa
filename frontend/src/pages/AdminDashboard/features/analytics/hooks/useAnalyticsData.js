// src/pages/AdminDashboard/hooks/useAnalyticsData.js
import { useState, useEffect } from "react";
import { api } from "../../../../../api/apiService";

export const useAnalyticsData = () => {
  const [calendarShifts, setCalendarShifts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true; // Защита от утечки памяти и повторных вызовов в StrictMode

    setLoading(true);
    api
      .getArchiveCalendar()
      .then((res) => {
        if (!isMounted) return;
        const shifts = res.data || [];
        // Переворачиваем массив смен наоборот, чтобы они шли в хронологическом порядке
        setCalendarShifts(shifts.reverse());
      })
      .catch((err) => {
        console.error("Ошибка чтения календаря в хуке:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false; // Отменяем стейты, если админ резко переключил вкладку
    };
  }, []); // 🌟 ВАЖНО: Массив зависимостей строго пустой! Запрос выполнится ровно 1 раз.

  return {
    calendarShifts,
    loading,
  };
};
