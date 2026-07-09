// src/pages/AdminDashboard/components/DashboardHeader.jsx
import React from "react";
import { Layout, Badge, Tooltip } from "antd";
import {
  SyncOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useAdminDashboard } from "../context/AdminDashboardContext";
import "./DashboardHeader.css";

const { Header } = Layout;

const DashboardHeader = () => {
  const {
    activeTab,
    shiftStatus,
    isArchiveMode,
    needRefresh,
    isSpinning,
    handlePwaUpdate,
  } = useAdminDashboard();

  // Логика динамических заголовков для левой части хедера
  const getTabTitle = () => {
    switch (activeTab) {
      case "visits":
        return "Лента визитов";
      case "workers":
        return "Управление сотрудниками";
      case "simulator":
        return "Симулятор PWA";
      case "archive":
        return "Архив рабочих смен";
      default:
        return "Панель управления";
    }
  };

  return (
    <>
      <Header className="admin-dashboard-header">
        {/* Левая часть: Название вкладки и индикатор состояния смены */}
        <div className="header-left-zone">
          <h2 className="header-tab-title">{getTabTitle()}</h2>
          <div
            className={`header-shift-status-badge ${isArchiveMode ? "archive" : shiftStatus}`}
          >
            {isArchiveMode
              ? "Архив"
              : shiftStatus === "open"
                ? "Смена открыта"
                : "Смена закрыта"}
          </div>
        </div>

        {/* Правая часть: Контролы обновления и профиль */}
        <div className="header-right-zone">
          {/* Кнопка обновления PWA */}
          <Tooltip
            title={
              needRefresh
                ? "Доступно критическое обновление"
                : "У вас актуальная версия"
            }
          >
            <button
              onClick={handlePwaUpdate}
              className={`pwa-update-action-btn ${needRefresh ? "needs-update" : "up-to-date"}`}
              disabled={!needRefresh}
            >
              {needRefresh ? (
                <Badge dot status="error" offset={[-2, 2]}>
                  <SyncOutlined
                    spin={isSpinning}
                    className="update-icon-orange"
                  />
                </Badge>
              ) : (
                <CheckCircleOutlined className="update-icon-green" />
              )}
              <span className="update-btn-text">
                {needRefresh ? "Обновить пульт" : "Система актуальна"}
              </span>
            </button>
          </Tooltip>

          {/* Информационный мини-профиль */}
          <div className="header-admin-profile">
            <div className="header-avatar">A</div>
            <span className="header-admin-name">Администратор</span>
          </div>
        </div>
      </Header>

      {/* СМАРТ-БАННЕР УВЕДОМЛЕНИЙ ОБ ОБНОВЛЕНИИ (Опускается ниже хедера при необходимости) */}
      {needRefresh && (
        <div className="update-notification-banner">
          <div className="update-banner-content">
            <div className="update-banner-icon">
              <SyncOutlined spin />
            </div>
            <div className="update-banner-text">
              <strong>Доступно критическое обновление</strong>
              <p>
                Система зафиксировала новую версию пульта управления.
                Рекомендуется применить изменения для корректной синхронизации
                кассы и заездов.
              </p>
            </div>
            <button onClick={handlePwaUpdate} className="update-banner-btn">
              <SyncOutlined />
              Обновить сейчас
            </button>
          </div>
          <div className="update-banner-glow"></div>
        </div>
      )}
    </>
  );
};

export default DashboardHeader;
