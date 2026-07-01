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

const VisitsTab = ({ shiftStatus, initialShiftData, onOpenShift }) => {
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

  // Сохранение изменений визита с ГАРАНТИРОВАННЫМ пересчетом кассы
  const handleEditVisitSubmit = async (payload) => {
    setLoadingEdit(true);
    try {
      const targetId = editingVisit.id || editingVisit.visit_id;
      await api.updateVisitFields(targetId, payload);

      // 🌟 ИСПРАВЛЕНО: Безопасное определение старого и нового способов оплаты
      const getPaymentString = (v) => {
        if (!v) return "";
        return String(v.manual_payment_type || v.payment_type || "")
          .trim()
          .toLowerCase();
      };

      const oldPaymentStr = getPaymentString(editingVisit);
      // Из модалки редактирования прилетает manual_payment_type
      const newPaymentStr = String(
        payload.manual_payment_type || payload.payment_type || "",
      )
        .trim()
        .toLowerCase();

      // Наличными считаем всё, что содержит "нал" (Наличные, Нал, нал)
      const oldIsCash = oldPaymentStr.includes("нал");
      const newIsCash = newPaymentStr.includes("нал");

      const oldPrice = Number(editingVisit.price || 0);
      const newPrice = Number(payload.price || oldPrice);

      setLiveShiftData((prev) => {
        let updatedCash = Number(prev.cash || 0);
        let updatedCard = Number(prev.card || 0);

        // Шаг А: Корректно вычитаем старую стоимость из нужной ячейки
        if (oldIsCash) {
          updatedCash -= oldPrice;
        } else {
          updatedCard -= oldPrice;
        }

        // Шаг Б: Корректно прибавляем новую стоимость в нужную ячейку
        if (newIsCash) {
          updatedCash += newPrice;
        } else {
          updatedCard += newPrice;
        }

        return {
          ...prev,
          cash: updatedCash,
          card: updatedCard,
        };
      });

      // 2. Обновляем строки в таблице
      setVisits((prevVisits) =>
        prevVisits.map((v) => {
          const currentId = v.id || v.visit_id;
          const currentEditingId = editingVisit.id || editingVisit.visit_id;

          if (currentId === currentEditingId) {
            return {
              ...v,
              ...payload,
              price: newPrice, // Фиксируем измененную цену в строке
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

  if (shiftStatus === "not_started") {
    return (
      <div className="shift-lock-overlay">
        <div className="lock-card content-group-box">
          <div className="lock-icon-circle">
            <i className="fas fa-lock"></i>
          </div>
          <h2>Операционный день закрыт</h2>
          <p>
            Для активации таблиц, дашбордов и запуска приема машин, пожалуйста,
            откройте текущую рабочую смену.
          </p>
          <button className="open-shift-big-btn" onClick={onOpenShift}>
            <i className="fas fa-key"></i> Открыть рабочую смену
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="visits-tab-viewport">
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

      {/* 🌟 ОСТАВЛЯЕМ ТОЛЬКО ОДИН ПРАВИЛЬНЫЙ ВЫЗОВ МОДАЛКИ С ОКАЗАНИЕМ УСЛУГ ИЗ БД */}
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
