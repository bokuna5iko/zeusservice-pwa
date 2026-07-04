// src/pages/AdminDashboard/hooks/useAnalyticsData.js
import { useState, useEffect } from "react";
import { api } from "../../../api/apiService";

export const useAnalyticsData = () => {
  const [calendarShifts, setCalendarShifts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getArchiveCalendar()
      // Переворачиваем массив смен наоборот, чтобы при совпадении логики
      // или вложенных массивов они обрабатывались в прямом календарном порядке
      .then((res) => {
        const shifts = res.data || [];
        setCalendarShifts(shifts.reverse());
      })
      .catch((err) => console.error("Ошибка чтения календаря в хуке:", err))
      .finally(() => setLoading(false));
  }, []);

  return {
    calendarShifts,
    loading,
  };
};
