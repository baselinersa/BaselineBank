import { useEffect, useState } from "react";
import API from "../api";
import Navbar from "../components/Navbar";

export default function PayShap() {
  const [mainBalance, setMainBalance] = useState(0);
  const [savingsBalance, setSavingsBalance] = useState(0);

  const [proxy, setProxy] = useState("");
  const [amount, setAmount] = useState("");
  const [accountType, setAccountType] = useState("main");

  const [loading, setLoading] = useState(false);
  const [fetchingBalance, setFetchingBalance] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reference, setReference] = useState("");

  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      setFetchingBalance(true);

      const response = await API.get("balance/");

      setMainBalance(
        Number(response.data.main_balance || 0)
      );

      setSavingsBalance(
        Number(response.data.savings_balance || 0)
      );
    } catch (err) {
      console.error("Balance Error:", err);

      setError(
        err.response?.data?.detail ||
        "Unable To Load Your Account Balance."
      );
    } finally {
      setFetchingBalance(false);
    }
  };

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const selectedBalance =
    accountType === "main"
      ? mainBalance
      : savingsBalance;

  const validateForm = () => {
    setError("");
    setSuccess("");

    const cleanProxy = proxy.trim();
    const numericAmount = Number(amount);

    if (!cleanProxy) {
      setError(
        "Please Enter The Recipient's PayShap Number Or Proxy."
      );
      return false;
    }

    if (
      /^\d+$/.test(cleanProxy) &&
      (
        cleanProxy.length !== 10 ||
        !cleanProxy.startsWith("0")
      )
    ) {
      setError(
        "Please Enter A Valid 10-Digit South African Mobile Number."
      );
      return false;
    }

    if (!amount || Number.isNaN(numericAmount)) {
      setError("Please Enter A Valid Amount.");
      return false;
    }

    if (numericAmount <= 0) {
      setError("Amount Must Be Greater Than R0.00.");
      return false;
    }

    if (numericAmount > selectedBalance) {
      setError(
        `Insufficient ${
          accountType === "main"
            ? "Main"
            : "Savings"
        } Account Balance.`
      );
      return false;
    }

    return true;
  };

  const continuePayment = (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setShowConfirmation(true);
  };

  const sendPayment = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.post(
        "payshap/",
        {
          proxy: proxy.trim(),
          amount: amount,
          account_type: accountType,
        }
      );

      if (response.data.success) {
        setSuccess(
          response.data.message ||
          "PayShap Payment Successful."
        );

        setReference(
          response.data.reference || ""
        );

        setMainBalance(
          Number(response.data.main_balance || 0)
        );

        setSavingsBalance(
          Number(response.data.savings_balance || 0)
        );

        setProxy("");
        setAmount("");
        setAccountType("main");
        setShowConfirmation(false);
      } else {
        setError(
          response.data.error ||
          "PayShap Payment Failed."
        );
      }
    } catch (err) {
      console.error("PayShap Error:", err);

      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Unable To Process PayShap Payment."
      );

      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6f8",
      }}
    >

      <Navbar />

      <main
        style={{
          width: "100%",
          maxWidth: "900px",
          margin: "0 auto",
          padding: "40px 20px 60px",
          boxSizing: "border-box",
        }}
      >

        {/* HEADER */}

        <div
          style={{
            marginBottom: "30px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: "800",
              color: "#111827",
            }}
          >
            💸 PayShap
          </h1>

          <p
            style={{
              marginTop: "8px",
              color: "#6b7280",
              fontSize: "16px",
            }}
          >
            Send Money Instantly Using A PayShap
            Mobile Number Or Proxy.
          </p>
        </div>

        {/* BALANCES */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "18px",
            marginBottom: "25px",
          }}
        >

          <div
            style={{
              padding: "25px",
              borderRadius: "18px",
              background:
                "linear-gradient(135deg, #111827, #374151)",
              color: "white",
              boxShadow:
                "0 8px 25px rgba(0,0,0,0.12)",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                opacity: 0.75,
              }}
            >
              Main Account
            </div>

            <div
              style={{
                fontSize: "30px",
                fontWeight: "800",
                marginTop: "8px",
              }}
            >
              R {formatMoney(mainBalance)}
            </div>
          </div>

          <div
            style={{
              padding: "25px",
              borderRadius: "18px",
              background:
                "linear-gradient(135deg, #4b5563, #6b7280)",
              color: "white",
              boxShadow:
                "0 8px 25px rgba(0,0,0,0.12)",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                opacity: 0.75,
              }}
            >
              Savings Account
            </div>

            <div
              style={{
                fontSize: "30px",
                fontWeight: "800",
                marginTop: "8px",
              }}
            >
              R {formatMoney(savingsBalance)}
            </div>
          </div>

        </div>

        {/* SUCCESS */}

        {success && (
          <div
            style={{
              background: "#ecfdf5",
              border: "1px solid #10b981",
              color: "#065f46",
              padding: "18px",
              borderRadius: "14px",
              marginBottom: "20px",
            }}
          >
            <strong>
              ✓ PayShap Payment Successful
            </strong>

            <div style={{ marginTop: "8px" }}>
              {success}
            </div>

            {reference && (
              <div
                style={{
                  marginTop: "8px",
                  fontWeight: "700",
                }}
              >
                Reference: {reference}
              </div>
            )}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #ef4444",
              color: "#991b1b",
              padding: "18px",
              borderRadius: "14px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* PAYSHAP CARD */}

        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "30px",
            boxShadow:
              "0 10px 35px rgba(0,0,0,0.08)",
          }}
        >

          <h2
            style={{
              marginTop: 0,
              marginBottom: "25px",
              color: "#111827",
            }}
          >
            Send Money
          </h2>

          <form onSubmit={continuePayment}>

            {/* PROXY */}

            <label
              style={{
                display: "block",
                fontWeight: "700",
                marginBottom: "8px",
              }}
            >
              Recipient PayShap Number / Proxy
            </label>

            <input
              type="text"
              value={proxy}
              onChange={(e) => {
                setProxy(e.target.value);
                setError("");
              }}
              placeholder="0821234567"
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                fontSize: "16px",
                boxSizing: "border-box",
                marginBottom: "25px",
              }}
            />

            {/* ACCOUNT */}

            <label
              style={{
                display: "block",
                fontWeight: "700",
                marginBottom: "10px",
              }}
            >
              Pay From
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "25px",
              }}
            >

              <button
                type="button"
                onClick={() => setAccountType("main")}
                style={{
                  padding: "18px",
                  borderRadius: "12px",
                  border:
                    accountType === "main"
                      ? "2px solid #111827"
                      : "1px solid #d1d5db",
                  background:
                    accountType === "main"
                      ? "#f3f4f6"
                      : "white",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <strong>
                  🏦 Main Account
                </strong>

                <div
                  style={{
                    marginTop: "7px",
                    color: "#6b7280",
                  }}
                >
                  R {formatMoney(mainBalance)}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAccountType("savings")}
                style={{
                  padding: "18px",
                  borderRadius: "12px",
                  border:
                    accountType === "savings"
                      ? "2px solid #111827"
                      : "1px solid #d1d5db",
                  background:
                    accountType === "savings"
                      ? "#f3f4f6"
                      : "white",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <strong>
                  💰 Savings Account
                </strong>

                <div
                  style={{
                    marginTop: "7px",
                    color: "#6b7280",
                  }}
                >
                  R {formatMoney(savingsBalance)}
                </div>
              </button>

            </div>

            {/* AMOUNT */}

            <label
              style={{
                display: "block",
                fontWeight: "700",
                marginBottom: "8px",
              }}
            >
              Amount
            </label>

            <div
              style={{
                position: "relative",
                marginBottom: "10px",
              }}
            >

              <span
                style={{
                  position: "absolute",
                  left: "15px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontWeight: "700",
                }}
              >
                R
              </span>

              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                }}
                placeholder="0.00"
                min="1"
                step="0.01"
                style={{
                  width: "100%",
                  padding: "15px 15px 15px 35px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  fontSize: "18px",
                  boxSizing: "border-box",
                }}
              />

            </div>

            <div
              style={{
                color: "#6b7280",
                fontSize: "13px",
                marginBottom: "15px",
              }}
            >
              Available: R {formatMoney(selectedBalance)}
            </div>

            {/* QUICK AMOUNTS */}

            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginBottom: "25px",
              }}
            >

              {[50, 100, 200, 500, 1000].map(
                (value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setAmount(String(value));
                      setError("");
                    }}
                    style={{
                      padding: "9px 15px",
                      borderRadius: "20px",
                      border: "1px solid #d1d5db",
                      background: "white",
                      cursor: "pointer",
                    }}
                  >
                    R {value}
                  </button>
                )
              )}

            </div>

            {/* CONTINUE */}

            <button
              type="submit"
              disabled={fetchingBalance || loading}
              style={{
                width: "100%",
                padding: "16px",
                border: "none",
                borderRadius: "12px",
                background: "#111827",
                color: "white",
                fontSize: "17px",
                fontWeight: "800",
                cursor: "pointer",
                opacity:
                  fetchingBalance || loading
                    ? 0.6
                    : 1,
              }}
            >
              {fetchingBalance
                ? "Loading Balance..."
                : "Continue"}
            </button>

          </form>

        </div>

      </main>

      {/* CONFIRMATION */}

    ```jsx
      {/* CONFIRMATION */}

      {showConfirmation && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.70)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "450px",
              background: "#1e293b",
              color: "#ffffff",
              borderRadius: "20px",
              padding: "30px",
              boxSizing: "border-box",
              boxShadow: "0 25px 70px rgba(0,0,0,0.45)",
              border: "1px solid #475569",
            }}
          >

            {/* TITLE */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "#334155",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "21px",
                }}
              >
                💸
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: "23px",
                  fontWeight: "800",
                  color: "#ffffff",
                }}
              >
                Confirm PayShap
              </h2>
            </div>

            <p
              style={{
                margin: "0 0 25px",
                color: "#cbd5e1",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              Please Check The Details Before Sending.
            </p>

            {/* PAYMENT DETAILS */}

            <div
              style={{
                background: "#0f172a",
                border: "1px solid #475569",
                borderRadius: "15px",
                padding: "20px",
                marginBottom: "25px",
              }}
            >

              {/* RECIPIENT */}

              <div
                style={{
                  marginBottom: "18px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    marginBottom: "5px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Recipient
                </div>

                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: "700",
                    color: "#ffffff",
                    wordBreak: "break-word",
                  }}
                >
                  {proxy}
                </div>
              </div>

              {/* PAY FROM */}

              <div
                style={{
                  marginBottom: "18px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    marginBottom: "5px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Pay From
                </div>

                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: "700",
                    color: "#ffffff",
                  }}
                >
                  {accountType === "main"
                    ? "🏦 Main Account"
                    : "💰 Savings Account"}
                </div>
              </div>

              {/* AMOUNT */}

              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    marginBottom: "5px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Amount
                </div>

                <div
                  style={{
                    fontSize: "30px",
                    fontWeight: "800",
                    color: "#ffffff",
                  }}
                >
                  R {formatMoney(amount)}
                </div>
              </div>

            </div>

            {/* BUTTONS */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >

              {/* CANCEL */}

              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "15px 10px",
                  borderRadius: "11px",
                  border: "1px solid #64748b",
                  background: "#334155",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: "700",
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                Cancel
              </button>

              {/* CONFIRM */}

              <button
                type="button"
                onClick={sendPayment}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "15px 10px",
                  borderRadius: "11px",
                  border: "none",
                  background: "#ffffff",
                  color: "#111827",
                  fontSize: "15px",
                  fontWeight: "800",
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading
                  ? "Sending..."
                  : "Confirm & Send"}
              </button>

            </div>

          </div>
        </div>
      )}



    </div>
  );
}

