// src/pages/AdminDashboard/components/VisitsTable.jsx
import React, { useState, useRef } from "react";
import { createPortal } from "react-dom"; // 🌟 Добавили Портал для обхода ограничений overflow
import "./VisitsTable.css";

const AddonPopoverBadge = ({ addons }) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const badgeRef = useRef(null);

  if (!addons || addons.length === 0) return null;

  const handleBadgeClick = (e) => {
    e.stopPropagation();

    if (!visible && badgeRef.current) {
      // 🌟 Магия геометрии: вычисляем точное положение баджа на экране в пикселях
      const rect = badgeRef.current.getBoundingClientRect();
      setCoords({
        // Опускаем окно чуть ниже баджа с учетом текущей прокрутки страницы
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    }
    setVisible(!visible);
  };

  return (
    <div className="addon-badge-wrapper" ref={badgeRef}>
      <span onClick={handleBadgeClick} className="addon-neon-badge">
        +{addons.length} доп
      </span>

      {visible &&
        // 🌟 Рендерим оверлей и поповер прямо в корень <body>, минуя любые таблицы!
        createPortal(
          <>
            <div
              onClick={(e) => {
                e.stopPropagation();
                setVisible(false);
              }}
              className="addon-popover-overlay"
            />
            <div
              className="addon-popover-card"
              style={{
                position: "absolute",
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                transform: "translateX(-50%)", // Идеальное центрирование
                zIndex: 99999, // Поверх абсолютно всего на автомойке!
              }}
            >
              <div className="addon-popover-title">Детали дозаказа:</div>
              {addons.map((a, i) => (
                <div key={i} className="addon-popover-item">
                  <span>• {a.name || "Доп. услуга"}</span>
                  <span className="addon-popover-item-price">{a.price} ₽</span>
                </div>
              ))}
            </div>
          </>,
          document.body, // Портируем элементы в корень страницы!
        )}
    </div>
  );
};

const VisitsTable = ({ visits, loadingVisits, shiftStatus, onEditClick }) => {
  const formatTime = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  return (
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
            visits.map((v, index) => {
              const isGuest = !v.user_id;

              // Логика склейки марки машины
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

              // Логика вывода имени
              const clientNameDisplay = isGuest
                ? v.manual_client_name || "Гость"
                : v.name || v.client_name || v.manual_client_name || "Клиент";

              return (
                <tr key={v.id || index} className="fade-in">
                  <td>
                    <div className="table-index-cell">
                      <span style={{ fontWeight: "600" }}>{index + 1}</span>
                      <span className="table-time-sub">
                        {formatTime(v.created_at)}
                      </span>
                    </div>
                  </td>

                  <td style={{ fontWeight: "600" }}>{carBrandDisplay}</td>
                  <td>{clientNameDisplay}</td>
                  <td>
                    {v.manual_client_phone || v.client_phone || v.phone || "—"}
                  </td>

                  {/* Услуга со стильным баджем апсейла без инлайн стилей */}
                  <td>
                    <div className="service-cell-container">
                      <span>
                        {v.manual_service_name ||
                          v.service_name ||
                          v.service_type ||
                          "—"}
                      </span>
                      <AddonPopoverBadge addons={v.additional_services} />
                    </div>
                  </td>

                  {/* Итоговый чек заезда */}
                  <td className="table-amount-bold">
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
                      <button
                        className="edit-row-btn"
                        disabled={shiftStatus === "closed"}
                        onClick={() => onEditClick(v)}
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
              );
            })
          )}
        </tbody>
      </table>
    </section>
  );
};

export default VisitsTable;
