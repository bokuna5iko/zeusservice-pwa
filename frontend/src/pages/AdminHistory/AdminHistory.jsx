// src/pages/AdminHistory/AdminHistory.jsx
import React, { useState, useEffect } from "react";
import { api } from "../../api/apiService"; // 🌟 Импортируем наш готовый центральный сервис API
import "./AdminHistory.css";

const AdminHistory = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedVisitId, setExpandedVisitId] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);

        // 🌟 ИСПРАВЛЕНО: Заменили сырой fetch на наш Axios-метод.
        // Он автоматически прокинет токен из localStorage и корректно обработает 304 статус от Workbox
        const response = await api.getTodayVisits();
        const dbVisits = response.data || [];

        setVisits(dbVisits);
      } catch (error) {
        // Блок поймает критический сбой сети, но приложение не упадёт
        console.warn(
          "Оффлайн-режим или сбой сети. Выведен локальный слепок истории:",
          error,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Логика одиночного аккордеона: при клике на открытый — закрывает, при клике на другой — закрывает старый
  const toggleExpand = (id) => {
    setExpandedVisitId(expandedVisitId === id ? null : id);
  };

  // Умная фильтрация ленты
  const filteredVisits = visits.filter((visit) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    const serviceName = (visit.service_name || "").toLowerCase();
    const clientPhone = (visit.phone || "").toLowerCase();
    const clientName = (visit.name || "").toLowerCase();
    const manualBrand = (visit.manual_car_brand || "").toLowerCase();
    const profileBrand = (
      visit.user_car_brand ||
      visit.car_brand ||
      ""
    ).toLowerCase();

    const dateFormatted = visit.created_at
      ? new Date(visit.created_at).toLocaleDateString("ru-RU")
      : "";

    return (
      serviceName.includes(term) ||
      clientPhone.includes(term) ||
      clientName.includes(term) ||
      manualBrand.includes(term) ||
      profileBrand.includes(term) ||
      dateFormatted.includes(term)
    );
  });

  const formatTime = (isoString) => {
    if (!isoString) return "00:00";
    return new Date(isoString).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
    });
  };

  return (
    <div className="admin-history-page">
      <div className="page-center-container">
        {/* КОНТЕЙНЕР №1: Поисковый фильтр */}
        <div className="content-group-box filter-container">
          <div className="search-wrapper">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              className="admin-search-input"
              placeholder="Поиск по услуге, телефону, марке, имени или дате..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchTerm("")}
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* КОНТЕЙНЕР №2: Lента визитов (Аккордеон) */}
        <div className="content-group-box filter-container">
          <h3 className="section-title-history">История заездов за сегодня</h3>

          {loading ? (
            <div className="admin-data-placeholder">
              Синхронизация с сервером...
            </div>
          ) : filteredVisits.length === 0 ? (
            <div className="admin-data-placeholder">
              Заездов по данному запросу не найдено
            </div>
          ) : (
            <div className="admin-visits-feed">
              {filteredVisits.map((visit) => {
                const isExpanded = expandedVisitId === visit.visit_id;
                const isGuest = !visit.user_id;

                return (
                  <div
                    key={visit.visit_id}
                    className={`admin-visit-accordion-card ${isExpanded ? "open" : ""}`}
                  >
                    {/* ==========================================
                        ОБНОВЛЕННАЯ ШАПКА КАРТОЧКИ (3 ПОДБЛОКА)
                        ========================================== */}
                    <div
                      className="admin-visit-header"
                      onClick={() => toggleExpand(visit.visit_id)}
                    >
                      {/* ПОДБЛОК 1: Верхняя основная строка (Услуга + Цена) */}
                      <div className="admin-header-row main-row">
                        <span className="admin-visit-service-title">
                          {visit.service_name || visit.service_type || "Услуга"}
                        </span>
                        <span className="admin-visit-price">
                          {visit.amount || visit.price} ₽
                        </span>
                      </div>

                      {/* ПОДБЛОК 2: Нижележащая строка параметров (Время/Дата + Бэйдж) */}
                      <div className="admin-header-row sub-row">
                        {/* Группа времени и даты слева */}
                        <div className="admin-visit-meta-time">
                          <span className="admin-visit-time">
                            {formatTime(visit.created_at)}
                          </span>
                          <span className="admin-visit-date-sub">
                            {formatDate(visit.created_at)}
                          </span>
                        </div>

                        {/* Зона статуса/марки авто справа */}
                        <div className="admin-visit-badge-zone">
                          {isGuest ? (
                            <span className="guest-badge-pill">Гость</span>
                          ) : (
                            <span
                              className="car-brand-pill"
                              style={{ whiteSpace: "nowrap" }}
                            >
                              {(() => {
                                const profileBrand =
                                  visit.user_car_brand || visit.car_brand; // Из профиля клиента
                                const manualBrand = visit.manual_car_brand; // От администратора при заезде

                                if (profileBrand && manualBrand) {
                                  return `${profileBrand} (${manualBrand})`;
                                }
                                return profileBrand || manualBrand || "Авто";
                              })()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ПОДБЛОК 3: Независимая стрелка-индикатор */}
                      <i
                        className={`fas fa-chevron-down admin-accordion-arrow ${isExpanded ? "rotate" : ""}`}
                      ></i>
                    </div>

                    {/* ==========================================
                        ВНУТРЕННЯЯ ПАНЕЛЬ ДЕТАЛИЗАЦИИ КЛИЕНТА
                        ========================================== */}
                    <div className="admin-visit-details">
                      <div className="admin-details-content">
                        {isGuest ? (
                          <div className="guest-info-notice">
                            <i className="fas fa-user-secret"></i> Данные
                            профиля недоступны для гостевых визитов
                          </div>
                        ) : (
                          <div className="client-info-list">
                            <div className="detail-row-item">
                              <span className="detail-item-label">
                                Автомобиль:
                              </span>
                              <span
                                className="detail-item-value"
                                style={{ fontWeight: "700", color: "#38bdf8" }}
                              >
                                {(() => {
                                  const profileBrand =
                                    visit.user_car_brand || visit.car_brand;
                                  const manualBrand = visit.manual_car_brand;
                                  if (profileBrand && manualBrand) {
                                    return `${profileBrand} (${manualBrand})`;
                                  }
                                  return (
                                    profileBrand || manualBrand || "Не указан"
                                  );
                                })()}
                              </span>
                            </div>

                            <div className="detail-row-item">
                              <span className="detail-item-label">
                                ID Клиента:
                              </span>
                              <span className="detail-item-value">
                                #{visit.user_id}
                              </span>
                            </div>
                            <div className="detail-row-item">
                              <span className="detail-item-label">Имя:</span>
                              <span className="detail-item-value">
                                {visit.name || "Не указано"}
                              </span>
                            </div>
                            <div className="detail-row-item">
                              <span className="detail-item-label">
                                Телефон:
                              </span>
                              <span className="detail-item-value">
                                {visit.phone ? `+${visit.phone}` : "—"}
                              </span>
                            </div>
                            <div className="detail-row-item">
                              <span className="detail-item-label">
                                Роль в системе:
                              </span>
                              <span className="detail-item-value role-badge">
                                {visit.role || "client"}
                              </span>
                            </div>
                            <div className="detail-row-item">
                              <span className="detail-item-label">
                                Всего визитов:
                              </span>
                              <span className="detail-item-value highlight">
                                {visit.total_visits || 0}
                              </span>
                            </div>
                            <div className="detail-row-item">
                              <span className="detail-item-label">
                                Визит в цикле:
                              </span>
                              <span className="detail-item-value loop-badge">
                                {visit.visit_number || 1} / 8
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Подвал выпадающего списка */}
                        <div className="visit-payment-footer">
                          <span className="payment-method">
                            <i className="far fa-credit-card"></i> Способ
                            оплаты:{" "}
                            <strong>{visit.payment_type || "Наличные"}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHistory;
