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

  // 🌟 ИСПРАВЛЕНО: Безопасный парсер времени, который не спотыкается о точку в ISO-строках
  const formatVisitTime = (dateString) => {
    if (!dateString) return { time: "—:—", date: "—" };

    // Если бэк прислал кастомную уже отформатированную строку с пробелом (например "29.05.2026 15:30")
    if (
      typeof dateString === "string" &&
      dateString.includes(".") &&
      dateString.includes(" ")
    ) {
      const parts = dateString.split(" ");
      return {
        date: parts[0] || "—",
        time: parts[1] || "—:—",
      };
    }

    // Для стандартных ISO-строк из PostgreSQL и объектов Date
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
                  // 🌟 АВТОМАТИЧЕСКИЙ ДИАГНОСТИЧЕСКИЙ ЛОГ
                  // Открой F12 в браузере и посмотри на этот лог — увидишь реальные ключи твоего бэка!
                  console.log("=== ZEUS DATA DEBUG ===", visit);

                  // 🌟 ШАГ 1: БРОНЕБОЙНЫЙ СБОР ПЕРЕМЕННЫХ ИЗ ЛЮБЫХ ВОЗМОЖНЫХ АЛИАСОВ И РЕГИСТРОВ БЭКЕНДА
                  const serviceTitle =
                    visit.service_type ||
                    visit.serviceType ||
                    visit.service_name ||
                    visit.serviceName ||
                    visit.service ||
                    visit.name ||
                    "Комплексная мойка";
                  const priceVal =
                    visit.price !== undefined
                      ? visit.price
                      : visit.amount !== undefined
                        ? visit.amount
                        : visit.base_price !== undefined
                          ? visit.base_price
                          : "—";
                  const visitNum =
                    visit.visit_number ||
                    visit.visitNumber ||
                    visit.visit_count ||
                    visit.visitCount ||
                    visit.num ||
                    "—";
                  const paymentMethod =
                    visit.payment_type ||
                    visit.paymentType ||
                    visit.payment_method ||
                    visit.paymentMethod ||
                    "card";
                  const dateRaw =
                    visit.created_at ||
                    visit.createdAt ||
                    visit.date ||
                    visit.visit_date ||
                    visit.visitDate;

                  const cardId = visit.id || visit.visit_id || index;
                  const isOpen = openCardId === cardId;
                  const { time, date } = formatVisitTime(dateRaw);

                  return (
                    <div
                      key={cardId}
                      className={`client-visit-accordion-card ${isOpen ? "open" : ""}`}
                    >
                      {/* Шапка карточки (Кликабельная зона) */}
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
                            {priceVal === "—"
                              ? "—"
                              : parseInt(priceVal) === 0
                                ? "БЕСПЛАТНО"
                                : `${priceVal} ₽`}
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

                          {/* Номер визита в текущем цикле */}
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
                              Статус оплаты
                            </span>
                            <span className="client-detail-item-value success-text">
                              Выполнено успешно
                            </span>
                          </div>

                          <div className="client-detail-row-item">
                            <span className="client-detail-item-label">
                              Способ расчета
                            </span>
                            <span className="client-detail-item-value">
                              <i
                                className={`fas ${paymentMethod === "cash" ? "fa-money-bill-wave" : "fa-credit-card"}`}
                              ></i>
                              {paymentMethod === "cash"
                                ? " Наличные"
                                : " Карта / СБП"}
                            </span>
                          </div>

                          <div className="client-detail-row-item">
                            <span className="client-detail-item-label">
                              Позиция в цикле
                            </span>
                            <span className="client-detail-item-value highlight-cycle">
                              {visitNum !== "—"
                                ? `${visitNum} из 8 заездов`
                                : "Вне программы лояльности"}
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

        {/* КОНТЕЙНЕР №3: Профессиональный подвал поддержки */}
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
