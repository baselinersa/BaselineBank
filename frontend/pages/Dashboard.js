import { useEffect, useState } from "react";
import API from "../api";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const [account, setAccount] = useState(null);
  const [amount, setAmount] = useState("");

 const fetchAccount = async () => {
  const res = await API.get("balance/");
  setAccount(res.data);
};

const deposit = async () => {
  await API.post("deposit/", { amount });
  fetchAccount();
};

const withdraw = async () => {
  await API.post("withdraw/", { amount });
  fetchAccount();
};

  const withdraw = async () => {
    await API.post("withdraw/", {
      account_id: 1,
      amount: amount,
    });

    fetchAccount();
  };

  useEffect(() => {
    fetchAccount();
  }, []);

 return (
  <div style={{ display: "flex" }}>

    {/* SIDEBAR */}
    <Sidebar />

    {/* MAIN CONTENT */}
    <div style={{
      marginLeft: 220,
      padding: 20,
      width: "100%"
    }}>

      <Navbar />

      <h1>Dashboard</h1>

      {/* BALANCE CARDS */}
      <div style={{ display: "flex", gap: 20, marginTop: 20 }}>

        <div style={{
          background: "#f4f4f4",
          padding: 20,
          borderRadius: 10,
          flex: 1
        }}>
          <h3>Main Account</h3>
          <h2>R {account?.main_balance || 0}</h2>
        </div>

        <div style={{
          background: "#f4f4f4",
          padding: 20,
          borderRadius: 10,
          flex: 1
        }}>
          <h3>Savings Account</h3>
          <h2>R {account?.savings_balance || 0}</h2>
        </div>

      </div>

      {/* TRANSACTION INPUT */}
      <div style={{ marginTop: 30 }}>
        <input
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ padding: 10, marginRight: 10 }}
        />

        <button onClick={deposit}>Deposit</button>
        <button onClick={withdraw} style={{ marginLeft: 10 }}>
          Withdraw
        </button>
      </div>

    </div>
  </div>
);