import { useState } from "react";
import axios from "axios";

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
      const res = await axios.post(
        "http://127.0.0.1:8000/api/token/",
        {
          username: username.trim(),
          password: password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // 💾 Save tokens
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      console.log("LOGIN SUCCESS ✔");

      // 🚀 Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      console.log("LOGIN ERROR:", err.response?.data || err.message);

      setError(
        err.response?.data?.detail ||
        "Invalid username or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f4f6f8",
      }}
    >
      <form
        onSubmit={login}
        style={{
          padding: 30,
          background: "white",
          borderRadius: 12,
          boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
          width: 320,
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 20 }}>
          Bank Login
        </h2>

        {error && (
          <div
            style={{
              background: "#ffe5e5",
              color: "#b00020",
              padding: 8,
              borderRadius: 6,
              marginBottom: 10,
              fontSize: 13,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <input
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 10,
            border: "1px solid #ddd",
            borderRadius: 6,
          }}
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 15,
            border: "1px solid #ddd",
            borderRadius: 6,
          }}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 10,
            background: loading ? "#ccc" : "#111",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}