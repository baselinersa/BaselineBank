import { useEffect, useState } from "react";

import API from "../api";
import Navbar from "../components/Navbar";

export default function Profile() {
  const [username, setUsername] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [mainBalance, setMainBalance] = useState(0);
  const [savingsBalance, setSavingsBalance] = useState(0);
  const [currentPin, setCurrentPin] = useState("");
const [newPin, setNewPin] = useState("");
const [confirmPin, setConfirmPin] = useState("");
const [pinMessage, setPinMessage] = useState("");
const [pinError, setPinError] = useState("");
const [changingPin, setChangingPin] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("dashboard/");

        setUsername(response.data.username || "");
        setAccountNumber(
          response.data.account_number || ""
        );

        setMainBalance(
          Number(response.data.main_balance || 0)
        );

        setSavingsBalance(
          Number(response.data.savings_balance || 0)
        );
      } catch (err) {
        console.error(
          "PROFILE ERROR:",
          err?.response?.data || err?.message
        );

        setError(
          err?.response?.data?.detail ||
            err?.response?.data?.error ||
            "Unable to load profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const totalBalance =
    Number(mainBalance) + Number(savingsBalance);

  const formatMoney = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "0.00";
    }

    return number.toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
const handleChangePin = async (e) => {
  e.preventDefault();

  setPinMessage("");
  setPinError("");

  if (!currentPin || !newPin || !confirmPin) {
    setPinError("Please complete all PIN fields.");
    return;
  }

  if (!/^\d{4}$/.test(newPin)) {
    setPinError("New PIN must be exactly 4 digits.");
    return;
  }

  if (newPin !== confirmPin) {
    setPinError("New PINs do not match.");
    return;
  }

  try {
    setChangingPin(true);

    const response = await API.post("change-pin/", {
      current_pin: currentPin,
      new_pin: newPin,
      confirm_pin: confirmPin,
    });

    setPinMessage(
      response.data.message || "PIN changed successfully."
    );

    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
  } catch (err) {
    console.error(
      "CHANGE PIN ERROR:",
      err?.response?.data || err?.message
    );

    setPinError(
      err?.response?.data?.error ||
        err?.response?.data?.detail ||
        "Unable to change PIN."
    );
  } finally {
    setChangingPin(false);
  }
};
  return (
    <div className="dashboard">
      <Navbar />

      <div className="dashboard-container">

        <div className="dashboard-header">
          <div>
            <span className="dashboard-eyebrow">
              BASELINE BANK
            </span>

            <h1>My Profile</h1>

            <p>
              View Your Baseline Bank Account Information.
            </p>
          </div>
        </div>

        {loading && (
          <div className="bank-form">
            Loading profile...
          </div>
        )}

        {!loading && error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="bank-form">
              <h2>Personal Information</h2>

              <div className="transaction-detail-row">
                <span>Username</span>

                <strong>
                  {username || "Unavailable"}
                </strong>
              </div>

              <div className="transaction-detail-row">
                <span>Account Number</span>

                <strong>
                  {accountNumber || "Unavailable"}
                </strong>
              </div>
            </div>
           
            <div className="balance-grid">

              <div className="balance-card">
                <h3>Main Account</h3>

                <h2>
                  R {formatMoney(mainBalance)}
                </h2>
              </div>

              <div className="balance-card">
                <h3>Savings Account</h3>

                <h2>
                  R {formatMoney(savingsBalance)}
                </h2>
              </div>

              <div className="balance-card">
                <h3>Total Balance</h3>

                <h2>
                  R {formatMoney(totalBalance)}
                </h2>
              </div>

            </div>

            <div className="bank-form">
              <h2>Account Status</h2>
               <div className="bank-form">
  <h2>Change PIN</h2>

  <p>
    Update Your 4-Digit Banking PIN.
  </p>

  {pinMessage && (
    <div className="success-message">
      {pinMessage}
    </div>
  )}

  {pinError && (
    <div className="error-message">
      {pinError}
    </div>
  )}

  <form onSubmit={handleChangePin}>

    <label>
      Current PIN
    </label>

    <input
      type="password"
      inputMode="numeric"
      maxLength="4"
      placeholder="Enter current PIN"
      value={currentPin}
      onChange={(e) =>
        setCurrentPin(e.target.value)
      }
    />

    <label>
      New PIN
    </label>

    <input
      type="password"
      inputMode="numeric"
      maxLength="4"
      placeholder="Enter new 4-digit PIN"
      value={newPin}
      onChange={(e) =>
        setNewPin(e.target.value)
      }
    />

    <label>
      Confirm New PIN
    </label>

    <input
      type="password"
      inputMode="numeric"
      maxLength="4"
      placeholder="Confirm new PIN"
      value={confirmPin}
      onChange={(e) =>
        setConfirmPin(e.target.value)
      }
    />

    <button
      type="submit"
      disabled={changingPin}
    >
      {changingPin
        ? "Changing PIN..."
        : "Change PIN"}
    </button>

  </form>
</div>


              <div className="transaction-detail-row">
                <span>Account</span>

                <strong>
                  Active
                </strong>
              </div>

              <div className="transaction-detail-row">
                <span>Bank</span>

                <strong>
                  Baseline BANK
                </strong>
              </div>

              <div className="transaction-detail-row">
                <span>Currency</span>

                <strong>
                  South African Rand (ZAR)
                </strong>
              </div>

              <div className="transaction-detail-row">
                <span>Account Security</span>

                <strong className="transaction-status">
                  Protected
                </strong>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}