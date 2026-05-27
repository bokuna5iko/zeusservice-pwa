const db = require('../config/db');

// 1. Получение количества визитов за СЕГОДНЯ (для Прогресс-бара)
exports.getTodayCount = async (req, res) => {
    try {
        // Считаем записи в visits, созданные с 00:00 текущего дня
        const result = await db.query(
            `SELECT COUNT(*)::int AS today_count 
             FROM visits 
             WHERE created_at >= CURRENT_DATE`
        );
        
        // Отдаем число (если записей нет, вернет 0)
        res.json({ today_count: result.rows[0].today_count || 0 });
    } catch (err) {
        console.error('Ошибка в getTodayCount:', err);
        res.status(500).json({ message: 'Ошибка сервера при получении статистики' });
    }
};

// 2. Получение 3-х последних действий админа (для Мини-ленты)
exports.getLastVisits = async (req, res) => {
    try {
        // Достаем последние 3 визита, подтягивая имя услуги и класс машины из таблицы services
        // Если визит гостевой (user_id IS NULL), имя клиента будет "Гость"
        const result = await db.query(
            `SELECT 
                v.id,
                v.service_type AS service_name,
                v.price AS base_price,
                v.created_at,
                v.visit_number,
                COALESCE(u.name, 'Гость') AS client_name
             FROM visits v
             LEFT JOIN users u ON v.user_id = u.id
             ORDER BY v.created_at DESC
             LIMIT 3`
        );
        
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка в getLastVisits:', err);
        res.status(500).json({ message: 'Ошибка сервера при получении ленты действий' });
    }
};

// Полный путь: GET /api/admin/users/verify/:id
exports.verifyUserById = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Ищем пользователя в базе
        const userRes = await db.query(
            "SELECT id, name, phone FROM users WHERE id = $1 AND role != 'admin'",
            [id]
        );

        if (userRes.rows.length === 0) {
            return res.status(404).json({ message: 'Клиент не найден или QR-код недействителен' });
        }

        const user = userRes.rows[0];

        // 2. Считаем общее количество его прошлых визитов для калькулятора лояльности
        const visitsRes = await db.query(
            "SELECT COUNT(*)::int AS count FROM visits WHERE user_id = $1",
            [id]
        );
        const visitCount = visitsRes.rows[0].count;

        // 3. Отдаем объект в точном формате, который ждет CalculatorModal
        res.json({
            id: user.id,
            name: user.name,
            phone: user.phone,
            visit_count: visitCount
        });

    } catch (err) {
        console.error('Ошибка при верификации QR-кода:', err);
        res.status(500).json({ message: 'Ошибка сервера при проверке QR-кода' });
    }
};

// 3. Получение списка всех услуг (для выпадающего списка в Калькуляторе)
exports.getAllServices = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, service_name, car_class, base_price FROM services ORDER BY id ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка в getAllServices:', err);
        res.status(500).json({ message: 'Ошибка сервера при получении списка услуг' });
    }
};

// 4. Зачисление визита (для Калькулятора)
// src/controllers/adminController.js

exports.createVisit = async (req, res) => {
    try {
        // 1. Принимаем параметры, которые РЕАЛЬНО отправляет калькулятор
        const { userId, serviceId, payment_type, is_guest, manual_price } = req.body;

        // Начинаем транзакцию через прямой db.query
        await db.query('BEGIN');

        let finalUserId = null;
        let currentVisitNumber = null;
        let serviceName = 'Нестандартная услуга';
        let finalPrice = manual_price || 0;

        // 2. Если передан serviceId — подтягиваем название и цену услуги из справочника
        if (serviceId) {
            const serviceResult = await db.query(
                'SELECT service_name, base_price FROM services WHERE id = $1',
                [serviceId]
            );
            if (serviceResult.rows.length === 0) {
                await db.query('ROLLBACK');
                return res.status(400).json({ message: 'Выбранная услуга не найдена в справочнике' });
            }
            serviceName = serviceResult.rows[0].service_name;
            
            // Если ручная цена не была введена, берем базовую стоимость услуги
            if (!manual_price) {
                finalPrice = serviceResult.rows[0].base_price;
            }
        }

        // 3. СЦЕНАРИЙ 1: Полноценный клиент (НЕ ГОСТЬ)
        if (!is_guest) {
            // ИСПРАВЛЕНО: Теперь ищем пользователя строго по чистокровному ID из QR-кода!
            const userResult = await db.query(
                'SELECT id, visit_count, total_visits FROM users WHERE id = $1', 
                [userId]
            );
            
            if (userResult.rows.length === 0) {
                await db.query('ROLLBACK');
                return res.status(444).json({ message: 'Пользователь не найден в базе данных' });
            }

            const user = userResult.rows[0];
            finalUserId = user.id;

            // Считаем номер текущего визита (с подстраховкой от NULL)
            const currentVisitCount = parseInt(user.visit_count || 0);
            currentVisitNumber = currentVisitCount + 1;

            // Логика скидок (синхронизируем цену с лояльностью, если это не ручной ввод)
            if (!manual_price) {
                if (currentVisitNumber === 4) {
                    finalPrice = Math.round(finalPrice * 0.8); // Скидка 20%
                } else if (currentVisitNumber === 8) {
                    finalPrice = 0; // Бесплатно
                }
            }

            let nextVisitCount = currentVisitNumber;
            // Если круг замкнулся на 8, сбрасываем счетчик в 0 для нового круга
            if (currentVisitNumber === 8) {
                nextVisitCount = 0;
            }

            // Обновляем счетчики пользователя (с подстраховкой COALESCE для total_visits)
            await db.query(
                `UPDATE users 
                 SET visit_count = $1, 
                     total_visits = COALESCE(total_visits, 0) + 1 
                 WHERE id = $2`,
                [nextVisitCount, finalUserId]
            );
        }

        // 4. СЦЕНАРИЙ 2: Гость (is_guest = true) -> finalUserId и currentVisitNumber останутся NULL

        // Вставляем запись в таблицу визитов визитов (6 параметров на 6 колонок!)
        await db.query(
            `INSERT INTO visits (user_id, service_id, service_type, price, visit_number, payment_type, admin_id, amount, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
            [
                finalUserId, 
                serviceId || null, 
                serviceName, 
                finalPrice, 
                currentVisitNumber, 
                payment_type, 
                req.user.id, // ID админа, который зачислил визит
                finalPrice
            ]
        );

        await db.query('COMMIT');
        res.status(201).json({ success: true, message: 'Visits successfully added' });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Ошибка в createVisit (adminController):', err);
        res.status(500).json({ message: 'Ошибка сервера при зачислении визита' });
    }
};

// 5. Получение полной истории визитов за последние 7 дней (для экрана История)
exports.getAdminHistory = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                v.id AS visit_id, 
                v.created_at, 
                v.service_type AS service_name, 
                v.price, 
                v.payment_type,
                v.visit_number,
                u.id AS user_id, 
                u.name, 
                u.phone, 
                u.car_brand, 
                u.role, 
                u.total_visits, 
                u.visit_count
            FROM visits v
            LEFT JOIN users u ON v.user_id = u.id
            WHERE v.created_at >= NOW() - INTERVAL '7 days'
            ORDER BY v.created_at DESC;
        `;

        const result = await db.query(queryText);
        
        // Возвращаем массив полученных строк
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка в getAdminHistory:', err);
        res.status(500).json({ message: 'Ошибка сервера при получении истории визитов' });
    }
};

// Заглушка для общего роута статистики
exports.getStats = async (req, res) => {
    try {
        res.json({ message: "Тут будет общая статистика" });
    } catch (err) {
        res.status(500).json({ message: "Ошибка сервера" });
    }
};