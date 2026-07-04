// src/pages/AdminDashboard/Tabs/VisitsTab.jsx
import React from "react";
import { useVisitsData } from "../hooks/useVisitsData";

// Импортируем визуальные компоненты блоков
import CashDashboard from "../components/CashDashboard";
import VisitsTable from "../components/VisitsTable";

// Импортируем компоненты модальных окон
import ExpenseModal from "../components/modals/ExpenseModal";
import EditVisitModal from "../components/modals/EditVisitModal";
import ExpenseHistoryModal from "../components/modals/ExpenseHistoryModal";

const VisitsTab = ({
  shiftStatus,
  initialShiftData,
  onOpenShift,
  onCloseShiftSuccess,
}) => {
  // Подключаем наш мощный и чистый кастомный хук бизнес-логики
  const {
    liveShiftData,
    visits,
    loadingVisits,
    allServices,
    showExpenseModal,
    setShowExpenseModal,
    showEditModal,
    setShowEditModal,
    showHistoryModal,
    setShowHistoryModal,
    editingVisit,
    expensesList,
    loadingExpense,
    loadingEdit,
    loadingExpensesList,
    handleEditClick,
    handleEditVisitSubmit,
    handleExpensesWidgetClick,
    handleAddExpenseSubmit,
  } = useVisitsData(shiftStatus, initialShiftData);

  const isArchive = !!initialShiftData?.shift_date;

  // Если мы НЕ в архиве и смена не активна — выводим аккуратную карточку блокировки дня
  if (!isArchive) {
    if (shiftStatus === "not_started" || shiftStatus === "closed") {
      const currentHour = new Date().getHours();
      // Если смена закрыта, но уже наступило 6 утра — система разрешит открыть новую смену кнопкой на плашке
      const isNewDayReady = shiftStatus === "closed" && currentHour >= 6;

      if (!isNewDayReady) {
        return (
          <div className="shift-lock-overlay">
            <div className="lock-card content-group-box">
              <div className="lock-icon-circle">
                <i className="fas fa-lock"></i>
              </div>
              <h2>
                {shiftStatus === "closed"
                  ? "Операционный день завершен"
                  : "Операционный день закрыт"}
              </h2>
              <p>
                {shiftStatus === "closed"
                  ? "Рабочая смена была успешно заархивирована. Кнопка открытия новой смены станет доступна автоматически после 06:00 утра."
                  : "Для активации таблиц, дашбордов и запуска приема машин, пожалуйста, откройте текущую рабочую смену."}
              </p>

              {shiftStatus !== "closed" && (
                <button className="open-shift-big-btn" onClick={onOpenShift}>
                  <i className="fas fa-key"></i> Открыть рабочую смену
                </button>
              )}

              {shiftStatus === "closed" && (
                <div
                  style={{
                    color: "#ef4444",
                    fontWeight: "600",
                    marginTop: "15px",
                    letterSpacing: "0.5px",
                  }}
                >
                  <i className="fas fa-calendar-check"></i> Касса заперта. Смена
                  сдана до 6:00 утра.
                </div>
              )}
            </div>
          </div>
        );
      }
    }
  }

  return (
    <div className="visits-tab-viewport">
      {/* Плашка «Наступило утро нового дня», если касса закрыта, но часы пробили 6:00+ утра */}
      {!isArchive && shiftStatus === "closed" && (
        <div
          style={{
            background: "rgba(245, 158, 11, 0.15)",
            border: "1px solid #f59e0b",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ color: "#f59e0b", fontWeight: "500" }}>
            <i className="fas fa-sun"></i> Наступило утро нового дня. Предыдущая
            смена заархивирована.
          </span>
          <button
            className="btn-primary"
            onClick={onOpenShift}
            style={{
              background: "#f59e0b",
              color: "#020617",
              padding: "8px 16px",
            }}
          >
            <i className="fas fa-key"></i> Открыть новую смену
          </button>
        </div>
      )}

      {/* Финансовый Дашборд */}
      <CashDashboard
        liveShiftData={liveShiftData}
        onAddExpenseClick={handleExpensesWidgetClick}
        shiftStatus={shiftStatus}
      />

      {/* Таблица текущих автомобилей */}
      <VisitsTable
        visits={visits}
        loadingVisits={loadingVisits}
        shiftStatus={shiftStatus}
        onEditClick={handleEditClick}
      />

      {/* Окна расходов и редактирования визитов */}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSave={handleAddExpenseSubmit}
        loadingExpense={loadingExpense}
      />

      <EditVisitModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        visit={editingVisit}
        onSave={handleEditVisitSubmit}
        loadingEdit={loadingEdit}
        servicePrices={allServices}
      />

      <ExpenseHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        expensesList={expensesList}
        loadingExpensesList={loadingExpensesList}
      />
    </div>
  );
};

export default VisitsTab;
