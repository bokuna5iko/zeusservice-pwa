// src/pages/AdminDashboard/hooks/useShiftReport.js
import { useState, useEffect } from "react";
import { api } from "../../../api/apiService";

export const useShiftReport = (isOpen, shiftId, onArchiveSuccess, onClose) => {
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [actualCash, setActualCash] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Загрузка предварительного финансового отчета при открытии модалки
  useEffect(() => {
    if (isOpen && shiftId) {
      setLoadingReport(true);
      api
        .getPreCloseReport(shiftId)
        .then((res) => setReportData(res.data))
        .catch((err) => console.error("Ошибка загрузки пре-отчета:", err))
        .finally(() => setLoadingReport(false));
    }
  }, [isOpen, shiftId]);

  // Закрытие операционного дня с отчетом
  const handleSubmitShift = async (e) => {
    e.preventDefault();
    if (!reportData || submitting) return;

    setSubmitting(true);
    try {
      const payload = {
        shiftId,
        actualCash: Number(actualCash),
        carsCount: reportData.carsCount,
        cashCalculated: reportData.cashCalculated,
        cardCalculated: reportData.cardCalculated,
      };

      const response = await api.closeWorkShiftWithReport(payload);
      alert("Смена успешно закрыта и заархивирована!");

      if (response?.data?.shift) {
        onArchiveSuccess(response.data.shift);
      } else {
        onArchiveSuccess({ status: "closed" });
      }

      if (typeof onClose === "function") onClose();
    } catch (err) {
      console.error("Критическая ошибка при закрытии смены в хуке:", err);
      alert(err.response?.data?.message || "Ошибка при архивации смены");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loadingReport,
    reportData,
    actualCash,
    setActualCash,
    submitting,
    handleSubmitShift,
  };
};
