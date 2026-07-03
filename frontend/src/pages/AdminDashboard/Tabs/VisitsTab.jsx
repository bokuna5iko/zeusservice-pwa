// src/pages/AdminDashboard/Tabs/VisitsTab.jsx
import React, { useState, useEffect } from "react";
import { api } from "../../../api/apiService";
import { io } from "socket.io-client";

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
  const [liveShiftData, setLiveShiftData] = useState({
    cash: 0,
    card: 0,
    expenses: 0,
  });
  const [visits, setVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);

  // 🌟 ДОБАВЛЕНО: Стейт для хранения полноценного справочника услуг из БД
  const [allServices, setAllServices] = useState([]);

  // Состояния триггеров видимости окон
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Стейты данных для модалок
  const [editingVisit, setEditingVisit] = useState(null);
  const [expensesList, setExpensesList] = useState([]);

  // Стейты загрузок процессов
  const [loadingExpense, setLoadingExpense] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [loadingExpensesList, setLoadingExpensesList] = useState(false);

  // 🌟 МОДЕРНИЗИРОВАНО: Работаем через исправленный и централизованный apiService!
  useEffect(() => {
    api
      .getServices()
      .then((res) => {
        setAllServices(res.data || []);
      })
      .catch((err) => {
        console.error(
          "Ошибка загрузки услуг в VisitsTab через apiService:",
          err,
        );
      });
  }, []);

  // Клик на карандашик таблицы
  const handleEditClick = (visit) => {
    setEditingVisit(visit);
    setShowEditModal(true);
  };

  // Сохранение изменений визита с ГАРАНТИРОВАННЫМ пересчетом кассы (включая Апсейл/Допы)
  const handleEditVisitSubmit = async (payload) => {
    setLoadingEdit(true);
    try {
      const targetId = editingVisit.id || editingVisit.visit_id;

      // Отправляем данные на бэк и ждем эталонный ответ с новой кассой
      const res = await api.updateVisitFields(targetId, payload);

      // 🌟 ИСПРАВЛЕНО: Больше никакой ручной математики на фронте!
      // Если бэк вернул обновленную кассу смены — просто ставим её в стейт
      if (res && res.data && res.data.updatedShift) {
        const { cash_total, card_total, expenses_total } =
          res.data.updatedShift;
        setLiveShiftData({
          cash: Number(cash_total || 0),
          card: Number(card_total || 0),
          expenses: Number(expenses_total || 0),
        });
      }

      // Рассчитываем сумму допов для мгновенного обновления строки в таблице пульта
      const addonsSum = Array.isArray(payload.additional_services)
        ? payload.additional_services.reduce(
            (acc, curr) => acc + Number(curr.price || 0),
            0,
          )
        : 0;
      const newAmount =
        Number(payload.price || editingVisit.price || 0) + addonsSum;

      // 2. Обновляем строку визита в локальной таблице
      setVisits((prevVisits) =>
        prevVisits.map((v) => {
          const currentId = v.id || v.visit_id;
          const currentEditingId = editingVisit.id || editingVisit.visit_id;

          if (currentId === currentEditingId) {
            return {
              ...v,
              ...payload,
              price: Number(payload.price || v.price),
              amount: newAmount,
              additional_services: payload.additional_services, // Явно прописываем новые допы в строку!
              visit_number: payload.manual_visit_number,
              loyalty_step: payload.manual_visit_number,
            };
          }
          return v;
        }),
      );

      setShowEditModal(false);
      alert("Запись визита успешно обновлена в БД!");
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          "Ошибка при изменении полей визита на сервере",
      );
    } finally {
      setLoadingEdit(false);
    }
  };

  // 🌟 МОДЕРНИЗИРОВАНО: Полная защита от смещения часовых поясов JS
  const fetchTodayVisits = async () => {
    const isArchive = !!initialShiftData?.shift_date;
    if (shiftStatus !== "open" && !isArchive) return;

    setLoadingVisits(true);
    try {
      let targetDate = undefined;

      if (isArchive && initialShiftData.shift_date) {
        // Создаем объект даты, игнорируя Z-таймзону, чтобы получить чистый локальный день
        const pureDate = new Date(initialShiftData.shift_date);

        // Форматируем строго в YYYY-MM-DD по стандарту ISO без искажений поясов
        const year = pureDate.getFullYear();
        const month = String(pureDate.getMonth() + 1).padStart(2, "0");
        const day = String(pureDate.getDate()).padStart(2, "0");

        targetDate = `${year}-${month}-${day}`;
      }

      const response = await api.getTodayVisits(targetDate);
      const dbVisits = response.data || [];
      setVisits(dbVisits.reverse());
    } catch (err) {
      console.error("Не удалось загрузить ленту заездов из базы:", err);
    } finally {
      setLoadingVisits(false);
    }
  };
  // 🌟 ИСПРАВЛЕНО: Триггерим загрузку при изменении смены или её данных
  useEffect(() => {
    fetchTodayVisits();
  }, [shiftStatus, initialShiftData?.shift_date]);

  // Получение списка трат и открытие истории расходов
  const handleExpensesWidgetClick = (openExpenseInputForm = false) => {
    if (openExpenseInputForm === true) {
      setShowExpenseModal(true);
      return;
    }

    setLoadingExpensesList(true);
    setShowHistoryModal(true);

    const isArchive = !!initialShiftData?.shift_date;
    const targetShiftId = isArchive ? initialShiftData.id : undefined;

    api
      .getTodayExpenses(targetShiftId)
      .then((res) => {
        setExpensesList(res.data || []);
      })
      .catch((err) =>
        console.error("Не удалось загрузить историю расходов:", err),
      )
      .finally(() => setLoadingExpensesList(false));
  };

  // Добавление нового расхода
  const handleAddExpenseSubmit = async (amount, comment, resetFormCallback) => {
    setLoadingExpense(true);
    try {
      await api.addWorkShiftExpense(amount, comment);
      setLiveShiftData((prev) => ({
        ...prev,
        expenses: prev.expenses + amount,
      }));
      resetFormCallback();
      setShowExpenseModal(false);
    } catch (err) {
      alert(err.response?.data?.message || "Ошибка при сохранении расхода");
    } finally {
      setLoadingExpense(false);
    }
  };

  // Синхронизация финансов
  useEffect(() => {
    if (initialShiftData) {
      setLiveShiftData({
        cash: initialShiftData.cash_total || 0,
        card: initialShiftData.card_total || 0,
        expenses: initialShiftData.expenses_total || 0,
      });
    }
  }, [initialShiftData]);

  // WebSockets
  useEffect(() => {
    if (shiftStatus !== "open") return;
    fetchTodayVisits();

    const socketUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const socket = io(socketUrl);

    socket.on("connect", () => {
      socket.emit("join_admin_room");
    });

    socket.on("visit_update", (data) => {
      if (data.action === "create" && data.visit) {
        setVisits((prevVisits) => [...prevVisits, data.visit]);
        const isCash =
          data.visit.manual_payment_type === "Наличные" ||
          data.visit.manual_payment_type === "Нал";
        setLiveShiftData((prev) => ({
          ...prev,
          cash: isCash ? prev.cash + data.visit.price : prev.cash,
          card: !isCash ? prev.card + data.visit.price : prev.card,
        }));
      }
    });

    return () => socket.disconnect();
  }, [shiftStatus]);

  // 🌟 МОДЕРНИЗИРОВАНО: Умная блокировка смены с открытием кнопки после 6:00 утра
  // Определяем, архив ли это, прямо в теле компонента
  const isArchive = !!initialShiftData?.shift_date;

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

              {shiftStatus !== "closed" ? (
                <button className="open-shift-big-btn" onClick={onOpenShift}>
                  <i className="fas fa-key"></i> Открыть рабочую смену
                </button>
              ) : (
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
      {/* 🌟 ИСПРАВЛЕНО: Плашка «Наступило утро» рендерится ТОЛЬКО для оперативного дня (НЕ в архиве) */}
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

      <CashDashboard
        liveShiftData={liveShiftData}
        onAddExpenseClick={handleExpensesWidgetClick}
        shiftStatus={shiftStatus}
      />

      <VisitsTable
        visits={visits}
        loadingVisits={loadingVisits}
        shiftStatus={shiftStatus}
        onEditClick={handleEditClick}
      />

      {/* Компоненты модальных окон */}
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
