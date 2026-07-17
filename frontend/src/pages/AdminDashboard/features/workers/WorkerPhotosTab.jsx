import React, { useState } from "react";
import "./WorkerPhotosTab.css";

const DEMO_REPORTS = [
  {
    id: 1,
    name: "Лёха",
    role: "Сушка / Протирка",
    time: "14:20",
    status: "pending", // 'pending' | 'approved' | 'rejected'
    images: [
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500",
      "https://images.unsplash.com/photo-1552930284-6b52de6f3513?w=500",
    ],
    comment: "Пост №2 убран, химия заправлена, чистые тряпки разложены.",
  },
  {
    id: 2,
    name: "Айтал",
    role: "Мойщик (Штиль)",
    time: "13:45",
    status: "pending",
    images: [
      "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=500",
    ],
    comment: "Пеногенератор промыт, фильтры на АВД очищены от песка.",
  },
  {
    id: 3,
    name: "Димон",
    role: "Детейлер",
    time: "12:10",
    status: "pending",
    images: [
      "https://images.unsplash.com/photo-1563720223185-11003d516935?w=500",
      "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=500",
    ],
    comment: "Торпедо БМВ после полировки, чеклист по коже сдан.",
  },
];

const WorkerPhotosTab = () => {
  const [reports, setReports] = useState(DEMO_REPORTS);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = (id) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)),
    );
  };

  const handleRejectTrigger = (id) => {
    setRejectingId(id);
    setRejectReason("");
  };

  const handleRejectSubmit = (id) => {
    if (!rejectReason.trim()) return;
    setReports((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "rejected", reason: rejectReason } : r,
      ),
    );
    alert(`📢 PUSH-уведомление отправлено мойщику: "${rejectReason}"`);
    setRejectingId(null);
  };

  return (
    <div className="worker-photos-tab-viewport">
      <div className="tab-header-flex">
        <h2>📸 Лента контроля фотоотчетов и чеклистов смен</h2>
        <span className="live-badge-pulse">• LIVE МОНИТОРИНГ</span>
      </div>

      <div className="reports-feed-container">
        {reports.filter((r) => r.status === "pending").length === 0 ? (
          <div className="all-checked-notice">
            <i className="fas fa-check-circle text-green"></i>
            <h3>Все фотоотчеты проверены!</h3>
            <p>Текущая смена работает строго по регламенту Zeus Auto.</p>
            <button
              className="reset-demo-btn"
              onClick={() => setReports(DEMO_REPORTS)}
            >
              Сбросить демо-данные ленты
            </button>
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className={`report-card-box ${report.status !== "pending" ? "fade-out-status" : ""}`}
            >
              {/* Шапка карточки */}
              <div className="report-card-header">
                <div className="report-user-info">
                  <div className="report-avatar-stub">{report.name[0]}</div>
                  <div>
                    <h4>
                      {report.name}{" "}
                      <span className="role-tag-sub">{report.role}</span>
                    </h4>
                    <span className="report-time-sub">
                      <i className="far fa-clock"></i> Сегодня в {report.time}
                    </span>
                  </div>
                </div>
                <span className="status-badge-pending">Ожидает проверки</span>
              </div>

              {/* Тело отчета (Комментарий и Сетка изображений) */}
              <div className="report-card-body">
                <p className="report-text-comment">{report.comment}</p>
                <div className="report-images-grid">
                  {report.images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="report-img-wrapper"
                      onClick={() => setLightboxImg(imgUrl)}
                    >
                      <img src={imgUrl} alt="Отчет поста" />
                      <div className="img-zoom-overlay">
                        <i className="fas fa-search-plus"></i>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Футер с действиями */}
              <div className="report-card-footer">
                {rejectingId === report.id ? (
                  <div className="reject-reason-action-block">
                    <input
                      type="text"
                      placeholder="Причина отказа (например: Тряпки грязные, перестирать)..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="reject-reason-input"
                    />
                    <div className="reject-reason-btns">
                      <button
                        className="btn-send-reject"
                        onClick={() => handleRejectSubmit(report.id)}
                      >
                        <i className="fas fa-paper-plane"></i> Отправить
                      </button>
                      <button
                        className="btn-cancel-reject"
                        onClick={() => setRejectingId(null)}
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="standard-action-footer-btns">
                    <button
                      className="btn-report-approve"
                      onClick={() => handleApprove(report.id)}
                    >
                      <i className="fas fa-check"></i> Одобрить — Верно
                    </button>
                    <button
                      className="btn-report-reject"
                      onClick={() => handleRejectTrigger(report.id)}
                    >
                      <i className="fas fa-times"></i> Отклонить — Переделать
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ГЛОБАЛЬНЫЙ LIGHTBOX ДЛЯ ПРОСМОТРА КАРТИНКИ НА ВЕСЬ ЭКРАН */}
      {lightboxImg && (
        <div
          className="pwa-lightbox-overlay"
          onClick={() => setLightboxImg(null)}
        >
          <div
            className="lightbox-content-box"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="lightbox-close-btn"
              onClick={() => setLightboxImg(null)}
            >
              &times;
            </button>
            <img
              src={lightboxImg}
              alt="Просмотр отчета"
              className="lightbox-main-img"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerPhotosTab;
