# План Миграции Zeus-Auto (Vanilla JS -> React)

Этот документ описывает стратегию переноса функционала из старого Vanilla JS проекта (`zeus-donor-app`) в текущий React-проект (`zeus-auto-react`).

## Общий подход:
1.  **Компонентная декомпозиция:** Перевод секций HTML в отдельные React-компоненты.
2.  **Управление состоянием:** Замена прямых DOM-манипуляций на состояние React (`useState`, `useReducer`) и контекст (`AuthContext`).
3.  **Маршрутизация:** Использование `react-router-dom` вместо ручного переключения классов `active`.
4.  **API-интеграция:** Создание централизованного `apiService` на основе `axios` или `fetch` с интерцепторами.
5.  **PWA-функционал:** Проверка и адаптация `manifest.json` и `sw.js` для React-проекта.

---

## Таблица Миграции Функционала

| Функциональная область / Компонент | Текущий статус (Vanilla JS)                                       | Целевой React-компонент/Хук/Контекст                                           | Сложность | Примечания / Рекомендации                                                                                                     |
| :--------------------------------- | :---------------------------------------------------------------- | :----------------------------------------------------------------------------- | :-------- | :---------------------------------------------------------------------------------------------------------------------------- |
| **PWA (Manifest/Service Worker)**  | `manifest.json`, `sw.js` в `zeus-donor-app/frontend`             | `public/manifest.json`, `src/service-worker.js` (или аналоги)                 | Низкая    | Перенести `manifest.json`. Для `sw.js` рассмотреть готовые решения (например, Workbox) или адаптировать существующий.        |
| **Авторизация/Регистрация**        | `index.html` (`#auth-page`), `main.js` (`setupAuthEvents`), `api.js` (`login`) | `Login.jsx`, `AuthContext.jsx`, `apiService.js`, `useNavigate`                 | Средняя   | Интегрировать `Login.jsx` с `AuthContext` для обработки входа/регистрации. Использовать `useNavigate` для перенаправления.     |
| **Главная страница (Home)**        | `index.html` (`#home-page`), `ui.js` (`renderHome`), `main.js` (`initAppData`) | `Home.jsx`, `PointsGrid.jsx`, `QRCodeDisplay.jsx`, `AuthContext.jsx`           | Средняя   | `Home.jsx` будет использовать данные из `AuthContext`. `PointsGrid` для отрисовки баллов. `QRCodeDisplay` для QR-кода.       |
| **Сетка баллов лояльности**        | `ui.js` (`renderHome` - `points.forEach(...)`)                    | `PointsGrid.jsx`                                                               | Средняя   | Перевести логику динамического добавления классов (`active`, `next-visit`) и текста в декларативный React-компонент.          |
| **QR-код пользователя**            | `main.js` (`window.generateUserQR`), `qrcode.min.js`             | `QRCodeDisplay.jsx`                                                            | Низкая    | Создать компонент для отображения QR-кода. Использовать `qrcode.js` (или `react-qrcode-logo`).                                |
| **История визитов**                | `index.html` (`#history-page`), `ui.js` (`renderHistory`), `api.js` (`getHistory`) | `History.jsx`, `VisitItem.jsx`, `AuthContext.jsx`                              | Средняя   | `History.jsx` будет загружать и отображать список `VisitItem` из `AuthContext` или напрямую из `apiService`.                 |
| **Профиль пользователя**           | `index.html` (`#profile-page`), `ui.js` (`renderProfile`), `main.js` (`initAppData`) | `Profile.jsx`, `AuthContext.jsx`                                               | Низкая    | `Profile.jsx` будет отображать данные пользователя из `AuthContext`.                                                         |
| **Выход из аккаунта**              | `main.js` (`setupNavigation`, `btnLogout`), `ui.js` (`logout`)    | `AuthContext.jsx` (`logout` функция), `Navigation.jsx`                         | Низкая    | Функция `logout` в `AuthContext` будет очищать токен и перенаправлять на страницу входа.                                     |
| **Админ-панель**                   | `index.html` (`#admin-page`), `ui.js` (`refreshAdminStats`), `api.js` (`getStats`) | `Admin.jsx`, `StatCard.jsx`, `useEffect` (`setInterval`), `apiService.js`      | Высокая   | Декомпозировать каждый блок статистики в `StatCard`. `useEffect` для загрузки и автообновления данных. Интеграция Chart.js. |
| **Сканирование QR (Админка)**      | `scanner.js`, `html5-qrcode`                                     | `QRScanner.jsx` (внутри `Admin.jsx`), `useEffect`, `html5-qrcode`             | Средняя   | Создать React-компонент для обертки `html5-qrcode`. Управлять состоянием запуска/остановки сканера.                        |
| **Модальное окно калькулятора**    | `index.html` (`#calculator-modal`), `ui.js` (`renderAdminPanel`), `api.js` (`getServices`, `addVisit`) | `CalculatorModal.jsx`, `useState`, `useEffect`, `apiService.js`                  | Высокая   | Динамическая загрузка услуг, расчет скидок, обработка подтверждения визита. Использовать `useState` для формы.                  |
| **Нижнее меню (Навигация)**        | `index.html` (`.bottom-nav`), `main.js` (`setupNavigation`)      | `Navigation.jsx`, `react-router-dom` (`NavLink`, `useNavigate`)                 | Низкая    | Использовать `NavLink` для автоматического выделения активного пункта.                                                       |
| **API-сервис**                     | `api.js`                                                          | `src/api/apiService.js` (или `utils/api.js`)                                   | Низкая    | Перенести все методы API. Использовать `axios` с интерцепторами для токенов и ошибок.                                      |

---

## Рекомендации по дальнейшей работе:

1.  **Создание `AuthContext.jsx`:** Это первый и самый важный шаг, так как он затронет большинство страниц.
2.  **Настройка `react-router-dom`:** Настроить маршруты для всех основных страниц.
3.  **Постепенный перенос компонентов:** Начинать с простых (например, `Profile.jsx`) и двигаться к более сложным (`Admin.jsx`, `CalculatorModal.jsx`).
4.  **Интеграция сторонних библиотек:** Адаптировать `qrcode.js`, `html5-qrcode`, `chart.js` для работы в React-компонентах (с использованием `useRef` и `useEffect`).
5.  **Тестирование:** После переноса каждого блока функционала обязательно написать юнит-тесты.

Этот план является отправной точкой. Мы можем корректировать его по мере продвижения и получения новых данных.

Что скажешь? Готов ли ты начать с первого пункта – создания `AuthContext.jsx`?