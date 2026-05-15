import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import VisitItem from '../../components/HistoryVisits/VisitItem'; // Твой новый путь
import './HistoryPage.css';

const HistoryPage = () => {
  const { user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Загружаем историю при монтировании компонента
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/user/history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      } catch (error) {
        console.error('Ошибка загрузки истории:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="history-page">
      <div className="page-center-container">
        
        {/* КОНТЕЙНЕР №1: Сводная информация */}
        <div className="history-card history-summary-box content-group-box">
          <div className="fill-zone">
            <h3 style={{ margin: 0 }}>Общая статистика</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '10px' }}>
              Данные за всё время
            </p>
            <div className="summary-stats">
              <span style={{ fontWeight: '800', fontSize: '1.2rem', color: '#1e3c72' }}>
                Всего заездов: {user?.total_visits || history.length || 0}
              </span>
            </div>
          </div>
        </div>

        {/* КОНТЕЙНЕР №2: Основной список визитов */}
        <div className="history-card history-main-list content-group-box">
          <div className="fill-zone">
            <h3 style={{ marginBottom: '15px' }}>Последние заезды</h3>
            
            <div className="visits-container">
              {loading ? (
                <div className="data-placeholder">Загрузка данных...</div>
              ) : history.length > 0 ? (
                history.map((visit, index) => (
                  <VisitItem key={index} visit={visit} />
                ))
              ) : (
                <div className="data-placeholder">Список посещений пуст...</div>
              )}
            </div>
          </div>
        </div>

        {/* КОНТЕЙНЕР №3: Дополнительная информация */}
        <div className="history-card history-footer-info content-group-box">
          <div className="fill-zone">
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
              Нужна помощь с историей заказов? 
              <br /> Обратитесь к администратору.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HistoryPage;