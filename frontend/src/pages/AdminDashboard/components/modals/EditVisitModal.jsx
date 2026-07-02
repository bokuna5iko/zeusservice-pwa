// src/pages/AdminDashboard/components/modals/EditVisitModal.jsx
import React, { useState, useEffect } from "react";
import "./EditVisitModal.css"; // 🔥 Подключаем выделенные CSS-стили

const EditVisitModal = ({
  isOpen,
  onClose,
  visit,
  onSave,
  loadingEdit,
  servicePrices,
}) => {
  const [editBrand, setEditBrand] = useState("");
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editService, setEditService] = useState("");
  const [editPayment, setEditPayment] = useState("");
  const [editVisitNumber, setEditVisitNumber] = useState(1);
  const [additionalServices, setAdditionalServices] = useState([]);

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
      setAdditionalServices(visit.additional_services || []);
    }
  }, [visit, isOpen]);

  if (!isOpen || !visit) return null;

  const handleAddAddonField = () => {
    setAdditionalServices([
      ...additionalServices,
      { name: "", price: 0, worker: "Основной мастер" },
    ]);
  };

  const handleRemoveAddonField = (index) => {
    setAdditionalServices(additionalServices.filter((_, i) => i !== index));
  };

  const handleAddonChange = (index, field, value) => {
    const updated = [...additionalServices];
    updated[index][field] = value;

    if (field === "name") {
      const found = servicePrices.find((s) => s.service_name === value);
      if (found) {
        updated[index]["price"] = Number(found.base_price || 0);
      }
    }
    setAdditionalServices(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const selectedServiceObj = servicePrices.find(
      (s) => s.service_name === editService,
    );
    const basePrice = selectedServiceObj
      ? Number(selectedServiceObj.base_price)
      : Number(visit.price || 0);

    const payload = {
      manual_car_brand: editBrand,
      manual_client_name: editName,
      manual_client_phone: editPhone,
      manual_service_name: editService,
      manual_payment_type: editPayment,
      manual_visit_number: Number(editVisitNumber),
      price: basePrice,
      additional_services: additionalServices,
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
              disabled={loadingEdit}
            />
          </div>

          <div className="arm-input-group">
            <label>Имя клиента</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={loadingEdit}
            />
          </div>

          <div className="arm-input-group">
            <label>Номер телефона</label>
            <input
              type="text"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              disabled={loadingEdit}
            />
          </div>

          <div className="arm-input-group">
            <label>Вид оказываемой услуги</label>
            <select
              value={editService}
              onChange={(e) => setEditService(e.target.value)}
              disabled={loadingEdit}
              className="arm-modal-select"
            >
              <option value="">-- Выберите услугу --</option>
              {servicePrices.map((s) => (
                <option key={s.id} value={s.service_name}>
                  {s.service_name} ({s.base_price} ₽)
                </option>
              ))}
            </select>
          </div>

          {/* 🌟 ЧИСТЫЙ БЛОК ДОП. УСЛУГ (БЕЗ ИНЛАЙН СТИЛЕЙ) */}
          <div className="additional-services-section">
            <h4 className="additional-services-title">Дополнительные услуги</h4>

            {additionalServices.map((addon, index) => (
              <div key={index} className="addon-row">
                <input
                  type="text"
                  placeholder="Название доп. услуги"
                  value={addon.name}
                  onChange={(e) =>
                    handleAddonChange(index, "name", e.target.value)
                  }
                  list={`services-list-${index}`}
                  className="addon-input-name"
                />
                <datalist id={`services-list-${index}`}>
                  {servicePrices.map((s) => (
                    <option key={s.id} value={s.service_name} />
                  ))}
                </datalist>

                <input
                  type="number"
                  placeholder="Цена ₽"
                  value={addon.price || ""}
                  onChange={(e) =>
                    handleAddonChange(index, "price", Number(e.target.value))
                  }
                  className="addon-input-price"
                />

                <select disabled className="addon-select-worker">
                  <option>Автоматически</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleRemoveAddonField(index)}
                  className="addon-delete-btn"
                  title="Удалить доп. услугу"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddAddonField}
              className="addon-add-trigger-btn"
            >
              <i className="fas fa-plus-circle"></i> + Добавить доп. услугу
            </button>
          </div>

          <div className="arm-input-group" style={{ marginTop: "15px" }}>
            <label>Визит в акции</label>
            <select
              value={editVisitNumber}
              onChange={(e) => setEditVisitNumber(e.target.value)}
              disabled={loadingEdit}
              className="arm-modal-select"
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
              className="arm-modal-select"
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
