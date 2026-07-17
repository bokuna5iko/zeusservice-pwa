// src/pages/AdminDashboard/features/visits/hooks/useVisitModals.js
import { useState } from "react";

export const useVisitModals = () => {
  // Состояние для модалки редактирования
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);

  // Состояние для модалки отмены
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [visitToCancel, setVisitToCancel] = useState(null);

  // Функции для Edit Modal
  const openEditModal = (visit) => {
    setEditingVisit(visit);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingVisit(null);
  };

  // Функции для Cancel Modal
  const openCancelModal = (visit) => {
    setVisitToCancel(visit);
    setIsCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    setIsCancelModalOpen(false);
    setVisitToCancel(null);
  };

  return {
    isEditModalOpen,
    editingVisit,
    openEditModal,
    closeEditModal,
    isCancelModalOpen,
    visitToCancel,
    openCancelModal,
    closeCancelModal,
  };
};
