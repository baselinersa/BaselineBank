import { useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      console.log("=================================");
      console.log("🔐 BASELINE BANK LOGIN");
      console.log("Username:", username);
      console.log("API:", `${API_URL}/api/token/`);
      console.log("=================================");

      const response = await axios.post(
        `${API_URL}/api/token/`,
        {
          username: username.trim(),
          password: password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      console.log("✅ LOGIN SUCCESS");
      console.log("Status:", response.status);
      console.log("Response:", response.data);

      if (!response.data.access) {
        throw new Error("Backend did not return an access token.");
      }

      // Save JWT tokens
      localStorage.setItem("access", response.data.access);

      if (response.data.refresh) {
        localStorage.setItem("refresh", response.data.refresh);
      }

      console.log("✅ ACCESS TOKEN SAVED");
      console.log("🚀 Going to dashboard...");

      window.location.href = "/dashboard";

    } catch (err) {
      console.error("=================================");
      console.error("❌ LOGIN FAILED");
      console.error("=================================");

      console.error("Error:", err);
      console.error("Message:", err.message);
      console.error("URL:", err.config?.url);
      console.error("Method:", err.config?.method);
      console.error("Status:", err.response?.status);
      console.error("Response:", err.response?.data);

      if (err.response) {
        setError(
          `Server error ${err.response.status}: ${
            err.response.data?.detail ||
            JSON.stringify(err.response.data)
          }`
        );
      } else if (err.request) {
        setError(
          "Backend could not be reached. Make sure Django is running on port 8000."
        );
      } else {
        setError(err.message || "Login failed.");
      }

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
        onSubmit={login}
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
            marginBottom: "25px",
          }}
        >
          Baseline Bank
        </h2>

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
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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

        <label>Password</label>

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "15px",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <button
  type="button"
  onClick={() => {
    window.location.href = "/forgot-password";
  }}
  style={{
    width: "100%",
    marginTop: "12px",
    padding: "10px",
    background: "transparent",
    color: "#111",
    border: "none",
    cursor: "pointer",
    textDecoration: "underline",
    fontSize: "14px",
  }}
>
  Forgot Password?
</button>
      </form>
    </div>
  );
}