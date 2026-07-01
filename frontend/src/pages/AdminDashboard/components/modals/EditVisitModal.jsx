// src/pages/AdminDashboard/components/modals/EditVisitModal.jsx
import React, { useState, useEffect } from "react";

const EditVisitModal = ({
  isOpen,
  onClose,
  visit,
  onSave,
  loadingEdit,
  servicePrices, // Теперь сюда приходит массив allServices из БД
}) => {
  const [editBrand, setEditBrand] = useState("");
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editService, setEditService] = useState("");
  const [editPayment, setEditPayment] = useState("");
  const [editVisitNumber, setEditVisitNumber] = useState(1);

  // Синхронизируем стейты формы с выбранным визитом при открытии
  useEffect(() => {
    if (visit && isOpen) {
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
      setEditVisitNumber(
        visit.manual_visit_number ||
          visit.loyalty_step ||
          visit.visit_number ||
          1,
      );
    }
  }, [visit, isOpen]);

  if (!isOpen || !visit) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    // 🌟 ДОБАВЛЕНО: Находим выбранную услугу в справочнике, чтобы обновить её цену в БД
    const selectedServiceObj = servicePrices.find(
      (s) => s.service_name === editService,
    );
    const updatedPrice = selectedServiceObj
      ? selectedServiceObj.base_price
      : visit.price;

    const payload = {
      manual_car_brand: editBrand,
      manual_client_name: editName,
      manual_client_phone: editPhone,
      manual_service_name: editService,
      manual_payment_type: editPayment,
      manual_visit_number: Number(editVisitNumber),
      // Пробрасываем скорректированную цену, если админ выбрал другую услугу
      price: updatedPrice,
      amount: updatedPrice,
    };
    onSave(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content content-group-box"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="modal-title">
          <i className="fas fa-edit"></i> Изменить параметры заезда
        </h3>
        <form onSubmit={handleSubmit} className="arm-modal-form">
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
                width: "100%",
              }}
            >
              <option value="">-- Выберите услугу --</option>
              {/* 🌟 ИСПРАВЛЕНО: Читаем корректные свойства s.service_name и s.base_price из БД */}
              {servicePrices.map((s) => (
                <option key={s.id} value={s.service_name}>
                  {s.service_name} ({s.base_price} ₽)
                </option>
              ))}
            </select>
          </div>

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
                width: "100%",
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <option key={num} value={num}>
                  {num} / 8{" "}
                  {num === 4 ? "(Скидка 20%)" : num === 8 ? "(Бесплатно)" : ""}
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
                width: "100%",
              }}
            >
              <option value="Наличные">Наличные</option>
              <option value="Онлайн-перевод">Онлайн-перевод</option>
              <option value="Карта">Карта / СБП</option>
            </select>
          </div>
          <div className="modal-btn-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
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
  );
};

export default EditVisitModal;
