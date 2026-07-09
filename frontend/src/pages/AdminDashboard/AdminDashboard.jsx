// src/pages/AdminDashboard/AdminDashboard.jsx
import React from "react";
import { Layout, ConfigProvider, theme } from "antd";
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

const { Content } = Layout;

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
    handleExitArchiveMode, // 🌟 ВОЗВРАЩЕНО: Деструктуризация метода сброса архива
  } = useAdminDashboard();

  const handleOpenShift = async () => {
    try {
      const res = await api.openWorkShift();
      alert("Смена успешно открыта!");

      if (res && res.data && res.data.shift) {
        setCurrentShiftRaw(res.data.shift);
      }
      setShiftStatus("open");
    } catch (err) {
      console.error("ПОЛНАЯ ОШИБКА ОТКРЫТИЯ СМЕНЫ:", err);
      const serverMessage =
        err.response?.data?.message || err.message || "Неизвестная ошибка";
      alert(`Не удалось открыть смену. Причина: ${serverMessage}`);
    }
  };

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

  if (shiftStatus === "loading") {
    return (
      <div className="admin-stats-loading">Синхронизация АРМ с кассой...</div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorBgContainer: "#0f172a",
          colorBgLayout: "#020617",
          colorPrimary: "#38bdf8",
          borderRadiusLG: 12,
        },
        components: {
          Layout: {
            siderBg: "#0f172a",
            triggerBg: "#1e293b",
          },
          Menu: {
            darkItemBg: "#0f172a",
            darkItemActiveBg: "#1e293b",
          },
        },
      }}
    >
      <Layout
        style={{ minHeight: "100vh" }}
        className="admin-dashboard-container"
      >
        {/* 🧭 СВОРАЧИВАЕМЫЙ САЙДБАР КАК ОТДЕЛЬНЫЙ КОМПОНЕНТ */}
        <DashboardSidebar />

        <Layout className="admin-main-layout">
          {isArchiveMode && (
            <div className="archive-top-sticky-banner">
              <span>
                ⚠️ ПРОСМОТР АРХИВНОЙ СМЕНЫ ОТ{" "}
                {new Date(archivedShiftData?.shift_date).toLocaleDateString(
                  "ru-RU",
                )}{" "}
                — ИЗМЕНЕНИЯ ЗАБЛОКИРОВАНЫ
              </span>
            </div>
          )}

          {/* 👑 НАША ЧИСТАЯ ШАПКА */}
          <DashboardHeader />

          {/* 📲 ДИНАМИЧЕСКИЙ ХАБ ВКЛАДОК */}
          <Content className="dashboard-content-viewport admin-tab-content-wrapper">
            {activeTab === "visits" && (
              <VisitsTab
                shiftStatus={isArchiveMode ? "closed" : shiftStatus}
                initialShiftData={
                  isArchiveMode
                    ? {
                        id: archivedShiftData?.id,
                        shift_date: archivedShiftData?.shift_date,
                        cash_total: archivedShiftData?.cash_total,
                        card_total: archivedShiftData?.card_total,
                        expenses_total: archivedShiftData?.expenses_total,
                      }
                    : currentShiftRaw
                }
                onOpenShift={handleOpenShift}
                onCloseShiftSuccess={() => setShiftStatus("closed")}
              />
            )}
            {activeTab === "workers" && (
              <WorkersTab
                shiftStatus={isArchiveMode ? "closed" : shiftStatus}
              />
            )}
            {activeTab === "simulator" && <SimulatorTab />}
            {activeTab === "archive" && (
              <AnalyticsTab onSelectArchiveDate={handleEnterArchiveReadOnly} />
            )}
          </Content>
        </Layout>

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
      </Layout>
    </ConfigProvider>
  );
};

const AdminDashboard = (props) => {
  return (
    <AdminDashboardProvider pwaProps={props}>
      <DashboardContent />
    </AdminDashboardProvider>
  );
};

export default AdminDashboard;
