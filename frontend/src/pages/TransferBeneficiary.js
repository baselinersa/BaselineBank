
import { useEffect, useState } from "react";
import API from "../api";
import Navbar from "../components/Navbar";

export default function TransferBeneficiary() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState("");
  const [amount, setAmount] = useState("");
  const [accountType, setAccountType] = useState("main");

  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // LOAD BENEFICIARIES
  // =========================================================

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  const loadBeneficiaries = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("beneficiaries/");

      setBeneficiaries(response.data || []);
    } catch (err) {
      console.error("Error loading beneficiaries:", err);

      setError(
        err.response?.data?.error ||
          "Unable to load your beneficiaries."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // TRANSFER
  // =========================================================

  const handleTransfer = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // -----------------------------------------
    // VALIDATE BENEFICIARY
    // -----------------------------------------

    if (!selectedBeneficiary) {
      setError("Please select a beneficiary.");
      return;
    }

    // -----------------------------------------
    // VALIDATE AMOUNT
    // -----------------------------------------

    const numericAmount = Number(amount);

    if (!amount || Number.isNaN(numericAmount)) {
      setError("Please enter a valid amount.");
      return;
    }

    if (numericAmount <= 0) {
      setError("Transfer amount must be greater than zero.");
      return;
    }

    // -----------------------------------------
    // START TRANSFER
    // -----------------------------------------

    try {
      setTransferring(true);

      const response = await API.post(
        "transfer-beneficiary/",
        {
          beneficiary_id: Number(selectedBeneficiary),
          amount: numericAmount,
          account_type: accountType,
        }
      );

      if (response.data?.success) {
        setSuccess(
          response.data.message ||
            "Transfer completed successfully."
        );

        setAmount("");
        setSelectedBeneficiary("");

        // Give the user a fresh beneficiary/account state
        await loadBeneficiaries();
      } else {
        setError(
          response.data?.error ||
            "Transfer could not be completed."
        );
      }
    } catch (err) {
      console.error("Transfer error:", err);

      setError(
        err.response?.data?.error ||
          "Transfer failed. Please try again."
      );
    } finally {
      setTransferring(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <>
        <Navbar />

        <div style={styles.page}>
          <div style={styles.card}>
            <p style={styles.loading}>
              Loading beneficiaries...
            </p>
          </div>
        </div>
      </>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <>
      <Navbar />

      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.title}>
              Pay Beneficiary
            </h1>

            <p style={styles.subtitle}>
              Transfer money securely to one of your
              saved beneficiaries.
            </p>
          </div>

          <div style={styles.card}>
            {/* =========================================
                SUCCESS MESSAGE
            ========================================= */}

            {success && (
              <div style={styles.success}>
                ✓ {success}
              </div>
            )}

            {/* =========================================
                ERROR MESSAGE
            ========================================= */}

            {error && (
              <div style={styles.error}>
                {error}
              </div>
            )}

            {/* =========================================
                NO BENEFICIARIES
            ========================================= */}

            {beneficiaries.length === 0 ? (
              <div style={styles.empty}>
                <div style={styles.emptyIcon}>
                  👤
                </div>

                <h2>No Beneficiaries</h2>

                <p>
                  You currently have no saved
                  beneficiaries.
                </p>

                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() => {
                    window.location.href =
                      "/beneficiaries";
                  }}
                >
                  Add Beneficiary
                </button>
              </div>
            ) : (
              <form onSubmit={handleTransfer}>
                {/* =====================================
                    BENEFICIARY
                ===================================== */}

                <label style={styles.label}>
                  Select Beneficiary
                </label>

                <select
                  value={selectedBeneficiary}
                  onChange={(e) =>
                    setSelectedBeneficiary(
                      e.target.value
                    )
                  }
                  style={styles.input}
                  disabled={transferring}
                >
                  <option value="">
                    -- Select Beneficiary --
                  </option>

                  {beneficiaries.map(
                    (beneficiary) => (
                      <option
                        key={beneficiary.id}
                        value={beneficiary.id}
                      >
                        {beneficiary.name} -{" "}
                        {beneficiary.bank} -{" "}
                        {beneficiary.account_number}
                      </option>
                    )
                  )}
                </select>

                {/* =====================================
                    SELECTED BENEFICIARY DETAILS
                ===================================== */}

                {selectedBeneficiary && (
                  <div style={styles.details}>
                    {(() => {
                      const beneficiary =
                        beneficiaries.find(
                          (item) =>
                            String(item.id) ===
                            String(
                              selectedBeneficiary
                            )
                        );

                      if (!beneficiary) {
                        return null;
                      }

                      return (
                        <>
                          <div
                            style={
                              styles.detailRow
                            }
                          >
                            <span>
                              Beneficiary
                            </span>

                            <strong>
                              {
                                beneficiary.name
                              }
                            </strong>
                          </div>

                          <div
                            style={
                              styles.detailRow
                            }
                          >
                            <span>Bank</span>

                            <strong>
                              {
                                beneficiary.bank
                              }
                            </strong>
                          </div>

                          <div
                            style={
                              styles.detailRow
                            }
                          >
                            <span>
                              Account Number
                            </span>

                            <strong>
                              {
                                beneficiary.account_number
                              }
                            </strong>
                          </div>

                          <div
                            style={
                              styles.detailRow
                            }
                          >
                            <span>
                              Account Type
                            </span>

                            <strong>
                              {beneficiary.account_type ===
                              "savings"
                                ? "Savings Account"
                                : "Main Account"}
                            </strong>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* =====================================
                    AMOUNT
                ===================================== */}

                <label style={styles.label}>
                  Amount
                </label>

                <div style={styles.amountWrapper}>
                  <span style={styles.currency}>
                    R
                  </span>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value)
                    }
                    style={styles.amountInput}
                    disabled={transferring}
                  />
                </div>

                {/* =====================================
                    SOURCE ACCOUNT
                ===================================== */}

                <label style={styles.label}>
                  Pay From
                </label>

                <select
                  value={accountType}
                  onChange={(e) =>
                    setAccountType(e.target.value)
                  }
                  style={styles.input}
                  disabled={transferring}
                >
                  <option value="main">
                    Main Account
                  </option>

                  <option value="savings">
                    Savings Account
                  </option>
                </select>

                {/* =====================================
                    TRANSFER BUTTON
                ===================================== */}

                <button
                  type="submit"
                  style={
                    transferring
                      ? styles.buttonDisabled
                      : styles.button
                  }
                  disabled={transferring}
                >
                  {transferring
                    ? "Processing Transfer..."
                    : "Pay Beneficiary"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles = {
  page: {
    minHeight: "calc(100vh - 70px)",
    background: "#f5f7fb",
    padding: "40px 20px",
  },

  container: {
    maxWidth: "700px",
    margin: "0 auto",
  },

  header: {
    marginBottom: "25px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "700",
    color: "#1f2937",
  },

  subtitle: {
    marginTop: "8px",
    color: "#6b7280",
    fontSize: "15px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "30px",
    boxShadow:
      "0 4px 20px rgba(0, 0, 0, 0.08)",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    marginTop: "20px",
    fontWeight: "600",
    color: "#374151",
  },

  input: {
    width: "100%",
    padding: "13px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "15px",
    background: "#ffffff",
    boxSizing: "border-box",
  },

  amountWrapper: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    overflow: "hidden",
    background: "#ffffff",
  },

  currency: {
    paddingLeft: "14px",
    fontWeight: "700",
    color: "#374151",
  },

  amountInput: {
    flex: 1,
    border: "none",
    outline: "none",
    padding: "13px 10px",
    fontSize: "16px",
  },

  details: {
    marginTop: "15px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
  },

  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    padding: "7px 0",
    color: "#6b7280",
    fontSize: "14px",
  },

  button: {
    width: "100%",
    marginTop: "28px",
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    background: "#111827",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
  },

  buttonDisabled: {
    width: "100%",
    marginTop: "28px",
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    background: "#9ca3af",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "not-allowed",
  },

  success: {
    padding: "13px",
    marginBottom: "20px",
    borderRadius: "8px",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: "600",
  },

  error: {
    padding: "13px",
    marginBottom: "20px",
    borderRadius: "8px",
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: "600",
  },

  empty: {
    textAlign: "center",
    padding: "30px 10px",
    color: "#6b7280",
  },

  emptyIcon: {
    fontSize: "45px",
    marginBottom: "10px",
  },

  loading: {
    textAlign: "center",
    color: "#6b7280",
    margin: 0,
  },

  secondaryButton: {
    marginTop: "15px",
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px",
    background: "#374151",
    color: "#ffffff",
    fontWeight: "600",
    cursor: "pointer",
  },
};

