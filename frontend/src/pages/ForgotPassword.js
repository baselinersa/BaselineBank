import { useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export default function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const resetPassword = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "New password must be at least 8 characters."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/reset-password/`,
        {
          username: username.trim(),
          account_number: accountNumber.trim(),
          new_password: newPassword,
          confirm_password: confirmPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      setMessage(
        response.data.message ||
          "Password reset successfully."
      );

      setUsername("");
      setAccountNumber("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (err) {
      console.error(
        "PASSWORD RESET ERROR:",
        err?.response?.data || err?.message
      );

      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f4f6f8",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <form
        onSubmit={resetPassword}
        style={{
          width: "320px",
          padding: "30px",
          background: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 5px 20px rgba(0,0,0,0.12)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "10px",
          }}
        >
          Reset Password
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            fontSize: "14px",
            marginBottom: "25px",
          }}
        >
          Reset Your Baseline Bank Login Password.
        </p>

        {message && (
          <div
            style={{
              background: "#e5f7e5",
              color: "#087f23",
              padding: "10px",
              borderRadius: "6px",
              marginBottom: "15px",
              fontSize: "13px",
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#ffe5e5",
              color: "#c00000",
              padding: "10px",
              borderRadius: "6px",
              marginBottom: "15px",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        <label>Username</label>

        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) =>
            setUsername(e.target.value)
          }
          required
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "11px",
            marginTop: "6px",
            marginBottom: "15px",
            border: "1px solid #ccc",
            borderRadius: "6px",
          }}
        />

        <label>Account Number</label>

        <input
          type="text"
          inputMode="numeric"
          maxLength="13"
          placeholder="13-digit account number"
          value={accountNumber}
          onChange={(e) =>
            setAccountNumber(e.target.value)
          }
          required
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "11px",
            marginTop: "6px",
            marginBottom: "15px",
            border: "1px solid #ccc",
            borderRadius: "6px",
          }}
        />

        <label>New Password</label>

        <input
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) =>
            setNewPassword(e.target.value)
          }
          required
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "11px",
            marginTop: "6px",
            marginBottom: "15px",
            border: "1px solid #ccc",
            borderRadius: "6px",
          }}
        />

        <label>Confirm New Password</label>

        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(e.target.value)
          }
          required
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "11px",
            marginTop: "6px",
            marginBottom: "20px",
            border: "1px solid #ccc",
            borderRadius: "6px",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: loading ? "#999" : "#111",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: loading
              ? "not-allowed"
              : "pointer",
            fontSize: "15px",
          }}
        >
          {loading
            ? "Resetting Password..."
            : "Reset Password"}
        </button>

        <button
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "10px",
            background: "transparent",
            color: "#111",
            border: "1px solid #ccc",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Back To Login
        </button>
      </form>
    </div>
  );
}