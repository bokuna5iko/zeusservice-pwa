// backend/src/controllers/workShiftController.js
const db = require("../config/db");

// 1. Получить статус смены с защитой от "забытых смен"
exports.getCurrentShiftStatus = async (req, res) => {
  try {
    // Шаг А: Проверяем, нет ли в базе зависших открытых смен за прошлые дни
    const activePastShift = await db.query(
      "SELECT * FROM work_shifts WHERE shift_date < CURRENT_DATE AND status = 'open' ORDER BY shift_date ASC LIMIT 1",
    );

    if (activePastShift.rows[0]) {
      // 🌟 КРИТИЧЕСКИЙ СЦЕНАРИЙ: Найдена забытая старая смена!
      return res.json({
        status: "forgotten_lock",
        shift: activePastShift.rows[0],
        message: "Обнаружена незакрытая смена за прошлый рабочий день!",
      });
    }

    // Шаг Б: Если старых зависших смен нет, ищем смену на сегодня
    const result = await db.query(
      "SELECT * FROM work_shifts WHERE shift_date = CURRENT_DATE",
    );
    const shift = result.rows[0];

    if (!shift) {
      return res.json({ status: "not_started", shift: null });
    }

    res.json({ status: shift.status, shift });
  } catch (err) {
    console.error("Ошибка при получении статуса смены:", err);
    res
      .status(500)
      .json({ message: "Ошибка сервера при проверке статуса смены" });
  }
};

// 2. Открытие операционной смены
exports.openShift = async (req, res) => {
  try {
    // Блокируем открытие, если есть незакрытые старые смены
    const activePastShift = await db.query(
      "SELECT id FROM work_shifts WHERE shift_date < CURRENT_DATE AND status = 'open'",
    );
    if (activePastShift.rows[0]) {
      return res.status(400).json({
        message: "Нельзя открыть новую смену, пока не закрыта прошлая!",
      });
    }

    const checkShift = await db.query(
      "SELECT * FROM work_shifts WHERE shift_date = CURRENT_DATE",
    );
    if (checkShift.rows[0]) {
      return res
        .status(400)
        .json({ message: "Смена на сегодняшнюю дату уже открывалась ранее!" });
    }

    const result = await db.query(`
      INSERT INTO work_shifts (shift_date, status, cash_total, card_total, expenses_total, total_cars_count, opened_at)
      VALUES (CURRENT_DATE, 'open', 0, 0, 0, 0, NOW())
      RETURNING *
    `);

    res
      .status(201)
      .json({ message: "Смена успешно открыта", shift: result.rows[0] });
  } catch (err) {
    console.error("Ошибка открытия смены:", err);
    res.status(500).json({ message: "Ошибка сервера при открытии смены" });
  }
};

// 3. Подготовка пре-отчета (Вызывается перед закрытием смены админом)
exports.getPreCloseReport = async (req, res) => {
  try {
    const { shiftId } = req.params;

    // Считаем показатели по реальным заездам за эту смену из таблицы visits
    const statsRes = await db.query(
      `SELECT 
        COUNT(id) as cars_count,
        COALESCE(SUM(CASE WHEN COALESCE(manual_payment_type, payment_type) = 'Наличные' THEN price ELSE 0 END), 0) as calc_cash,
        COALESCE(SUM(CASE WHEN COALESCE(manual_payment_type, payment_type) = 'Карта' THEN price ELSE 0 END), 0) as calc_card
       FROM visits 
       WHERE created_at >= (SELECT opened_at FROM work_shifts WHERE id = $1)
         AND created_at <= NOW()`,
      [shiftId],
    );

    const shiftRes = await db.query(
      "SELECT expenses_total FROM work_shifts WHERE id = $1",
      [shiftId],
    );

    const report = {
      carsCount: parseInt(statsRes.rows[0].cars_count || 0),
      cashCalculated: parseFloat(statsRes.rows[0].calc_cash || 0),
      cardCalculated: parseFloat(statsRes.rows[0].calc_card || 0),
      expensesTotal: parseFloat(shiftRes.rows[0].expenses_total || 0),
    };

    res.json(report);
  } catch (err) {
    console.error("Ошибка подготовки отчета:", err);
    res.status(500).json({ message: "Ошибка сервера при формировании отчета" });
  }
};

// 4. Финальное закрытие смены со сверкой кассы и архивацией
exports.closeShift = async (req, res) => {
  try {
    const { shiftId, actualCash, carsCount, cashCalculated, cardCalculated } =
      req.body;

    if (actualCash === undefined || actualCash === null) {
      return res.status(400).json({
        message: "Необходимо передать фактическую сумму наличных в кассе",
      });
    }

    // Высчитываем разницу (фактический нал минус расчетный)
    const cashDifference = Number(actualCash) - Number(cashCalculated);

    // Архивация смены: фиксируем все итоги, переводим статус в closed
    const result = await db.query(
      `UPDATE work_shifts 
       SET status = 'closed', 
           cash_total = $1, 
           card_total = $2, 
           total_cars_count = $3, 
           actual_cash = $4, 
           cash_difference = $5, 
           closed_at = NOW() 
       WHERE id = $6
       RETURNING *`,
      [
        Number(cashCalculated),
        Number(cardCalculated),
        Number(carsCount),
        Number(actualCash),
        cashDifference,
        shiftId,
      ],
    );

    res.json({
      message: "Смена успешно заархивирована. Изменения заблокированы.",
      shift: result.rows[0],
    });
  } catch (err) {
    console.error("Ошибка при закрытии и архивации смены:", err);
    res.status(500).json({ message: "Ошибка сервера при закрытии смены" });
  }
};

// 5. Выгрузка всех закрытых смен (Для календаря-архива в АРМ)
exports.getShiftArchiveCalendar = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, shift_date, status, cash_total, card_total, expenses_total, actual_cash, cash_difference, total_cars_count, opened_at, closed_at 
       FROM work_shifts 
       WHERE status = 'closed' 
       ORDER BY shift_date DESC`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка загрузки архива смен:", err);
    res.status(500).json({ message: "Ошибка сервера при чтении архива" });
  }
};

// 6. 🌟 МОДЕРНИЗИРОВАНО: Получить список всех расходов (за сегодня или за конкретный shiftId из архива)
exports.getTodayExpenses = async (req, res) => {
  try {
    const { shiftId } = req.query;
    let targetShiftId = null;

    if (shiftId) {
      targetShiftId = shiftId;
    } else {
      const checkShift = await db.query(
        "SELECT id FROM work_shifts WHERE shift_date = CURRENT_DATE",
      );
      if (checkShift.rows[0]) {
        targetShiftId = checkShift.rows[0].id;
      }
    }

    if (!targetShiftId) {
      return res.json([]);
    }

    const expensesResult = await db.query(
      "SELECT id, amount, description, created_at FROM expenses WHERE shift_id = $1 ORDER BY created_at DESC",
      [targetShiftId],
    );
    res.json(expensesResult.rows);
  } catch (err) {
    console.error("Ошибка при получении списка расходов:", err);
    res
      .status(500)
      .json({ message: "Ошибка сервера при получении списка расходов" });
  }
};

// 7. 🌟 ВОЗВРАЩАЕМ: Добавление расхода (привязывается жестко к текущей открытой смене)
exports.addExpense = async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || !description) {
      return res
        .status(400)
        .json({ message: "Сумма и описание расхода обязательны" });
    }

    // Проверяем, есть ли открытая смена на сегодня, куда можно влить трату
    const checkShift = await db.query(
      "SELECT * FROM work_shifts WHERE shift_date = CURRENT_DATE AND status = 'open'",
    );
    const currentShift = checkShift.rows[0];

    if (!currentShift) {
      return res.status(400).json({
        message:
          "Нельзя добавить расход: сегодняшняя смена не открыта или уже закрыта!",
      });
    }

    // 1. Записываем расход в таблицу expenses
    const expenseResult = await db.query(
      `INSERT INTO expenses (shift_id, amount, description, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [currentShift.id, Number(amount), description.trim()],
    );

    // 2. Плюсуем сумму расхода в общую копилку expenses_total таблицы work_shifts
    await db.query(
      `UPDATE work_shifts 
       SET expenses_total = expenses_total + $1 
       WHERE id = $2`,
      [Number(amount), currentShift.id],
    );

    res.status(201).json({
      message: "Расход успешно учтен в кассе смены",
      expense: expenseResult.rows[0],
    });
  } catch (err) {
    console.error("Ошибка добавления расхода:", err);
    res.status(500).json({ message: "Ошибка сервера при фиксации расхода" });
  }
};
