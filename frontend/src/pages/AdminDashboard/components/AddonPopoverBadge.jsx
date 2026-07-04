import React from "react";
import { createPortal } from "react-dom";
// Импортируем созданный хук!
import { useVisitsTableState } from "../hooks/useVisitsTableState";

const AddonPopoverBadge = ({ addons }) => {
  // Забираем из него стейты и методы
  const { visible, coords, badgeRef, togglePopover, closePopover } =
    useVisitsTableState();

  if (!addons || addons.length === 0) return null;

  return (
    <div className="addon-badge-wrapper" ref={badgeRef}>
      <span onClick={togglePopover} className="addon-neon-badge">
        +{addons.length} доп
      </span>

      {visible &&
        createPortal(
          <>
            <div onClick={closePopover} className="addon-popover-overlay" />
            <div
              className="addon-popover-card"
              style={{
                position: "absolute",
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                transform: "translateX(-50%)",
                zIndex: 99999,
              }}
            >
              <div className="addon-popover-title">Детали дозаказа:</div>
              {addons.map((a, i) => (
                <div key={i} className="addon-popover-item">
                  <span>• {a.name || "Доп. услуга"}</span>
                  <span className="addon-popover-item-price">{a.price} ₽</span>
                </div>
              ))}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
};

export default AddonPopoverBadge;
