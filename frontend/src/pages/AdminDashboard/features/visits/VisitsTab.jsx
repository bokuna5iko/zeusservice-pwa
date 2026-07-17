// src/pages/AdminDashboard/features/visits/VisitsTab.jsx
import React from "react";
import { useVisitsData } from "./hooks/useVisitsData";
import { useVisitModals } from "./hooks/useVisitModals"; // 🌟 НОВЫЙ ХУК

import "./VisitsTab.css";

// Визуальные компоненты блоков
import CashDashboard from "./components/CashDashboard";
import VisitsTable from "./components/VisitsTable";

// Компоненты модальных окон
import ExpenseModal from "../../shared/modals/ExpenseModal";
import EditVisitModal from "../../shared/modals/EditVisitModal";
import ExpenseHistoryModal from "../../shared/modals/ExpenseHistoryModal";
import CancelVisitModal from "../../shared/modals/CancelVisitModal";

const VisitsTab = ({
  shiftStatus,
  initialShiftData,
  onOpenShift,
  onCloseShiftSuccess,
}) => {
  // 1. Бизнес-логика и данные (оставляем нетронутым, чтобы не сломать 13 внутренних хуков)
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

  // 2. UI-логика модальных окон (теперь чистая и изолированная)
  const {
    showCancelModal,
    cancellingVisit,
    loadingCancel,
    setLoadingCancel,
    openCancelModal,
    closeCancelModal,
  } = useVisitModals();

  const isArchive = !!initialShiftData?.shift_date;

  // 3. Бизнес-логика отмены (остается здесь, так как ей нужен доступ к массиву visits из useVisitsData)
  const handleCancelSubmit = async (reason, comment) => {
    setLoadingCancel(true);
    try {
      console.log("Отмена визита:", cancellingVisit.id, { reason, comment });

      // Локальное обновление для мгновенного UI-отклика
      if (visits) {
        const found = visits.find((v) => v.id === cancellingVisit.id);
        if (found) {
          found.status = "cancelled";
          found.cancellation_reason = reason;
          found.cancellation_comment = comment;
        }
      }
      closeCancelModal();
    } catch (error) {
      console.error("Ошибка отмены визита:", error);
    } finally {
      setLoadingCancel(false);
    }
  };

  // 4. Ранний возврат (Экран блокировки)
  if (!isArchive) {
    if (shiftStatus === "not_started" || shiftStatus === "closed") {
      const currentHour = new Date().getHours();
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

  // 5. Основной рендер (Чистый оркестратор)
  return (
    <div className="visits-tab-viewport">
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
        onCancelClick={
          openCancelModal
        } /* 🌟 Теперь передаем чистую функцию из хука */
      />

      {/* --- МОДАЛЬНЫЕ ОКНА --- */}
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

      <CancelVisitModal
        isOpen={showCancelModal}
        onClose={closeCancelModal} /* 🌟 Чистая функция закрытия */
        visit={cancellingVisit}
        onSave={handleCancelSubmit}
        loading={loadingCancel}
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
