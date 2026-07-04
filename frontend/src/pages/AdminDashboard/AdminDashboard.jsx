// src/pages/AdminDashboard/AdminDashboard.jsx
import React from "react";
import {
  AdminDashboardProvider,
  useAdminDashboard,
} from "./context/AdminDashboardContext";

// Импортируем наши новые раздробленные UI-компоненты
import DashboardSidebar from "./components/DashboardSidebar";
import DashboardHeader from "./components/DashboardHeader";

// Импортируем операционные вкладки пульта
import VisitsTab from "./Tabs/VisitsTab.jsx";
import WorkersTab from "./Tabs/WorkersTab.jsx";
import SimulatorTab from "./Tabs/SimulatorTab.jsx";
import AnalyticsTab from "./Tabs/AnalyticsTab.jsx";

import { api } from "../../api/apiService";

// Импортируем защитные модалки управления сменными циклами
import ForgottenLockModal from "./components/modals/ForgottenLockModal";
import ShiftReportModal from "./components/modals/ShiftReportModal";

import "./AdminDashboard.css";
import "./Tabs/WorkersTab.css";

// Внутренний контейнер, который рендерит верстку и имеет доступ к useAdminDashboard()
const DashboardContent = () => {
  const {
    activeTab,
    shiftStatus,
    isArchiveMode,
    archivedShiftData,
    currentShiftRaw,
    showForgottenModal,
    showCloseReportModal,
    targetClosingShiftId,
    setTargetClosingShiftId,
    setShowCloseReportModal,
    setShowForgottenModal,
    setShiftStatus,
    setCurrentShiftRaw,
    setIsArchiveMode,
    setActiveTab,
    setArchivedShiftData,
  } = useAdminDashboard();

  // 🌟 ИСПРАВЛЕНО: Закрыли синтаксис try/catch и добавили мгновенную реактивность переключения экранов
  const handleOpenShift = async () => {
    try {
      const res = await api.openWorkShift();
      alert("Смена успешно открыта!");

      // Если бэк вернул объект созданной смены, записываем его в стейт пульта
      if (res && res.data && res.data.shift) {
        setCurrentShiftRaw(res.data.shift);
      }

      // Переключаем визуальное состояние АРМ на "open", чтобы зарендерить таблицу заездов
      setShiftStatus("open");
    } catch (err) {
      console.error("ПОЛНАЯ ОШИБКА ОТКРЫТИЯ СМЕНЫ:", err);
      const serverMessage =
        err.response?.data?.message || err.message || "Неизвестная ошибка";
      alert(`Не удалось открыть смену. Причина: ${serverMessage}`);
    }
  };

  // Коллбэк успешной сдачи кассы
  const handleArchiveSuccess = (closedShift) => {
    setShowCloseReportModal(false);
    setShiftStatus("closed");
    if (closedShift) setCurrentShiftRaw(closedShift);
    alert("Смена успешно заархивирована! Касса заблокирована до утра.");
  };

  // Вход в архивный просмотр
  const handleEnterArchiveReadOnly = (shift) => {
    setArchivedShiftData(shift);
    setIsArchiveMode(true);
    setActiveTab("visits");
  };

  // Выход из архива
  const handleExitArchiveMode = () => {
    setIsArchiveMode(false);
    setArchivedShiftData(null);
  };

  if (shiftStatus === "loading") {
    return (
      <div className="admin-stats-loading">Синхронизация АРМ с кассой...</div>
    );
  }

  return (
    <div className="admin-dashboard-layout">
      {/* 🧭 НАШ КРАСИВЫЙ САЙДБАР */}
      <DashboardSidebar />

      <div className="dashboard-main-container">
        {/* КРИТИЧЕСКАЯ ПЛАШКА ДЛЯ РЕЖИМА АРХИВА */}
        {isArchiveMode && (
          <div
            style={{
              background: "#eab308",
              color: "#020617",
              padding: "10px 24px",
              fontWeight: "800",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "14px",
            }}
          >
            <span>
              ⚠️ ПРОСМОТР АРХИВНОЙ СМЕНЫ ОТ{" "}
              {new Date(archivedShiftData.shift_date).toLocaleDateString(
                "ru-RU",
              )}{" "}
              — ИЗМЕНЕНИЯ ЗАБЛОКИРОВАНЫ
            </span>
            <button
              onClick={handleExitArchiveMode}
              style={{
                background: "#020617",
                color: "#eab308",
                border: "none",
                padding: "6px 14px",
                borderRadius: "6px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Вернуться в текущую смену ↩️
            </button>
          </div>
        )}

        {/* 👑 НАША ЧИСТАЯ ШАПКА */}
        <DashboardHeader />

        {/* 📲 ДИНАМИЧЕСКИЙ ХАБ ВКЛАДОК */}
        <main className="dashboard-content-viewport">
          {activeTab === "visits" && (
            <VisitsTab
              shiftStatus={isArchiveMode ? "closed" : shiftStatus}
              initialShiftData={
                isArchiveMode
                  ? {
                      id: archivedShiftData.id,
                      shift_date: archivedShiftData.shift_date,
                      cash_total: archivedShiftData.cash_total,
                      card_total: archivedShiftData.card_total,
                      expenses_total: archivedShiftData.expenses_total,
                    }
                  : currentShiftRaw
              }
              onOpenShift={handleOpenShift}
              onCloseShiftSuccess={() => setShiftStatus("closed")}
            />
          )}
          {activeTab === "workers" && (
            <WorkersTab shiftStatus={isArchiveMode ? "closed" : shiftStatus} />
          )}
          {activeTab === "simulator" && <SimulatorTab />}
          {activeTab === "archive" && (
            <AnalyticsTab onSelectArchiveDate={handleEnterArchiveReadOnly} />
          )}
        </main>
      </div>

      {/* 🪟 УПРАВЛЯЮЩИЕ МОДАЛКИ СМЕННОГО ЦИКЛА */}
      <ForgottenLockModal
        isOpen={showForgottenModal}
        shiftData={currentShiftRaw}
        onTriggerClose={() => {
          const shiftId = currentShiftRaw?.id || targetClosingShiftId;
          if (shiftId) {
            setTargetClosingShiftId(shiftId);
            setShowForgottenModal(false);
            setShowCloseReportModal(true);
          }
        }}
      />
      <ShiftReportModal
        isOpen={showCloseReportModal}
        shiftId={targetClosingShiftId}
        onClose={() => setShowCloseReportModal(false)}
        onArchiveSuccess={handleArchiveSuccess}
      />
    </div>
  );
};

// Главная точка входа оборачивает все внутренности в провайдер данных context
const AdminDashboard = (props) => {
  return (
    <AdminDashboardProvider pwaProps={props}>
      <DashboardContent />
    </AdminDashboardProvider>
  );
};

export default AdminDashboard;
