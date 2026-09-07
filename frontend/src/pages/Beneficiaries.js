
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const API_URL = "http://127.0.0.1:8000";

export default function Beneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState([]);

  const [name, setName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bank, setBank] = useState("Baseline BANK");
  const [accountType, setAccountType] = useState("main");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // GET AUTH HEADERS
  // =====================================================

  const getHeaders = () => {
    const token = localStorage.getItem("access");

    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // =====================================================
  // LOAD BENEFICIARIES
  // =====================================================

  const loadBeneficiaries = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/api/beneficiaries/`,
        getHeaders()
      );

      setBeneficiaries(response.data);
    } catch (err) {
      console.error(
        "Failed to load beneficiaries:",
        err
      );

      if (err.response?.status === 401) {
        setError(
          "Your Session Has Expired. Please Log In Again."
        );
      } else {
        setError(
          err.response?.data?.error ||
            "Unable To Load Beneficiaries."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD ON PAGE OPEN
  // =====================================================

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  // =====================================================
  // ADD BENEFICIARY
  // =====================================================

  const addBeneficiary = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError(
        "Please Enter The Beneficiary Name."
      );
      return;
    }

    if (!accountNumber.trim()) {
      setError(
        "Please Enter The Account Number."
      );
      return;
    }

    if (!/^\d+$/.test(accountNumber.trim())) {
      setError(
        "Account Number Must Contain Numbers Only."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await axios.post(
        `${API_URL}/api/beneficiaries/`,
        {
          name: name.trim(),
          account_number: accountNumber.trim(),
          bank: bank,
          account_type: accountType,
        },
        getHeaders()
      );

      setSuccess(
        response.data.message ||
          "Beneficiary Added Successfully."
      );

      setName("");
      setAccountNumber("");
      setBank("Baseline BANK");
      setAccountType("main");

      await loadBeneficiaries();
    } catch (err) {
      console.error(
        "Failed to add beneficiary:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Unable To Add Beneficiary."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE BENEFICIARY
  // =====================================================

  const deleteBeneficiary = async (id) => {
    const confirmed = window.confirm(
      "Are You Sure You Want To Delete This Beneficiary?"
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await axios.delete(
        `${API_URL}/api/beneficiaries/${id}/`,
        getHeaders()
      );

      setSuccess(
        response.data.message ||
          "Beneficiary Deleted Successfully."
      );

      await loadBeneficiaries();
    } catch (err) {
      console.error(
        "Failed to delete beneficiary:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Unable To Delete Beneficiary."
      );
    }
  };

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <>
      <Navbar />

      <div
        style={{
          minHeight: "100vh",
          padding: "30px",
          boxSizing: "border-box",
          background:
            "var(--page-bg, #f4f6f8)",
          color:
            "var(--text-color, #111827)",
          transition: "0.3s ease",
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >

          {/* =================================================
              HEADER
          ================================================= */}

          <div
            style={{
              marginBottom: "25px",
            }}
          >
            <h1
              style={{
                marginBottom: "8px",
                color:
                  "var(--text-color, #111827)",
              }}
            >
              Beneficiaries
            </h1>

            <p
              style={{
                margin: 0,
                color:
                  "var(--muted-text, #6b7280)",
              }}
            >
              Manage The People And Accounts You
              Frequently Transfer Money To.
            </p>
          </div>

          {/* =================================================
              MESSAGES
          ================================================= */}

          {error && (
            <div
              style={{
                background:
                  "var(--error-bg, #ffe5e5)",
                color:
                  "var(--error-text, #c00000)",
                padding: "14px",
                borderRadius: "10px",
                marginBottom: "15px",
                border:
                  "1px solid var(--error-border, #f5b5b5)",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                background:
                  "var(--success-bg, #e5f8ea)",
                color:
                  "var(--success-text, #08752b)",
                padding: "14px",
                borderRadius: "10px",
                marginBottom: "15px",
                border:
                  "1px solid var(--success-border, #9bd6aa)",
              }}
            >
              {success}
            </div>
          )}

          {/* =================================================
              ADD BENEFICIARY FORM
          ================================================= */}

          <div
            style={{
              background:
                "var(--card-bg, #ffffff)",
              padding: "25px",
              borderRadius: "16px",
              boxShadow:
                "0 6px 25px rgba(0,0,0,0.08)",
              marginBottom: "30px",
              border:
                "1px solid var(--border-color, #e5e7eb)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: "20px",
                color:
                  "var(--text-color, #111827)",
              }}
            >
              Add Beneficiary
            </h2>

            <form onSubmit={addBeneficiary}>

              {/* NAME */}

              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: "700",
                  color:
                    "var(--text-color, #111827)",
                }}
              >
                Beneficiary Name
              </label>

              <input
                type="text"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px",
                  marginBottom: "18px",
                  border:
                    "1px solid var(--border-color, #ccc)",
                  borderRadius: "9px",
                  background:
                    "var(--input-bg, #ffffff)",
                  color:
                    "var(--text-color, #111827)",
                  fontSize: "15px",
                  outline: "none",
                }}
              />

              {/* ACCOUNT NUMBER */}

              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: "700",
                  color:
                    "var(--text-color, #111827)",
                }}
              >
                Account Number
              </label>

              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter Account Number"
                value={accountNumber}
                onChange={(e) =>
                  setAccountNumber(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px",
                  marginBottom: "18px",
                  border:
                    "1px solid var(--border-color, #ccc)",
                  borderRadius: "9px",
                  background:
                    "var(--input-bg, #ffffff)",
                  color:
                    "var(--text-color, #111827)",
                  fontSize: "15px",
                  outline: "none",
                }}
              />

              {/* BANK */}

              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: "700",
                  color:
                    "var(--text-color, #111827)",
                }}
              >
                Bank
              </label>

              <select
                value={bank}
                onChange={(e) =>
                  setBank(e.target.value)
                }
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px",
                  marginBottom: "18px",
                  border:
                    "1px solid var(--border-color, #ccc)",
                  borderRadius: "9px",
                  background:
                    "var(--input-bg, #ffffff)",
                  color:
                    "var(--text-color, #111827)",
                  fontSize: "15px",
                }}
              >
                <option value="Baseline BANK">
                  Baseline BANK
                </option>

                <option value="ABSA">
                  ABSA
                </option>

                <option value="Capitec">
                  Capitec
                </option>

                <option value="FNB">
                  FNB
                </option>

                <option value="Nedbank">
                  Nedbank
                </option>

                <option value="Standard Bank">
                  Standard Bank
                </option>

                <option value="TymeBank">
                  TymeBank
                </option>
              </select>

              {/* ACCOUNT TYPE */}

              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: "700",
                  color:
                    "var(--text-color, #111827)",
                }}
              >
                Account Type
              </label>

              <select
                value={accountType}
                onChange={(e) =>
                  setAccountType(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px",
                  marginBottom: "20px",
                  border:
                    "1px solid var(--border-color, #ccc)",
                  borderRadius: "9px",
                  background:
                    "var(--input-bg, #ffffff)",
                  color:
                    "var(--text-color, #111827)",
                  fontSize: "15px",
                }}
              >
                <option value="main">
                  Main Account
                </option>

                <option value="savings">
                  Savings Account
                </option>
              </select>

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={saving}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: saving
                    ? "#6b7280"
                    : "#111827",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "9px",
                  cursor: saving
                    ? "not-allowed"
                    : "pointer",
                  fontSize: "15px",
                  fontWeight: "800",
                }}
              >
                {saving
                  ? "Adding Beneficiary..."
                  : "Add Beneficiary"}
              </button>

            </form>
          </div>

          {/* =================================================
              SAVED BENEFICIARIES
          ================================================= */}

          <div
            style={{
              background:
                "var(--card-bg, #ffffff)",
              padding: "25px",
              borderRadius: "16px",
              boxShadow:
                "0 6px 25px rgba(0,0,0,0.08)",
              border:
                "1px solid var(--border-color, #e5e7eb)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: "20px",
                color:
                  "var(--text-color, #111827)",
              }}
            >
              Saved Beneficiaries
            </h2>

            {loading ? (
              <p
                style={{
                  color:
                    "var(--muted-text, #6b7280)",
                }}
              >
                Loading Beneficiaries...
              </p>
            ) : beneficiaries.length === 0 ? (
              <p
                style={{
                  color:
                    "var(--muted-text, #6b7280)",
                }}
              >
                You Do Not Have Any Saved
                Beneficiaries Yet.
              </p>
            ) : (
              <div>
                {beneficiaries.map(
                  (beneficiary) => (
                    <div
                      key={beneficiary.id}
                      style={{
                        border:
                          "1px solid var(--border-color, #e0e0e0)",
                        borderRadius: "14px",
                        padding: "20px",
                        marginBottom: "14px",
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                        gap: "20px",
                        flexWrap: "wrap",
                        background:
                          "var(--card-inner-bg, #ffffff)",
                      }}
                    >

                      {/* BENEFICIARY INFO */}

                      <div
                        style={{
                          flex: 1,
                          minWidth: "250px",
                        }}
                      >

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "14px",
                          }}
                        >

                          <div
                            style={{
                              width: "46px",
                              height: "46px",
                              borderRadius: "50%",
                              background:
                                "#111827",
                              color: "#ffffff",
                              display: "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              fontSize: "18px",
                              fontWeight: "800",
                              flexShrink: 0,
                            }}
                          >
                            {beneficiary.name
                              ? beneficiary.name
                                  .charAt(0)
                                  .toUpperCase()
                              : "?"}
                          </div>

                          <h3
                            style={{
                              margin: 0,
                              color:
                                "var(--text-color, #111827)",
                              fontSize: "19px",
                              fontWeight: "800",
                            }}
                          >
                            {beneficiary.name}
                          </h3>

                        </div>

                        {/* DETAILS */}

                        <div
                          style={{
                            display: "grid",
                            gap: "8px",
                            padding: "15px",
                            borderRadius: "11px",
                            background:
                              "var(--input-bg, #f9fafb)",
                            border:
                              "1px solid var(--border-color, #e5e7eb)",
                          }}
                        >

                          <div
                            style={{
                              color:
                                "var(--text-color, #111827)",
                            }}
                          >
                            <strong>Bank:</strong>{" "}
                            {beneficiary.bank}
                          </div>

                          <div
                            style={{
                              color:
                                "var(--text-color, #111827)",
                              wordBreak:
                                "break-all",
                            }}
                          >
                            <strong>
                              Account:
                            </strong>{" "}
                            {beneficiary.account_number}
                          </div>

                          <div
                            style={{
                              color:
                                "var(--text-color, #111827)",
                            }}
                          >
                            <strong>Type:</strong>{" "}
                            {beneficiary.account_type ===
                            "savings"
                              ? "Savings Account"
                              : "Main Account"}
                          </div>

                        </div>

                      </div>

                      {/* DELETE */}

                      <button
                        type="button"
                        onClick={() =>
                          deleteBeneficiary(
                            beneficiary.id
                          )
                        }
                        style={{
                          padding:
                            "11px 18px",
                          background:
                            "transparent",
                          color: "#ef4444",
                          border:
                            "1px solid #ef4444",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "700",
                        }}
                      >
                        Delete
                      </button>

                    </div>
                  )
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

