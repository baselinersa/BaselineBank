import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div style={{
      width: 200,
      height: "100vh",
      background: "#111",
      color: "white",
      padding: 20,
      position: "fixed"
    }}>
      <h2>Bank App</h2>

      <nav style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        <Link to="/dashboard" style={{ color: "white" }}>Dashboard</Link>
        <Link to="/transactions" style={{ color: "white" }}>Transactions</Link>
      </nav>
    </div>
      );
}