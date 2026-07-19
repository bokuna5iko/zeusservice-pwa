// src/pages/AdminDashboard/AdminDashboard.jsx
import React from "react";
import { Layout, ConfigProvider, theme } from "antd";
import {
  AdminDashboardProvider,
  useAdminDashboard,
} from "./context/AdminDashboardContext";

import DashboardSidebar from "./shared/DashboardSidebar/DashboardSidebar";
import DashboardHeader from "./shared/DashboardHeader/DashboardHeader";

import VisitsTab from "./features/visits/VisitsTab";
import WorkersTab from "./features/workers/WorkersTab";
import SimulatorTab from "./features/simulator/SimulatorTab";
import AnalyticsTab from "./features/analytics/AnalyticsTab";
import StatisticsTab from "./features/analytics/StatisticsTab";

// 🌟 ДОБАВЛЕНО ПО ТЗ: Полноценный компонент Журнала системного аудита для роли Owner
const AuditTab = () => {
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.getAuditLogs();
        if (res.data && res.data.success) {
          setLogs(res.data.logs || []);
        }
      } catch (err) {
        console.error("Ошибка при получении логов аудита:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const formatLogDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Метод парсинга payload для вывода понятных деталей изменений
  const renderLogDetails = (type, payload) => {
    if (!payload) return "—";
    const data = typeof payload === "string" ? JSON.parse(payload) : payload;

    switch (type) {
      case "cancel":
        return (
          <div className="audit-detail-block">
            <span className="audit-label">Сумма:</span>{" "}
            <strong className="text-muted">{data.amount} ₽</strong> |{" "}
            <span className="audit-label">Причина:</span>{" "}
            <strong className="text-red">{data.reason}</strong>
            {data.comment && (
              <div>
                <span className="audit-label">Коммент:</span>{" "}
                <em>{data.comment}</em>
              </div>
            )}
          </div>
        );
      case "edit":
        return (
          <div className="audit-detail-block">
            <span className="audit-label">Услуга:</span>{" "}
            <span>
              {data.old_service} ➔ {data.new_service}
            </span>{" "}
            | <span className="audit-label">Сумма:</span>{" "}
            <strong className="text-orange">
              {data.old_price} ₽ ➔ {data.new_price} ₽
            </strong>
          </div>
        );
      case "note_add":
        return (
          <div className="audit-detail-block">
            <span className="audit-label">Текст заметки:</span>{" "}
            <em>{data.note_text || "Заметка добавлена"}</em>
          </div>
        );
      default:
        return JSON.stringify(data);
    }
  };

  if (loading) {
    return (
      <div className="admin-stats-loading">
        <i className="fas fa-spinner fa-spin text-cyan"></i> Чтение журнала
        логов action_logs...
      </div>
    );
  }

  return (
    <div
      className="audit-tab-container custom-scroll"
      style={{ padding: "20px", height: "100%", overflowY: "auto" }}
    >
      <div className="audit-header-box" style={{ marginBottom: "20px" }}>
        <h2
          style={{
            color: "#38bdf8",
            fontSize: "1.4rem",
            fontWeight: "800",
            margin: 0,
          }}
        >
          📋 Сквозной аудит действий персонала
        </h2>
        <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "4px" }}>
          Данные защищены на уровне СУБД PostgreSQL. Изменение или удаление
          записей заблокировано.
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="table-empty-notice" style={{ padding: "40px 0" }}>
          Журнал аудита пока пуст. Изменения финансовых данных отсутствуют.
        </div>
      ) : (
        <div
          className="audit-activity-timeline"
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          {logs.map((log) => {
            // Подбираем цветовые маркеры на основе ТЗ
            let typeClass = "badge-edit";
            let typeLabel = "ИЗМЕНЕНИЕ";
            if (log.action_type === "cancel") {
              typeClass = "badge-cancel";
              typeLabel = "ОТМЕНА";
            } else if (log.action_type === "note_add") {
              typeClass = "badge-note";
              typeLabel = "ЗАМЕТКА";
            }

            return (
              <div
                key={log.id}
                className="audit-log-card"
                style={{
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span
                      style={{
                        color: "#64748b",
                        fontSize: "0.82rem",
                        fontWeight: "600",
                      }}
                    >
                      <i className="far fa-clock"></i>{" "}
                      {formatLogDate(log.timestamp)}
                    </span>
                    <span
                      style={{
                        color: "#ffffff",
                        fontWeight: "700",
                        fontSize: "0.9rem",
                      }}
                    >
                      {log.admin_name || "Система"}
                    </span>
                    <span className={`audit-type-badge ${typeClass}`}>
                      {typeLabel}
                    </span>
                  </div>
                  <span
                    style={{
                      color: "#38bdf8",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                    }}
                  >
                    🚗 {log.car_brand}
                  </span>
                </div>

                <div
                  style={{
                    padding: "8px 12px",
                    background: "#020617",
                    borderRadius: "8px",
                    borderLeft: "3px solid var(--accent-color, #1e293b)",
                  }}
                >
                  {renderLogDetails(log.action_type, log.payload)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

import { api } from "../../api/apiService";

import ForgottenLockModal from "./shared/modals/ForgottenLockModal";
import ShiftReportModal from "./shared/modals/ShiftReportModal";

import "./AdminDashboard.css";
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
    setCurrentShiftRaw,
    setShiftStatus,
    setIsArchiveMode,
    setActiveTab,
    setArchivedShiftData,
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
        <DashboardSidebar />

        <Layout className="admin-main-layout">
          <DashboardHeader />

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
            {activeTab === "stats" && <StatisticsTab />}

            {/* 🌟 ДОБАВЛЕНО: Рендер новой вкладки Аудита при клике в сайдбаре */}
            {activeTab === "audit" && <AuditTab />}

            {activeTab === "archive" && (
              <AnalyticsTab onSelectArchiveDate={handleEnterArchiveReadOnly} />
            )}
          </Content>
        </Layout>

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
