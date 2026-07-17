// src/pages/AdminDashboard/features/visits/hooks/useVisitModals.js
import { useState } from "react";

export const useVisitModals = () => {
  // Состояние исключительно для модалки отмены визита
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingVisit, setCancellingVisit] = useState(null);
  const [loadingCancel, setLoadingCancel] = useState(false);

  const openCancelModal = (visit) => {
    setCancellingVisit(visit);
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancellingVisit(null);
    setLoadingCancel(false); // Сбрасываем лоадер при закрытии
  };

  return {
    showCancelModal,
    cancellingVisit,
    loadingCancel,
    setLoadingCancel, // Оставляем доступным, чтобы компонент мог управлять спиннером во время сабмита
    openCancelModal,
    closeCancelModal,
  };
};
