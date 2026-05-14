const pool = require('../config/db');

exports.getAllServices = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, service_name, base_price FROM services ORDER BY id ASC');
        
        // Преобразуем названия ключей в camelCase для фронтенда, как ты и хотел
        const services = result.rows.map(s => ({
            serviceId: s.id,
            serviceName: s.service_name,
            basePrice: s.base_price
        }));

        res.json(services);
    } catch (err) {
        console.error('Ошибка в getAllServices:', err);
        res.status(500).json({ message: 'Не удалось загрузить список услуг' });
    }
};