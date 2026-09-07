
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Profile from "./pages/Profile";
import { useState, useEffect } from "react";
import PrivateRoute from "./components/PrivateRoute";
import Beneficiaries from "./pages/Beneficiaries";
import TransferBeneficiary from "./pages/TransferBeneficiary";
import AIAssistant from "./pages/AIAssistant";
import PayShap from "./pages/PayShap";

function App() {
  // 🌙 Load theme from localStorage
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // 🔁 Apply theme to BODY
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }

    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((previousMode) => !previousMode);
  };

  return (
    <div
      style={{
        background: darkMode ? "#0f172a" : "#f4f6f8",
        color: darkMode ? "#fff" : "#000",
        minHeight: "100vh",
        transition: "0.3s ease",
      }}
    >
      {/* 🌙 TOP BAR */}
      <div
        style={{
          padding: 10,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={toggleTheme}
          style={{
            padding: "8px 12px",
            border: "none",
            cursor: "pointer",
            borderRadius: 5,
          }}
        >
          {darkMode ? "Light Mode ☀️" : "Dark Mode 🌙"}
        </button>
      </div>

      <BrowserRouter>
        <Routes>

          {/* 🔓 PUBLIC ROUTE */}
          <Route
            path="/"
            element={<Login />}
          />
          <Route
  path="/forgot-password"
  element={<ForgotPassword />}
/>

          {/* 🔐 DASHBOARD */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
  path="/ai-assistant"
  element={
    <PrivateRoute>
      <AIAssistant />
    </PrivateRoute>
  }
/>

          {/* 💳 TRANSACTIONS */}
          <Route
            path="/transactions"
            element={
              <PrivateRoute>
                <Transactions />
              </PrivateRoute>
            }
          />
          {/* 👤 PROFILE */}
        <Route
  path="/transfer-beneficiary"
  element={
    <PrivateRoute>
      <TransferBeneficiary />
    </PrivateRoute>
  }
/>
<Route
  path="/beneficiaries"
  element={
    <PrivateRoute>
      <Beneficiaries />
    </PrivateRoute>
  }
/>
<Route
  path="/payshap"
  element={
    <PrivateRoute>
      <PayShap />
    </PrivateRoute>
  }
/>

<Route
  path="/profile"
  element={
    <PrivateRoute>
      <Profile />
    </PrivateRoute>
  }
/>

        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;