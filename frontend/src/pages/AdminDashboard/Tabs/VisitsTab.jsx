// src/pages/AdminDashboard/Tabs/VisitsTab.jsx
import React, { useState, useEffect } from "react";
import { api } from "../../../api/apiService";
import { io } from "socket.io-client"; // 🌟 ДОБАВЛЕНО: Клиент сокетов

const SERVICE_PRICES = [
  { id: 1, name: "Экспресс-мойка", price: 500 },
  { id: 2, name: "Кузов + Салон (Комплекс)", price: 1500 },
  { id: 3, name: "Премиум Детейлинг", price: 5000 },
  { id: 4, name: "Химчистка салона", price: 3500 },
];

const VisitsTab = ({ shiftStatus, initialShiftData, onOpenShift }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);

  // И функцию-обработчик
  const handleEditClick = (visit) => {
    console.log("✏️ Редактируем визит:", visit);
    setEditingVisit(visit);
    setShowEditModal(true);
  };
  const [liveShiftData, setLiveShiftData] = useState({
    cash: 0,
    card: 0,
    expenses: 0,
  });
  const [visits, setVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false); // 🌟 ДОБАВЛЕНО: Стейт загрузки архива заездов

  // Состояния расходов
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseAmount, setAmount] = useState("");
  const [expenseComment, setComment] = useState("");
  const [loadingExpense, setLoadingExpense] = useState(false);

  // 🌟 ДОБАВЛЕНО: Функция получения заездов за текущий день из БД
  const fetchTodayVisits = async () => {
    if (shiftStatus !== "open") return;
    setLoadingVisits(true);
    try {
      const response = await api.getTodayVisits();
      const dbVisits = response.data || [];
      setVisits(dbVisits.reverse());
    } catch (err) {
      console.error("Не удалось загрузить ленту заездов из базы:", err);
    } finally {
      setLoadingVisits(false);
    }
  };

  // Синхронизируем начальные финансовые итоги смены
  useEffect(() => {
    if (initialShiftData) {
      setLiveShiftData({
        cash: initialShiftData.cash_total || 0,
        card: initialShiftData.card_total || 0,
        expenses: initialShiftData.expenses_total || 0,
      });
    }
  }, [initialShiftData]);

  // 🌟 МОДЕРНИЗИРОВАНО: Загружаем архив из БД + держим WebSocket на открытой смене
  useEffect(() => {
    if (shiftStatus !== "open") return;

    // Сразу запрашиваем накопленные за день визиты, чтобы F5 ничего не стирал
    fetchTodayVisits();

    const socketUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const socket = io(socketUrl);

    socket.on("connect", () => {
      console.log("🔌 Вкладка визитов вошла в сокет-соединение");
      socket.emit("join_admin_room"); // Заходим в административную комнату
    });

    // Перехватываем целевое действие клиента из PWA / Калькулятора
    socket.on("visit_update", (data) => {
      console.log("🚀 Пульт поймал реалтайм визит:", data);

      if (data.action === "create" && data.visit) {
        // 1. «На лету» модифицируем массив данных без перезагрузки всей страницы
        setVisits((prevVisits) => [...prevVisits, data.visit]);

        // 2. Автоматически пересчитываем кассовый виджет в моменте
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

  // Сохранение расхода
  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseAmount || !expenseComment || loadingExpense) return;

    setLoadingExpense(true);
    try {
      const response = await api.addWorkShiftExpense(
        Number(expenseAmount),
        expenseComment,
      );

      setLiveShiftData((prev) => ({
        ...prev,
        expenses: prev.expenses + Number(expenseAmount),
      }));

      setShowExpenseModal(false);
      setAmount("");
      setComment("");
    } catch (err) {
      alert(err.response?.data?.message || "Ошибка при сохранении расхода");
    } finally {
      setLoadingExpense(false);
    }
  };

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

  const totalRevenue =
    liveShiftData.cash + liveShiftData.card - liveShiftData.expenses;

  return (
    <div className="visits-tab-viewport">
      {/* ДАШБОРД КАССЫ */}
      <section className="cash-dashboard-row">
        <div className="cash-mini-card">
          <span className="card-label">Касса (Всего)</span>
          <span className="card-num color-cyan">{totalRevenue} ₽</span>
        </div>
        <div className="cash-mini-card">
          <span className="card-label">Наличные</span>
          <span className="card-num">{liveShiftData.cash} ₽</span>
        </div>
        <div className="cash-mini-card">
          <span className="card-label">Безналичные</span>
          <span className="card-num">{liveShiftData.card} ₽</span>
        </div>
        <div className="cash-mini-card">
          <span className="card-label">Расходы дня</span>
          <span className="card-num color-red">{liveShiftData.expenses} ₽</span>
        </div>

        <button
          className="dashboard-add-expense-btn"
          onClick={() => setShowExpenseModal(true)}
          disabled={shiftStatus === "closed"}
          style={
            shiftStatus === "closed"
              ? { opacity: 0.4, cursor: "not-allowed" }
              : {}
          }
        >
          <i className="fas fa-minus-circle"></i> Добавить расход
        </button>
      </section>

      {/* ТАБЛИЦА СТРОГО ИЗ 8 КОЛОНОК (ПО ТЗ) */}
      <section className="visits-table-wrapper content-group-box">
        <table className="arm-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Марка автомобиля</th>
              <th>Имя + Username</th>
              <th>Номер телефона</th>
              <th>Вид услуги</th>
              <th>Стоимость</th>
              <th>Визит в акции</th>
              <th>Способ оплаты</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {loadingVisits ? (
              <tr>
                <td colSpan="9" className="table-empty-notice">
                  <i className="fas fa-spinner fa-spin"></i> Синхронизация ленты
                  заездов с базой...
                </td>
              </tr>
            ) : visits.length === 0 ? (
              <tr>
                <td colSpan="9" className="table-empty-notice">
                  {shiftStatus === "closed"
                    ? "Смена завершена. Лента заездов зафиксирована."
                    : "Лента заездов пуста. Машины появятся автоматически через WebSockets при сканировании QR-кодов."}
                </td>
              </tr>
            ) : (
              visits.map((v, index) => (
                <tr key={v.id || index} className="fade-in">
                  <td>{index + 1}</td>
                  <td>{v.manual_car_brand || "—"}</td>
                  <td>
                    {v.manual_client_name || v.client_name || v.name || "—"}
                  </td>
                  <td>
                    {v.manual_client_phone || v.client_phone || v.phone || "—"}
                  </td>
                  <td>
                    {v.manual_service_name ||
                      v.service_name ||
                      v.service_type ||
                      "—"}
                  </td>
                  <td>{v.price} ₽</td>
                  <td>
                    <span className="action-step-badge">
                      {v.loyalty_step || v.visit_number || 1}/8
                    </span>
                  </td>
                  <td>{v.manual_payment_type || v.payment_type || "—"}</td>
                  <td>
                    <div className="table-actions-cell">
                      <button
                        className="edit-row-btn"
                        disabled={shiftStatus === "closed"}
                        onClick={() => handleEditClick(v)} // 🌟 ДОБАВЛЕНО
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="cancel-row-btn"
                        disabled={shiftStatus === "closed"}
                      >
                        &times;
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* МОДАЛКА РАСХОДОВ */}
      {showExpenseModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowExpenseModal(false)}
        >
          <div
            className="modal-content content-group-box"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-title">
              <i className="fas fa-wallet"></i> Учесть расход из кассы
            </h3>
            <form onSubmit={handleAddExpenseSubmit} className="arm-modal-form">
              <div className="arm-input-group">
                <label>Сумма трат (₽)</label>
                <input
                  type="number"
                  placeholder="450"
                  value={expenseAmount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loadingExpense}
                  required
                />
              </div>
              <div className="arm-input-group">
                <label>Описание</label>
                <input
                  type="text"
                  placeholder="Закупка автошампуня"
                  value={expenseComment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={loadingExpense}
                  required
                />
              </div>
              <div className="modal-btn-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowExpenseModal(false)}
                  disabled={loadingExpense}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loadingExpense}
                >
                  {loadingExpense ? "Сохранение..." : "Зафиксировать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitsTab;
