# Zeus Auto — Система лояльности для автомойки (v0.1)

Проект представляет собой PWA-приложение для автоматизации программы лояльности "Каждая 8-я мойка бесплатно" и сбора бизнес-метрик.

## 🛠 Технологический стек
* **Frontend:** HTML5, CSS3, JavaScript (PWA)
* **Backend:** PostgreSQL (БД), Node.js (API)
* **Management:** Obsidian (Zettelkasten + Canvas)

## 📐 Архитектура данных (API Контракты)

### 1. Получение данных клиента (GET /user)
Запрашивается при сканировании QR-кода.
```json
{
  "userId": "string",
  "status": {
    "visitCount": 0-8,
    "isEligibleForFreeWash": boolean,
    "lastVisitDate": "YYYY-MM-DD"
  },
  "personalInfo": {
    "phoneNumber": "string"
  }
}
```

Создание заказа (POST /order)
Отправляется при подтверждении услуги в калькуляторе.

```json
{
  "userId": "string",
  "adminId": "string",
  "transaction": {
    "serviceId": number,
    "grossAmount": number,
    "netAmount": number,
    "appliedBonus": boolean
  }
}
```
## 📊 Бизнес-логика калькулятора
Двойной расчет цены: Система всегда оперирует двумя суммами:

grossAmount: Полная стоимость по прайсу.

netAmount: Фактическая сумма к оплате (равна 0, если visitCount == 7 и применяется бонус).

Сброс счетчика: После успешного POST /order с флагом appliedBonus: true, счетчик visitCount в БД сбрасывается в 0.

Метрики: Каждая транзакция сохраняется для расчета среднего чека, популярности услуг и "стоимости лояльности" (разница между gross и net).

## 🗄 Структура базы данных (PostgreSQL)
Рекомендуемые таблицы:

users: id, phone, visit_count, last_visit.

services: id, name, base_price.

transactions: id, user_id, admin_id, service_id, gross_amount, net_amount, is_bonus, created_at.
