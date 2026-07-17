// src/pages/AdminDashboard/hooks/useEditVisit.js
import { useState, useEffect } from "react";

export const useEditVisit = (isOpen, visit, servicePrices, onSave) => {
  const [editBrand, setEditBrand] = useState("");
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editService, setEditService] = useState("");
  const [editPayment, setEditPayment] = useState("");
  const [editVisitNumber, setEditVisitNumber] = useState(1);
  const [additionalServices, setAdditionalServices] = useState([]);
  const [carClass, setCarClass] = useState(1);

  useEffect(() => {
    if (visit && isOpen) {
      setEditBrand(visit.manual_car_brand || "");
      setEditName(
        visit.manual_client_name || visit.client_name || visit.name || "",
      );
      setEditPhone(
        visit.manual_client_phone || visit.client_phone || visit.phone || "",
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

      // 🌟 ИСПРАВЛЕНО: Ищем услугу сначала по service_id (точное совпадение)
      let currentServiceInDb = null;

      if (visit.service_id) {
        currentServiceInDb = servicePrices.find(
          (s) => s.id === parseInt(visit.service_id),
        );
      }

      // Если не нашли по ID — ищем по имени (менее надёжно из-за дубликатов)
      if (!currentServiceInDb) {
        const serviceName =
          visit.manual_service_name ||
          visit.service_name ||
          visit.service_type ||
          "";
        currentServiceInDb = servicePrices.find(
          (s) => s.service_name === serviceName,
        );
      }

      if (currentServiceInDb) {
        setCarClass(currentServiceInDb.car_class || 1);
        setEditService(currentServiceInDb.service_name);
      } else {
        setEditService(
          visit.manual_service_name ||
            visit.service_name ||
            visit.service_type ||
            "",
        );
        setCarClass(1);
      }
    }
  }, [visit, isOpen, servicePrices]);

  const filteredServices = servicePrices.filter(
    (s) => s.car_class === null || s.car_class === parseInt(carClass),
  );

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
      const found = servicePrices.find(
        (s) =>
          s.service_name === value &&
          (s.car_class === null || s.car_class === parseInt(carClass)),
      );
      if (found) {
        updated[index]["price"] = Number(found.base_price || 0);
      }
    }
    setAdditionalServices(updated);
  };

  const handleSubmitFields = (e) => {
    e.preventDefault();

    const selectedServiceObj = servicePrices.find(
      (s) =>
        s.service_name === editService &&
        (s.car_class === null || s.car_class === parseInt(carClass)),
    );

    // 🌟 Отправляем БАЗОВУЮ цену без скидки — бэкенд сам применит скидку
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
      price: basePrice, // ← Базовая цена (500), БЕЗ скидки
      additional_services: additionalServices, // ← Допы БЕЗ скидки
      service_id: selectedServiceObj ? selectedServiceObj.id : null,
    };
    onSave(payload);
  };

  return {
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
  };
};
