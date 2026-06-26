// backend/src/controllers/workShiftController.js
const db = require("../config/db");

// 1. Получить статус текущей смены за сегодня
exports.getCurrentShiftStatus = async (req, res) => {
  try {
    // Ищем смену на текущую дату
    const result = await db.query(
      "SELECT * FROM work_shifts WHERE shift_date = CURRENT_DATE",
    );
    const shift = result.rows[0];

    if (!shift) {
      // Если на сегодня записи нет — смена считается еще не открытой
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

// 2. Открытие смены (в 09:00)
exports.openShift = async (req, res) => {
  try {
    // Проверяем, не создана ли уже смена на сегодня
    const checkShift = await db.query(
      "SELECT * FROM work_shifts WHERE shift_date = CURRENT_DATE",
    );

    if (checkShift.rows[0]) {
      return res.status(400).json({
        message: "Смена на сегодняшнюю дату уже была открыта ранее!",
      });
    }

    // Создаем новую открытую операционную смену
    const result = await db.query(`
            INSERT INTO work_shifts (shift_date, status, cash_total, card_total, expenses_total, opened_at)
            VALUES (CURRENT_DATE, 'open', 0, 0, 0, NOW())
            RETURNING *
        `);

    res.status(201).json({
      message: "Смена успешно открыта",
      shift: result.rows[0],
    });
  } catch (err) {
    console.error("Ошибка открытия смены:", err);
    res.status(500).json({ message: "Ошибка сервера при открытии смены" });
  }
};

// 3. Закрытие смены (в 22:00) с фиксацией и блокировкой
exports.closeShift = async (req, res) => {
  try {
    // Ищем активную открытую смену на сегодня
    const checkShift = await db.query(
      "SELECT * FROM work_shifts WHERE shift_date = CURRENT_DATE AND status = 'open'",
    );
    const currentShift = checkShift.rows[0];

    if (!currentShift) {
      return res.status(404).json({
        message:
          "Активная открытая смена на сегодня не найдена или уже закрыта",
      });
    }

    // Переводим статус в 'closed' и фиксируем точное время закрытия
    const result = await db.query(
      `
            UPDATE work_shifts 
            SET status = 'closed', closed_at = NOW() 
            WHERE id = $1 
            RETURNING *
        `,
      [currentShift.id],
    );

    res.json({
      message: "Смена успешно закрыта. Редактирование заблокировано.",
      shift: result.rows[0],
    });
  } catch (err) {
    console.error("Ошибка закрытия смены:", err);
    res.status(500).json({ message: "Ошибка сервера при закрытии смены" });
  }
};

// 4. Добавление расхода (привязывается жестко к текущей открытой смене)
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
      `
            INSERT INTO expenses (shift_id, amount, description, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING *
        `,
      [currentShift.id, Number(amount), description.trim()],
    );

    // 2. Плюсуем сумму расхода в общую копилку expenses_total таблицы work_shifts
    await db.query(
      `
            UPDATE work_shifts 
            SET expenses_total = expenses_total + $1 
            WHERE id = $2
        `,
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
