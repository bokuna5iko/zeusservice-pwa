// src/pages/AdminDashboard/hooks/useSimulatorState.js
import { useState } from "react";

export const useSimulatorState = () => {
  const [phoneScreen, setPhoneScreen] = useState("home"); // 'home', 'history', 'scanner'

  const changeScreen = (screen) => {
    setPhoneScreen(screen);
  };

  return {
    phoneScreen,
    changeScreen,
  };
};
