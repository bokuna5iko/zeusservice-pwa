// src/pages/AdminDashboard/components/modals/EditVisitModal.jsx
import React from "react";
import { useEditVisit } from "../../hooks/useEditVisit";
import "./EditVisitModal.css";

const EditVisitModal = ({
  isOpen,
  onClose,
  visit,
  onSave,
  loadingEdit,
  servicePrices,
}) => {
  // Подключаем наш изолированный хук логики полей заезда
  const {
    editBrand,
    setEditBrand,
    editName,
    setEditName,
    editPhone,
    setEditPhone,
    editService,
    setEditService,
    editPayment,
    setEditPayment,
    editVisitNumber,
    setEditVisitNumber,
    additionalServices,
    carClass,
    setCarClass,
    filteredServices,
    handleAddAddonField,
    handleRemoveAddonField,
    handleAddonChange,
    handleSubmitFields,
  } = useEditVisit(isOpen, visit, servicePrices, onSave);

  if (!isOpen || !visit) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content content-group-box"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="modal-title">
          <i className="fas fa-edit"></i> Изменить параметры заезда
        </h3>

        <form onSubmit={handleSubmitFields} className="arm-modal-form">
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
            <label>Класс автомобиля</label>
            <div
              className="calc-class-selector"
              style={{ marginBottom: "5px" }}
            >
              {[1, 2, 3, 4, 5].map((cls) => (
                <button
                  key={cls}
                  type="button"
                  className={`calc-class-tab ${carClass === cls ? "active" : ""}`}
                  onClick={() => {
                    setCarClass(cls);
                    setEditService("");
                  }}
                  disabled={loadingEdit}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          <div className="arm-input-group">
            <label>Вид оказываемой услуги (Класс {carClass})</label>
            <select
              value={editService}
              onChange={(e) => setEditService(e.target.value)}
              disabled={loadingEdit}
              className="arm-modal-select"
              required
            >
              <option value="">-- Нажмите для выбора услуги --</option>
              {filteredServices.map((s) => (
                <option key={s.id} value={s.service_name}>
                  {s.service_name} ({s.base_price} ₽)
                </option>
              ))}
            </select>
          </div>

          {/* Блок доп. услуг (Апсейл) */}
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
                  disabled={loadingEdit}
                  list={`services-list-${index}`}
                  className="addon-input-name"
                />
                <datalist id={`services-list-${index}`}>
                  {filteredServices.map((s) => (
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
                  disabled={loadingEdit}
                  className="addon-input-price"
                />

                <select disabled className="addon-select-worker">
                  <option>Автоматически</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleRemoveAddonField(index)}
                  disabled={loadingEdit}
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
              disabled={loadingEdit}
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
