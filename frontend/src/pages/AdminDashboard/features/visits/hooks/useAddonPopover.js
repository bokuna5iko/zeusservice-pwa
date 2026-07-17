// src/pages/AdminDashboard/hooks/useAddonPopover.js
import { useState, useRef } from "react";

export const useAddonPopover = () => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const badgeRef = useRef(null);

  const togglePopover = (e) => {
    e.stopPropagation();

    if (!visible && badgeRef.current) {
      // Вычисляем точное положение баджа на экране в пикселях
      const rect = badgeRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    }
    setVisible(!visible);
  };

  const closePopover = (e) => {
    e.stopPropagation();
    setVisible(false);
  };

  return {
    visible,
    coords,
    badgeRef,
    togglePopover,
    closePopover,
  };
};
