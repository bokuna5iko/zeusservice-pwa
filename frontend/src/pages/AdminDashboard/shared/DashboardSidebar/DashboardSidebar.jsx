// src/pages/AdminDashboard/components/DashboardSidebar.jsx
import React, { useState } from "react";
import "./DashboardSidebar.css";
import { Layout, Menu } from "antd";
import {
  CalendarOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  PoweroffOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
  BarChartOutlined, // 🌟 ДОБАВЛЕНО: Иконка для раздела статистики
} from "@ant-design/icons";
import { useAdminDashboard } from "../../context/AdminDashboardContext";

const { Sider } = Layout;

const DashboardSidebar = () => {
  const {
    activeTab,
    setActiveTab,
    currentTime,
    shiftStatus,
    currentShiftRaw,
    isArchiveMode,
    setIsArchiveMode,
    setArchivedShiftData,
    targetClosingShiftId,
    setTargetClosingShiftId,
    setShowForgottenModal,
    setShowCloseReportModal,
  } = useAdminDashboard();

  const [collapsed, setCollapsed] = useState(false);

  // Стандартное меню для повседневной работы пульта
  const normalMenuItems = [
    {
      key: "visits",
      label: "Лента визитов",
      icon: <CalendarOutlined />,
    },
    {
      key: "workers",
      label: "Сотрудники",
      icon: <TeamOutlined />,
    },
    {
      key: "stats", // 🌟 ДОБАВЛЕНО: Ключ совпадает с роутом в AdminDashboard
      label: "Статистика",
      icon: <BarChartOutlined />,
    },
    {
      key: "simulator",
      label: "Симулятор PWA",
      icon: <ThunderboltOutlined />,
    },
    {
      key: "archive",
      label: "Архив смен",
      icon: <HistoryOutlined />,
    },
  ];

  // Специальное меню для режима просмотра архива (сохраняет структуру Ant Design)
  const archiveMenuItems = [
    {
      key: "visits",
      label: "Лента заездов (Архив)",
      icon: <HistoryOutlined />,
      className: "archive-menu-item-active", // Кастомный класс для желтой подсветки
    },
    {
      key: "exit_archive",
      label: "Выйти из архива",
      icon: <ArrowLeftOutlined />,
      className: "archive-menu-item-exit",
    },
  ];

  const handleTriggerCloseShift = () => {
    const shiftId = currentShiftRaw?.id || targetClosingShiftId;
    if (!shiftId) return;

    if (
      window.confirm(
        "Вы уверены, что хотите закрыть смену? Данные кассы будут зафиксированы, а редактирование заблокировано.",
      )
    ) {
      setTargetClosingShiftId(shiftId);
      setShowForgottenModal(false);
      setShowCloseReportModal(true);
    }
  };

  const handleExitArchiveMode = () => {
    setIsArchiveMode(false);
    setArchivedShiftData(null);
  };

  // Обработка кликов по меню
  const handleMenuClick = ({ key }) => {
    if (key === "exit_archive") {
      handleExitArchiveMode();
    } else {
      setActiveTab(key);
    }
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      width={280}
      breakpoint="lg"
      className={`admin-dashboard-sider ${isArchiveMode ? "sider-archive-mode" : ""}`}
    >
      <div className="sider-flex-wrapper">
        {/* ВЕРХНЯЯ ЧАСТЬ: ЛОГОТИП И НАВИГАЦИЯ */}
        <div className="sider-top-content">
          <div className="admin-sidebar-logo-container">
            <span className="admin-sidebar-logo-text">
              {collapsed ? "⚡" : "ZEUS AUTO ⚡"}
            </span>
          </div>

          {isArchiveMode && !collapsed && (
            <div className="sider-archive-badge-text">⚠️ РЕЖИМ ПРОСМОТРА</div>
          )}

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[activeTab]}
            items={isArchiveMode ? archiveMenuItems : normalMenuItems}
            onClick={handleMenuClick}
          />
        </div>

        {/* НИЖНЯЯ ЧАСТЬ: КОНТРОЛЬ СМЕНЫ И ЧАСЫ */}
        <div className="sider-footer-content">
          {shiftStatus === "open" && !isArchiveMode && (
            <button
              className="sider-close-shift-action-btn"
              onClick={handleTriggerCloseShift}
            >
              <PoweroffOutlined /> {!collapsed && "Закрыть смену (22:00)"}
            </button>
          )}

          <div className="sider-live-clock-wrapper">
            <ClockCircleOutlined className="clock-neon-icon" />
            {!collapsed && (
              <div className="clock-text-block">
                <span className="clock-time">
                  {currentTime.toLocaleTimeString("ru-RU")}
                </span>
                <span className="clock-date">
                  {currentTime.toLocaleDateString("ru-RU", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Sider>
  );
};

export default DashboardSidebar;
