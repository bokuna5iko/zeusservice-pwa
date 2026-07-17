// src/pages/AdminDashboard/components/VisitsTable.jsx
import React from "react";
import AddonPopoverBadge from "./AddonPopoverBadge";
import "./VisitsTable.css";

// 🌟 ОБНОВЛЕНО: В пропсы добавлен onCancelClick для вызова модалки отказа
const VisitsTable = ({
  visits,
  loadingVisits,
  shiftStatus,
  onEditClick,
  onCancelClick,
}) => {
  const formatTime = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  return (
    <section className="visits-table-wrapper content-group-box">
      {/* 🌟 ОБНОВЛЕНО: Добавлен класс custom-scroll для активации локального скролла */}
      <div className="arm-table-scroll-area custom-scroll">
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
                    ? "Смена завершена. Таблица заездов зафиксирована."
                    : "Лента заездов пуста. Машины появятся автоматически через WebSockets при сканировании QR-кодов."}
                </td>
              </tr>
            ) : (
              visits.map((v, index) => {
                const isGuest = !v.user_id;
                const profileBrand = v.user_car_brand || v.car_brand;
                const manualBrand = v.manual_car_brand;
                let carBrandDisplay = "—";

                if (isGuest) {
                  carBrandDisplay = manualBrand || "Гостевой авто";
                } else {
                  if (profileBrand && manualBrand) {
                    carBrandDisplay = `${profileBrand} (${manualBrand})`;
                  } else {
                    carBrandDisplay = profileBrand || manualBrand || "Авто";
                  }
                }

                const clientNameDisplay = isGuest
                  ? v.manual_client_name || "Гость"
                  : v.name || v.client_name || v.manual_client_name || "Клиент";

                // 🌟 ДОБАВЛЕНО: Проверяем, отменен ли визит
                const isCancelled = v.status === "cancelled";

                return (
                  <tr
                    key={v.id || index}
                    className={`fade-in ${isCancelled ? "row-cancelled" : ""}`}
                  >
                    <td>
                      <div className="table-index-cell">
                        <span style={{ fontWeight: "600" }}>{index + 1}</span>
                        <span className="table-time-sub">
                          {formatTime(v.created_at)}
                        </span>
                      </div>
                    </td>

                    <td
                      style={{
                        fontWeight: "600",
                        textDecoration: isCancelled ? "line-through" : "none",
                      }}
                    >
                      {carBrandDisplay}
                    </td>
                    <td
                      style={{
                        textDecoration: isCancelled ? "line-through" : "none",
                      }}
                    >
                      {clientNameDisplay}
                    </td>
                    <td>
                      {v.manual_client_phone ||
                        v.client_phone ||
                        v.phone ||
                        "—"}
                    </td>

                    <td>
                      <div className="service-cell-container">
                        <span
                          style={{
                            textDecoration: isCancelled
                              ? "line-through"
                              : "none",
                          }}
                        >
                          {v.manual_service_name ||
                            v.service_name ||
                            v.service_type ||
                            "—"}
                        </span>
                        <AddonPopoverBadge addons={v.additional_services} />

                        {/* 🌟 ДОБАВЛЕНО: Компактный тег с причиной отмены, если статус отменен */}
                        {isCancelled && v.cancellation_reason && (
                          <span
                            className="cancel-reason-tag"
                            title={v.cancellation_comment}
                          >
                            ❌ {v.cancellation_reason}
                          </span>
                        )}
                      </div>
                    </td>

                    <td
                      className="table-amount-bold"
                      style={{ color: isCancelled ? "#94a3b8" : "inherit" }}
                    >
                      {Number(v.amount ?? v.price ?? 0)} ₽
                    </td>

                    <td>
                      <span className="action-step-badge">
                        {v.visit_number ??
                          v.manual_visit_number ??
                          v.loyalty_step ??
                          1}
                        /8
                      </span>
                    </td>
                    <td>{v.manual_payment_type || v.payment_type || "—"}</td>
                    <td>
                      <div className="table-actions-cell">
                        {/* Кнопка изменения: блокируется, если смена закрыта или заезд уже отменен */}
                        <button
                          className="edit-row-btn"
                          disabled={shiftStatus === "closed" || isCancelled}
                          onClick={() => onEditClick(v)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>

                        {/* 🌟 ОБНОВЛЕНО: Крестик теперь интерактивный и вызывает окно отмены */}
                        <button
                          className={`cancel-row-btn ${isCancelled ? "cancelled-active" : ""}`}
                          disabled={shiftStatus === "closed" || isCancelled}
                          onClick={() => onCancelClick(v)}
                          title={
                            isCancelled ? "Заезд отменен" : "Отменить заезд"
                          }
                        >
                          &times;
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default VisitsTable;
