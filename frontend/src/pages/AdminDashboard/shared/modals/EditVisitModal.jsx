// src/pages/AdminDashboard/components/modals/EditVisitModal.jsx
import React, { useState, useEffect } from "react";
import { useEditVisit } from "../../features/visits/hooks/useEditVisit";
import "./EditVisitModal.css";

const EditVisitModal = ({
  isOpen,
  onClose,
  visit,
  onSave,
  loadingEdit,
  servicePrices,
}) => {
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

  // 🌟 ДОБАВЛЕНО ПО ТЗ: Локальный стейт для управления рабочей заметкой к автомобилю
  const [editNote, setEditNote] = useState("");

  // Синхронизируем текст заметки при открытии модалки под конкретную машину
  useEffect(() => {
    if (isOpen && visit) {
      setEditNote(visit.note || "");
    }
  }, [isOpen, visit]);

  if (!isOpen || !visit) return null;

  // 🌟 ИСПРАВЛЕНО: Перехватываем сабмит, чтобы подмешать заметку в payload для onSave/бэкенда
  const handleLocalSubmit = (e) => {
    e.preventDefault();

    // Внутри useEditVisit оригинальный handleSubmitFields работает с e-объектом.
    // Чтобы передать заметку на бэк, мы временно вешаем её свойством в текущий объект visit в памяти,
    // откуда хук useEditVisit собирает итоговый payload для отправки в базу данных.
    visit.note = editNote;

    handleSubmitFields(e);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content content-group-box compact-edit-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="modal-title">
          <i className="fas fa-edit"></i> Параметры заезда
        </h3>

        <form onSubmit={handleLocalSubmit} className="arm-modal-form">
          {/* Ряд 1: Клиентские данные */}
          <div className="form-row-twin">
            <div className="arm-input-group">
              <label>Имя клиента</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={loadingEdit}
                placeholder="Гость"
              />
            </div>
            <div className="arm-input-group">
              <label>Номер телефона</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                disabled={loadingEdit}
                placeholder="—"
              />
            </div>
          </div>

          {/* Ряд 2: Автомобиль */}
          <div className="form-row-twin">
            <div className="arm-input-group">
              <label>Марка авто</label>
              <input
                type="text"
                value={editBrand}
                onChange={(e) => setEditBrand(e.target.value)}
                disabled={loadingEdit}
                placeholder="Марка / Модель"
              />
            </div>
            <div className="arm-input-group">
              <label>Класс авто</label>
              <div className="calc-class-selector text-center">
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
          </div>

          {/* Ряд 3: Основная услуга */}
          <div className="arm-input-group">
            <label>Основная услуга (Класс {carClass})</label>
            <select
              value={editService}
              onChange={(e) => setEditService(e.target.value)}
              disabled={loadingEdit}
              className="arm-modal-select"
              required
            >
              <option value="">-- Выберите услугу --</option>
              {filteredServices.map((s) => (
                <option key={s.id} value={s.service_name}>
                  {s.service_name} ({s.base_price} ₽)
                </option>
              ))}
            </select>
          </div>

          {/* Блок доп. услуг (Скроллируемый контейнер-конструктор) */}
          <div className="additional-services-section">
            <div className="addon-header-row">
              <h4 className="additional-services-title">
                Дополнительные услуги (+ чек)
              </h4>
              <button
                type="button"
                onClick={handleAddAddonField}
                disabled={loadingEdit}
                className="addon-mini-add-btn"
              >
                <i className="fas fa-plus"></i> Добавить
              </button>
            </div>

            <div className="addons-scroll-viewport">
              {additionalServices.length === 0 ? (
                <p className="addons-empty-placeholder">
                  Дополнительных услуг не добавлено
                </p>
              ) : (
                additionalServices.map((addon, index) => (
                  <div key={index} className="addon-row compact-row">
                    <input
                      type="text"
                      placeholder="Название допа"
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
                      placeholder="Цена"
                      value={addon.price || ""}
                      onChange={(e) =>
                        handleAddonChange(
                          index,
                          "price",
                          Number(e.target.value),
                        )
                      }
                      disabled={loadingEdit}
                      className="addon-input-price"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveAddonField(index)}
                      disabled={loadingEdit}
                      className="addon-delete-btn"
                    >
                      &times;
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ряд 4: Лояльность и Расчет */}
          <div className="form-row-twin mt-10">
            <div className="arm-input-group">
              <label>Визит в акции</label>
              <select
                value={editVisitNumber}
                onChange={(e) => setEditVisitNumber(e.target.value)}
                disabled={loadingEdit}
                className="arm-modal-select"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    {num}/8 {num === 4 ? "(-20%)" : num === 8 ? "(Беспл.)" : ""}
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
                <option value="Онлайн-перевод">Перевод</option>
                <option value="Карта">Карта / СБП</option>
              </select>
            </div>
          </div>

          {/* 🌟 ДОБАВЛЕНО ПО ТЗ: Новое текстовое поле ввода рабочих заметок (textarea) */}
          <div className="arm-input-group mt-10">
            <label>Заметка к визиту</label>
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              disabled={loadingEdit}
              placeholder="Впишите важные детали (например: оставить сушиться до 19:00, помыть детское кресло...)"
              rows="3"
              style={{
                width: "100%",
                background: "#020617",
                border: "1px solid #1e293b",
                borderRadius: "8px",
                padding: "12px",
                color: "#f8fafc",
                outline: "none",
                resize: "none",
                fontSize: "0.9rem",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Кнопки */}
          <div className="modal-btn-row mt-15">
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
              {loadingEdit ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditVisitModal;
