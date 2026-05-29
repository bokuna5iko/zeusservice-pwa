// src/pages/History/HistoryPage.jsx
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import "./HistoryPage.css";
import { api } from "../../api/apiService";

const HistoryPage = () => {
  const { user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Стейт для отслеживания открытого аккордеона
  const [openCardId, setOpenCardId] = useState(null);

  // Загружаем историю при монтировании компонента
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.getUserHistory();
        setHistory(response.data);
      } catch (error) {
        console.error("Ошибка загрузки истории:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const toggleAccordion = (id) => {
    setOpenCardId(openCardId === id ? null : id);
  };

  // Безопасный парсер времени
  const formatVisitTime = (dateString) => {
    if (!dateString) return { time: "—:—", date: "—" };

    const d = new Date(dateString);
    if (isNaN(d.getTime())) return { time: "—:—", date: "—" };

    const time = d.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const date = d.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return { time, date };
  };

  // Логика расчета скидок на фронте
  const calculateDiscountedPrice = (price, visitNum) => {
    const num = Number(visitNum);
    if (num === 8) return 0;
    if (num === 4) return price * 0.8;
    return price;
  };

  return (
    <div className="client-history-page">
      <div className="page-center-container">
        {/* КОНТЕЙНЕР №1: Сводная информация по лояльности */}
        <div className="client-history-card summary-box content-group-box">
          <div className="fill-zone">
            <h3 className="history-section-title">Общая статистика</h3>
            <p className="history-section-subtitle">
              Данные вашей карты за всё время
            </p>
            <div className="client-summary-counter">
              <i className="fas fa-car-wash"></i>
              <span>
                Всего заездов:{" "}
                <strong className="neon-count">
                  {user?.total_visits || history.length || 0}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* КОНТЕЙНЕР №2: Лента визитов */}
        <div className="client-history-card list-box content-group-box">
          <div className="fill-zone">
            <h3 className="history-list-title">История посещений</h3>

            <div className="client-visits-feed">
              {loading ? (
                <div className="client-data-placeholder">
                  <i className="fas fa-spinner fa-spin"></i> Загрузка вашей
                  истории...
                </div>
              ) : history.length > 0 ? (
                history.map((visit, index) => {
                  // Наша логика счетчика на основе главной страницы
                  const currentCount =
                    user?.visit_count !== undefined
                      ? Number(user.visit_count)
                      : 0;

                  let visitNum =
                    currentCount === 0 ? 8 - index : currentCount - index;

                  if (visitNum <= 0) {
                    visitNum = ((((visitNum - 1) % 8) + 8) % 8) + 1;
                  }

                  // Сбор параметров из Response
                  const serviceTitle =
                    visit.service_name || "Комплексная мойка";
                  const basePrice =
                    visit.base_price !== undefined && visit.base_price !== null
                      ? visit.base_price
                      : 0;
                  const dateRaw = visit.created_at;
                  const carName = visit.car_name || "Не указан";

                  // 🌟 ИСПРАВЛЕНО: Бронебойное определение способа оплаты ( cash / Наличные )
                  const rawPayment = visit.payment_type || "";
                  const isCash =
                    rawPayment === "cash" || rawPayment === "Наличные";

                  // Динамически подставляем текст и иконку в зависимости от ответа бэка
                  const paymentDisplayText = isCash
                    ? " Наличные"
                    : rawPayment || " Карта / СБП";
                  const paymentIconClass = isCash
                    ? "fa-money-bill-wave"
                    : "fa-credit-card";

                  // Рассчитываем цену со скидками 20% / 100%
                  const finalPrice = calculateDiscountedPrice(
                    basePrice,
                    visitNum,
                  );

                  const cardId = visit.id || index;
                  const isOpen = openCardId === cardId;
                  const { time, date } = formatVisitTime(dateRaw);

                  return (
                    <div
                      key={cardId}
                      className={`client-visit-accordion-card ${isOpen ? "open" : ""}`}
                    >
                      {/* Шапка карточки */}
                      <div
                        className="client-visit-header"
                        onClick={() => toggleAccordion(cardId)}
                      >
                        {/* Верхняя строка: Название услуги и Цена */}
                        <div className="client-header-row main-row">
                          <span className="client-visit-service-title">
                            {serviceTitle}
                          </span>
                          <span className="client-visit-price">
                            {parseInt(basePrice) === 0 ||
                            Number(finalPrice) === 0
                              ? "БЕСПЛАТНО"
                              : `${finalPrice} ₽`}
                          </span>
                        </div>

                        {/* Нижняя строка: Мета-данные */}
                        <div className="client-header-row sub-row">
                          <div className="client-visit-meta-time">
                            <span className="client-visit-time">{time}</span>
                            <span className="client-visit-date-sub">
                              {date}
                            </span>
                          </div>

                          <div className="client-visit-badge-zone">
                            <span className="visit-number-pill">
                              Визит №{visitNum}
                            </span>
                          </div>
                        </div>

                        {/* Независимая стрелка-индикатор */}
                        <i className="fas fa-chevron-down client-accordion-arrow"></i>
                      </div>

                      {/* Внутренний раскрывающийся блок деталей */}
                      <div className="client-visit-details">
                        <div className="client-details-content">
                          <div className="client-detail-row-item">
                            <span className="client-detail-item-label">
                              Стоимость заезда
                            </span>
                            <span className="client-detail-item-value">
                              {Number(visitNum) === 4 ||
                              Number(visitNum) === 8 ? (
                                <>
                                  <span
                                    style={{
                                      textDecoration: "line-through",
                                      color: "#64748b",
                                      marginRight: "6px",
                                    }}
                                  >
                                    {basePrice} ₽
                                  </span>
                                  <span
                                    className="success-text"
                                    style={{ fontWeight: "bold" }}
                                  >
                                    {finalPrice} ₽
                                  </span>
                                  <span
                                    style={{
                                      color: "#f59e0b",
                                      fontSize: "0.8rem",
                                      marginLeft: "6px",
                                    }}
                                  >
                                    (
                                    {Number(visitNum) === 8
                                      ? "100% подарок"
                                      : "20% скидка"}
                                    )
                                  </span>
                                </>
                              ) : (
                                `${basePrice} ₽`
                              )}
                            </span>
                          </div>

                          {/* 🌟 МОДЕРНИЗИРОВАНО: Корректный вывод иконки и типа оплаты */}
                          <div className="client-detail-row-item">
                            <span className="client-detail-item-label">
                              Способ расчета
                            </span>
                            <span className="client-detail-item-value">
                              <i className={`fas ${paymentIconClass}`}></i>
                              {paymentDisplayText}
                            </span>
                          </div>

                          <div className="client-detail-row-item">
                            <span className="client-detail-item-label">
                              Автомобиль
                            </span>
                            <span
                              className="client-detail-item-value highlight-cycle"
                              style={{
                                background: "rgba(56, 189, 248, 0.1)",
                                color: "#38bdf8",
                              }}
                            >
                              {carName}
                            </span>
                          </div>

                          <div className="client-detail-row-item">
                            <span className="client-detail-item-label">
                              Позиция в цикле
                            </span>
                            <span className="client-detail-item-value highlight-cycle">
                              {visitNum} из 8 визитов
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="client-data-placeholder">
                  У вас пока нет зарегистрированных посещений...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* КОНТЕЙНЕР №3: Подвал поддержки */}
        <div className="client-history-card history-footer-info content-group-box">
          <div className="fill-zone footer-center">
            <i className="fas fa-info-circle"></i>
            <p className="footer-notice-text">
              Заметили неточность в истории или количестве визитов?
              <br />
              Пожалуйста, обратитесь к администратору на кассе.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
