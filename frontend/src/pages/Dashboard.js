import { useEffect, useMemo, useState } from "react";
import API from "../api";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  // ==========================================
  // ACCOUNT STATE
  // ==========================================

  const [mainBalance, setMainBalance] = useState(0);
  const [savingsBalance, setSavingsBalance] = useState(0);
  const [username, setUsername] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  // ==========================================
  // TRANSACTION / ANALYTICS STATE
  // ==========================================

  const [transactions, setTransactions] = useState([]);

  // ==========================================
  // LOADING / ERROR
  // ==========================================

  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==========================================
  // DEPOSIT / WITHDRAW
  // ==========================================

  const [amount, setAmount] = useState("");
  const [accountType, setAccountType] = useState("main");

  // ==========================================
  // TRANSFER BETWEEN ACCOUNTS
  // ==========================================

  const [transferAmount, setTransferAmount] = useState("");
  const [transferDirection, setTransferDirection] =
    useState("to_savings");

  // ==========================================
  // TRANSFER TO ANOTHER USER
  // ==========================================

  const [recipientUsername, setRecipientUsername] = useState("");
  const [userTransferAmount, setUserTransferAmount] =
    useState("");

  // ==========================================
  // FETCH DASHBOARD
  // ==========================================

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("dashboard/");

      setUsername(response.data.username || "");
      setAccountNumber(response.data.account_number || "");

      setMainBalance(
        Number(response.data.main_balance || 0)
      );

      setSavingsBalance(
        Number(response.data.savings_balance || 0)
      );
    } catch (err) {
      console.error(
        "DASHBOARD ERROR:",
        err?.response?.data || err?.message
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "Unable To Load Account Information."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FETCH TRANSACTIONS
  // ==========================================

  const fetchTransactions = async () => {
    try {
      setAnalyticsLoading(true);

      const response = await API.get("transactions/");
      const data = response.data;

      if (Array.isArray(data)) {
        setTransactions(data);
      } else if (Array.isArray(data?.results)) {
        setTransactions(data.results);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error(
        "TRANSACTIONS ANALYTICS ERROR:",
        err?.response?.data || err?.message
      );

      setTransactions([]);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // ==========================================
  // LOAD DASHBOARD
  // ==========================================

  useEffect(() => {
    fetchDashboard();
    fetchTransactions();
  }, []);

  // ==========================================
  // DEPOSIT
  // ==========================================

  const handleDeposit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!amount || Number(amount) <= 0) {
      setError("Please Enter A Valid Deposit Amount.");
      return;
    }

    try {
      const response = await API.post("deposit/", {
        amount,
        account_type: accountType,
      });

      setMainBalance(
        Number(response.data.main_balance || 0)
      );

      setSavingsBalance(
        Number(response.data.savings_balance || 0)
      );

      setAmount("");
      setMessage("Deposit Successful.");

      await fetchTransactions();
    } catch (err) {
      console.error(
        "DEPOSIT ERROR:",
        err?.response?.data || err?.message
      );

      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          "Deposit Failed."
      );
    }
  };

  // ==========================================
  // WITHDRAW
  // ==========================================

  const handleWithdraw = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!amount || Number(amount) <= 0) {
      setError("Please Enter A Valid Withdrawal Amount.");
      return;
    }

    try {
      const response = await API.post("withdraw/", {
        amount,
        account_type: accountType,
      });

      setMainBalance(
        Number(response.data.main_balance || 0)
      );

      setSavingsBalance(
        Number(response.data.savings_balance || 0)
      );

      setAmount("");
      setMessage("Withdrawal Successful.");

      await fetchTransactions();
    } catch (err) {
      console.error(
        "WITHDRAW ERROR:",
        err?.response?.data || err?.message
      );

      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          "Withdrawal Failed."
      );
    }
  };

  // ==========================================
  // TRANSFER BETWEEN ACCOUNTS
  // ==========================================

  const handleAccountTransfer = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (
      !transferAmount ||
      Number(transferAmount) <= 0
    ) {
      setError("Please Enter A Valid Transfer Amount.");
      return;
    }

    try {
      const response = await API.post("transfer/", {
        amount: transferAmount,
        direction: transferDirection,
      });

      setMainBalance(
        Number(response.data.main_balance || 0)
      );

      setSavingsBalance(
        Number(response.data.savings_balance || 0)
      );

      setTransferAmount("");

      setMessage(
        "Transfer Between Accounts Successful."
      );

      await fetchTransactions();
    } catch (err) {
      console.error(
        "ACCOUNT TRANSFER ERROR:",
        err?.response?.data || err?.message
      );

      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          "Account Transfer Failed."
      );
    }
  };

  // ==========================================
  // TRANSFER TO ANOTHER USER
  // ==========================================

  const handleUserTransfer = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!recipientUsername.trim()) {
      setError(
        "Please Enter The Recipient Username."
      );
      return;
    }

    if (
      !userTransferAmount ||
      Number(userTransferAmount) <= 0
    ) {
      setError(
        "Please Enter A Valid Transfer Amount."
      );
      return;
    }

    try {
      const response = await API.post(
        "transfer-user/",
        {
          username: recipientUsername.trim(),
          amount: userTransferAmount,
        }
      );

      setMainBalance(
        Number(response.data.main_balance || 0)
      );

      setSavingsBalance(
        Number(response.data.savings_balance || 0)
      );

      setRecipientUsername("");
      setUserTransferAmount("");

      setMessage(
        response.data.message ||
          "Money Transferred Successfully."
      );

      await fetchTransactions();
    } catch (err) {
      console.error(
        "USER TRANSFER ERROR:",
        err?.response?.data || err?.message
      );

      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          "Transfer Failed."
      );
    }
  };

  // ==========================================
  // TOTAL BALANCE
  // ==========================================

  const totalBalance =
    Number(mainBalance) +
    Number(savingsBalance);

  // ==========================================
  // FORMAT MONEY
  // ==========================================

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

  // ==========================================
  // TRANSACTION HELPERS
  // ==========================================

  const getTransactionType = (transaction) => {
    return String(
      transaction?.type ||
        transaction?.transaction_type ||
        transaction?.category ||
        ""
    ).toLowerCase();
  };

  const getTransactionDescription = (transaction) => {
    return String(
      transaction?.description ||
        transaction?.narration ||
        transaction?.details ||
        transaction?.label ||
        transaction?.type ||
        ""
    );
  };

  const getTransactionAmount = (transaction) => {
    const possibleAmounts = [
      transaction?.amount,
      transaction?.value,
      transaction?.transaction_amount,
    ];

    for (const value of possibleAmounts) {
      const number = Number(value);

      if (Number.isFinite(number)) {
        return number;
      }
    }

    return 0;
  };

  const getTransactionDate = (transaction) => {
    const possibleDates = [
      transaction?.timestamp,
      transaction?.created_at,
      transaction?.date,
      transaction?.created,
    ];

    for (const value of possibleDates) {
      if (value) {
        const date = new Date(value);

        if (!Number.isNaN(date.getTime())) {
          return date;
        }
      }
    }

    return null;
  };

  // ==========================================
  // INTERNAL ACCOUNT TRANSFER
  // ==========================================

  const isTransferBetweenAccounts = (transaction) => {
    const type = getTransactionType(transaction);

    const description =
      getTransactionDescription(
        transaction
      ).toLowerCase();

    if (type !== "transfer") {
      return false;
    }

    return (
      description.includes("main → savings") ||
      description.includes("savings → main") ||
      description.includes("main to savings") ||
      description.includes("savings to main")
    );
  };

  // ==========================================
  // INCOME DETECTION
  // ==========================================

  const isIncomeTransaction = (transaction) => {
    const type = getTransactionType(transaction);

    const description =
      getTransactionDescription(
        transaction
      ).toLowerCase();

    if (type === "deposit") {
      return true;
    }

    if (
      type === "transfer" &&
      description.includes("transfer from") &&
      !isTransferBetweenAccounts(transaction)
    ) {
      return true;
    }

    return false;
  };

  // ==========================================
  // EXPENSE DETECTION
  // ==========================================

  const isExpenseTransaction = (transaction) => {
    const type = getTransactionType(transaction);

    const description =
      getTransactionDescription(
        transaction
      ).toLowerCase();

    // Ignore internal account transfers
    if (
      isTransferBetweenAccounts(transaction)
    ) {
      return false;
    }

    // Money received from another user
    if (
      type === "transfer" &&
      description.includes("transfer from")
    ) {
      return false;
    }

    // Money sent to another user
    if (
      type === "transfer" &&
      description.includes("transfer to")
    ) {
      return true;
    }

    // PayShap
    if (
      type === "payshap" ||
      type === "payshap_payment"
    ) {
      return true;
    }

    return [
      "withdraw",
      "airtime",
      "electricity",
      "bill_payment",
      "bill",
    ].includes(type);
  };

  // ==========================================
  // SPENDING CATEGORY
  // ==========================================

  const getSpendingCategory = (transaction) => {
    const type = getTransactionType(transaction);

    if (type === "airtime") {
      return "Airtime & Data";
    }

    if (type === "electricity") {
      return "Electricity";
    }

    if (
      type === "bill_payment" ||
      type === "bill"
    ) {
      return "Bills";
    }

    if (type === "payshap") {
      return "PayShap";
    }

    if (type === "payshap_payment") {
      return "PayShap";
    }

    if (type === "withdraw") {
      return "Cash Withdrawal";
    }

    if (
      type === "transfer" &&
      !isTransferBetweenAccounts(transaction)
    ) {
      return "Transfers";
    }

    return "Other";
  };

  // ==========================================
  // BALANCE GROWTH DATA
  // ==========================================

  const balanceGrowthData = useMemo(() => {
    let runningBalance = 0;

    const sortedTransactions = [...transactions].sort(
      (a, b) => {
        const dateA = getTransactionDate(a);
        const dateB = getTransactionDate(b);

        if (!dateA && !dateB) {
          return 0;
        }

        if (!dateA) {
          return 1;
        }

        if (!dateB) {
          return -1;
        }

        return dateA.getTime() - dateB.getTime();
      }
    );

    const dailyBalances = {};

    sortedTransactions.forEach((transaction) => {
      const amount = Math.abs(
        getTransactionAmount(transaction)
      );

      const type = getTransactionType(transaction);

      const description =
        getTransactionDescription(
          transaction
        ).toLowerCase();

      // Internal transfers do not change
      // total balance.
      if (
        type === "transfer" &&
        isTransferBetweenAccounts(transaction)
      ) {
        // Do nothing.
      }

      // Money coming into the account
      else if (
        type === "deposit" ||
        (
          type === "transfer" &&
          description.includes("transfer from")
        )
      ) {
        runningBalance += amount;
      }

      // Money leaving the account
      else if (
        type === "withdraw" ||
        type === "airtime" ||
        type === "electricity" ||
        type === "bill_payment" ||
        type === "bill" ||
        type === "payshap" ||
        type === "payshap_payment" ||
        (
          type === "transfer" &&
          description.includes("transfer to")
        )
      ) {
        runningBalance -= amount;
      }

      const date = getTransactionDate(transaction);

      if (!date) {
        return;
      }

      const dateKey = [
        date.getFullYear(),
        String(
          date.getMonth() + 1
        ).padStart(2, "0"),
        String(
          date.getDate()
        ).padStart(2, "0"),
      ].join("-");

      dailyBalances[dateKey] = {
        date: dateKey,

        label: date.toLocaleDateString(
          "en-ZA",
          {
            day: "2-digit",
            month: "short",
          }
        ),

        balance: Math.max(
          0,
          runningBalance
        ),

        timestamp: date.getTime(),
      };
    });

    return Object.values(dailyBalances)
      .sort(
        (a, b) =>
          a.timestamp - b.timestamp
      )
      .map((item) => ({
        date: item.label,
        balance: item.balance,
      }));
  }, [transactions]);

  // ==========================================
  // ANALYTICS
  // ==========================================

  const analytics = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;

    const categoryTotals = {};

    transactions.forEach((transaction) => {
      const amount = Math.abs(
        getTransactionAmount(transaction)
      );

      const type = getTransactionType(transaction);

      const description =
        getTransactionDescription(
          transaction
        ).toLowerCase();

      const internalTransfer =
        type === "transfer" &&
        (
          description.includes(
            "main → savings"
          ) ||
          description.includes(
            "savings → main"
          ) ||
          description.includes(
            "main to savings"
          ) ||
          description.includes(
            "savings to main"
          )
        );

      if (
        type === "deposit" ||
        (
          type === "transfer" &&
          description.includes(
            "transfer from"
          ) &&
          !internalTransfer
        )
      ) {
        totalIncome += amount;
      }

      if (
        !internalTransfer &&
        (
          type === "withdraw" ||
          type === "airtime" ||
          type === "electricity" ||
          type === "bill_payment" ||
          type === "bill" ||
          type === "payshap" ||
          type === "payshap_payment" ||
          (
            type === "transfer" &&
            description.includes(
              "transfer to"
            )
          )
        )
      ) {
        totalExpenses += amount;

        const category =
          getSpendingCategory(
            transaction
          );

        categoryTotals[category] =
          (
            categoryTotals[category] || 0
          ) + amount;
      }
    });

    const sortedCategories =
      Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({
          name,
          value,
        }));

    return {
      totalIncome,
      totalExpenses,
      categoryTotals: sortedCategories,
    };
  }, [transactions]);

  // ==========================================
  // MONTHLY SPENDING
  // ==========================================

  const monthlySpending = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),

        label: date.toLocaleDateString(
          "en-ZA",
          {
            month: "short",
          }
        ),

        value: 0,
      });
    }

    transactions.forEach((transaction) => {
      if (
        !isExpenseTransaction(transaction)
      ) {
        return;
      }

      const date =
        getTransactionDate(transaction);

      if (!date) {
        return;
      }

      const month = months.find(
        (item) =>
          item.year ===
            date.getFullYear() &&
          item.month ===
            date.getMonth()
      );

      if (month) {
        month.value += Math.abs(
          getTransactionAmount(
            transaction
          )
        );
      }
    });

    return months;
  }, [transactions]);

  const maximumMonthlySpending =
    Math.max(
      ...monthlySpending.map(
        (month) => month.value
      ),
      1
    );

  // ==========================================
  // CURRENT MONTH SPENDING
  // ==========================================

  const currentMonthSpending = useMemo(() => {
    const now = new Date();

    return transactions.reduce(
      (total, transaction) => {
        const date =
          getTransactionDate(
            transaction
          );

        if (!date) {
          return total;
        }

        const sameMonth =
          date.getFullYear() ===
            now.getFullYear() &&
          date.getMonth() ===
            now.getMonth();

        if (
          sameMonth &&
          isExpenseTransaction(
            transaction
          )
        ) {
          return (
            total +
            Math.abs(
              getTransactionAmount(
                transaction
              )
            )
          );
        }

        return total;
      },
      0
    );
  }, [transactions]);

  // ==========================================
  // SAVINGS RATIO
  // ==========================================

  const savingsPercentage =
    totalBalance > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (
              Number(savingsBalance) /
              Number(totalBalance)
            ) * 100
          )
        )
      : 0;

  // ==========================================
  // FINANCIAL INSIGHT
  // ==========================================

  const financialInsight = useMemo(() => {
    if (transactions.length === 0) {
      return "Start Using Your Account To Generate Personal Financial Insights.";
    }

    if (
      currentMonthSpending > 0 &&
      currentMonthSpending >
        Number(totalBalance) * 0.5
    ) {
      return "Your Current Spending Is Relatively High Compared With Your Available Balance. Consider Reviewing Your Recent Transactions.";
    }

    if (savingsPercentage >= 50) {
      return "Great Work! More Than Half Of Your Available Balance Is Currently In Savings.";
    }

    if (savingsPercentage >= 25) {
      return "You're Building A Healthy Savings Balance. Keep Contributing Regularly.";
    }

    if (
      Number(mainBalance) < 200 &&
      Number(savingsBalance) > 0
    ) {
      return "Your Main Account Balance Is Low. Consider Moving Some Funds From Savings If Necessary.";
    }

    if (
      analytics.totalExpenses >
      analytics.totalIncome
    ) {
      return "Your Recorded Expenses Are Higher Than Your Recorded Income. Review Your Spending Activity.";
    }

    return "Your Account Activity Looks Balanced. Keep Monitoring Your Spending And Savings.";
  }, [
    transactions.length,
    currentMonthSpending,
    totalBalance,
    savingsPercentage,
    mainBalance,
    savingsBalance,
    analytics.totalExpenses,
    analytics.totalIncome,
  ]);

  // ==========================================
  // RECENT TRANSACTIONS
  // ==========================================

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        const dateA =
          getTransactionDate(a);

        const dateB =
          getTransactionDate(b);

        if (!dateA && !dateB) {
          return 0;
        }

        if (!dateA) {
          return 1;
        }

        if (!dateB) {
          return -1;
        }

        return (
          dateB.getTime() -
          dateA.getTime()
        );
      })
      .slice(0, 5);
  }, [transactions]);

  // ==========================================
  // FORMAT TRANSACTION DATE
  // ==========================================

  const formatTransactionDate = (
    transaction
  ) => {
    const date =
      getTransactionDate(
        transaction
      );

    if (!date) {
      return "Recent";
    }

    return date.toLocaleDateString(
      "en-ZA",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="dashboard">
      <Navbar />

      <div className="dashboard-container">

        {/* =====================================
            HEADER
        ===================================== */}

        <div className="dashboard-header">
          <div>

            <span className="dashboard-eyebrow">
              BASELINE BANK
            </span>

            <h1>
              👋 Welcome
              {username
                ? `, ${username}`
                : ""}
            </h1>

            <p>
              Manage Your Baseline Bank Account.
            </p>

            {accountNumber && (
  <div className="account-number">

    <span>
      🔢 Account Number:
    </span>

    <strong style={{ marginLeft: "14px" }}>
      {accountNumber}
    </strong>

  </div>
)}

          </div>
        </div>

        {/* =====================================
            LOADING
        ===================================== */}

        {loading && (
          <div className="bank-form">
            Loading Account...
          </div>
        )}

        {/* =====================================
            ERROR
        ===================================== */}

        {!loading && error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* =====================================
            SUCCESS
        ===================================== */}

        {!loading && message && (
          <div className="success-message">
            {message}
          </div>
        )}

        {!loading && (
          <>

            {/* =================================
                ACCOUNT BALANCES
            ================================= */}

            <section className="dashboard-section">

              <div className="section-title">

                <h2>
                  💰 Account Balances
                </h2>

                <p>
                  Your Main, Savings And Total
                  Available Balance.
                </p>

              </div>

              <div className="balance-grid">

                <div className="balance-card">

                  <h3>
                    Main Account
                  </h3>

                  <h2>
                    R {formatMoney(
                      mainBalance
                    )}
                  </h2>

                </div>

                <div className="balance-card">

                  <h3>
                    Savings Account
                  </h3>

                  <h2>
                    R {formatMoney(
                      savingsBalance
                    )}
                  </h2>

                </div>

                <div className="balance-card">

                  <h3>
                    Total Balance
                  </h3>

                  <h2>
                    R {formatMoney(
                      totalBalance
                    )}
                  </h2>

                </div>

              </div>

            </section>

            {/* =================================
                BANKING ACTIONS
            ================================= */}

            <section className="dashboard-section">

              <div className="section-title">

                <h2>
                  💳 Banking Actions
                </h2>

                <p>
                  Manage Your Money And Make
                  Transfers.
                </p>

              </div>

              <div className="banking-actions-grid">

                {/* DEPOSIT / WITHDRAW */}

                <div className="bank-form">

                  <h2>
                    💵 Deposit / Withdraw
                  </h2>

                  <form>

                    <label>
                      Account
                    </label>

                    <select
                      value={accountType}
                      onChange={(e) =>
                        setAccountType(
                          e.target.value
                        )
                      }
                    >

                      <option value="main">
                        Main Account
                      </option>

                      <option value="savings">
                        Savings Account
                      </option>

                    </select>

                    <label>
                      Amount
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter Amount"
                      value={amount}
                      onChange={(e) =>
                        setAmount(
                          e.target.value
                        )
                      }
                    />

                    <div className="form-buttons">

                      <button
                        type="button"
                        onClick={
                          handleDeposit
                        }
                      >
                        Deposit
                      </button>

                      <button
                        type="button"
                        onClick={
                          handleWithdraw
                        }
                      >
                        Withdraw
                      </button>

                    </div>

                  </form>

                </div>

                {/* TRANSFER BETWEEN ACCOUNTS */}

                <div className="bank-form">

                  <h2>
                    🔄 Transfer Between Accounts
                  </h2>

                  <form
                    onSubmit={
                      handleAccountTransfer
                    }
                  >

                    <label>
                      Transfer Direction
                    </label>

                    <select
                      value={
                        transferDirection
                      }
                      onChange={(e) =>
                        setTransferDirection(
                          e.target.value
                        )
                      }
                    >

                      <option value="to_savings">
                        Main → Savings
                      </option>

                      <option value="to_main">
                        Savings → Main
                      </option>

                    </select>

                    <label>
                      Amount
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter Amount"
                      value={
                        transferAmount
                      }
                      onChange={(e) =>
                        setTransferAmount(
                          e.target.value
                        )
                      }
                    />

                    <button type="submit">
                      Transfer Between Accounts
                    </button>

                  </form>

                </div>

                {/* TRANSFER TO ANOTHER USER */}

                <div className="bank-form">

                  <h2>
                    💸 Transfer To Another User
                  </h2>

                  <p>
                    Send Money From Your Main
                    Account To Another Baseline
                    Bank User.
                  </p>

                  <form
                    onSubmit={
                      handleUserTransfer
                    }
                  >

                    <label>
                      Recipient Username
                    </label>

                    <input
                      type="text"
                      placeholder="Enter Username"
                      value={
                        recipientUsername
                      }
                      onChange={(e) =>
                        setRecipientUsername(
                          e.target.value
                        )
                      }
                    />

                    <label>
                      Amount
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter Amount"
                      value={
                        userTransferAmount
                      }
                      onChange={(e) =>
                        setUserTransferAmount(
                          e.target.value
                        )
                      }
                    />

                    <button type="submit">
                      Transfer Money
                    </button>

                  </form>

                </div>

              </div>

            </section>

            {/* =================================
                FINANCIAL ANALYTICS
            ================================= */}

            <section className="dashboard-section analytics-dashboard">

              <div className="section-title">

                <h2>
                  📊 Financial Analytics
                </h2>

                <p>
                  Understand Your Income,
                  Spending And Savings.
                </p>

              </div>

              {/* ANALYTICS SUMMARY */}

              <div className="analytics-grid">

                <div className="analytics-card">

                  <span>
                    Total Income
                  </span>

                  <h2 className="income-value">
                    R{" "}
                    {formatMoney(
                      analytics.totalIncome
                    )}
                  </h2>

                  <small>
                    Recorded Income
                  </small>

                </div>

                <div className="analytics-card">

                  <span>
                    Total Spending
                  </span>

                  <h2 className="expense-value">
                    R{" "}
                    {formatMoney(
                      analytics.totalExpenses
                    )}
                  </h2>

                  <small>
                    Recorded Expenses
                  </small>

                </div>

                <div className="analytics-card">

                  <span>
                    This Month
                  </span>

                  <h2>
                    R{" "}
                    {formatMoney(
                      currentMonthSpending
                    )}
                  </h2>

                  <small>
                    Current Month Spending
                  </small>

                </div>

                <div className="analytics-card">

                  <span>
                    Savings Ratio
                  </span>

                  <h2>
                    {savingsPercentage.toFixed(
                      1
                    )}
                    %
                  </h2>

                  <small>
                    Of Total Balance
                  </small>

                </div>

              </div>

              {/* FINANCIAL INSIGHT */}

              <div className="bank-form analytics-insight">

                <h2>
                  🤖 Financial Insight
                </h2>

                <p>
                  {financialInsight}
                </p>

              </div>

              {/* =================================
                  BALANCE GROWTH
              ================================= */}

              <div className="bank-form">

                <div className="analytics-section-header">

                  <div>

                    <h2>
                      📈 Balance Growth
                    </h2>

                    <p>
                      Track How Your Total Balance
                      Has Changed Over Time.
                    </p>

                  </div>

                  {analyticsLoading && (
                    <span>
                      Updating...
                    </span>
                  )}

                </div>

                {balanceGrowthData.length === 0 ? (

                  <div className="empty-analytics">
                    No Balance Growth Data
                    Available Yet.
                  </div>

                ) : (

                  <div className="smooth-balance-chart">

                    <svg
                      viewBox="0 0 1000 350"
                      preserveAspectRatio="none"
                      className="balance-line-svg"
                    >

                      <defs>

                        <linearGradient
                          id="balanceGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >

                          <stop
                            offset="0%"
                            stopOpacity="0.35"
                          />

                          <stop
                            offset="100%"
                            stopOpacity="0"
                          />

                        </linearGradient>

                      </defs>

                      {(() => {

                        const data =
                          balanceGrowthData;

                        const width = 1000;
                        const height = 350;

                        const paddingLeft = 70;
                        const paddingRight = 30;
                        const paddingTop = 30;
                        const paddingBottom = 55;

                        const chartWidth =
                          width -
                          paddingLeft -
                          paddingRight;

                        const chartHeight =
                          height -
                          paddingTop -
                          paddingBottom;

                        const maxBalance =
                          Math.max(
                            ...data.map(
                              (item) =>
                                Number(
                                  item.balance
                                ) || 0
                            ),
                            1
                          );

                        const points =
                          data.map(
                            (
                              item,
                              index
                            ) => {

                              const x =
                                data.length === 1
                                  ? paddingLeft +
                                    chartWidth /
                                      2
                                  : paddingLeft +
                                    (
                                      index /
                                      (
                                        data.length -
                                        1
                                      )
                                    ) *
                                      chartWidth;

                              const y =
                                paddingTop +
                                chartHeight -
                                (
                                  (
                                    Number(
                                      item.balance
                                    ) || 0
                                  ) /
                                  maxBalance
                                ) *
                                  chartHeight;

                              return {
                                ...item,
                                x,
                                y,
                              };
                            }
                          );

                        const linePath =
                          points.length > 0
                            ? points
                                .map(
                                  (
                                    point,
                                    index
                                  ) =>
                                    `${
                                      index === 0
                                        ? "M"
                                        : "L"
                                    } ${
                                      point.x
                                    } ${
                                      point.y
                                    }`
                                )
                                .join(" ")
                            : "";

                        const areaPath =
                          points.length > 0
                            ? `${linePath}
                               L ${
                                 points[
                                   points.length - 1
                                 ].x
                               }
                               ${
                                 paddingTop +
                                 chartHeight
                               }
                               L ${
                                 points[0].x
                               }
                               ${
                                 paddingTop +
                                 chartHeight
                               }
                               Z`
                            : "";

                        return (
                          <>
                            {/* GRID LINES */}

                            {[0, 25, 50, 75, 100].map(
                              (
                                percentage
                              ) => {

                                const y =
                                  paddingTop +
                                  chartHeight -
                                  (
                                    percentage /
                                    100
                                  ) *
                                    chartHeight;

                                const value =
                                  (
                                    percentage /
                                    100
                                  ) *
                                  maxBalance;

                                return (
                                  <g
                                    key={
                                      percentage
                                    }
                                  >

                                    <line
                                      x1={
                                        paddingLeft
                                      }
                                      y1={y}
                                      x2={
                                        width -
                                        paddingRight
                                      }
                                      y2={y}
                                      stroke="currentColor"
                                      strokeOpacity="0.12"
                                      strokeDasharray="5 5"
                                    />

                                    <text
                                      x={
                                        paddingLeft -
                                        10
                                      }
                                      y={
                                        y + 4
                                      }
                                      textAnchor="end"
                                      fontSize="12"
                                      fill="currentColor"
                                      opacity="0.65"
                                    >
                                      R{" "}
                                      {formatMoney(
                                        value
                                      )}
                                    </text>

                                  </g>
                                );
                              }
                            )}

                            {/* AREA */}

                            <path
                              d={areaPath}
                              fill="url(#balanceGradient)"
                              opacity="0.8"
                            />

                            {/* LINE */}

                            <path
                              d={linePath}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            {/* POINTS */}

                            {points.map(
                              (
                                point,
                                index
                              ) => (
                                <g
                                  key={`${point.date}-${index}`}
                                >

                                  <circle
                                    cx={
                                      point.x
                                    }
                                    cy={
                                      point.y
                                    }
                                    r="6"
                                    fill="currentColor"
                                    stroke="var(--card-bg, white)"
                                    strokeWidth="3"
                                  />

                                  <text
                                    x={
                                      point.x
                                    }
                                    y={
                                      height -
                                      25
                                    }
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="currentColor"
                                    opacity="0.7"
                                  >
                                    {
                                      point.date
                                    }
                                  </text>

                                </g>
                              )
                            )}

                          </>
                        );

                      })()}

                    </svg>

                  </div>

                )}

              </div>

              {/* =================================
                  MONTHLY SPENDING
              ================================= */}

              <div className="bank-form">

                <div className="analytics-section-header">

                  <div>

                    <h2>
                      📈 Monthly Spending
                    </h2>

                    <p>
                      Your Spending Over The
                      Last 6 Months.
                    </p>

                  </div>

                  {analyticsLoading && (
                    <span>
                      Updating...
                    </span>
                  )}

                </div>

                <div className="monthly-chart">

                  {monthlySpending.map(
                    (month) => {

                      const height =
                        month.value > 0
                          ? Math.max(
                              8,
                              (
                                month.value /
                                maximumMonthlySpending
                              ) *
                                100
                            )
                          : 4;

                      return (
                        <div
                          className="chart-column"
                          key={`${month.year}-${month.month}`}
                        >

                          <div className="chart-value">
                            {month.value > 0
                              ? `R ${formatMoney(
                                  month.value
                                )}`
                              : "R 0.00"}
                          </div>

                          <div className="chart-bar-container">

                            <div
                              className="chart-bar"
                              style={{
                                height:
                                  `${height}%`,
                              }}
                              title={`${month.label}: R ${formatMoney(
                                month.value
                              )}`}
                            />

                          </div>

                          <strong>
                            {month.label}
                          </strong>

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

              {/* =================================
                  SPENDING BY CATEGORY
              ================================= */}

              <div className="bank-form">

                <h2>
                  📊 Spending By Category
                </h2>

                <p>
                  See Where Your Money Is Going.
                </p>

                {analytics.categoryTotals
                  .length === 0 ? (

                  <div className="empty-analytics">
                    No Spending Data Available
                    Yet.
                  </div>

                ) : (

                  <div className="category-list">

                    {analytics.categoryTotals.map(
                      (category) => {

                        const percentage =
                          analytics.totalExpenses >
                          0
                            ? (
                                category.value /
                                analytics.totalExpenses
                              ) * 100
                            : 0;

                        return (
                          <div
                            className="category-row"
                            key={
                              category.name
                            }
                          >

                            <div className="category-header">

                              <strong>
                                {
                                  category.name
                                }
                              </strong>

                              <span>
                                R{" "}
                                {formatMoney(
                                  category.value
                                )}
                              </span>

                            </div>

                            <div className="category-progress">

                              <div
                                className="category-progress-fill"
                                style={{
                                  width:
                                    `${percentage}%`,
                                }}
                              />

                            </div>

                            <small>
                              {percentage.toFixed(
                                1
                              )}
                              % Of Total Spending
                            </small>

                          </div>
                        );
                      }
                    )}

                  </div>

                )}

              </div>

              {/* =================================
                  RECENT TRANSACTIONS
              ================================= */}

              <div className="bank-form">

                <div className="analytics-section-header">

                  <div>

                    <h2>
                      🧾 Recent Transactions
                    </h2>

                    <p>
                      Your Latest Account Activity.
                    </p>

                  </div>

                </div>

                {recentTransactions.length ===
                0 ? (

                  <div className="empty-analytics">
                    No Transactions Available
                    Yet.
                  </div>

                ) : (

                  <div className="recent-transactions">

                    {recentTransactions.map(
                      (
                        transaction,
                        index
                      ) => {

                        const amount =
                          getTransactionAmount(
                            transaction
                          );

                        const income =
                          isIncomeTransaction(
                            transaction
                          );

                        const expense =
                          isExpenseTransaction(
                            transaction
                          );

                        return (
                          <div
                            className="recent-transaction"
                            key={
                              transaction.id ||
                              transaction.reference ||
                              index
                            }
                          >

                            <div className="recent-transaction-info">

                              <strong>
                                {getTransactionDescription(
                                  transaction
                                ) ||
                                  "Transaction"}
                              </strong>

                              <small>
                                {formatTransactionDate(
                                  transaction
                                )}
                              </small>

                            </div>

                            <strong
                              className={
                                expense
                                  ? "transaction-expense"
                                  : income
                                    ? "transaction-income"
                                    : ""
                              }
                            >
                              {expense
                                ? "-"
                                : income
                                  ? "+"
                                  : ""}
                              R{" "}
                              {formatMoney(
                                Math.abs(
                                  amount
                                )
                              )}
                            </strong>

                          </div>
                        );
                      }
                    )}

                  </div>

                )}

              </div>

            </section>

          </>
        )}

      </div>
    </div>
  );
}