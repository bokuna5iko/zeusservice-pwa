## 🗺️ Часть 1. Схематичная карта структуры
Запомни главное разделение: Shared (общее для всего дашборда) и Features (изолированные бизнес-функции).

```
AdminDashboard/
│
├── AdminDashboard.jsx # 🎯 ГЛАВНЫЙ ДИРИЖЁР. Только импорты и условный рендеринг табов.
├── AdminDashboard.css # 🎨 ТОЛЬКО глобальный layout (фон, отступы, высота).
├── context/ # 🧠 ГЛОБАЛЬНОЕ СОСТОЯНИЕ (activeTab, shiftStatus, isArchiveMode).
│ └── AdminDashboardContext.jsx
│
├── shared/ # 🧩 ПЕРЕИСПОЛЬЗУЕМЫЕ ЭЛЕМЕНТЫ (используются в 2+ местах)
│ ├── DashboardSidebar/ # Сайдбар + его CSS
│ ├── DashboardHeader/ # Шапка + её CSS
│ └── modals/ # Универсальные модалки (например, подтверждение действия)
│
└── features/ # ⚙️ БИЗНЕС-ФУНКЦИИ (Каждая папка самодостаточна)
├── visits/ # Всё о визитах и кассе
│ ├── VisitsTab.jsx # Оркестратор вкладки
│ ├── VisitsTab.css # Стили ТОЛЬКО этой вкладки
│ ├── components/ # UI-блоки (VisitsTable, CashDashboard)
│ └── hooks/ # Логика (useVisitsData, useVisitModals)
│
├── workers/ # Всё о персонале
│ ├── WorkersTab.jsx
│ ├── WorkersTab.css
│ ├── WorkersSubTabsNav.jsx # Навигация внутри вкладки
│ ├── WorkerPhotosTab.jsx
│ ├── WorkerFinancesTab.jsx
│ └── hooks/
│
├── analytics/ # Статистика и архив
└── simulator/ # Симулятор
```
## 🛠️ Часть 2. Сценарии действий (Как масштабировать)

### 🟢 Сценарий А: Добавить новую главную вкладку в сайдбар (например, "Склад")
Создай папку фичи: features/inventory/
Создай базовые файлы:
InventoryTab.jsx (компонент)
InventoryTab.css (стили)
hooks/useInventoryData.js (логика и запросы к API)
Обнови Сайдбар: Открой shared/DashboardSidebar/DashboardSidebar.jsx и добавь новую кнопку в <Menu>, которая меняет activeTab на 'inventory'.
Обнови Дирижёра: Открой AdminDashboard.jsx, импортируй InventoryTab и добавь условие: {activeTab === 'inventory' && <InventoryTab />}.
(Готово! Новая фича полностью изолирована).

### 🟡 Сценарий Б: Усложнить существующую вкладку (например, добавить новую модалку в "Визиты")
Не пиши useState в VisitsTab.jsx!
Создай хук: features/visits/hooks/useNewModal.js. Внутри него опиши isOpen, setIsOpen и логику отправки данных.
Создай компонент модалки: features/visits/components/NewModal.jsx (или в shared/modals/, если она универсальная).
Собери в оркестраторе: В VisitsTab.jsx импортируй хук useNewModal, передай функции открытия в дочерние компоненты (например, в кнопку внутри VisitsTable), а саму модалку отрендери внизу файла.

### 🔵 Сценарий В: Добавить глобальную фичу (например, уведомление о новой задаче, видимое везде)
Открой context/AdminDashboardContext.jsx.
Добавь туда состояние: const [globalNotification, setGlobalNotification] = useState(null).
Добавь функцию обновления в value провайдера.
Используй useAdminDashboard() в любом компоненте (DashboardHeader, VisitsTab и т.д.), чтобы прочитать или изменить это состояние.

### 🛡️ Часть 3. Золотые правила (Чтобы не рефакторить раз в месяц)
Правило Ко-локации (CSS рядом с JSX):
Никогда не пиши стили в AdminDashboard.css, если они относятся к конкретной фиче. Стили таблицы визитов живут в features/visits/VisitsTab.css (или VisitsTable.css).
Проверка: Если я удалю папку features/simulator, в проекте не должно остаться ни одной строки CSS или JS, связанной с симулятором.
Правило "Глупых" компонентов (Dumb Components):
Компоненты в папке components/ (например, VisitsTable) не должны делать запросы к API или хранить сложный useState. Они получают данные и функции через props от родительского Tab или hook.

## Правило 200 строк:
Если твой Tab.jsx или hook.js превышает 200-250 строк, это сигнал. Спроси себя: "Могу ли я вынести часть этого (например, управление модалками или расчеты) в отдельный маленький хук?". (Как мы сделали с useVisitModals).
Правило Контекста:
В AdminDashboardContext храним только то, что нужно минимум двум разным вкладкам (например, статус смены shiftStatus). Если состояние нужно только внутри "Визитов", оно должно жить в features/visits/hooks/.

# 💡 Итог
Теперь твой код работает как конструктор LEGO.
Хочешь изменить внешний вид кассы? Иди в features/visits.
Хочешь добавить новую вкладку? Создай новую папку в features.
Хочешь поменять шапку? Иди в shared/DashboardHeader.
