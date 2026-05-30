// src/components/Shifts/AdminDashboardShifts.jsx
import React, { useState, useEffect } from "react";

const AdminDashboardShifts = ({ pendingCount }) => {
  const [todayWorkers, setTodayWorkers] = useState([]);
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");

  useEffect(() => {
    const fetchTodayWorkers = async () => {
      try {
        const res = await fetch("/api/shifts/admin/calendar", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const todayStr = new Date().toISOString().split("T")[0];

          // Вырезаем только тех, у кого сегодня статус 'approved'
          const activeToday = data.filter(
            (s) => s.date === todayStr && s.status === "approved",
          );
          setTodayWorkers(activeToday);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTodayWorkers();
  }, [pendingCount]);

  return (
    <div className="profile-card admin-shifts-dashboard">
      <div className="dashboard-flex-layout">
        {/* Левая сторона: Счетчик */}
        <div className="db-left-counter-pane">
          <span className="db-pane-label">На рассмотрении</span>
          <h2
            className={`db-pending-number-text ${pendingCount > 0 ? "text-orange-neon" : "text-muted-gray"}`}
          >
            {pendingCount}{" "}
            {pendingCount === 1
              ? "заявка"
              : pendingCount > 1 && pendingCount < 5
                ? "заявки"
                : "заявок"}
          </h2>
        </div>

        {/* Правая сторона: Горизонтальный скролл */}
        <div className="db-right-workers-pane">
          <span className="db-pane-label">Сегодня в боксах</span>
          <div className="workers-horizontal-scroll">
            {todayWorkers.length > 0 ? (
              todayWorkers.map((w) => (
                <div key={w.id} className="scroll-avatar-pill">
                  <img
                    src={`/avatars/${w.avatar_url || "1.png"}`}
                    alt="avatar"
                  />
                  <span>{w.worker_name}</span>
                </div>
              ))
            ) : (
              <span className="no-workers-today-text">Смена не заполнена</span>
            )}
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .admin-shifts-dashboard {
          background: #0f172a !important;
          padding: 14px !important;
          border: 1px solid #1e293b !important;
        }
        .dashboard-flex-layout {
          display: flex;
          width: 100%;
          gap: 16px;
          align-items: center;
        }
        .db-left-counter-pane {
          flex: 1;
          border-right: 1px solid #1e293b;
          padding-right: 10px;
          display: flex;
          flex-direction: column;
        }
        .db-right-workers-pane {
          flex: 1.4;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .db-pane-label {
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .db-pending-number-text {
          margin: 4px 0 0 0;
          font-size: 1.2rem;
          font-weight: 800;
        }

        .text-orange-neon {
          color: #f59e0b;
          text-shadow: 0 0 8px rgba(245, 158, 11, 0.25);
        }
        .text-muted-gray {
          color: #64748b;
        }

        .workers-horizontal-scroll {
          display: flex;
          gap: 8px;
          margin-top: 6px;
          overflow-x: auto;
          padding-bottom: 4px;
          width: 100%;
        }
        .workers-horizontal-scroll::-webkit-scrollbar {
          height: 3px;
        }
        .workers-horizontal-scroll::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 2px;
        }

        .scroll-avatar-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #1e293b;
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid #334155;
          flex-shrink: 0;
        }
        .scroll-avatar-pill img {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          object-fit: cover;
        }
        .scroll-avatar-pill span {
          font-size: 0.75rem;
          font-weight: 600;
          color: #e2e8f0;
        }
        .no-workers-today-text {
          font-size: 0.8rem;
          color: #475569;
          font-style: italic;
          margin-top: 6px;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboardShifts;
