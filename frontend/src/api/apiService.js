// src/api/apiService.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const apiService = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Интерцептор для добавления токена авторизации к каждому запросу
apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Интерцептор для обработки ошибок ответа (например, 401 Unauthorized)
apiService.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized request, token might be expired.");
    }
    return Promise.reject(error);
  },
);

export const api = {
  login: (phone) => apiService.post("/auth/login", { phone }),
  getProfile: () => apiService.get("/user/me"),
  getServices: () => apiService.get("/services"),
  getUserHistory: () => apiService.get("/user/history"),
  addVisit: (userId, serviceId) =>
    apiService.post("/visits/add", { userId, serviceId }),
  getStats: () => apiService.get("/admin/stats/today"),
  getClientArchive: (query) =>
    apiService.get(
      `/admin/clients/archive?search=${encodeURIComponent(query)}`,
    ),
  verifyUserByQr: (qrString) =>
    apiService.get(`/admin/users/verify/${encodeURIComponent(qrString)}`),

  // 🌟 ИСПРАВЛЕНО: Добавлены точные методы для модуля смен (ТЗ 2.0)
  // Маршруты Сотрудника (Worker)
  getWorkerShifts: () => apiService.get("/shifts/worker/history"),
  requestShift: (date) => apiService.post("/shifts/worker/request", { date }),

  // Маршруты Администратора (Admin)
  getPendingShifts: () => apiService.get("/shifts/admin/pending"),
  getAdminCalendar: () => apiService.get("/shifts/admin/calendar"),
  batchUpdateShifts: (changes) =>
    apiService.post("/shifts/admin/batch-update", { changes }),

  // 🌟 ДОБАВЛЕНО: Методы АРМ Пульта Управления (Операционные Смены и Расходы)
  getWorkShiftStatus: () => apiService.get("/work-shifts/status"),
  openWorkShift: () => apiService.post("/work-shifts/open"),
  closeWorkShift: () => apiService.post("/work-shifts/close"),
  addWorkShiftExpense: (amount, description) =>
    apiService.post("/work-shifts/expenses", { amount, description }),

  // 🌟 ДОБАВЛЯЕМ СЮДА: Метод получения расходов за сегодня
  getTodayExpenses: () => apiService.get("/work-shifts/expenses/today"),

  // Получить список всех заездов за текущий операционный день
  getTodayVisits: () => apiService.get("/admin/visits/today"),

  // Точечное редактирование полей визита администратором (PATCH)
  updateVisitFields: (visitId, fields) =>
    apiService.patch(`/admin/visits/update/${visitId}`, fields),
};

export default apiService;
