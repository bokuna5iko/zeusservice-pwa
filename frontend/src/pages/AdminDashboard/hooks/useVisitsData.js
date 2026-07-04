// src/pages/AdminDashboard/hooks/useVisitsData.js
import { useState, useEffect } from "react";
import { api } from "../../../api/apiService";
import { io } from "socket.io-client";

export const useVisitsData = (shiftStatus, initialShiftData) => {
  const [liveShiftData, setLiveShiftData] = useState({
    cash: 0,
    card: 0,
    expenses: 0,
  });
  const [visits, setVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [allServices, setAllServices] = useState([]);

  // Состояния триггеров окон
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Стейты данных для модалок
  const [editingVisit, setEditingVisit] = useState(null);
  const [expensesList, setExpensesList] = useState([]);

  // Загрузки
  const [loadingExpense, setLoadingExpense] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [loadingExpensesList, setLoadingExpensesList] = useState(false);

  // Загрузка справочника услуг
  useEffect(() => {
    api
      .getServices()
      .then((res) => setAllServices(res.data || []))
      .catch((err) => console.error("Ошибка загрузки услуг:", err));
  }, []);

  // Синхронизация финансов при изменении данных смены сверху
  useEffect(() => {
    if (initialShiftData) {
      setLiveShiftData({
        cash: initialShiftData.cash_total || 0,
        card: initialShiftData.card_total || 0,
        expenses: initialShiftData.expenses_total || 0,
      });
    }
  }, [initialShiftData]);

  // Загрузка списка визитов с защитой от смещения часовых поясов
  const fetchTodayVisits = async () => {
    const isArchive = !!initialShiftData?.shift_date;
    if (shiftStatus !== "open" && !isArchive) return;

    setLoadingVisits(true);
    try {
      let targetDate = undefined;
      if (isArchive && initialShiftData.shift_date) {
        const pureDate = new Date(initialShiftData.shift_date);
        const year = pureDate.getFullYear();
        const month = String(pureDate.getMonth() + 1).padStart(2, "0");
        const day = String(pureDate.getDate()).padStart(2, "0");
        targetDate = `${year}-${month}-${day}`;
      }

      const response = await api.getTodayVisits(targetDate);
      const dbVisits = response.data || [];
      setVisits(dbVisits.reverse());
    } catch (err) {
      console.error("Не удалось загрузить ленту заездов:", err);
    } finally {
      setLoadingVisits(false);
    }
  };

  useEffect(() => {
    fetchTodayVisits();
  }, [shiftStatus, initialShiftData?.shift_date]);

  // Живые сокеты
  useEffect(() => {
    if (shiftStatus !== "open") return;
    fetchTodayVisits();

    const socketUrl =
      window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : window.location.origin;

    const socket = io(socketUrl, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

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

    return () => {
      socket.disconnect();
    };
  }, [shiftStatus]);

  // Сохранение изменений визита
  const handleEditVisitSubmit = async (payload) => {
    setLoadingEdit(true);
    try {
      const targetId = editingVisit.id || editingVisit.visit_id;
      const res = await api.updateVisitFields(targetId, payload);

      if (res?.data?.updatedShift) {
        const { cash_total, card_total, expenses_total } =
          res.data.updatedShift;
        setLiveShiftData({
          cash: Number(cash_total || 0),
          card: Number(card_total || 0),
          expenses: Number(expenses_total || 0),
        });
      }

      const addonsSum = Array.isArray(payload.additional_services)
        ? payload.additional_services.reduce(
            (acc, curr) => acc + Number(curr.price || 0),
            0,
          )
        : 0;
      const newAmount =
        Number(payload.price || editingVisit.price || 0) + addonsSum;

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
              additional_services: payload.additional_services,
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
      alert(err.response?.data?.message || "Ошибка при изменении полей визита");
    } finally {
      setLoadingEdit(false);
    }
  };

  // Клик по расходам
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
      .then((res) => setExpensesList(res.data || []))
      .catch((err) =>
        console.error("Не удалось загрузить историю расходов:", err),
      )
      .finally(() => setLoadingExpensesList(false));
  };

  // Добавление расхода
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

  const handleEditClick = (visit) => {
    setEditingVisit(visit);
    setShowEditModal(true);
  };

  return {
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
  };
};
