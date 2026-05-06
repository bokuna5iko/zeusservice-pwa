
| **Сущность в БД (PostgreSQL)** | **Ключ в JSON (JS)**    | **Тип данных** | **Описание**               |
| ------------------------------ | ----------------------- | -------------- | -------------------------- |
| `user_id`                      | `userId`                | String (UUID)  | Уникальный ID пользователя |
| `visit_count`                  | `visitCount`            | Integer        | Текущее кол-во моек (0-8)  |
| `last_visit`                   | `lastVisitDate`         | Date (ISO)     | Дата последнего посещения  |
| `is_free_wash`                 | `isEligibleForFreeWash` | Boolean        | Флаг «Пора мыть бесплатно» |
| `service_id`                   | `serviceId`             |                | Какая услуга выбрана       |
| `price`                        | `totalPrice`            |                | Стоимость для метрик       |
[!abstract] Текущий формат ответа API ![[Buslog#^standard-json]]