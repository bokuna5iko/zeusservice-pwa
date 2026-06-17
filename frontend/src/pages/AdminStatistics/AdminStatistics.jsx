import React, { useState, useEffect } from "react";
import { api } from "../../api/apiService";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./AdminStatistics.css";

const AdminStatistics = () => {
  // Состояния для метрик и графика
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Состояния для архива клиентов
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [archiveLoading, setArchiveLoading] = useState(false);

  // 1. Загрузка метрик и данных графика (за сегодня) через apiService
  const fetchTodayStats = async () => {
    try {
      // Вызываем метод из apiService. Наш интерцептор сам подставит accessToken!
      const response = await api.getStats();

      setStats(response.data);
    } catch (error) {
      console.error("Ошибка загрузки статистики за сегодня:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Загрузка архива клиентов через apiService
  const fetchClientArchive = async (query = "") => {
    setArchiveLoading(true);
    try {
      // Передаем строку поиска в метод
      const response = await api.getClientArchive(query);

      setClients(response.data);
    } catch (error) {
      console.error("Ошибка загрузки архива клиентов:", error);
    } finally {
      setArchiveLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayStats();
    // Автоматическое обновление данных каждые 30 минут, как в ТЗ
    const interval = setInterval(fetchTodayStats, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Перезапрашиваем архив при вводе в поиск
  useEffect(() => {
    if (isArchiveOpen) {
      const delayDebounce = setTimeout(() => {
        fetchClientArchive(searchQuery);
      }, 400); // Дебаунс 400мс, чтобы не спамить бэк при каждой букве
      return () => clearTimeout(delayDebounce);
    }
  }, [searchQuery, isArchiveOpen]);

  if (loading || !stats) {
    return <div className="admin-stats-loading">Загрузка аналитики...</div>;
  }
  // Подготовка данных для графика Recharts (заполнение дефолтных рабочих часов, если на бэке пусто)
  const chartData = (stats?.hourlyGraph || []).map((item) => {
    // Вытаскиваем числовое значение часа из строки бэка "XX:00"
    const serverHour = parseInt(item.hour.split(":")[0], 10);

    // Прибавляем 6 часов разницы между Москвой и Якутском.
    // % 24 нужен, чтобы время не улетало выше 24 часов (например, 22 + 6 = 28 -> превратится в 4 часа утра)
    const localHour = (serverHour + 6) % 24;

    // Форматируем обратно в красивую строку "XX:00"
    const formattedHour = `${String(localHour).padStart(2, "0")}:00`;

    return {
      ...item,
      hour: formattedHour, // Перезаписываем ось X правильным местным временем
      cars: item.cars,
    };
  });

  // Пересортируем массив по часам, чтобы после сдвига сетка от 08:00 до 22:00 не перемешалась
  chartData.sort((a, b) => a.hour.localeCompare(b.hour));

  return (
    <div className="admin-stats-page">
      <div className="page-center-container">
        {/* ==========================================================================
            КОНТЕЙНЕР №1: МЕТРИКИ (ГРИД 2х2)
            ========================================================================== */}
        <div className="stats-metrics-grid">
          <div className="metric-item-card">
            <div className="metric-icon-box">
              <i className="fas fa-car"></i>
            </div>
            <span className="metric-title">Клиенты сегодня</span>
            <span className="metric-value">
              {stats?.metrics?.totalVisitsToday || 0}
            </span>
          </div>

          <div className="metric-item-card">
            <div className="metric-icon-box">
              <i className="fas fa-heart"></i>
            </div>
            <span className="metric-title">% Лояльных</span>
            <span className="metric-value">
              {stats?.metrics?.loyaltyPercentage || 0}%
            </span>
          </div>

          <div className="metric-item-card">
            <div className="metric-icon-box">
              <i className="fas fa-user-plus"></i>
            </div>
            <span className="metric-title">Новые в PWA</span>
            <span className="metric-value">
              {stats?.metrics?.registeredToday || 0}
            </span>
          </div>

          <div className="metric-item-card accent-cash">
            <div className="metric-icon-box">
              <i className="fas fa-wallet"></i>
            </div>
            <span className="metric-title">Выручка сегодня</span>
            <span className="metric-value">
              {stats?.metrics?.totalRevenueToday || 0} ₽
            </span>
          </div>
        </div>

        {/* ==========================================================================
            КОНТЕЙНЕР №2: ВИЗУАЛЬНАЯ ДИНАМИКА ЗА 24 ЧАСА (ГРАФИК)
            ========================================================================== */}
        <div className="stats-chart-container content-group-box">
          <h3 className="stats-block-title">
            <i className="fas fa-chart-line"></i> Загруженность мойки по часам
          </h3>
          <div className="responsive-chart-wrapper">
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  {/* Плавный градиент под линией графика */}
                  <linearGradient
                    id="statsLineGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  vertical={false}
                />
                <XAxis
                  dataKey="hour"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  allowDecimals={false}
                  dx={6}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1e293b",
                    borderRadius: "8px",
                    color: "#f8fafc",
                  }}
                  itemStyle={{ color: "#38bdf8" }}
                  labelFormatter={(value) => `Время: ${value}`}
                />
                <Area
                  type="monotone"
                  dataKey="cars"
                  name="Машин"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#statsLineGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ==========================================================================
            КОНТЕЙНЕР №3: СПРАВОЧНИК (АРХИВ КЛИЕНТОВ) - КНОПКА ВЫЗОВА
            ========================================================================== */}
        <div className="stats-archive-trigger-box">
          <button
            className="stats-archive-btn"
            onClick={() => setIsArchiveOpen(true)}
          >
            <i className="fas fa-book"></i>
            <span>Открыть список клиентов</span>
            <i className="fas fa-chevron-right arrow-end"></i>
          </button>
        </div>
      </div>

      {/* ==========================================================================
          МОДАЛЬНОЕ ОКНО: АРХИВ КЛИЕНТОВ (СПРАВОЧНИК)
          ========================================================================== */}
      {isArchiveOpen && (
        <div
          className="archive-modal-overlay"
          onClick={() => setIsArchiveOpen(false)}
        >
          <div
            className="archive-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="archive-modal-close"
              onClick={() => setIsArchiveOpen(false)}
            >
              &times;
            </button>

            <div className="archive-modal-header">
              <h3>
                <i className="fas fa-users"></i> База клиентов (Топ-50 свежих)
              </h3>
              <div className="archive-search-wrapper">
                <i className="fas fa-search search-inside-icon"></i>
                <input
                  type="text"
                  placeholder="Поиск по ФИО, телефону, авто или ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="archive-search-input"
                />
              </div>
            </div>

            <div className="archive-modal-body">
              {archiveLoading ? (
                <div className="archive-status-text">
                  Поиск в базе данных...
                </div>
              ) : clients.length === 0 ? (
                <div className="archive-status-text">Клиенты не найдены</div>
              ) : (
                <div className="clients-list-container">
                  {clients.map((client) => (
                    <div className="client-archive-card" key={client.id}>
                      <div className="client-card-top">
                        <span className="client-name">
                          {client.name || "Без имени"}
                        </span>
                        <span className="client-id-badge">ID: {client.id}</span>
                      </div>

                      <div className="client-card-details">
                        <div className="detail-row">
                          <i className="fas fa-phone-alt"></i>
                          <span>
                            {client.phone ? `+${client.phone}` : "Нет телефона"}
                          </span>
                        </div>
                        <div className="detail-row">
                          <i className="fas fa-car"></i>
                          <span>{client.car_brand || "Марка не указана"}</span>
                        </div>
                        <div className="detail-row">
                          <i className="fas fa-star-half-alt"></i>
                          <span>
                            Всего визитов:{" "}
                            <strong>{client.total_visits || 0}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="client-card-footer">
                        <span>Был у нас последний раз:</span>
                        <strong>
                          {client.last_visit
                            ? new Date(client.last_visit).toLocaleDateString(
                                "ru-RU",
                                { hour: "2-digit", minute: "2-digit" },
                              )
                            : "Нет визитов"}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStatistics;
