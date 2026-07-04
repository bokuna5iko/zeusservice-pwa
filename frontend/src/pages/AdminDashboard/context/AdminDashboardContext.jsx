// src/pages/AdminDashboard/context/AdminDashboardContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../../../api/apiService";

const AdminDashboardContext = createContext(null);

export const AdminDashboardProvider = ({ children, pwaProps }) => {
  const [activeTab, setActiveTab] = useState("visits");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Состояния сменного бизнес-цикла
  const [shiftStatus, setShiftStatus] = useState("loading"); // loading, not_started, open, closed, forgotten_lock
  const [currentShiftRaw, setCurrentShiftRaw] = useState(null);

  // Режим Архива (Просмотра прошедших дней)
  const [isArchiveMode, setIsArchiveMode] = useState(false);
  const [archivedShiftData, setArchivedShiftData] = useState(null);

  // Состояния триггеров модалок
  const [showForgottenModal, setShowForgottenModal] = useState(false);
  const [showCloseReportModal, setShowCloseReportModal] = useState(false);
  const [targetClosingShiftId, setTargetClosingShiftId] = useState(null);

  // Живые часы (вынесли сюда, чтобы разгрузить UI)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Синхронизация статуса смены с базой данных
  const fetchShiftStatus = async () => {
    try {
      const response = await api.getWorkShiftStatus();
      setShiftStatus(response.data.status);
      setCurrentShiftRaw(response.data.shift);

      if (response.data.status === "forgotten_lock") {
        setTargetClosingShiftId(response.data.shift.id);
        setShowForgottenModal(true);
      }
    } catch (err) {
      console.error("Ошибка получения статуса смены в контексте:", err);
      setShiftStatus("not_started");
    }
  };

  useEffect(() => {
    fetchShiftStatus();
  }, []);

  // Объединяем все стейты, мутации и PWA-пропсы из родительского App.jsx в один объект доступа
  const value = {
    activeTab,
    setActiveTab,
    currentTime,
    shiftStatus,
    setShiftStatus,
    currentShiftRaw,
    setCurrentShiftRaw,
    isArchiveMode,
    setIsArchiveMode,
    archivedShiftData,
    setArchivedShiftData,
    showForgottenModal,
    setShowForgottenModal,
    showCloseReportModal,
    setShowCloseReportModal,
    targetClosingShiftId,
    setTargetClosingShiftId,
    fetchShiftStatus,
    ...pwaProps, // прокидываем сюда needRefresh, showHintBanner, isSpinning, handlePwaUpdate
  };

  return (
    <AdminDashboardContext.Provider value={value}>
      {children}
    </AdminDashboardContext.Provider>
  );
};

// Простой кастомный хук для использования данных в любом дочернем компоненте
export const useAdminDashboard = () => {
  const context = useContext(AdminDashboardContext);
  if (!context) {
    throw new Error(
      "useAdminDashboard должен использоваться внутри AdminDashboardProvider",
    );
  }
  return context;
};
