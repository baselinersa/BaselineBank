import { useEffect, useMemo, useState } from "react";
import API from "../api";
import Navbar from "../components/Navbar";

export default function Transactions() {
const [transactions, setTransactions] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const [search, setSearch] = useState("");
const [typeFilter, setTypeFilter] = useState("ALL");
const [accountFilter, setAccountFilter] = useState("ALL");
const [sortOrder, setSortOrder] = useState("NEWEST");
const [showAllTransactions, setShowAllTransactions] =
  useState(false);

const [selectedTransaction, setSelectedTransaction] = useState(null);

const [showAirtime, setShowAirtime] = useState(false);
const [showElectricity, setShowElectricity] = useState(false);
const [showBills, setShowBills] = useState(false);
const [showCardDetails, setShowCardDetails] = useState(false); 

const [airtimeMobileNumber, setAirtimeMobileNumber] = useState("");
const [airtimeNetwork, setAirtimeNetwork] = useState("");
const [airtimeAmount, setAirtimeAmount] = useState("");
const [airtimeLoading, setAirtimeLoading] = useState(false);
const [airtimeError, setAirtimeError] = useState("");

const [electricityMeterNumber, setElectricityMeterNumber] = useState("");
const [electricityProvider, setElectricityProvider] = useState("");
const [electricityAmount, setElectricityAmount] = useState("");
const [electricityLoading, setElectricityLoading] = useState(false);
const [electricityError, setElectricityError] = useState("");

const [billType, setBillType] = useState("");
const [billAccount, setBillAccount] = useState("");
const [billAmount, setBillAmount] = useState("");
const [billLoading, setBillLoading] = useState(false);
const [billError, setBillError] = useState("");

const [card, setCard] = useState(null);
const [cardLoading, setCardLoading] = useState(false);
const [cardError, setCardError] = useState("");
const [cardMessage, setCardMessage] = useState("");



useEffect(() => {
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("transactions/");
      const data = response.data;

      console.log("TRANSACTIONS RESPONSE:", data);

      if (Array.isArray(data)) {
        setTransactions(data);
      } else if (data && Array.isArray(data.results)) {
        setTransactions(data.results);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error(
        "TRANSACTIONS ERROR:",
        err?.response?.data || err?.message
      );

      setTransactions([]);

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "Unable to load transactions."
      );
    } finally {
      setLoading(false);
    }
  };

  fetchTransactions();
}, []);
useEffect(() => {
const handleEscape = (event) => {
if (event.key === "Escape") {
setSelectedTransaction(null);
}
};

window.addEventListener("keydown", handleEscape);

return () => {
  window.removeEventListener("keydown", handleEscape);
};


}, []);

const getType = (transaction) => {
return String(
transaction?.transaction_type ||
transaction?.type ||
"TRANSACTION"
).toUpperCase();
};

const getAccount = (transaction) => {
const accountType = String(
transaction?.account_type || ""
).toLowerCase();


return accountType === "savings"
  ? "Savings Account"
  : "Main Account";


};

const getTimestamp = (transaction) => {
return (
transaction?.timestamp ||
transaction?.created_at ||
transaction?.date ||
null
);
};

const getRecipient = (transaction) => {
const recipient =
transaction?.recipient ||
transaction?.recipient_username ||
transaction?.recipient_email;


if (!recipient) {
  return "";
}

if (typeof recipient === "object") {
  return String(
    recipient?.username ||
      recipient?.email ||
      recipient?.name ||
      "Unknown"
  );
}

return String(recipient);


};

const getTransferDirection = (transaction) => {
const description = String(
transaction?.description || ""
).toLowerCase();


if (
  description.includes("transfer from") ||
  description.includes("received") ||
  description.includes("transfer received")
) {
  return "IN";
}

if (
  description.includes("transfer to") ||
  description.includes("sent") ||
  description.includes("transfer sent")
) {
  return "OUT";
}

if (
  description.includes("main → savings") ||
  description.includes("main -> savings") ||
  description.includes("main to savings") ||
  description.includes("savings → main") ||
  description.includes("savings -> main") ||
  description.includes("savings to main")
) {
  return "INTERNAL";
}

return "TRANSFER";


};

const getAmountClass = (transaction) => {
const type = getType(transaction);

if (type.includes("DEPOSIT")) {
  return "deposit-amount";
}

if (
  type.includes("WITHDRAW") ||
  type.includes("WITHDRAWAL")
) {
  return "withdraw-amount";
}

if (type.includes("TRANSFER")) {
  const direction = getTransferDirection(transaction);

  if (direction === "IN") {
    return "deposit-amount";
  }

  if (direction === "OUT") {
    return "withdraw-amount";
  }

  return "transfer-amount";
}

return "transfer-amount";


};

const getSign = (transaction) => {
const type = getType(transaction);


if (type.includes("DEPOSIT")) {
  return "+";
}

if (
  type.includes("WITHDRAW") ||
  type.includes("WITHDRAWAL")
) {
  return "-";
}

if (type.includes("TRANSFER")) {
  const direction = getTransferDirection(transaction);

  if (direction === "IN") {
    return "+";
  }

  if (direction === "OUT") {
    return "-";
  }
}

return "";


};

const getTransactionLabel = (transaction) => {
const type = getType(transaction);


if (type.includes("DEPOSIT")) {
  return "DEPOSIT";
}

if (
  type.includes("WITHDRAW") ||
  type.includes("WITHDRAWAL")
) {
  return "WITHDRAW";
}

if (type.includes("TRANSFER")) {
  const direction = getTransferDirection(transaction);

  if (direction === "IN") {
    return "TRANSFER RECEIVED";
  }

  if (direction === "OUT") {
    return "TRANSFER SENT";
  }

  return "TRANSFER";
}

return type;


};

const getDescription = (transaction) => {
if (transaction?.description) {
return String(transaction.description);
}


const type = getType(transaction);

if (type.includes("DEPOSIT")) {
  return "Deposit";
}

if (
  type.includes("WITHDRAW") ||
  type.includes("WITHDRAWAL")
) {
  return "Withdrawal";
}

if (type.includes("TRANSFER")) {
  return "Transfer";
}

return "Transaction";


};

const formatAmount = (amount) => {
const value = Number(amount);

if (!Number.isFinite(value)) {
  return "0.00";
}

return value.toFixed(2);


};

const formatDate = (timestamp) => {
if (!timestamp) {
return "Date unavailable";
}


const date = new Date(timestamp);

if (Number.isNaN(date.getTime())) {
  return "Date unavailable";
}

try {
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
} catch (err) {
  return date.toLocaleString();
}

};

const filteredTransactions = useMemo(() => {
let result = [...transactions];


const searchText = search.trim().toLowerCase();

if (searchText) {
  result = result.filter((transaction) => {
    const label =
      getTransactionLabel(transaction).toLowerCase();

    const type =
      getType(transaction).toLowerCase();

    const account =
      getAccount(transaction).toLowerCase();

    const description =
      getDescription(transaction).toLowerCase();

    const amount = String(
      transaction?.amount || ""
    ).toLowerCase();

    const recipient =
      getRecipient(transaction).toLowerCase();

    return (
      label.includes(searchText) ||
      type.includes(searchText) ||
      account.includes(searchText) ||
      description.includes(searchText) ||
      amount.includes(searchText) ||
      recipient.includes(searchText)
    );
  });
}

if (typeFilter !== "ALL") {
  result = result.filter((transaction) => {
    const type = getType(transaction);

    if (typeFilter === "DEPOSIT") {
      return type.includes("DEPOSIT");
    }

    if (typeFilter === "WITHDRAW") {
      return (
        type.includes("WITHDRAW") ||
        type.includes("WITHDRAWAL")
      );
    }

    if (typeFilter === "TRANSFER") {
      return type.includes("TRANSFER");
    }

    return true;
  });
}

if (accountFilter === "MAIN") {
  result = result.filter(
    (transaction) =>
      String(
        transaction?.account_type || ""
      ).toLowerCase() !== "savings"
  );
}

if (accountFilter === "SAVINGS") {
  result = result.filter(
    (transaction) =>
      String(
        transaction?.account_type || ""
      ).toLowerCase() === "savings"
  );
}

result.sort((a, b) => {
  const dateA =
    new Date(getTimestamp(a)).getTime() || 0;

  const dateB =
    new Date(getTimestamp(b)).getTime() || 0;

  return sortOrder === "OLDEST"
    ? dateA - dateB
    : dateB - dateA;
});

return result;


}, [
transactions,
search,
typeFilter,
accountFilter,
sortOrder,
]);
const displayedTransactions =
  showAllTransactions
    ? filteredTransactions
    : filteredTransactions.slice(0, 3);

const clearFilters = () => {
  setSearch("");
  setTypeFilter("ALL");
  setAccountFilter("ALL");
  setSortOrder("NEWEST");
  setShowAllTransactions(false);
};

const closeModal = () => {
setSelectedTransaction(null);
};

const handleBuyAirtime = async () => {
  setAirtimeError("");

  const mobileNumber = airtimeMobileNumber.trim();
  const network = airtimeNetwork.trim();
  const amount = Number(airtimeAmount);

  if (!mobileNumber || mobileNumber.length !== 10) {
    setAirtimeError(
      "Please enter a valid 10-digit mobile number."
    );
    return;
  }

  if (!network) {
    setAirtimeError("Please select a network.");
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    setAirtimeError(
      "Please enter a valid airtime amount."
    );
    return;
  }

  try {
    setAirtimeLoading(true);

    const response = await API.post(
      "buy-airtime/",
      {
        mobile_number: mobileNumber,
        network: network,
        amount: amount,
      }
    );

    const data = response.data;

    if (data?.success) {
      alert(
        data.message ||
          "Airtime purchased successfully."
      );

      setAirtimeMobileNumber("");
      setAirtimeNetwork("");
      setAirtimeAmount("");
      setAirtimeError("");
      setShowAirtime(false);

      const transactionsResponse = await API.get(
        "transactions/"
      );

      const transactionsData =
        transactionsResponse.data;

      if (Array.isArray(transactionsData)) {
        setTransactions(transactionsData);
      } else if (
        transactionsData &&
        Array.isArray(transactionsData.results)
      ) {
        setTransactions(
          transactionsData.results
        );
      }
    } else {
      setAirtimeError(
        data?.error ||
          "Airtime purchase could not be completed."
      );
    }
  } catch (err) {
    console.error(
      "AIRTIME PURCHASE ERROR:",
      err?.response?.data || err?.message
    );

    setAirtimeError(
      err?.response?.data?.error ||
        err?.response?.data?.detail ||
        "Airtime purchase failed. Please try again."
    );
  } finally {
    setAirtimeLoading(false);
  }
};
const handleBuyElectricity = async () => {
  setElectricityError("");

  const meterNumber = electricityMeterNumber.trim();
  const provider = electricityProvider.trim();
  const amount = Number(electricityAmount);

  if (!meterNumber || !/^\d+$/.test(meterNumber)) {
    setElectricityError(
      "Please enter a valid meter number using numbers only."
    );
    return;
  }

  if (meterNumber.length < 10 || meterNumber.length > 20) {
    setElectricityError(
      "Please enter a valid meter number."
    );
    return;
  }

  if (!provider) {
    setElectricityError(
      "Please select an electricity provider."
    );
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    setElectricityError(
      "Please enter a valid electricity amount."
    );
    return;
  }

  try {
    setElectricityLoading(true);

    const response = await API.post(
      "buy-electricity/",
      {
        meter_number: meterNumber,
        provider: provider,
        amount: amount,
      }
    );

    const data = response.data;

    if (data?.success) {
      alert(
        data.message ||
          "Electricity purchased successfully."
      );

      setElectricityMeterNumber("");
      setElectricityProvider("");
      setElectricityAmount("");
      setElectricityError("");
      setShowElectricity(false);

      const transactionsResponse = await API.get(
        "transactions/"
      );

      const transactionsData =
        transactionsResponse.data;

      if (Array.isArray(transactionsData)) {
        setTransactions(transactionsData);
      } else if (
        transactionsData &&
        Array.isArray(transactionsData.results)
      ) {
        setTransactions(
          transactionsData.results
        );
      }
    } else {
      setElectricityError(
        data?.error ||
          "Electricity purchase could not be completed."
      );
    }
  } catch (err) {
    console.error(
      "ELECTRICITY PURCHASE ERROR:",
      err?.response?.data || err?.message
    );

    setElectricityError(
      err?.response?.data?.error ||
        err?.response?.data?.detail ||
        "Electricity purchase failed. Please try again."
    );
  } finally {
    setElectricityLoading(false);
  }
};
const handlePayBill = async () => {
  setBillError("");

  const type = billType.trim();
  const accountNumber = billAccount.trim();
  const amount = Number(billAmount);

  if (!type) {
    setBillError("Please select a bill type.");
    return;
  }

  if (!accountNumber) {
    setBillError(
      "Please enter an account / reference number."
    );
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    setBillError(
      "Please enter a valid bill amount."
    );
    return;
  }

  try {
    setBillLoading(true);

    const response = await API.post(
      "pay-bill/",
      {
        bill_type: type,
        bill_account: accountNumber,
        amount: amount,
      }
    );

    const data = response.data;

    if (data?.success) {
      alert(
        data.message ||
          "Bill paid successfully."
      );

      setBillType("");
      setBillAccount("");
      setBillAmount("");
      setBillError("");
      setShowBills(false);

      const transactionsResponse = await API.get(
        "transactions/"
      );

      const transactionsData =
        transactionsResponse.data;

      if (Array.isArray(transactionsData)) {
        setTransactions(transactionsData);
      } else if (
        transactionsData &&
        Array.isArray(transactionsData.results)
      ) {
        setTransactions(
          transactionsData.results
        );
      }
    } else {
      setBillError(
        data?.error ||
          "Bill payment could not be completed."
      );
    }
  } catch (err) {
    console.error(
      "BILL PAYMENT ERROR:",
      err?.response?.data || err?.message
    );

    setBillError(
      err?.response?.data?.error ||
        err?.response?.data?.detail ||
        "Bill payment failed. Please try again."
    );
  } finally {
    setBillLoading(false);
  }
};

const handleCardDetails = async () => {
  setCardError("");
  setCardMessage("");

  try {
    setCardLoading(true);

    const response = await API.get(
      "bank-card/"
    );

    const data = response.data;

    if (data?.success && data?.card) {
      setCard(data.card);
      setCardMessage(
        "Card details loaded successfully."
      );
    } else {
      setCardError(
        data?.error ||
          "Unable to load your bank card."
      );
    }
  } catch (err) {
    console.error(
      "BANK CARD ERROR:",
      err?.response?.data || err?.message
    );

    setCardError(
      err?.response?.data?.error ||
        err?.response?.data?.detail ||
        "Unable to load your bank card."
    );
  } finally {
    setCardLoading(false);
  }
};

const handleCardStatus = async (newStatus) => {
  setCardError("");
  setCardMessage("");

  try {
    setCardLoading(true);

    const response = await API.patch(
      "bank-card/",
      {
        status: newStatus,
      }
    );

    const data = response.data;

    if (data?.success && data?.card) {
      setCard(data.card);

      setCardMessage(
        newStatus === "FROZEN"
          ? "Your card has been frozen."
          : "Your card has been unfrozen."
      );
    } else {
      setCardError(
        data?.error ||
          "Unable to update card status."
      );
    }
  } catch (err) {
    console.error(
      "BANK CARD STATUS ERROR:",
      err?.response?.data || err?.message
    );

    setCardError(
      err?.response?.data?.error ||
        err?.response?.data?.detail ||
        "Unable to update card status."
    );
  } finally {
    setCardLoading(false);
  }
};


const printReceipt = () => {
if (!selectedTransaction) {
return;
}

const transaction = selectedTransaction;

const transactionId =
  transaction?.id ?? "N/A";

const transactionLabel =
  getTransactionLabel(transaction);

const amount =
  formatAmount(transaction?.amount);

const account =
  getAccount(transaction);

const date =
  formatDate(getTimestamp(transaction));

const description =
  getDescription(transaction);

const recipient =
  getRecipient(transaction);

const sign =
  getSign(transaction);

const direction =
  getTransferDirection(transaction);

const isTransfer =
  getType(transaction).includes("TRANSFER");

let directionText = "Internal Transfer";

if (direction === "IN") {
  directionText = "Money Received";
} else if (direction === "OUT") {
  directionText = "Money Sent";
}

const receiptWindow = window.open(
  "",
  "_blank",
  "width=650,height=900"
);

if (!receiptWindow) {
  setError(
    "Unable To Open Receipt Window. Please Allow Pop-Ups."
  );
  return;
}

const recipientRow = recipient
  ? `
    <div class="detail-row">
      <span class="detail-label">Recipient</span>
      <span class="detail-value">${recipient}</span>
    </div>
  `
  : "";

const directionRow = isTransfer
  ? `
    <div class="detail-row">
      <span class="detail-label">Direction</span>
      <span class="detail-value">${directionText}</span>
    </div>
  `
  : "";

const receiptHTML = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Baseline BANK - Transaction Receipt</title>

      <style>
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 40px 20px;
          background: #eef1f5;
          color: #172033;
          font-family: Arial, Helvetica, sans-serif;
        }

        .receipt-wrapper {
          width: 100%;
          max-width: 560px;
          margin: 0 auto;
        }

        .receipt {
          background: #ffffff;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 15px 45px rgba(0, 0, 0, 0.12);
        }

        .receipt-header {
          background: #111827;
          color: #ffffff;
          padding: 30px;
          text-align: center;
        }

        .bank-name {
          margin: 0;
          font-size: 30px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .bank-subtitle {
          margin: 8px 0 0;
          color: #cbd5e1;
          font-size: 13px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .receipt-title {
          margin: 24px 0 0;
          font-size: 18px;
          font-weight: 600;
        }

        .success-section {
          padding: 28px 30px 10px;
          text-align: center;
        }

        .success-icon {
          width: 58px;
          height: 58px;
          margin: 0 auto 12px;
          border: 3px solid #16a34a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #16a34a;
          font-size: 30px;
          font-weight: bold;
        }

        .success-text {
          margin: 0;
          color: #15803d;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .amount-section {
          padding: 20px 30px 30px;
          text-align: center;
        }

        .amount-label {
          margin: 0 0 8px;
          color: #64748b;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .amount {
          margin: 0;
          color: #111827;
          font-size: 42px;
          font-weight: 800;
        }

        .transaction-type {
          display: inline-block;
          margin-top: 12px;
          padding: 7px 13px;
          border-radius: 999px;
          background: #f1f5f9;
          color: #334155;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.8px;
        }

        .divider {
          margin: 0 30px;
          border-top: 1px dashed #cbd5e1;
        }

        .details {
          padding: 10px 30px 20px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          gap: 25px;
          padding: 17px 0;
          border-bottom: 1px solid #edf0f3;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-label {
          color: #64748b;
          font-size: 13px;
        }

        .detail-value {
          max-width: 60%;
          color: #172033;
          font-size: 13px;
          font-weight: 700;
          text-align: right;
          word-break: break-word;
        }

        .status {
          color: #15803d;
        }

        .reference {
          margin: 5px 30px 25px;
          padding: 16px;
          border-radius: 10px;
          background: #f8fafc;
          text-align: center;
        }

        .reference-label {
          margin: 0 0 6px;
          color: #64748b;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .reference-value {
          margin: 0;
          color: #172033;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .receipt-footer {
          padding: 24px 30px 30px;
          background: #f8fafc;
          text-align: center;
        }

        .footer-main {
          margin: 0;
          color: #334155;
          font-size: 13px;
          font-weight: 700;
        }

        .footer-note {
          margin: 8px 0 0;
          color: #94a3b8;
          font-size: 11px;
          line-height: 1.5;
        }

        .print-button {
          width: 100%;
          margin-top: 22px;
          padding: 14px 18px;
          border: none;
          border-radius: 10px;
          background: #111827;
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        @media print {
          body {
            padding: 0;
            background: #ffffff;
          }

          .receipt {
            border-radius: 0;
            box-shadow: none;
          }

          .print-button {
            display: none;
          }
        }
      </style>
    </head>

    <body>
      <div class="receipt-wrapper">
        <div class="receipt">

          <div class="receipt-header">
            <h1 class="bank-name">BASELINE BANK</h1>
            <p class="bank-subtitle">Secure Digital Banking</p>
            <p class="receipt-title">Transaction Receipt</p>
          </div>

          <div class="success-section">
            <div class="success-icon">✓</div>
            <p class="success-text">Transaction Completed</p>
          </div>

          <div class="amount-section">
            <p class="amount-label">Transaction Amount</p>
            <p class="amount">
              ${sign ? sign + " " : ""}R ${amount}
            </p>
            <span class="transaction-type">
              ${transactionLabel}
            </span>
          </div>

          <div class="divider"></div>

          <div class="details">

            <div class="detail-row">
              <span class="detail-label">Transaction ID</span>
              <span class="detail-value">#${transactionId}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Account</span>
              <span class="detail-value">${account}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Description</span>
              <span class="detail-value">${description}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Date &amp; Time</span>
              <span class="detail-value">${date}</span>
            </div>

            ${recipientRow}

            ${directionRow}

            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="detail-value status">Completed</span>
            </div>

          </div>

          <div class="reference">
            <p class="reference-label">Transaction Reference</p>
            <p class="reference-value">BB-${transactionId}</p>
          </div>

          <div class="receipt-footer">
            <p class="footer-main">
              Thank You For Banking With Baseline BANK
            </p>

            <p class="footer-note">
              Please Keep This Receipt For Your Records.<br>
              This Is An Electronic Transaction Receipt.
            </p>

            <button
              class="print-button"
              onclick="window.print()"
            >
              🖨️ Print Receipt
            </button>
          </div>

        </div>
      </div>
    </body>
  </html>
`;

receiptWindow.document.open();
receiptWindow.document.write(receiptHTML);
receiptWindow.document.close();
receiptWindow.focus();


};

return ( <div className="dashboard"> <Navbar />


  <div className="dashboard-container">
      <div className="transaction-services">

  <button
    type="button"
    className="transaction-service-card"
    onClick={() => setShowAirtime(true)}
  >
    <div className="service-icon">
      📱
    </div>

    <div className="service-content">
      <h3>Buy Airtime</h3>
      <p>Purchase Airtime For Your Mobile Number</p>
    </div>

    <span className="service-arrow">›</span>
  </button>

  <button
    type="button"
    className="transaction-service-card"
    onClick={() => setShowElectricity(true)}
  >
    <div className="service-icon">
      ⚡
    </div>

    <div className="service-content">
      <h3>Buy Electricity</h3>
      <p>Purchase Electricity Tokens Easily</p>
    </div>

    <span className="service-arrow">›</span>
  </button>

  <button
    type="button"
    className="transaction-service-card"
    onClick={() => setShowBills(true)}
  >
    <div className="service-icon">
      📄
    </div>

    <div className="service-content">
      <h3>Pay Bills</h3>
      <p>Pay Your Bills Securely</p>
    </div>

    <span className="service-arrow">›</span>
  </button>

  <button
    type="button"
    className="transaction-service-card"
    onClick={() => {
  setShowCardDetails(true);
  handleCardDetails();
}}
  >
    <div className="service-icon">
      💳
    </div>

    <div className="service-content">
      <h3>Bank Card</h3>
      <p>View Your Card Details</p>
    </div>

    <span className="service-arrow">›</span>
  </button>

</div>

    <div className="transactions-header">
      <div>
        <h1>Transaction History</h1>

        <p>
  {filteredTransactions.length} transaction
  {filteredTransactions.length !== 1
    ? "s"
    : ""}
</p>
      </div>
    </div>

    {!loading &&
      !error &&
      transactions.length > 0 && (
        <div className="transactions-filters">

          <div className="transaction-search">
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="transaction-filter">
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value)
              }
            >
              <option value="ALL">All Types</option>
              <option value="DEPOSIT">Deposits</option>
              <option value="WITHDRAW">Withdrawals</option>
              <option value="TRANSFER">Transfers</option>
            </select>
          </div>

          <div className="transaction-filter">
            <select
              value={accountFilter}
              onChange={(event) =>
                setAccountFilter(event.target.value)
              }
            >
              <option value="ALL">All Accounts</option>
              <option value="MAIN">Main Account</option>
              <option value="SAVINGS">Savings Account</option>
            </select>
          </div>

          <div className="transaction-filter">
            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value)
              }
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
            </select>
          </div>

          <button
            type="button"
            className="clear-filters-button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>

        </div>
      )}

    {loading && (
      <div className="bank-form">
        Loading transactions...
      </div>
    )}

    {!loading && error && (
      <div className="error-message">
        {error}
      </div>
    )}

    {!loading &&
      !error &&
      transactions.length === 0 && (
        <div className="bank-form">
          No transactions yet.
        </div>
      )}

    {!loading &&
      !error &&
      transactions.length > 0 &&
      filteredTransactions.length === 0 && (
        <div className="bank-form">
          No transactions match your filters.
        </div>
      )}
{!loading &&
  !error &&
  filteredTransactions.length > 0 && (
    <>
      <div className="transactions-list">
        {displayedTransactions.map(
          (transaction, index) => {
            const label =
              getTransactionLabel(transaction);

            const account =
              getAccount(transaction);

            const sign =
              getSign(transaction);

            const amountClass =
              getAmountClass(transaction);

            const description =
              getDescription(transaction);

            return (
              <div
                key={
                  transaction?.id ??
                  `transaction-${index}`
                }
                className="transaction-card"
                role="button"
                tabIndex={0}
                onClick={() =>
                  setSelectedTransaction(transaction)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    event.preventDefault();
                    setSelectedTransaction(
                      transaction
                    );
                  }
                }}
              >
                <div className="transaction-info">
                  <h3>{label}</h3>

                  <p>{account}</p>

                  <small>{description}</small>

                  <small>
                    {formatDate(
                      getTimestamp(transaction)
                    )}
                  </small>
                </div>

                <div
                  className={
                    "transaction-amount " +
                    amountClass
                  }
                >
                  {sign && (
                    <span>{sign} </span>
                  )}

                  R{" "}
                  {formatAmount(
                    transaction?.amount
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>

      {filteredTransactions.length > 3 && (
        <div className="show-all-transactions-container">
          <button
            type="button"
            className="show-all-transactions-button"
            onClick={() =>
              setShowAllTransactions(
                !showAllTransactions
              )
            }
          >
            {showAllTransactions
              ? "Show Latest 3 Transactions"
              : "Show All Transactions"}
          </button>
        </div>
      )}
    </>
  )}

  {showAirtime && (
  <div
    className="service-modal-overlay"
    onClick={() => setShowAirtime(false)}
  >
    <div
      className="service-modal"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="service-modal-close"
        onClick={() => setShowAirtime(false)}
      >
        ×
      </button>

      <div className="service-modal-icon">📱</div>

      <h2>Buy Airtime</h2>

      <p>Purchase Airtime For Your Mobile Number</p>

      <div className="service-form">
        <label htmlFor="airtime-number">
          Mobile Number
        </label>

        <input
  id="airtime-number"
  type="tel"
  placeholder="e.g. 0821234567"
  maxLength="10"
  value={airtimeMobileNumber}
  onChange={(event) =>
    setAirtimeMobileNumber(
      event.target.value.replace(/\D/g, "")
    )
  }
/>

        <label htmlFor="airtime-network">
          Network
        </label>
<select
  id="airtime-network"
  value={airtimeNetwork}
  onChange={(event) =>
    setAirtimeNetwork(event.target.value)
  }
>
          <option value="" disabled>
            Select Network
          </option>
          <option value="vodacom">Vodacom</option>
          <option value="mtn">MTN</option>
          <option value="telkom">Telkom</option>
          <option value="cellc">Cell C</option>
        </select>

        <label htmlFor="airtime-amount">
          Amount
        </label>

        <input
  id="airtime-amount"
  type="number"
  placeholder="Enter Amount"
  min="5"
  step="5"
  value={airtimeAmount}
  onChange={(event) =>
    setAirtimeAmount(event.target.value)
  }
/>

        {airtimeError && (
  <div className="error-message">
    {airtimeError}
  </div>
)}

<button
  type="button"
  className="service-modal-button"
  onClick={handleBuyAirtime}
  disabled={airtimeLoading}
>
  {airtimeLoading
    ? "Processing..."
    : "Continue"}
</button>

      </div>
    </div>
  </div>
)} 
{showElectricity && (
  <div
    className="service-modal-overlay"
    onClick={() => setShowElectricity(false)}
  >
    <div
      className="service-modal"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="service-modal-close"
        onClick={() => setShowElectricity(false)}
      >
        ×
      </button>

      <div className="service-modal-icon">
        ⚡
      </div>

      <h2>Buy Electricity</h2>

      <p>
        Purchase Prepaid Electricity For Your Property
      </p>

      <div className="service-form">

        <label htmlFor="electricity-meter">
          Meter Number
        </label>

        <input
          id="electricity-meter"
          type="text"
          inputMode="numeric"
          placeholder="Enter Meter Number"
          maxLength="20"
          value={electricityMeterNumber}
          onChange={(event) =>
            setElectricityMeterNumber(
              event.target.value.replace(/\D/g, "")
            )
          }
        />

        <label htmlFor="electricity-provider">
          Electricity Provider
        </label>

        <select
          id="electricity-provider"
          value={electricityProvider}
          onChange={(event) =>
            setElectricityProvider(
              event.target.value
            )
          }
        >
          <option value="" disabled>
            Select Provider
          </option>

          <option value="eskom">
            Eskom
          </option>

          <option value="municipality">
            Municipality
          </option>
        </select>

        <label htmlFor="electricity-amount">
          Amount
        </label>

        <input
          id="electricity-amount"
          type="number"
          placeholder="Enter Amount"
          min="10"
          step="10"
          value={electricityAmount}
          onChange={(event) =>
            setElectricityAmount(
              event.target.value
            )
          }
        />

        {electricityError && (
          <div className="error-message">
            {electricityError}
          </div>
        )}

        <button
          type="button"
          className="service-modal-button"
          onClick={handleBuyElectricity}
          disabled={electricityLoading}
        >
          {electricityLoading
            ? "Processing..."
            : "Continue"}
        </button>

      </div>
    </div>
  </div>
)}
{showBills && (
  <div
    className="service-modal-overlay"
    onClick={() => setShowBills(false)}
  >
    <div
      className="service-modal"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="service-modal-close"
        onClick={() => setShowBills(false)}
      >
        ×
      </button>

      <div className="service-modal-icon">
        📄
      </div>

      <h2>Pay Bills</h2>

      <p>
        Pay Your Bills Quickly And Securely
      </p>

      <div className="service-form">

        <label htmlFor="bill-type">
          Bill Type
        </label>

        <select
          id="bill-type"
          value={billType}
          onChange={(event) =>
            setBillType(event.target.value)
          }
        >
          <option value="" disabled>
            Select Bill Type
          </option>

          <option value="water">
            Water
          </option>

          <option value="municipality">
            Municipality
          </option>

          <option value="internet">
            Internet
          </option>

          <option value="insurance">
            Insurance
          </option>

          <option value="other">
            Other
          </option>
        </select>

        <label htmlFor="bill-account">
          Account / Reference Number
        </label>

        <input
          id="bill-account"
          type="text"
          placeholder="Enter Account Number"
          value={billAccount}
          onChange={(event) =>
            setBillAccount(event.target.value)
          }
        />

        <label htmlFor="bill-amount">
          Amount
        </label>

        <input
          id="bill-amount"
          type="number"
          placeholder="Enter Amount"
          min="1"
          step="0.01"
          value={billAmount}
          onChange={(event) =>
            setBillAmount(event.target.value)
          }
        />

        {billError && (
          <div className="error-message">
            {billError}
          </div>
        )}

        <button
          type="button"
          className="service-modal-button"
          onClick={handlePayBill}
          disabled={billLoading}
        >
          {billLoading
            ? "Processing..."
            : "Continue"}
        </button>

      </div>
    </div>
  </div>
)}

{showCardDetails && (
  <div
    className="service-modal-overlay"
    onClick={() => {
      setShowCardDetails(false);
      setCardError("");
      setCardMessage("");
    }}
  >
    <div
      className="service-modal"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="service-modal-close"
        onClick={() => {
          setShowCardDetails(false);
          setCardError("");
          setCardMessage("");
        }}
      >
        ×
      </button>

      <div className="service-modal-icon">
        💳
      </div>

      <h2>Bank Card</h2>

      <p>
        Manage Your Bank Card And View Card Details
      </p>

      {cardLoading && (
        <div className="bank-form">
          Loading Card Details...
        </div>
      )}

      {!cardLoading && card && (
        <div className="service-form">

          {/* =========================
              VISUAL BANK CARD
          ========================= */}

          <div className="bank-card-visual">

            <div className="bank-card-brand">
              BASELINE BANK
            </div>

            <div className="bank-card-type">
              {card.card_type || "DEBIT"}
            </div>

            <div className="bank-card-number">
              {card.masked_card_number ||
                "•••• •••• ••••"}
            </div>

            <div className="bank-card-bottom">

              <div>
                <span className="bank-card-label">
                  Cardholder
                </span>

                <span className="bank-card-value">
                  {card.cardholder_name ||
                    "BANK CUSTOMER"}
                </span>
              </div>

              <div>
                <span className="bank-card-label">
                  Expires
                </span>

                <span className="bank-card-value">
                  {card.expiry_date || "--/--"}
                </span>
              </div>

            </div>

          </div>

          {/* =========================
              CARD STATUS
          ========================= */}

          <div
            className={`bank-card-status ${
              String(card.status || "")
                .toLowerCase()
            }`}
          >
            {card.status === "ACTIVE" && (
              <>🟢 Card Is Active</>
            )}

            {card.status === "FROZEN" && (
              <>❄️ Card Is Frozen</>
            )}

            {card.status === "BLOCKED" && (
              <>🚫 Card Is Blocked</>
            )}
          </div>

          {/* =========================
              MESSAGES
          ========================= */}

          {cardError && (
            <div className="error-message">
              {cardError}
            </div>
          )}

          {cardMessage && (
            <div className="success-message">
              {cardMessage}
            </div>
          )}

          {/* =========================
              CARD ACTION
          ========================= */}

          {card.status === "ACTIVE" && (
            <button
              type="button"
              className="service-modal-button"
              onClick={() =>
                handleCardStatus("FROZEN")
              }
              disabled={cardLoading}
            >
              ❄️ Freeze Card
            </button>
          )}

          {card.status === "FROZEN" && (
            <button
              type="button"
              className="service-modal-button"
              onClick={() =>
                handleCardStatus("ACTIVE")
              }
              disabled={cardLoading}
            >
              🔓 Unfreeze Card
            </button>
          )}

          {card.status === "BLOCKED" && (
            <div className="error-message">
              🚫 This Card Has Been Blocked.
            </div>
          )}

        </div>
      )}

      {!cardLoading &&
        !card &&
        !cardError && (
          <div className="bank-form">
            No Card Details Available.
          </div>
        )}

    </div>
  </div>
)}


  {selectedTransaction && (
    <div
      className="transaction-modal-overlay"
      onClick={closeModal}
    >
      <div
        className="transaction-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-details-title"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="transaction-modal-header">

          <div>
            <h2 id="transaction-details-title">
              Transaction Details
            </h2>

            <p>Baseline BANK</p>
          </div>

          <button
            type="button"
            className="transaction-modal-close"
            onClick={closeModal}
            aria-label="Close transaction details"
          >
            ×
          </button>

        </div>

        <div className="transaction-modal-type">
          <span
            className={getAmountClass(
              selectedTransaction
            )}
          >
            {getTransactionLabel(
              selectedTransaction
            )}
          </span>
        </div>

        <div
          className={
            "transaction-modal-amount " +
            getAmountClass(selectedTransaction)
          }
        >
          {getSign(selectedTransaction)}
          {" R "}
          {formatAmount(
            selectedTransaction?.amount
          )}
        </div>

        <div className="transaction-details">

          <div className="transaction-detail-row">
            <span>Transaction ID</span>

            <strong>
              {selectedTransaction?.id ??
                "Unavailable"}
            </strong>
          </div>

          <div className="transaction-detail-row">
            <span>Type</span>

            <strong>
              {getTransactionLabel(
                selectedTransaction
              )}
            </strong>
          </div>

          <div className="transaction-detail-row">
            <span>Account</span>

            <strong>
              {getAccount(selectedTransaction)}
            </strong>
          </div>

          <div className="transaction-detail-row">
            <span>Amount</span>

            <strong
              className={getAmountClass(
                selectedTransaction
              )}
            >
              {getSign(selectedTransaction)}
              {" R "}
              {formatAmount(
                selectedTransaction?.amount
              )}
            </strong>
          </div>

          <div className="transaction-detail-row">
            <span>Date &amp; Time</span>

            <strong>
              {formatDate(
                getTimestamp(selectedTransaction)
              )}
            </strong>
          </div>

          <div className="transaction-detail-row">
            <span>Description</span>

            <strong>
              {getDescription(selectedTransaction)}
            </strong>
          </div>

          {getRecipient(selectedTransaction) && (
            <div className="transaction-detail-row">
              <span>Recipient</span>

              <strong>
                {getRecipient(selectedTransaction)}
              </strong>
            </div>
          )}

          {getType(selectedTransaction).includes(
            "TRANSFER"
          ) && (
            <div className="transaction-detail-row">
              <span>Direction</span>

              <strong>
                {getTransferDirection(
                  selectedTransaction
                ) === "IN"
                  ? "Money Received"
                  : getTransferDirection(
                      selectedTransaction
                    ) === "OUT"
                  ? "Money Sent"
                  : "Internal Transfer"}
              </strong>
            </div>
          )}

          <div className="transaction-detail-row">
            <span>Status</span>

            <strong className="transaction-status">
              Completed
            </strong>
          </div>

        </div>

        <div className="transaction-modal-actions">

          <button
            type="button"
            className="transaction-print-button"
            onClick={printReceipt}
          >
            🖨️ Print Receipt
          </button>

          <button
            type="button"
            className="transaction-modal-button"
            onClick={closeModal}
          >
            Close
          </button>

        </div>
      </div>
    </div>
    )}

    </div>
  </div>
);
}