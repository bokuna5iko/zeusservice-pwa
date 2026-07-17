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
import CancelVisitModal from "../components/modals/CancelVisitModal"; // 🌟 ДОБАВЛЕНО: Новое модальное окно отмены визита

const VisitsTab = ({
  shiftStatus,
  initialShiftData,
  onOpenShift,
  onCloseShiftSuccess,
}) => {
  // 1. Подключаем наш мощный и чистый кастомный хук бизнес-логики (содержит 13 внутренних хуков)
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

  // 🌟 ИСПРАВЛЕНО: Перенесли локальные стейты в самый верх компонента.
  // Теперь правила хуков строго соблюдены, React всегда видит стабильные 17 хуков!
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [cancellingVisit, setCancellingVisit] = React.useState(null);
  const [loadingCancel, setLoadingCancel] = React.useState(false);

  const isArchive = !!initialShiftData?.shift_date;

  const handleCancelClick = (visit) => {
    setCancellingVisit(visit);
    setShowCancelModal(true);
  };

  const handleCancelSubmit = async (reason, comment) => {
    setLoadingCancel(true);
    try {
      console.log("Отмена визита:", cancellingVisit.id, { reason, comment });

      // Локально обновляем статус визита, чтобы сразу увидеть результат на экране
      if (visits) {
        const found = visits.find((v) => v.id === cancellingVisit.id);
        if (found) {
          found.status = "cancelled";
          found.cancellation_reason = reason;
          found.cancellation_comment = comment;
        }
      }

      setShowCancelModal(false);
    } catch (error) {
      console.error("Ошибка отмены визита:", error);
    } finally {
      setLoadingCancel(false);
    }
  };

  // 🌟 ТЕПЕРЬ РАННИЕ ВОЗВРАТЫ НАХОДЯТСЯ СТРОГО ПОД ВСЕМИ ОБЪЯВЛЕННЫМИ ХУКАМИ
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
      {/* Плашка «Наступило утро нового дня» */}
      {!isArchive && shiftStatus === "closed" && (
        <div style={{}}>{/* ... */}</div>
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
        onCancelClick={handleCancelClick} /* Передаем клик отмены */
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

      {/* Новое модальное окно отмены визита */}
      <CancelVisitModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
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
