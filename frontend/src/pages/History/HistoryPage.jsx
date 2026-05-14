import React, { useState, useEffect } from 'react';
import api from "../../api/axios";
import './HistoryPage.css';

const HistoryPage = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/user/history');
        setVisits(res.data);
      } catch (err) {
        console.error("Ошибка загрузки истории:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="loading-state">Загрузка истории...</div>;

  return (
    <div className="history-page">
      <div className="section-header">
        <h1>История визитов</h1>
        <p>Ваши поездки в Zeus Auto</p>
      </div>

      <div className="history-list">
        {visits.length > 0 ? (
          visits.map((visit) => (
            // Используем visit.id как уникальный ключ для React
            <div key={visit.id || visit.visit_date} className="history-item">
              <div className="history-icon">
                <i className="fas fa-car-wash"></i>
              </div>
              <div className="history-info">
                <div className="history-main">
                  <span className="service-name">{visit.service_name}</span>
                  <span className="service-price">
                    {visit.points_spent > 0 ? `-${visit.points_spent} ₽` : '0 ₽'}
                  </span>
                </div>
                <div className="history-footer">
                   <span className="history-date">
                     <i className="far fa-calendar-alt"></i> {new Date(visit.visit_date).toLocaleDateString('ru-RU')}
                   </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-history">
            <i className="fas fa-box-open"></i>
            <p>У вас пока нет визитов</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;