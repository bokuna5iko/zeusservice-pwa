// src/pages/AdminDashboard/AdminDashboard.jsx
import React from "react";
import { Layout, ConfigProvider, theme } from "antd";
import {
  AdminDashboardProvider,
  useAdminDashboard,
} from "./context/AdminDashboardContext";

// 🔄 ОБНОВЛЕНО: Импорты из новой структуры shared/
import DashboardSidebar from "./shared/DashboardSidebar/DashboardSidebar";
import DashboardHeader from "./shared/DashboardHeader/DashboardHeader";

// 🔄 ОБНОВЛЕНО: Импорты операционных вкладок из features/
import VisitsTab from "./features/visits/VisitsTab";
import WorkersTab from "./features/workers/WorkersTab";
import SimulatorTab from "./features/simulator/SimulatorTab";
import AnalyticsTab from "./features/analytics/AnalyticsTab";
import StatisticsTab from "./features/analytics/StatisticsTab";

import { api } from "../../api/apiService";

// 🔄 ОБНОВЛЕНО: Импорты модалок из shared/modals/
import ForgottenLockModal from "./shared/modals/ForgottenLockModal";
import ShiftReportModal from "./shared/modals/ShiftReportModal";

import "./AdminDashboard.css";
// 🔄 ОБНОВЛЕНО: Путь к CSS воркеров
import "./features/workers/WorkersTab.css";

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
    handleExitArchiveMode,
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
          {/* 👑 НАША ЧИСТАЯ ШАПКА */}
          <DashboardHeader />

          {/* 📲 ЕДИНСТВЕННЫЙ И ПРАВИЛЬНЫЙ ДИНАМИЧЕСКИЙ ХАБ ВКЛАДОК */}
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

            {/* 🌟 ДОБАВЛЕНО: Рендер нового таба профессиональной аналитики */}
            {activeTab === "stats" && <StatisticsTab />}

            {/* Старый архивный календарь дат по-прежнему работает независимо */}
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
