// src/pages/AdminDashboard/Tabs/VisitsTab.jsx
import React, { useState, useEffect } from "react";
import { api } from "../../../api/apiService";
import { io } from "socket.io-client";

const SERVICE_PRICES = [
  { id: 1, name: "Экспресс-мойка", price: 500 },
  { id: 2, name: "Кузов + Салон (Комплекс)", price: 1500 },
  { id: 3, name: "Премиум Детейлинг", price: 5000 },
  { id: 4, name: "Химчистка салона", price: 3500 },
];

const VisitsTab = ({ shiftStatus, initialShiftData, onOpenShift }) => {
  const [liveShiftData, setLiveShiftData] = useState({
    cash: 0,
    card: 0,
    expenses: 0,
  });
  const [visits, setVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);

  // Состояния расходов
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseAmount, setAmount] = useState("");
  const [expenseComment, setComment] = useState("");
  const [loadingExpense, setLoadingExpense] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [expensesList, setExpensesList] = useState([]);
  const [loadingExpensesList, setLoadingExpensesList] = useState(false);

  // СОСТОЯНИЯ РЕДАКТИРОВАНИЯ ВИЗИТА
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Локальные стейты формы редактирования визита
  const [editBrand, setEditBrand] = useState("");
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editService, setEditService] = useState("");
  const [editPayment, setEditPayment] = useState("");
  const [editVisitNumber, setEditVisitNumber] = useState(1); // 🌟 ДОБАВЛЕНО: Стейт шага лояльности

  // Обработчик клика на карандашик — предзаполняем поля формы
  const handleEditClick = (visit) => {
    console.log("✏️ Редактируем визит:", visit);
    setEditingVisit(visit);
    setEditBrand(visit.manual_car_brand || "");
    setEditName(
      visit.manual_client_name || visit.client_name || visit.name || "",
    );
    setEditPhone(
      visit.manual_client_phone || visit.client_phone || visit.phone || "",
    );
    setEditService(
      visit.manual_service_name ||
        visit.service_name ||
        visit.service_type ||
        "",
    );
    setEditPayment(
      visit.manual_payment_type || visit.payment_type || "Наличные",
    );
    // 🌟 Загружаем ручной или системный шаг лояльности в селект
    setEditVisitNumber(
      visit.manual_visit_number ||
        visit.loyalty_step ||
        visit.visit_number ||
        1,
    );
    setShowEditModal(true);
  };

  // Функция отправки отредактированных данных на бэкенд
  const handleEditVisitSubmit = async (e) => {
    e.preventDefault();
    if (!editingVisit || loadingEdit) return;

    setLoadingEdit(true);
    try {
      const payload = {
        manual_car_brand: editBrand,
        manual_client_name: editName,
        manual_client_phone: editPhone,
        manual_service_name: editService,
        manual_payment_type: editPayment,
        manual_visit_number: Number(editVisitNumber), // 🌟 ДОБАВЛЕНО в отправку
      };

      const targetId = editingVisit.id || editingVisit.visit_id;

      console.log("=== ТЕСТ 1: ОТПРАВКА НА БЭКЕНД ===");
      console.log("ID визита:", targetId);
      console.log(
        "Значение editVisitNumber из стейта селекта:",
        editVisitNumber,
      );
      console.log("Payload для отправки:", payload);

      await api.updateVisitFields(targetId, payload);

      // Локально обновляем массив на клиенте
      setVisits((prevVisits) =>
        prevVisits.map((v) => {
          const currentId = v.id || v.visit_id;
          const currentEditingId = editingVisit.id || editingVisit.visit_id;

          if (currentId === currentEditingId) {
            return {
              ...v,
              ...payload,
              // 🌟 Стираем старые счетчики автоматики и пишем туда выбранное ручное число!
              visit_number: Number(editVisitNumber),
              loyalty_step: Number(editVisitNumber),
            };
          }
          return v;
        }),
      );

      setShowEditModal(false);
      alert("Запись визита успешно обновлена в БД!");
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Ошибка при изменении полей визита на сервере",
      );
    } finally {
      setLoadingEdit(false);
    }
  };

  // Функция получения заездов за текущий день из БД
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

  //Функция загрузки трат
  const fetchExpensesHistory = async () => {
    setLoadingExpensesList(true);
    setShowHistoryModal(true);
    try {
      // Подставь метод твоего apiService (например, api.getTodayExpenses)
      // Если метода еще нет в apiService.js, добавь его туда: getTodayExpenses: () => axios.get('/api/work-shifts/expenses/today')
      const response = await api.getTodayExpenses();
      setExpensesList(response.data || []);
    } catch (err) {
      console.error("Не удалось загрузить историю расходов:", err);
    } finally {
      setLoadingExpensesList(false);
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

  // WebSocket
  useEffect(() => {
    if (shiftStatus !== "open") return;

    fetchTodayVisits();

    const socketUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const socket = io(socketUrl);

    socket.on("connect", () => {
      console.log("🔌 Вкладка визитов вошла в сокет-соединение");
      socket.emit("join_admin_room");
    });

    socket.on("visit_update", (data) => {
      console.log("🚀 Пульт поймал реалтайм визит:", data);
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

  // Сохранение расхода
  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseAmount || !expenseComment || loadingExpense) return;

    setLoadingExpense(true);
    try {
      await api.addWorkShiftExpense(Number(expenseAmount), expenseComment);
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

  // 🌟 ДОБАВЛЕНО: Парсер ISO-даты в формат ЧЧ:ММ
  const formatTime = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

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
        <div
          className="cash-mini-card"
          onClick={fetchExpensesHistory}
          style={{ cursor: "pointer", transition: "transform 0.2s" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "scale(1.02)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
          title="Нажмите, чтобы посмотреть историю трат"
        >
          <span className="card-label">Расходы дня 🔍</span>
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

      {/* ТАБЛИЦА */}
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
                  {/* 🌟 ИСПРАВЛЕНО: Комбо-вывод Номера и Времени заезда */}
                  <td>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontWeight: "600" }}>{index + 1}</span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {formatTime(v.created_at)}
                      </span>
                    </div>
                  </td>
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
                      {/* 🌟 Приоритетный вывод ручного или системного шага лояльности */}
                      {v.manual_visit_number ||
                        v.loyalty_step ||
                        v.visit_number ||
                        1}
                      /8
                    </span>
                  </td>
                  <td>{v.manual_payment_type || v.payment_type || "—"}</td>
                  <td>
                    <div className="table-actions-cell">
                      <button
                        className="edit-row-btn"
                        disabled={shiftStatus === "closed"}
                        onClick={() => handleEditClick(v)}
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
                  Зафиксировать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* УМНАЯ МОДАЛКА РЕДАКТИРОВАНИЯ ПАРАМЕТРОВ ВИЗИТА */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div
            className="modal-content content-group-box"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-title">
              <i className="fas fa-edit"></i> Изменить параметры заезда
            </h3>
            <form onSubmit={handleEditVisitSubmit} className="arm-modal-form">
              <div className="arm-input-group">
                <label>Марка автомобиля</label>
                <input
                  type="text"
                  value={editBrand}
                  onChange={(e) => setEditBrand(e.target.value)}
                  placeholder="Например, Toyota Camry"
                  disabled={loadingEdit}
                />
              </div>
              <div className="arm-input-group">
                <label>Имя клиента</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Например, Александр"
                  disabled={loadingEdit}
                />
              </div>
              <div className="arm-input-group">
                <label>Номер телефона</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Например, +7 (999) 000-00-00"
                  disabled={loadingEdit}
                />
              </div>
              <div className="arm-input-group">
                <label>Вид оказываемой услуги</label>
                <select
                  value={editService}
                  onChange={(e) => setEditService(e.target.value)}
                  disabled={loadingEdit}
                  style={{
                    background: "#020617",
                    color: "#f8fafc",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #1e293b",
                  }}
                >
                  <option value="">-- Выберите услугу --</option>
                  {SERVICE_PRICES.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.price} ₽)
                    </option>
                  ))}
                </select>
              </div>

              {/* 🌟 ДОБАВЛЕНО: СЕЛЕКТ ШАГА КАРТЫ ЛОЯЛЬНОСТИ ОТ 1 ДО 8 */}
              <div className="arm-input-group">
                <label>Визит в акции (Карта лояльности)</label>
                <select
                  value={editVisitNumber}
                  onChange={(e) => setEditVisitNumber(e.target.value)}
                  disabled={loadingEdit}
                  style={{
                    background: "#020617",
                    color: "#f8fafc",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #1e293b",
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>
                      {num} / 8{" "}
                      {num === 4
                        ? "(Скидка 20%)"
                        : num === 8
                          ? "(Бесплатно)"
                          : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="arm-input-group">
                <label>Способ расчета</label>
                <select
                  value={editPayment}
                  onChange={(e) => setEditPayment(e.target.value)}
                  disabled={loadingEdit}
                  style={{
                    background: "#020617",
                    color: "#f8fafc",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #1e293b",
                  }}
                >
                  <option value="Наличные">Наличные</option>
                  <option value="Карта">Карта / СБП</option>
                </select>
              </div>
              <div className="modal-btn-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={loadingEdit}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loadingEdit}
                >
                  {loadingEdit ? "Сохранение..." : "Сохранить изменения"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 🌟 ИСПРАВЛЕНО: МОДАЛКА ПРОСМОТРА ИСТОРИИ РАСХОДОВ ТЕПЕРЬ САМОСТОЯТЕЛЬНА */}
      {showHistoryModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowHistoryModal(false)}
        >
          <div
            className="modal-content content-group-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px" }}
          >
            <h3 className="modal-title">
              <i className="fas fa-list-alt"></i> История расходов за смену
            </h3>

            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                marginBottom: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {loadingExpensesList ? (
                <p style={{ textAlign: "center", color: "#64748b" }}>
                  <i className="fas fa-spinner fa-spin"></i> Загрузка...
                </p>
              ) : expensesList.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    color: "#64748b",
                    padding: "20px 0",
                  }}
                >
                  Трат за текущую смену еще не зафиксировано.
                </p>
              ) : (
                expensesList.map((exp) => (
                  <div
                    key={exp.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px",
                      background: "#020617",
                      borderRadius: "8px",
                      border: "1px solid #1e293b",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <span style={{ fontWeight: "600", color: "#f8fafc" }}>
                        {exp.description}
                      </span>
                      <span style={{ fontSize: "11px", color: "#475569" }}>
                        {new Date(exp.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <span
                      style={{
                        color: "#f87171",
                        fontWeight: "700",
                        fontSize: "1.05rem",
                      }}
                    >
                      -{exp.amount} ₽
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="modal-btn-row">
              {/* Добавили явный type="button", чтобы клик не отправлял никакие скрытые формы */}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowHistoryModal(false)}
              >
                Закрыть окно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitsTab;
