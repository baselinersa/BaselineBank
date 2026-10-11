import { useEffect, useRef, useState } from "react";

import API from "../api";

import Navbar from "../components/Navbar";

export default function AIAssistant() {
  // =========================================================
  // STATE
  // =========================================================

  const [mainBalance, setMainBalance] = useState(0);
  const [savingsBalance, setSavingsBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text:
        "Hello! 👋 I'm Your Baseline Bank AI Assistant. Ask Me About Your Balance, Savings, Spending, Income, Transactions, Transfers, Deposits, Withdrawals, Beneficiaries, Airtime, Electricity, Bills, Or Your Financial Health.",
    },
  ]);

  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
const [speechSupported, setSpeechSupported] = useState(true);

const recognitionRef = useRef(null);

  const [pendingTransfer, setPendingTransfer] = useState(null);
  const [pendingDeposit, setPendingDeposit] = useState(null);
  const [pendingWithdrawal, setPendingWithdrawal] = useState(null);
  const [pendingInterAccountTransfer, setPendingInterAccountTransfer] =
    useState(null);

  // =========================================================
  // PAYMENT INFORMATION
  // =========================================================

  const [pendingAirtime, setPendingAirtime] = useState(null);
  const [pendingElectricity, setPendingElectricity] = useState(null);
  const [pendingBill, setPendingBill] = useState(null);

  // =========================================================
  // FORMAT MONEY
  // =========================================================

  const formatMoney = (amount) => {
    const number = Number(amount || 0);

    if (!Number.isFinite(number)) {
      return "0.00";
    }

    return number.toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatTransactionDate = (transaction) => {
    const dateValue =
      transaction?.timestamp ??
      transaction?.created_at ??
      transaction?.createdAt ??
      transaction?.date;

    if (!dateValue) {
      return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString("en-ZA", {
      timeZone: "Africa/Johannesburg",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // FETCH BANK DATA
  // =========================================================

  const fetchBankData = async () => {
    try {
      const [
        dashboardResponse,
        transactionsResponse,
        beneficiariesResponse,
      ] = await Promise.all([
        API.get("dashboard/"),
        API.get("transactions/"),
        API.get("beneficiaries/"),
      ]);

      const dashboardData = dashboardResponse.data || {};

      console.log("AI DASHBOARD DATA:", dashboardData);

      const newMainBalance = Number(
        dashboardData.main_balance ??
          dashboardData.account?.main_balance ??
          0
      );

      const newSavingsBalance = Number(
        dashboardData.savings_balance ??
          dashboardData.account?.savings_balance ??
          0
      );

      setMainBalance(
        Number.isFinite(newMainBalance)
          ? newMainBalance
          : 0
      );

      setSavingsBalance(
        Number.isFinite(newSavingsBalance)
          ? newSavingsBalance
          : 0
      );

      const transactionData = transactionsResponse.data;

      if (Array.isArray(transactionData)) {
        setTransactions(transactionData);
      } else if (Array.isArray(transactionData?.results)) {
        setTransactions(transactionData.results);
      } else {
        setTransactions([]);
      }

      const beneficiaryData = beneficiariesResponse.data;

      if (Array.isArray(beneficiaryData)) {
        setBeneficiaries(beneficiaryData);
      } else if (Array.isArray(beneficiaryData?.results)) {
        setBeneficiaries(beneficiaryData.results);
      } else {
        setBeneficiaries([]);
      }
    } catch (error) {
      console.error(
        "AI BANK DATA ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );
    }
  };


  useEffect(() => {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    setSpeechSupported(false);
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = false;

  // South African English
  recognition.lang = "en-ZA";

  recognition.onstart = () => {
    setIsListening(true);
  };

  recognition.onresult = (event) => {
    const transcript =
      event.results?.[0]?.[0]?.transcript || "";

    if (transcript.trim()) {
      setInput(transcript.trim());
    }
  };

  recognition.onerror = (event) => {
    console.error("VOICE INPUT ERROR:", event.error);
    setIsListening(false);
  };

  recognition.onend = () => {
    setIsListening(false);
  };

  recognitionRef.current = recognition;

  return () => {
    try {
      recognition.stop();
    } catch (error) {
      // Recognition may already be stopped.
    }

    recognitionRef.current = null;
  };
}, []);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchBankData();
  }, []);

  // =========================================================
  // AMOUNT EXTRACTION
  // =========================================================

    const extractAmount = (text) => {
    if (!text) {
      return null;
    }

    const normalized = String(text)
      .toLowerCase()
      .replace(/,/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const match = normalized.match(
      /\br?\s*(\d+(?:\.\d+)?)\s*(k)?\b/i
    );

    if (!match) {
      return null;
    }

    const number = Number(match[1]);

    if (!Number.isFinite(number)) {
      return null;
    }

    let amount = number;

    if (
      match[2] &&
      match[2].toLowerCase() === "k"
    ) {
      amount = number * 1000;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return null;
    }

    return amount;
  };

  // =========================================================
  // TRANSACTION HELPERS
  // =========================================================

  const getTransactionAmount = (transaction) => {
    const amount = Number(
      transaction?.amount ??
        transaction?.value ??
        transaction?.transaction_amount ??
        0
    );

    return Number.isFinite(amount)
      ? amount
      : 0;
  };

  const getTransactionType = (transaction) => {
    return String(
      transaction?.transaction_type ??
        transaction?.type ??
        transaction?.category ??
        ""
    ).toLowerCase();
  };

  const getTransactionDescription = (transaction) => {
    return String(
      transaction?.description ??
        transaction?.details ??
        transaction?.narration ??
        transaction?.merchant ??
        transaction?.recipient ??
        ""
    );
  };

  const getTransactionAccount = (transaction) => {
    return String(
      transaction?.account_type ??
        transaction?.accountType ??
        transaction?.account ??
        ""
    ).toLowerCase();
  };

  // =========================================================
  // INTERNAL TRANSFERS
  // =========================================================

  const isInternalTransfer = (transaction) => {
    const description =
      getTransactionDescription(transaction)
        .toLowerCase();

    const type =
      getTransactionType(transaction);

    return (
      description.includes("savings → main") ||
      description.includes("main → savings") ||
      description.includes("savings to main") ||
      description.includes("main to savings") ||
      description.includes("transfer between accounts") ||
      description.includes("internal transfer") ||
      (
        type.includes("transfer") &&
        (
          description.includes("savings") ||
          description.includes("main account")
        )
      )
    );
  };

  // =========================================================
  // EXPENSE / INCOME DETECTION
  // =========================================================

  const isExpenseTransaction = (transaction) => {
    const type =
      getTransactionType(transaction);

    return (
      type.includes("withdraw") ||
      type.includes("transfer") ||
      type.includes("payment") ||
      type.includes("purchase") ||
      type.includes("debit") ||
      type.includes("expense") ||
      type.includes("airtime") ||
      type.includes("electricity") ||
      type.includes("bill")
    );
  };

  const isIncomeTransaction = (transaction) => {
    const type =
      getTransactionType(transaction);

    return (
      type.includes("deposit") ||
      type.includes("credit") ||
      type.includes("income")
    );
  };

  // =========================================================
  // SPENDING CALCULATIONS
  // =========================================================

  const getCurrentMonthSpending = () => {
    if (!Array.isArray(transactions)) {
      return 0;
    }

    const now = new Date();

    return transactions.reduce(
      (total, transaction) => {
        const dateValue =
          transaction?.timestamp ??
          transaction?.created_at ??
          transaction?.createdAt ??
          transaction?.date;

        if (!dateValue) {
          return total;
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
          return total;
        }

        if (
          date.getMonth() !== now.getMonth() ||
          date.getFullYear() !== now.getFullYear()
        ) {
          return total;
        }

        if (
          !isExpenseTransaction(transaction) ||
          isInternalTransfer(transaction)
        ) {
          return total;
        }

        return (
          total +
          getTransactionAmount(transaction)
        );
      },
      0
    );
  };

  const getPreviousMonthSpending = () => {
    if (!Array.isArray(transactions)) {
      return 0;
    }

    const now = new Date();

    let month = now.getMonth() - 1;
    let year = now.getFullYear();

    if (month < 0) {
      month = 11;
      year -= 1;
    }

    return transactions.reduce(
      (total, transaction) => {
        const dateValue =
          transaction?.timestamp ??
          transaction?.created_at ??
          transaction?.createdAt ??
          transaction?.date;

        if (!dateValue) {
          return total;
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
          return total;
        }

        if (
          date.getMonth() !== month ||
          date.getFullYear() !== year
        ) {
          return total;
        }

        if (
          !isExpenseTransaction(transaction) ||
          isInternalTransfer(transaction)
        ) {
          return total;
        }

        return (
          total +
          getTransactionAmount(transaction)
        );
      },
      0
    );
  };

  const getTotalSpending = () => {
    if (!Array.isArray(transactions)) {
      return 0;
    }

    return transactions.reduce(
      (total, transaction) => {
        if (
          !isExpenseTransaction(transaction) ||
          isInternalTransfer(transaction)
        ) {
          return total;
        }

        return (
          total +
          getTransactionAmount(transaction)
        );
      },
      0
    );
  };

  const getTotalIncome = () => {
    if (!Array.isArray(transactions)) {
      return 0;
    }

    return transactions.reduce(
      (total, transaction) => {
        if (!isIncomeTransaction(transaction)) {
          return total;
        }

        return (
          total +
          getTransactionAmount(transaction)
        );
      },
      0
    );
  };

  const getBiggestExpense = () => {
    if (
      !Array.isArray(transactions) ||
      transactions.length === 0
    ) {
      return null;
    }

    const expenses =
      transactions.filter(
        (transaction) =>
          isExpenseTransaction(transaction) &&
          !isInternalTransfer(transaction) &&
          getTransactionAmount(transaction) > 0
      );

    if (expenses.length === 0) {
      return null;
    }

    return expenses.reduce(
      (largest, current) =>
        getTransactionAmount(current) >
        getTransactionAmount(largest)
          ? current
          : largest,
      expenses[0]
    );
  };

  // =========================================================
  // AFFORDABILITY
  // =========================================================

  const isAffordabilityCommand = (text) => {
    const normalized =
      text.trim().toLowerCase();

    return (
      normalized.includes("can i afford") ||
      normalized.includes("can i spend") ||
      normalized.includes("will i have enough") ||
      normalized.includes("do i have enough") ||
      normalized.includes("can i pay for")
    );
  };

  const getAffordabilityResponse = (text) => {
    const amount = extractAmount(text);

    if (!amount) {
      return (
        "💰 Please Tell Me The Amount You Want To Spend. " +
        "For Example: Can I Afford R1,000?"
      );
    }

    const availableBalance =
      Number(mainBalance || 0);

    const remainingBalance =
      availableBalance - amount;

    if (amount <= availableBalance) {
      return (
        `✅ Yes, You Can Afford To Spend R ${formatMoney(
          amount
        )} From Your Main Account.\n\n` +
        `💳 Current Balance: R ${formatMoney(
          availableBalance
        )}\n` +
        `💸 After Spending: R ${formatMoney(
          remainingBalance
        )}\n\n` +
        `You Would Have R ${formatMoney(
          remainingBalance
        )} Remaining.`
      );
    }

    const shortfall =
      amount - availableBalance;

    return (
      `❌ You Cannot Afford To Spend R ${formatMoney(
        amount
      )} From Your Main Account Right Now.\n\n` +
      `💳 Current Balance: R ${formatMoney(
        availableBalance
      )}\n` +
      `💸 Required: R ${formatMoney(amount)}\n` +
      `⚠️ Short By: R ${formatMoney(
        shortfall
      )}.`
    );
  };

  // =========================================================
  // SPENDING CATEGORIES
  // =========================================================

  const getSpendingCategory = (transaction) => {
    const type =
      getTransactionType(transaction);

    const description =
      getTransactionDescription(transaction)
        .toLowerCase();

    if (
      description.includes("airtime") ||
      type.includes("airtime")
    ) {
      return "Airtime";
    }

    if (
      description.includes("electricity") ||
      description.includes("eskom") ||
      type.includes("electricity")
    ) {
      return "Electricity";
    }

    if (
      description.includes("bill") ||
      type.includes("bill")
    ) {
      return "Bills";
    }

    if (
      description.includes("food") ||
      description.includes("restaurant") ||
      description.includes("takeaway") ||
      description.includes("groceries")
    ) {
      return "Food";
    }

    if (
      description.includes("shopping") ||
      description.includes("clothing") ||
      description.includes("mall")
    ) {
      return "Shopping";
    }

    if (
      description.includes("transfer") ||
      type.includes("transfer")
    ) {
      return "Transfers";
    }

    if (
      description.includes("withdraw") ||
      type.includes("withdraw")
    ) {
      return "Cash Withdrawals";
    }

    if (
      description.includes("payment") ||
      type.includes("payment")
    ) {
      return "Payments";
    }

    return "Other";
  };

  const getSpendingCategories = () => {
    const categories = {};

    if (!Array.isArray(transactions)) {
      return categories;
    }

    transactions
      .filter(isExpenseTransaction)
      .filter(
        (transaction) =>
          !isInternalTransfer(transaction)
      )
      .forEach((transaction) => {
        const category =
          getSpendingCategory(transaction);

        const amount =
          getTransactionAmount(transaction);

        if (!categories[category]) {
          categories[category] = 0;
        }

        categories[category] += amount;
      });

    return categories;
  };

  const getBiggestSpendingCategory = () => {
    const categories =
      getSpendingCategories();

    const entries =
      Object.entries(categories);

    if (!entries.length) {
      return null;
    }

    entries.sort(
      (a, b) => b[1] - a[1]
    );

    return {
      category: entries[0][0],
      amount: entries[0][1],
      categories,
    };
  };

  // =========================================================
  // SPENDING CATEGORY INTENT
  // =========================================================

  const isSpendingCategoryCommand = (text) => {
    const normalized =
      text.trim().toLowerCase();

    return (
      normalized.includes("where am i spending") ||
      normalized.includes("what do i spend the most") ||
      normalized.includes("what am i spending the most") ||
      normalized.includes("biggest spending category") ||
      normalized.includes("largest spending category") ||
      normalized.includes("where does my money go") ||
      normalized.includes("what category do i spend the most") ||
      normalized.includes("what do i spend most on") ||
      normalized.includes("what am i spending most on")
    );
  };

  const getSpendingCategoryResponse = () => {
    const result =
      getBiggestSpendingCategory();

    if (!result) {
      return (
        "📊 I Don't Have Enough Spending Data Yet " +
        "To Identify Your Biggest Spending Category."
      );
    }

    const categoryLines =
      Object.entries(result.categories)
        .sort((a, b) => b[1] - a[1])
        .map(
          ([category, amount]) =>
            `• ${category}: R ${formatMoney(
              amount
            )}`
        )
        .join("\n");

    return (
      `📊 Your Biggest Spending Category Is ${result.category} ` +
      `At R ${formatMoney(
        result.amount
      )}.\n\n` +
      `Here Is Your Spending Breakdown:\n\n` +
      categoryLines
    );
  };

  // =========================================================
  // SPECIFIC CATEGORY SPENDING
  // =========================================================

  const getCategoryFromText = (text) => {
    const normalized =
      text.trim().toLowerCase();

    if (normalized.includes("airtime")) {
      return "Airtime";
    }

    if (
      normalized.includes("electricity") ||
      normalized.includes("eskom")
    ) {
      return "Electricity";
    }

    if (
      normalized.includes("bills") ||
      normalized.includes("bill")
    ) {
      return "Bills";
    }

    if (
      normalized.includes("food") ||
      normalized.includes("groceries") ||
      normalized.includes("restaurant") ||
      normalized.includes("takeaway")
    ) {
      return "Food";
    }

    if (
      normalized.includes("shopping") ||
      normalized.includes("clothing") ||
      normalized.includes("mall")
    ) {
      return "Shopping";
    }

    if (
      normalized.includes("withdrawal") ||
      normalized.includes("withdrawals") ||
      normalized.includes("cash")
    ) {
      return "Cash Withdrawals";
    }

    if (
      normalized.includes("payment") ||
      normalized.includes("payments")
    ) {
      return "Payments";
    }

    if (
      normalized.includes("transfer") ||
      normalized.includes("transfers")
    ) {
      return "Transfers";
    }

    return null;
  };

  const isSpecificCategoryCommand = (text) => {
    const normalized =
      text.trim().toLowerCase();

    const category =
      getCategoryFromText(text);

    if (!category) {
      return false;
    }

    return (
      normalized.includes("how much") ||
      normalized.includes("how much did") ||
      normalized.includes("how much have") ||
      normalized.includes("what did i spend") ||
      normalized.includes("spend on") ||
      normalized.includes("spent on") ||
      normalized.includes("spending on") ||
      normalized.includes("transactions for") ||
      normalized.includes("transactions on") ||
      normalized.includes("show my")
    );
  };

  const getSpecificCategoryResponse = (text) => {
    const category =
      getCategoryFromText(text);

    if (!category) {
      return null;
    }

    const matchingTransactions =
      transactions.filter(
        (transaction) =>
          isExpenseTransaction(transaction) &&
          !isInternalTransfer(transaction) &&
          getSpendingCategory(transaction) ===
            category
      );

    const total =
      matchingTransactions.reduce(
        (sum, transaction) =>
          sum +
          getTransactionAmount(transaction),
        0
      );

    if (!matchingTransactions.length) {
      return (
        `📊 I Couldn't Find Any Recorded ${category} Spending Yet.`
      );
    }

    return (
      `💸 You Have Spent R ${formatMoney(
        total
      )} On ${category}.\n\n` +
      `📋 Matching Transactions: ${matchingTransactions.length}`
    );
  };

  // =========================================================
  // FINANCIAL HEALTH
  // =========================================================

  const isFinancialHealthCommand = (text) => {
    const normalized =
      text.trim().toLowerCase();

    return (
      normalized.includes("how am i doing financially") ||
      normalized.includes("how am i doing with my money") ||
      normalized.includes("financial health") ||
      normalized.includes("financial checkup") ||
      normalized.includes("money checkup") ||
      normalized.includes("managing my money") ||
      normalized.includes("am i managing my money") ||
      normalized.includes("financial situation") ||
      normalized.includes("financial score")
    );
  };

  const getFinancialHealthResponse = () => {
    const main =
      Number(mainBalance || 0);

    const savings =
      Number(savingsBalance || 0);

    const total =
      main + savings;

    const spending =
      getTotalSpending();

    const income =
      getTotalIncome();

    const savingsPercentage =
      total > 0
        ? (savings / total) * 100
        : 0;

    let score = 50;

    if (total > 0) {
      score += 15;
    }

    if (savings > 0) {
      score += 10;
    }

    if (savingsPercentage >= 20) {
      score += 15;
    } else if (savingsPercentage >= 10) {
      score += 8;
    }

    if (income > spending) {
      score += 10;
    } else if (
      spending > income &&
      income > 0
    ) {
      score -= 10;
    }

    score = Math.max(
      0,
      Math.min(100, score)
    );

    let status =
      "Needs Attention";

    if (score >= 80) {
      status = "Excellent";
    } else if (score >= 65) {
      status = "Good";
    } else if (score >= 50) {
      status = "Fair";
    }

    let recommendation;

    if (savingsPercentage >= 20) {
      recommendation =
        "✅ Your Savings Position Looks Strong.";
    } else if (savings > 0) {
      recommendation =
        "👍 You Have Started Building Savings. " +
        "Increasing It Gradually Could Strengthen " +
        "Your Financial Position.";
    } else {
      recommendation =
        "⚠️ Consider Building An Emergency Savings Buffer.";
    }

    return (
      `🧠 Financial Health: ${status}\n\n` +
      `💳 Main Account: R ${formatMoney(
        main
      )}\n` +
      `🏦 Savings: R ${formatMoney(
        savings
      )}\n` +
      `💰 Total Balance: R ${formatMoney(
        total
      )}\n` +
      `📈 Savings Ratio: ${savingsPercentage.toFixed(
        1
      )}%\n` +
      `💸 Total Spending: R ${formatMoney(
        spending
      )}\n` +
      `💵 Total Income: R ${formatMoney(
        income
      )}\n\n` +
      `⭐ Financial Health Score: ${score}/100\n\n` +
      recommendation
    );
  };

  // =========================================================
  // RECIPIENT EXTRACTION
  // =========================================================

  const extractTransferRecipient = (text) => {
    const normalized =
      text.trim();

    const patterns = [
      /\bto\s+(.+)$/i,
      /\bfor\s+(.+)$/i,
    ];

    for (const pattern of patterns) {
      const match =
        normalized.match(pattern);

      if (match && match[1]) {
        let recipient =
          match[1]
            .trim()
            .replace(/[?.!,]+$/, "");

        recipient =
          recipient
            .replace(
              /\s+(from|using|via)\s+(main|savings?|saving)\b.*$/i,
              ""
            )
            .trim();

        if (recipient) {
          return recipient;
        }
      }
    }

    return null;
  };

  // =========================================================
  // BENEFICIARY LOOKUP
  // =========================================================

  const findBeneficiary = (recipient) => {
    if (
      !recipient ||
      !Array.isArray(beneficiaries)
    ) {
      return null;
    }

    const normalized =
      recipient
        .trim()
        .toLowerCase();

    return (
      beneficiaries.find(
        (beneficiary) => {
          const name =
            String(
              beneficiary?.name ??
                beneficiary?.full_name ??
                beneficiary?.beneficiary_name ??
                ""
            ).toLowerCase();

          const accountNumber =
            String(
              beneficiary?.account_number ??
                beneficiary?.accountNumber ??
                ""
            ).toLowerCase();

          return (
            name === normalized ||
            name.includes(normalized) ||
            normalized.includes(name) ||
            accountNumber === normalized
          );
        }
      ) || null
    );
  };

  // =========================================================
  // BENEFICIARY LIST
  // =========================================================

  const isBeneficiaryListCommand = (text) => {
    const normalized =
      text.trim().toLowerCase();

    return (
      normalized.includes("show my beneficiaries") ||
      normalized.includes("list my beneficiaries") ||
      normalized.includes("my beneficiaries") ||
      normalized.includes("beneficiary list") ||
      normalized.includes("who can i pay") ||
      normalized.includes("who can i transfer to")
    );
  };

  const getBeneficiaryListResponse = () => {
    if (
      !Array.isArray(beneficiaries) ||
      beneficiaries.length === 0
    ) {
      return (
        "👤 You Don't Have Any Beneficiaries Saved Yet."
      );
    }

    const lines =
      beneficiaries
        .map(
          (beneficiary, index) => {
            const name =
              beneficiary?.name ??
              beneficiary?.full_name ??
              beneficiary?.beneficiary_name ??
              `Beneficiary ${index + 1}`;

            const accountNumber =
              beneficiary?.account_number ??
              beneficiary?.accountNumber ??
              "";

            const bank =
              beneficiary?.bank ??
              beneficiary?.bank_name ??
              beneficiary?.bankName ??
              "";

            let line =
              `• ${name}`;

            if (bank) {
              line += ` — ${bank}`;
            }

            if (accountNumber) {
              line += ` — ${accountNumber}`;
            }

            return line;
          }
        )
        .join("\n");

    return (
      `👤 Your Saved Beneficiaries:\n\n${lines}`
    );
  };

  // =========================================================
  // TRANSACTION SEARCH
  // =========================================================

  const isTransactionSearchCommand = (text) => {
    const normalized =
      String(text || "")
        .trim()
        .toLowerCase();

    return (
      normalized.includes("find my") ||
      normalized.includes("find a transaction") ||
      normalized.includes("find transaction") ||
      normalized.includes("search my transactions") ||
      normalized.includes("search transactions") ||
      normalized.includes("show transaction for") ||
      normalized.includes("show transactions for") ||
      normalized.includes("show my transactions") ||
      normalized.includes("show transactions") ||
      normalized.includes("show my transaction") ||
      normalized.includes("transaction with") ||
      normalized.includes("transaction from") ||
      normalized.includes("transaction to") ||
      normalized.includes("find the") ||
      normalized.includes("find r")
    );
  };

  const getTransactionDateRange = (text) => {
    const normalized =
      String(text || "")
        .trim()
        .toLowerCase();

    const now = new Date();

    if (normalized.includes("today")) {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);

      const end = new Date(now);
      end.setHours(23, 59, 59, 999);

      return { start, end };
    }

    if (normalized.includes("yesterday")) {
      const start = new Date(now);

      start.setDate(
        start.getDate() - 1
      );

      start.setHours(0, 0, 0, 0);

      const end = new Date(start);

      end.setHours(23, 59, 59, 999);

      return { start, end };
    }

    if (normalized.includes("this week")) {
      const start = new Date(now);
      const day = start.getDay();

      start.setDate(
        start.getDate() - day
      );

      start.setHours(0, 0, 0, 0);

      const end = new Date(now);

      end.setHours(23, 59, 59, 999);

      return { start, end };
    }

    if (normalized.includes("last week")) {
      const start = new Date(now);
      const day = start.getDay();

      start.setDate(
        start.getDate() - day - 7
      );

      start.setHours(0, 0, 0, 0);

      const end = new Date(start);

      end.setDate(
        end.getDate() + 6
      );

      end.setHours(23, 59, 59, 999);

      return { start, end };
    }

    if (normalized.includes("this month")) {
      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

      const end = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );

      return { start, end };
    }

    if (normalized.includes("last month")) {
      const start = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );

      const end = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
        999
      );

      return { start, end };
    }

    return null;
  };

  // =========================================================
  // TRANSACTION SEARCH ENGINE
  // =========================================================

  const searchTransactions = (text) => {
    if (!Array.isArray(transactions)) {
      return [];
    }

    const normalized =
      String(text || "")
        .trim()
        .toLowerCase();

    const amount =
      extractAmount(text);

    const dateRange =
      getTransactionDateRange(text);

    let searchWords =
      normalized.replace(
        /\b(find my|find a transaction|find transaction|search my transactions|search transactions|show transaction for|show transactions for|show transactions|show transaction|transaction with|transaction from|transaction to|transactions with|transactions from|transactions to)\b/gi,
        ""
      );

    searchWords =
      searchWords
        .replace(
          /\br?\s*\d+(?:\.\d+)?\s*k?\b/gi,
          ""
        )
        .replace(/\s+/g, " ")
        .trim();

    const ignoredWords = [
      "my",
      "the",
      "a",
      "an",
      "for",
      "from",
      "to",
      "with",
      "transaction",
      "transactions",
      "payment",
      "payments",
      "show",
      "find",
      "search",
      "please",
      "me",
      "of",
      "on",
      "in",
      "at",
    ];

    const keywords =
      searchWords
        .split(/\s+/)
        .map((word) => word.trim())
        .filter(
          (word) =>
            word &&
            !ignoredWords.includes(word)
        );

    const results =
      transactions.filter(
        (transaction) => {
          const transactionAmount =
            Math.abs(
              getTransactionAmount(
                transaction
              )
            );

          const description =
            getTransactionDescription(
              transaction
            ).toLowerCase();

          const type =
            getTransactionType(
              transaction
            ).toLowerCase();

          const account =
            getTransactionAccount(
              transaction
            ).toLowerCase();

          const recipient =
            String(
              transaction?.recipient ??
                transaction?.recipient_name ??
                transaction?.beneficiary ??
                transaction?.beneficiary_name ??
                ""
            ).toLowerCase();

          const searchableText = [
            description,
            type,
            account,
            recipient,
          ]
            .join(" ")
            .toLowerCase();

          if (
            amount !== null &&
            Math.abs(
              transactionAmount - amount
            ) >= 0.01
          ) {
            return false;
          }

          if (dateRange) {
            const rawDate =
              transaction?.created_at ??
              transaction?.date ??
              transaction?.timestamp ??
              transaction?.createdAt;

            if (!rawDate) {
              return false;
            }

            const transactionDate =
              new Date(rawDate);

            if (
              Number.isNaN(
                transactionDate.getTime()
              )
            ) {
              return false;
            }

            if (
              transactionDate <
                dateRange.start ||
              transactionDate >
                dateRange.end
            ) {
              return false;
            }
          }

          if (keywords.length === 0) {
            return (
              amount !== null ||
              dateRange !== null
            );
          }

          return keywords.every(
            (keyword) =>
              searchableText.includes(
                keyword
              )
          );
        }
      );

    return results.slice(0, 10);
  };

  const getTransactionSearchResponse = (text) => {
    const results =
      searchTransactions(text);

    if (!results.length) {
      return (
        "🔎 I Couldn't Find A Matching Transaction."
      );
    }

    const lines =
      results
        .map(
          (transaction) => {
            const type =
              getTransactionType(
                transaction
              ) || "Transaction";

            const amount =
              getTransactionAmount(
                transaction
              );

            const description =
              getTransactionDescription(
                transaction
              );

            const account =
              getTransactionAccount(
                transaction
              );

            const date =
              formatTransactionDate(
                transaction
              );

            return (
              `• ${type} — R ${formatMoney(
                amount
              )}` +
              (
                description
                  ? ` — ${description}`
                  : ""
              ) +
              (
                account
                  ? ` — ${account}`
                  : ""
              ) +
              (
                date
                  ? ` — ${date}`
                  : ""
              )
            );
          }
        )
        .join("\n");

    return (
      `🔎 I Found ${results.length} Matching Transaction${
        results.length === 1
          ? ""
          : "s"
      }:\n\n${lines}`
    );
  };

  // =========================================================
  // ACCOUNT TRANSACTION SEARCH
  // =========================================================

  const isAccountTransactionCommand = (text) => {
    const normalized =
      text.trim().toLowerCase();

    const mentionsAccount =
      normalized.includes("main") ||
      normalized.includes("savings") ||
      normalized.includes("saving");

    const mentionsTransaction =
      normalized.includes("transaction") ||
      normalized.includes("transactions") ||
      normalized.includes("spending") ||
      normalized.includes("spent") ||
      normalized.includes("withdrawal") ||
      normalized.includes("deposit");

    return (
      mentionsAccount &&
      mentionsTransaction
    );
  };

  const getAccountTransactionResponse = (text) => {
    const normalized =
      text.trim().toLowerCase();

    const accountType =
      normalized.includes("saving")
        ? "savings"
        : "main";

    const matching =
      transactions.filter(
        (transaction) => {
          const account =
            getTransactionAccount(
              transaction
            );

          return (
            account === accountType ||
            account.includes(accountType)
          );
        }
      );

    if (!matching.length) {
      return (
        `📋 I Couldn't Find Any Transactions Recorded For Your ${
          accountType === "savings"
            ? "Savings"
            : "Main Account"
        }.`
      );
    }

    const lines =
      matching
        .slice(0, 10)
        .map(
          (transaction) => {
            const type =
              getTransactionType(
                transaction
              ) || "Transaction";

            const amount =
              getTransactionAmount(
                transaction
              );

            const description =
              getTransactionDescription(
                transaction
              );

            return (
              `• ${type} — R ${formatMoney(
                amount
              )}` +
              (
                description
                  ? ` — ${description}`
                  : ""
              )
            );
          }
        )
        .join("\n");

    return (
      `📋 Transactions From Your ${
        accountType === "savings"
          ? "Savings"
          : "Main Account"
      }:\n\n${lines}`
    );
  };

  // =========================================================
  // PERSON / RECIPIENT TRANSACTION HISTORY
  // =========================================================

  const isRecipientHistoryCommand = (text) => {
    const normalized =
      text.trim().toLowerCase();

    return (
      normalized.includes("sent to") ||
      normalized.includes("send to") ||
      normalized.includes("transfers to") ||
      normalized.includes("transfer to") ||
      normalized.includes("paid") ||
      normalized.includes("payments to")
    );
  };

  const extractHistoryRecipient = (text) => {
    const normalized =
      text.trim();

    const patterns = [
      /\bsent\s+to\s+(.+)$/i,
      /\bsend\s+to\s+(.+)$/i,
      /\btransfers?\s+to\s+(.+)$/i,
      /\bpaid\s+(.+)$/i,
      /\bpayments?\s+to\s+(.+)$/i,
    ];

    for (const pattern of patterns) {
      const match =
        normalized.match(pattern);

      if (match?.[1]) {
        return match[1]
          .trim()
          .replace(/[?.!,]+$/, "");
      }
    }

    return null;
  };

  const getRecipientHistoryResponse = (text) => {
    const recipient =
      extractHistoryRecipient(text);

    if (!recipient) {
      return (
        "👤 Please Tell Me The Person You Want Me To Look For.\n\n" +
        "For Example: How Much Have I Sent To Amasi?"
      );
    }

    const search =
      recipient.toLowerCase();

    const matching =
      transactions.filter(
        (transaction) => {
          const description =
            getTransactionDescription(
              transaction
            ).toLowerCase();

          const transactionRecipient =
            String(
              transaction?.recipient ??
                transaction?.recipient_name ??
                transaction?.beneficiary ??
                ""
            ).toLowerCase();

          return (
            description.includes(search) ||
            transactionRecipient.includes(search)
          );
        }
      );

    if (!matching.length) {
      return (
        `👤 I Couldn't Find Any Transactions Matching "${recipient}".`
      );
    }

    const total =
      matching.reduce(
        (sum, transaction) =>
          sum +
          getTransactionAmount(
            transaction
          ),
        0
      );

    return (
      `👤 I Found ${matching.length} Transaction${
        matching.length === 1
          ? ""
          : "s"
      } Matching "${recipient}".\n\n` +
      `💸 Total Amount: R ${formatMoney(
        total
      )}\n\n` +
      matching
        .slice(0, 5)
        .map(
          (transaction) =>
            `• R ${formatMoney(
              getTransactionAmount(
                transaction
              )
            )} — ${
              getTransactionDescription(
                transaction
              ) || "Transfer"
            }`
        )
        .join("\n")
    );
  };

  // =========================================================
  // MONTH COMPARISON
  // =========================================================

  const isMonthComparisonCommand = (text) => {
    const normalized =
      text.trim().toLowerCase();

    return (
      normalized.includes("compare this month") ||
      normalized.includes("compared to last month") ||
      normalized.includes("compare my spending") ||
      normalized.includes("spending compared") ||
      normalized.includes("this month vs last month") ||
      normalized.includes("this month versus last month")
    );
  };

  const getMonthComparisonResponse = () => {
    const current =
      getCurrentMonthSpending();

    const previous =
      getPreviousMonthSpending();

    const difference =
      current - previous;

    if (previous === 0) {
      return (
        `📊 This Month: R ${formatMoney(
          current
        )}\n` +
        `📅 Last Month: R 0.00\n\n` +
        `There Isn't Enough Previous-Month Spending Data To Calculate A Meaningful Comparison.`
      );
    }

    const percentage =
      Math.abs(
        difference / previous
      ) * 100;

    if (difference > 0) {
      return (
        `📊 Spending Comparison:\n\n` +
        `📅 This Month: R ${formatMoney(
          current
        )}\n` +
        `📅 Last Month: R ${formatMoney(
          previous
        )}\n\n` +
        `📈 Difference: R ${formatMoney(
          difference
        )}\n` +
        `📊 Change: ${percentage.toFixed(
          1
        )}% Higher Than Last Month.`
      );
    }

    if (difference < 0) {
      return (
        `📊 Spending Comparison:\n\n` +
        `📅 This Month: R ${formatMoney(
          current
        )}\n` +
        `📅 Last Month: R ${formatMoney(
          previous
        )}\n\n` +
        `📉 Difference: R ${formatMoney(
          Math.abs(difference)
        )}\n` +
        `📊 Change: ${percentage.toFixed(
          1
        )}% Lower Than Last Month.`
      );
    }

    return (
      `📊 Your Spending Is The Same As Last Month.\n\n` +
      `This Month: R ${formatMoney(
        current
      )}\n` +
      `Last Month: R ${formatMoney(
        previous
      )}`
    );
  };

  // =========================================================
  // PAYMENT INTENTS
  // =========================================================

  const isAirtimeCommand = (text) => {
    const normalized =
      text.trim().toLowerCase();

    return (
      normalized.includes("airtime") &&
      (
        normalized.includes("buy") ||
        normalized.includes("get") ||
        normalized.includes("need") ||
        normalized.includes("purchase") ||
        normalized.includes("top up") ||
        normalized.includes("topup") ||
        normalized.includes("recharge") ||
        normalized.includes("can you")
      )
    );
  };

  const isElectricityCommand = (text) => {
    const normalized =
      text.trim().toLowerCase();

    return (
      normalized.includes("electricity") &&
      (
        normalized.includes("buy") ||
        normalized.includes("get") ||
        normalized.includes("need") ||
        normalized.includes("purchase") ||
        normalized.includes("pay") ||
        normalized.includes("can you")
      )
    );
  };

  const isBillPaymentCommand = (text) => {
    const normalized =
      text.trim().toLowerCase();

    return (
      (
        normalized.includes("pay my bill") ||
        normalized.includes("pay my bills") ||
        normalized.includes("pay bill") ||
        normalized.includes("pay bills") ||
        normalized.includes("pay a bill") ||
        normalized.includes("need to pay a bill") ||
        normalized.includes("need to pay my bill") ||
        normalized.includes("can you pay my bill") ||
        normalized.includes("can you pay my bills")
      )
    );
  };

  // =========================================================
  // PAYMENT RESPONSES
  // =========================================================

  const getAirtimeResponse = (text) => {
    const amount =
      extractAmount(text);

    if (!amount) {
      return (
        "📱 Sure! How Much Airtime Would You Like To Buy?\n\n" +
        "For Example: Buy Me R50 Airtime."
      );
    }

    if (amount > Number(mainBalance || 0)) {
      return (
        `❌ You Don't Have Enough Money In Your Main Account.\n\n` +
        `💳 Available: R ${formatMoney(
          mainBalance
        )}\n` +
        `📱 Airtime: R ${formatMoney(
          amount
        )}\n` +
        `⚠️ Short By: R ${formatMoney(
          amount - Number(mainBalance || 0)
        )}.`
      );
    }

    setPendingAirtime({
      amount,
    });

    return (
      `📱 I Found An Airtime Purchase Request For R ${formatMoney(
        amount
      )}.\n\n` +
      `💳 Payment Will Come From Your Main Account.\n` +
      `💰 Balance After Purchase: R ${formatMoney(
        Number(mainBalance || 0) - amount
      )}\n\n` +
      `I Still Need Your Network And Mobile Number Before I Can Process It.\n\n` +
      `Example: MTN 0721234567`
    );
  };

  const getElectricityResponse = (text) => {
    const amount =
      extractAmount(text);

    if (!amount) {
      return (
        "⚡ Sure! How Much Electricity Would You Like To Buy?\n\n" +
        "For Example: Buy R200 Electricity."
      );
    }

    if (amount > Number(mainBalance || 0)) {
      return (
        `❌ You Don't Have Enough Money In Your Main Account.\n\n` +
        `💳 Available: R ${formatMoney(
          mainBalance
        )}\n` +
        `⚡ Electricity: R ${formatMoney(
          amount
        )}\n` +
        `⚠️ Short By: R ${formatMoney(
          amount - Number(mainBalance || 0)
        )}.`
      );
    }

    setPendingElectricity({
      amount,
    });

    return (
      `⚡ I Found An Electricity Purchase Request For R ${formatMoney(
        amount
      )}.\n\n` +
      `💳 Payment Will Come From Your Main Account.\n` +
      `💰 Balance After Purchase: R ${formatMoney(
        Number(mainBalance || 0) - amount
      )}\n\n` +
      `I Need Your Electricity Meter Number Before I Can Process It.\n\n` +
      `Example: 12345678901`
    );
  };

  const getBillPaymentResponse = (text) => {
    const amount =
      extractAmount(text);

    if (!amount) {
      return (
        "📄 Sure! How Much Would You Like To Pay?\n\n" +
        "For Example: Pay My R500 Bill."
      );
    }

    if (amount > Number(mainBalance || 0)) {
      return (
        `❌ You Don't Have Enough Money In Your Main Account.\n\n` +
        `💳 Available: R ${formatMoney(
          mainBalance
        )}\n` +
        `📄 Bill: R ${formatMoney(
          amount
        )}\n` +
        `⚠️ Short By: R ${formatMoney(
          amount - Number(mainBalance || 0)
        )}.`
      );
    }

    setPendingBill({
      amount,
    });

    return (
      `📄 I Found A Bill Payment Request For R ${formatMoney(
        amount
      )}.\n\n` +
      `💳 Payment Will Come From Your Main Account.\n` +
      `💰 Balance After Payment: R ${formatMoney(
        Number(mainBalance || 0) - amount
      )}\n\n` +
      `I Need The Bill Type And Reference Number Before I Can Process It.\n\n` +
      `Example: DSTV 123456789`
    );
  };

  // =========================================================
  // TRANSFER COMMAND
  // =========================================================

  const isTransferCommand = (text) => {
    const normalized =
      text.trim().toLowerCase();

    return (
      normalized.startsWith("transfer ") ||
      normalized.startsWith("send ") ||
      normalized.startsWith("pay ") ||
      normalized.startsWith("move ")
    );
  };

  // =========================================================
  // INTER-ACCOUNT TRANSFER
  // =========================================================

  const extractInterAccountTransfer = (text) => {
    const normalized =
      text
        .trim()
        .toLowerCase()
        .replace(/,/g, "");

    const amount =
      extractAmount(normalized);

    if (!amount) {
      return null;
    }

    const hasSavings =
      /\bsavings?\b|\bsaving\b/i.test(
        normalized
      );

    const hasMain =
      /\bmain\b|\bmain account\b/i.test(
        normalized
      );

    if (
      hasSavings &&
      hasMain &&
      (
        /from\s+(?:my\s+)?savings?\b.*to\s+(?:my\s+)?main\b/i.test(
          normalized
        ) ||
        /\bsavings?\s+to\s+main\b/i.test(
          normalized
        ) ||
        /\bsavings?\s+into\s+main\b/i.test(
          normalized
        )
      )
    ) {
      return {
        amount,
        direction: "to_main",
      };
    }

    if (
      hasSavings &&
      hasMain &&
      (
        /from\s+(?:my\s+)?main\b.*to\s+(?:my\s+)?savings?\b/i.test(
          normalized
        ) ||
        /from\s+(?:my\s+)?main\b.*into\s+(?:my\s+)?savings?\b/i.test(
          normalized
        ) ||
        /\bmain\s+to\s+savings?\b/i.test(
          normalized
        ) ||
        /\bmain\s+into\s+savings?\b/i.test(
          normalized
        )
      )
    ) {
      return {
        amount,
        fromAccount: "main",
        toAccount: "savings",
        direction: "to_savings",
      };
    }

    if (
      !hasMain &&
      /\b(?:to|into)\s+(?:my\s+)?savings?\b/i.test(
        normalized
      )
    ) {
      return {
        amount,
        direction: "to_savings",
      };
    }

    if (
      !hasSavings &&
      /\b(?:to|into)\s+(?:my\s+)?main\b/i.test(
        normalized
      )
    ) {
      return {
        amount,
        direction: "to_main",
      };
    }

    return null;
  };

    // =========================================================
  // PAYMENT DETAIL EXTRACTION
  // =========================================================
const extractAirtimeDetails = (text) => {
  const normalized = String(text || "")
    .trim()
    .toLowerCase();

  // Recognize network names and common voice transcription mistakes.
  const networkAliases = [
    {
      network: "vodacom",
      aliases: [
        "vodacom",
        "vodakum",
        "vodacom",
        "voda com",
        "vodacome",
        "vodacom network",
      ],
    },
    {
      network: "mtn",
      aliases: [
        "mtn",
        "em t n",
        "emt en",
        "empty en",
        "mt n",
        "m t n",
        "emten",
      ],
    },
    {
      network: "telkom",
      aliases: [
        "telkom",
        "telecom",
        "tell com",
        "tel com",
        "telkom network",
      ],
    },
    {
      network: "cellc",
      aliases: [
        "cellc",
        "cell c",
        "cell see",
        "cell sea",
        "sell c",
        "sell see",
      ],
    },
  ];

  let network = null;

  for (const item of networkAliases) {
    const matched = item.aliases.some((alias) => {
      const escapedAlias = alias.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const pattern = new RegExp(
        `\\b${escapedAlias}\\b`,
        "i"
      );

      return pattern.test(normalized);
    });

    if (matched) {
      network = item.network;
      break;
    }
  }

  // Recognize South African mobile numbers.
  const phoneMatch = normalized.match(
    /(?:\+27\s?\d{2}|0\d{2})[\s-]?\d{3}[\s-]?\d{4}\b/
  );

  let mobileNumber = null;

  if (phoneMatch) {
    mobileNumber = phoneMatch[0].replace(/[\s-]/g, "");

    if (mobileNumber.startsWith("+27")) {
      mobileNumber = "0" + mobileNumber.slice(3);
    }
  }

  return { network, mobileNumber };
};

  const extractMeterNumber = (text) => {
    const normalized = String(text || "")
      .trim();

    const match = normalized.match(
      /\b\d{8,13}\b/
    );

    return match
      ? match[0]
      : null;
  };

  const extractBillDetails = (text) => {
    const normalized = String(text || "")
      .trim()
      .toLowerCase();

    let billType = null;

    if (normalized.includes("water")) {
      billType = "water";
    } else if (
      normalized.includes("municipality") ||
      normalized.includes("municipal")
    ) {
      billType = "municipality";
    } else if (
      normalized.includes("internet") ||
      normalized.includes("wifi") ||
      normalized.includes("wi-fi")
    ) {
      billType = "internet";
    } else if (
      normalized.includes("insurance")
    ) {
      billType = "insurance";
    } else {
      billType = "other";
    }

    const accountMatch = normalized.match(
      /\b\d{6,16}\b/
    );

    return {
      billType,
      billAccount: accountMatch
        ? accountMatch[0]
        : null,
    };
  };
  // =========================================================
  // DEPOSIT COMMAND
  // =========================================================

  const isDepositCommand = (text) => {
    const normalized =
      text.trim().toLowerCase();

    return (
      normalized.startsWith("deposit ") ||
      normalized.includes("deposit ") ||
      (
        normalized.includes("put ") &&
        normalized.includes("into ")
      ) ||
      (
        normalized.includes("add ") &&
        normalized.includes("to ")
      )
    );
  };

  const extractDepositAccount = (text) => {
    const normalized =
      text.trim().toLowerCase();

    if (
      /\b(?:into|to|in)\s+(?:my\s+)?savings?\b/i.test(
        normalized
      )
    ) {
      return "savings";
    }

    return "main";
  };

  // =========================================================
  // WITHDRAWAL COMMAND
  // =========================================================

  const isWithdrawalCommand = (text) => {
    const normalized =
      text.trim().toLowerCase();

    return (
      normalized.startsWith("withdraw ") ||
      normalized.includes("withdraw ") ||
      normalized.startsWith("take out ") ||
      normalized.includes("take out ")
    );
  };

  const extractWithdrawalAccount = (text) => {
    const normalized =
      text.trim().toLowerCase();

    const isSavingsWithdrawal =
      /\bfrom\s+(?:my\s+)?savings?\b/i.test(
        normalized
      ) ||
      /\bfrom\s+(?:my\s+)?saving\b/i.test(
        normalized
      );

    return isSavingsWithdrawal
      ? "savings"
      : "main";
  };

  // =========================================================
  // EXECUTE WITHDRAWAL
  // =========================================================

  const executeAIWithdrawal = async (
    withdrawal
  ) => {
    try {
      setThinking(true);

      await API.post("withdraw/", {
        amount: withdrawal.amount,
        account_type:
          withdrawal.accountType,
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text:
            `✅ Withdrawal Successful!\n\n` +
            `💸 Amount: R ${formatMoney(
              withdrawal.amount
            )}\n` +
            `🏦 Account: ${
              withdrawal.accountType ===
              "savings"
                ? "Savings"
                : "Main Account"
            }\n\n` +
            `Your Account Balances Have Been Updated.`,
        },
      ]);

      setPendingWithdrawal(null);

      await fetchBankData();
    } catch (error) {
      console.error(
        "AI WITHDRAWAL ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text:
            "❌ I Couldn't Complete The Withdrawal. " +
            (
              error?.response?.data?.detail ||
              error?.response?.data?.error ||
              "Please Check Your Balance And Try Again."
            ),
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  // =========================================================
  // EXECUTE DEPOSIT
  // =========================================================

  const executeAIDeposit = async (
    deposit
  ) => {
    try {
      setThinking(true);

      await API.post("deposit/", {
        amount: deposit.amount,
        account_type:
          deposit.accountType,
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text:
            `✅ Deposit Successful!\n\n` +
            `💰 Amount: R ${formatMoney(
              deposit.amount
            )}\n` +
            `🏦 Account: ${
              deposit.accountType ===
              "savings"
                ? "Savings"
                : "Main Account"
            }\n\n` +
            `Your Account Balances Have Been Updated.`,
        },
      ]);

      setPendingDeposit(null);

      await fetchBankData();
    } catch (error) {
      console.error(
        "AI DEPOSIT ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text:
            "❌ I Couldn't Complete The Deposit. " +
            (
              error?.response?.data?.detail ||
              error?.response?.data?.error ||
              "Please Try Again."
            ),
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  // =========================================================
  // EXECUTE INTER-ACCOUNT TRANSFER
  // =========================================================

  const executeAIInterAccountTransfer = async (
    transfer
  ) => {
    try {
      setThinking(true);

      await API.post("transfer/", {
        amount: transfer.amount,
        direction: transfer.direction,
      });

      const directionText =
        transfer.direction === "to_savings"
          ? "Main Account → Savings"
          : "Savings → Main Account";

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text:
            `✅ Transfer Successful!\n\n` +
            `💸 Amount: R ${formatMoney(
              transfer.amount
            )}\n` +
            `🔄 Transfer: ${directionText}\n\n` +
            `Your Account Balances Have Been Updated.`,
        },
      ]);

      setPendingInterAccountTransfer(null);

      await fetchBankData();
    } catch (error) {
      console.error(
        "AI INTER-ACCOUNT TRANSFER ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text:
            "❌ I Couldn't Complete The Account Transfer. " +
            (
              error?.response?.data?.detail ||
              error?.response?.data?.error ||
              "Please Check Your Balance And Try Again."
            ),
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  // =========================================================
  // EXECUTE BENEFICIARY TRANSFER
  // =========================================================

  const executeAITransfer = async (
    transfer
  ) => {
    try {
      setThinking(true);

      await API.post(
        "transfer-beneficiary/",
        {
          amount: transfer.amount,
          beneficiary:
            transfer.beneficiary,
          beneficiary_id:
            transfer.beneficiaryId,
          account_number:
            transfer.accountNumber,
        }
      );

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text:
            `✅ Transfer Successful!\n\n` +
            `💸 Amount: R ${formatMoney(
              transfer.amount
            )}\n` +
            `👤 Recipient: ${transfer.recipient}\n\n` +
            `The Beneficiary Has Been Paid Successfully.`,
        },
      ]);

      setPendingTransfer(null);

      await fetchBankData();
    } catch (error) {
      console.error(
        "AI BENEFICIARY TRANSFER ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text:
            "❌ I Couldn't Complete The Beneficiary Transfer. " +
            (
              error?.response?.data?.detail ||
              error?.response?.data?.error ||
              "Please Check Your Balance, Beneficiary Details, And Try Again."
            ),
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  // =========================================================
  // GENERATE AI RESPONSE
  // =========================================================

  const generateAIResponse = (text) => {
    const normalized =
      text.trim().toLowerCase();

    // =======================================================
    // AIRTIME
    // =======================================================

    if (isAirtimeCommand(text)) {
      return getAirtimeResponse(text);
    }

    // =======================================================
    // ELECTRICITY
    // =======================================================

    if (isElectricityCommand(text)) {
      return getElectricityResponse(text);
    }

    // =======================================================
    // BILLS
    // =======================================================

    if (isBillPaymentCommand(text)) {
      return getBillPaymentResponse(text);
    }

    // =======================================================
    // WITHDRAWAL
    // =======================================================

    if (isWithdrawalCommand(text)) {
      const amount =
        extractAmount(text);

      if (!amount) {
        return (
          "💸 Please Tell Me How Much You Want To Withdraw. " +
          "For Example: Withdraw R500 Or Withdraw 2K."
        );
      }

      const accountType =
        extractWithdrawalAccount(text);

      const availableBalance =
        accountType === "savings"
          ? Number(savingsBalance || 0)
          : Number(mainBalance || 0);

      if (amount > availableBalance) {
        return (
          `❌ You Don't Have Enough Money In Your ${
            accountType === "savings"
              ? "Savings"
              : "Main Account"
          }.\n\n` +
          `💳 Available: R ${formatMoney(
            availableBalance
          )}\n` +
          `💸 Requested: R ${formatMoney(
            amount
          )}\n` +
          `⚠️ Short By: R ${formatMoney(
            amount - availableBalance
          )}.`
        );
      }

      setPendingWithdrawal({
        amount,
        accountType,
      });

      return (
        `💸 I Found A Withdrawal Request For R ${formatMoney(
          amount
        )} From Your ${
          accountType === "savings"
            ? "Savings"
            : "Main Account"
        }.\n\n` +
        `💳 Available Balance: R ${formatMoney(
          availableBalance
        )}\n` +
        `💰 Balance After Withdrawal: R ${formatMoney(
          availableBalance - amount
        )}\n\n` +
        `Would You Like Me To Proceed?`
      );
    }

    // =======================================================
    // DEPOSIT
    // =======================================================

    if (isDepositCommand(text)) {
      const amount =
        extractAmount(text);

      if (!amount) {
        return (
          "💰 Please Tell Me How Much You Want To Deposit. " +
          "For Example: Deposit R500 Or Put 2K Into Savings."
        );
      }

      const accountType =
        extractDepositAccount(text);

      setPendingDeposit({
        amount,
        accountType,
      });

      return (
        `💰 I Found A Deposit Request For R ${formatMoney(
          amount
        )} Into Your ${
          accountType === "savings"
            ? "Savings"
            : "Main Account"
        }.\n\n` +
        `Would You Like Me To Proceed?`
      );
    }

    // =======================================================
    // INTER-ACCOUNT TRANSFER
    // =======================================================

    const interAccountTransfer =
      extractInterAccountTransfer(text);

    if (interAccountTransfer) {
      const {
        amount,
        direction,
      } = interAccountTransfer;

      const isMainToSavings =
        direction === "to_savings";

      const sourceBalance =
        isMainToSavings
          ? Number(mainBalance || 0)
          : Number(savingsBalance || 0);

      const sourceAccount =
        isMainToSavings
          ? "Main Account"
          : "Savings";

      const destinationAccount =
        isMainToSavings
          ? "Savings"
          : "Main Account";

      if (amount > sourceBalance) {
        return (
          `❌ You Don't Have Enough Money In Your ${sourceAccount}.\n\n` +
          `💳 Available: R ${formatMoney(
            sourceBalance
          )}\n` +
          `💸 Requested: R ${formatMoney(
            amount
          )}\n` +
          `⚠️ Short By: R ${formatMoney(
            amount - sourceBalance
          )}.`
        );
      }

      setPendingInterAccountTransfer({
        amount,
        direction,
      });

      return (
        `🔄 I Found A Transfer Request For R ${formatMoney(
          amount
        )} From ${sourceAccount} To ${destinationAccount}.\n\n` +
        `💳 Current ${sourceAccount} Balance: R ${formatMoney(
          sourceBalance
        )}\n` +
        `💰 Balance After Transfer: R ${formatMoney(
          sourceBalance - amount
        )}\n\n` +
        `Would You Like Me To Proceed?`
      );
    }

    // =======================================================
    // AFFORDABILITY
    // =======================================================

    if (
      isAffordabilityCommand(text)
    ) {
      return getAffordabilityResponse(
        text
      );
    }

    // =======================================================
    // MONTH COMPARISON
    // =======================================================

    if (
      isMonthComparisonCommand(text)
    ) {
      return getMonthComparisonResponse();
    }

    // =======================================================
    // SPECIFIC CATEGORY
    // =======================================================

    if (
      isSpecificCategoryCommand(text)
    ) {
      return getSpecificCategoryResponse(
        text
      );
    }

    // =======================================================
    // SPENDING CATEGORY
    // =======================================================

    if (
      isSpendingCategoryCommand(text)
    ) {
      return getSpendingCategoryResponse();
    }

    // =======================================================
    // FINANCIAL HEALTH
    // =======================================================

    if (
      isFinancialHealthCommand(text)
    ) {
      return getFinancialHealthResponse();
    }

    // =======================================================
    // BENEFICIARY LIST
    // =======================================================

    if (
      isBeneficiaryListCommand(text)
    ) {
      return getBeneficiaryListResponse();
    }

    // =======================================================
    // ACCOUNT TRANSACTIONS
    // =======================================================

    if (
      isAccountTransactionCommand(text)
    ) {
      return getAccountTransactionResponse(
        text
      );
    }

    // =======================================================
    // RECIPIENT HISTORY
    // =======================================================

    if (
      isRecipientHistoryCommand(text)
    ) {
      return getRecipientHistoryResponse(
        text
      );
    }

    // =======================================================
    // TRANSACTION SEARCH
    // =======================================================

    if (
      isTransactionSearchCommand(text)
    ) {
      return getTransactionSearchResponse(
        text
      );
    }

    // =======================================================
    // BENEFICIARY TRANSFER
    // =======================================================

    if (isTransferCommand(text)) {
      const amount =
        extractAmount(text);

      if (!amount) {
        return (
          "💸 Please Tell Me How Much You Want To Transfer. " +
          "For Example: Send R500 To Khumalo."
        );
      }

      const recipient =
        extractTransferRecipient(text);

      if (!recipient) {
        return (
          "👤 Please Tell Me Who You Want To Send The Money To. " +
          "For Example: Send R500 To Khumalo."
        );
      }

      const beneficiary =
        findBeneficiary(recipient);

      if (!beneficiary) {
        return (
          `❌ I Couldn't Find A Beneficiary Matching "${recipient}".\n\n` +
          `Please Check Your Beneficiary List And Try Again.`
        );
      }

      const availableBalance =
        Number(mainBalance || 0);

      if (amount > availableBalance) {
        return (
          `❌ You Don't Have Enough Money In Your Main Account.\n\n` +
          `💳 Available: R ${formatMoney(
            availableBalance
          )}\n` +
          `💸 Requested: R ${formatMoney(
            amount
          )}\n` +
          `⚠️ Short By: R ${formatMoney(
            amount - availableBalance
          )}.`
        );
      }

      const beneficiaryName =
        beneficiary?.name ??
        beneficiary?.full_name ??
        beneficiary?.beneficiary_name ??
        recipient;

      const beneficiaryId =
        beneficiary?.id ??
        beneficiary?.beneficiary_id ??
        null;

      const accountNumber =
        beneficiary?.account_number ??
        beneficiary?.accountNumber ??
        "";

      setPendingTransfer({
        amount,
        recipient: beneficiaryName,
        beneficiary: beneficiaryName,
        beneficiaryId,
        accountNumber,
      });

      return (
        `💸 I Found A Transfer Request For R ${formatMoney(
          amount
        )} To ${beneficiaryName}.\n\n` +
        `💳 You Will Pay From Your Main Account.\n` +
        `💰 Balance After Transfer: R ${formatMoney(
          availableBalance - amount
        )}\n\n` +
        `Would You Like Me To Proceed?`
      );
    }

    // =======================================================
    // GREETINGS
    // =======================================================

    if (
      normalized === "hi" ||
      normalized === "hello" ||
      normalized === "hey" ||
      normalized.includes("good morning") ||
      normalized.includes("good afternoon") ||
      normalized.includes("good evening")
    ) {
      return (
        "👋 Hello! I'm Your Baseline Bank AI Assistant.\n\n" +
        "I Can Help You With:\n" +
        "💳 Balances\n" +
        "🏦 Savings\n" +
        "💸 Spending\n" +
        "📊 Spending Categories\n" +
        "📈 Financial Health\n" +
        "🔄 Transfers\n" +
        "💵 Deposits\n" +
        "🏧 Withdrawals\n" +
        "📋 Transactions\n" +
        "👤 Beneficiaries\n" +
        "📱 Airtime\n" +
        "⚡ Electricity\n" +
        "📄 Bills\n" +
        "🔎 Transaction Search\n\n" +
        "What Would You Like To Know?"
      );
    }

    // =======================================================
    // TOTAL BALANCE
    // =======================================================

    if (
      normalized.includes("total balance") ||
      normalized.includes("combined balance") ||
      normalized.includes("overall balance") ||
      normalized.includes("how much money do i have total")
    ) {
      const total =
        Number(mainBalance || 0) +
        Number(savingsBalance || 0);

      return (
        `💰 Your Total Balance Is R ${formatMoney(
          total
        )}.\n\n` +
        `💳 Main Account: R ${formatMoney(
          mainBalance
        )}\n` +
        `🏦 Savings: R ${formatMoney(
          savingsBalance
        )}`
      );
    }

    // =======================================================
    // SAVINGS BALANCE
    // =======================================================

    if (
      normalized === "savings" ||
      normalized === "saving" ||
      normalized.includes("savings balance") ||
      normalized.includes("saving balance") ||
      normalized.includes("how much is in savings") ||
      normalized.includes("how much is in my savings") ||
      normalized.includes("money in savings")||
      normalized.includes("how much do i have")
 ) {
      return (
        `🏦 Your Current Savings Balance Is R ${formatMoney(
          savingsBalance
        )}.`
      );
    }

    // =======================================================
// MAIN BALANCE
// =======================================================

if (
  normalized === "balance" ||
  normalized.includes("main balance") ||
  normalized.includes("current balance") ||
  normalized.includes("bank balance") ||
  normalized.includes("account balance") ||
  normalized.includes("what's my balance") ||
  normalized.includes("what is my balance") ||
  normalized.includes("whats my balance") ||
  (
    normalized.includes("how much do i have") &&
    !normalized.includes("savings") &&
    !normalized.includes("saving")
  ) ||
  (
    normalized.includes("how much money do i have") &&
    !normalized.includes("savings") &&
    !normalized.includes("saving")
  ) ||
  (
    normalized.includes("how much is in my account") &&
    !normalized.includes("savings") &&
    !normalized.includes("saving")
  ) ||
  (
    normalized.includes("how much do i currently have") &&
    !normalized.includes("savings") &&
    !normalized.includes("saving")
  )
) {
  return (
    `💳 Your Current Main Account Balance Is R ${formatMoney(
      mainBalance
    )}.`
  );
}

    // =======================================================
    // MONTHLY SPENDING
    // =======================================================

    if (
      normalized.includes("spent this month") ||
      normalized.includes("spending this month") ||
      normalized.includes("monthly spending") ||
      normalized.includes("how much did i spend")
    ) {
      const spending =
        getCurrentMonthSpending();

      return (
        `📊 You Have Spent R ${formatMoney(
          spending
        )} This Month.`
      );
    }

    // =======================================================
    // BIGGEST EXPENSE
    // =======================================================

    if (
      normalized.includes("biggest expense") ||
      normalized.includes("largest expense") ||
      normalized.includes("most expensive transaction")
    ) {
      const biggest =
        getBiggestExpense();

      if (!biggest) {
        return (
          "📊 I Couldn't Find Any Expense Transactions Yet."
        );
      }

      return (
        `💸 Your Biggest Expense Is R ${formatMoney(
          getTransactionAmount(biggest)
        )}.\n\n` +
        `📝 ${
          getTransactionDescription(
            biggest
          ) || "Expense Transaction"
        }`
      );
    }

    // =======================================================
    // TOTAL SPENDING
    // =======================================================

    if (
      normalized.includes("total spending") ||
      normalized.includes("how much have i spent") ||
      normalized.includes("how much money have i spent")
    ) {
      const spending =
        getTotalSpending();

      return (
        `💸 Your Total Spending Is R ${formatMoney(
          spending
        )}.`
      );
    }

    // =======================================================
    // TOTAL INCOME
    // =======================================================

    if (
      normalized.includes("total income") ||
      normalized.includes("how much have i earned") ||
      normalized.includes("how much money have i received") ||
      normalized.includes("my income")
    ) {
      const income =
        getTotalIncome();

      return (
        `💵 Your Total Recorded Income Is R ${formatMoney(
          income
        )}.`
      );
    }

    // =======================================================
    // RECENT TRANSACTIONS
    // =======================================================

    if (
      normalized.includes("recent transactions") ||
      normalized.includes("latest transactions") ||
      normalized.includes("show my transactions") ||
      normalized.includes("show transactions") ||
      normalized.includes("my transactions")
    ) {
      if (
        !Array.isArray(transactions) ||
        transactions.length === 0
      ) {
        return (
          "📋 You Don't Have Any Transactions Yet."
        );
      }

      const recent =
        transactions.slice(0, 5);

      const lines =
        recent
          .map((transaction) => {
            const amount =
              getTransactionAmount(
                transaction
              );

            const description =
              getTransactionDescription(
                transaction
              );

            const type =
              getTransactionType(
                transaction
              );

            return (
              `• ${type || "Transaction"} — ` +
              `R ${formatMoney(amount)}` +
              (
                description
                  ? ` — ${description}`
                  : ""
              )
            );
          })
          .join("\n");

      return (
        `📋 Your Most Recent Transactions:\n\n${lines}`
      );
    }

    // =======================================================
    // FINANCIAL SUMMARY
    // =======================================================

    if (
      normalized.includes("financial summary") ||
      normalized.includes("money summary") ||
      normalized.includes("give me a summary") ||
      normalized.includes("account summary")
    ) {
      const total =
        Number(mainBalance || 0) +
        Number(savingsBalance || 0);

      const spending =
        getTotalSpending();

      const income =
        getTotalIncome();

      return (
        `📊 Your Financial Summary:\n\n` +
        `💳 Main Account: R ${formatMoney(
          mainBalance
        )}\n` +
        `🏦 Savings: R ${formatMoney(
          savingsBalance
        )}\n` +
        `💰 Total Balance: R ${formatMoney(
          total
        )}\n` +
        `💵 Total Income: R ${formatMoney(
          income
        )}\n` +
        `💸 Total Spending: R ${formatMoney(
          spending
        )}`
      );
    }

    // =======================================================
    // HELP
    // =======================================================

    if (
      normalized === "help" ||
      normalized.includes("what can you do") ||
      normalized.includes("how can you help")
    ) {
      return (
        "🤖 Here's What I Can Do:\n\n" +
        "💳 Check Your Balance\n" +
        "🏦 Check Your Savings\n" +
        "💰 Calculate Your Total Balance\n" +
        "💸 Analyse Your Spending\n" +
        "📊 Find Your Biggest Spending Category\n" +
        "🧠 Check Your Financial Health\n" +
        "💵 Check Your Income\n" +
        "📋 Show Recent Transactions\n" +
        "🔎 Search Transactions\n" +
        "👤 Search Recipient History\n" +
        "👥 Show Beneficiaries\n" +
        "📅 Compare Monthly Spending\n" +
        "💸 Withdraw Money\n" +
        "💰 Deposit Money\n" +
        "🔄 Move Money Between Main And Savings\n" +
        "👤 Send Money To Beneficiaries\n" +
        "📱 Buy Airtime\n" +
        "⚡ Buy Electricity\n" +
        "📄 Pay Bills\n" +
        "💡 Check Whether You Can Afford Something\n\n" +
        "Try:\n" +
        "• \"Buy Me R50 Airtime\"\n" +
        "• \"Buy R200 Electricity\"\n" +
        "• \"Pay My R500 Bill\"\n" +
        "• \"Can I Afford R1,000?\"\n" +
        "• \"How Much Did I Spend On Airtime?\"\n" +
        "• \"How Much Have I Sent To Amasi?\"\n" +
        "• \"Compare This Month To Last Month\"\n" +
        "• \"Show My Beneficiaries\""
      );
    }

    // =======================================================
    // DEFAULT RESPONSE
    // =======================================================
    return (
      "🤖 I'm Not Quite Sure What You Mean Yet.\n\n" +
      "Try Asking Me Something Like:\n" +
      "• What's My Balance?\n" +
      "• How Much Is In Savings?\n" +
      "• Buy Me R50 Airtime\n" +
      "• Buy R200 Electricity\n" +
      "• Pay My R500 Bill\n" +
      "• Can I Afford R1,000?\n" +
      "• Where Am I Spending Most?\n" +
      "• How Much Did I Spend On Airtime?\n" +
      "• How Much Have I Sent To Amasi?\n" +
      "• Compare This Month To Last Month\n" +
      "• Show My Beneficiaries\n" +
      "• Show My Recent Transactions"
    );
  };
// =========================================================
// EXECUTE AI AIRTIME
// =========================================================

const executeAIAirtime = async (
  payment
) => {
  try {
    setThinking(true);

    await API.post(
      "buy-airtime/",
      {
        mobile_number:
          payment.mobileNumber,
        network:
          payment.network,
        amount:
          payment.amount,
      }
    );

    setMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text:
          `✅ Airtime Purchase Successful!\n\n` +
          `📱 Network: ${payment.network.toUpperCase()}\n` +
          `📞 Number: ${payment.mobileNumber}\n` +
          `💰 Amount: R ${formatMoney(
            payment.amount
          )}\n` +
          `💳 Payment From: Main Account\n\n` +
          `Your Airtime Purchase Has Been Completed Successfully.`,
      },
    ]);

    setPendingAirtime(null);

    await fetchBankData();
  } catch (error) {
    console.error(
      "AI AIRTIME ERROR:",
      error?.response?.data ||
        error?.message ||
        error
    );

    setMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text:
          "❌ I Couldn't Complete The Airtime Purchase. " +
          (
            error?.response?.data?.detail ||
            error?.response?.data?.error ||
            "Please Check Your Balance And Airtime Details."
          ),
      },
    ]);
  } finally {
    setThinking(false);
  }
};


const executeAIElectricity = async (
  payment
) => {
  try {
    setThinking(true);

    await API.post(
      "buy-electricity/",
      {
        meter_number:
          payment.meterNumber,
        provider:
          payment.provider,
        amount:
          payment.amount,
      }
    );

    setMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text:
          `✅ Electricity Purchase Successful!\n\n` +
          `⚡ Provider: ${
            payment.provider
              ? payment.provider.toUpperCase()
              : "ELECTRICITY"
          }\n` +
          `🔢 Meter Number: ${payment.meterNumber}\n` +
          `💰 Amount: R ${formatMoney(
            payment.amount
          )}\n` +
          `💳 Payment From: Main Account\n\n` +
          `Your Electricity Purchase Has Been Completed Successfully.`,
      },
    ]);

    setPendingElectricity(null);

    await fetchBankData();
  } catch (error) {
    console.error(
      "AI ELECTRICITY ERROR:",
      error?.response?.data ||
        error?.message ||
        error
    );

    setMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text:
          "❌ I Couldn't Complete The Electricity Purchase. " +
          (
            error?.response?.data?.detail ||
            error?.response?.data?.error ||
            "Please Check Your Balance And Electricity Details."
          ),
      },
    ]);
  } finally {
    setThinking(false);
  }
};


const executeAIBill = async (
  payment
) => {
  try {
    setThinking(true);

    await API.post(
      "pay-bill/",
      {
        bill_type:
          payment.billType,
        bill_account:
          payment.billAccount,
        amount:
          payment.amount,
      }
    );

    setMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text:
          `✅ Bill Payment Successful!\n\n` +
          `📄 Bill Type: ${
            payment.billType
              ? payment.billType.toUpperCase()
              : "BILL"
          }\n` +
          `🔢 Reference: ${payment.billAccount}\n` +
          `💰 Amount: R ${formatMoney(
            payment.amount
          )}\n` +
          `💳 Payment From: Main Account\n\n` +
          `Your Bill Has Been Paid Successfully.`,
      },
    ]);

    setPendingBill(null);

    await fetchBankData();
  } catch (error) {
    console.error(
      "AI BILL PAYMENT ERROR:",
      error?.response?.data ||
        error?.message ||
        error
    );

    setMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text:
          "❌ I Couldn't Complete The Bill Payment. " +
          (
            error?.response?.data?.detail ||
            error?.response?.data?.error ||
            "Please Check Your Balance And Bill Details."
          ),
      },
    ]);
  } finally {
    setThinking(false);
  }
};
const handleVoiceInput = () => {
  if (!speechSupported) {
    setMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text:
          "🎤 Voice Input Is Not Supported By This Browser. Please Try Google Chrome.",
      },
    ]);

    return;
  }

  if (!recognitionRef.current) {
    return;
  }

  // Stop listening if the microphone is already active
  if (isListening) {
    recognitionRef.current.stop();
    setIsListening(false);
    return;
  }

  try {
    recognitionRef.current.start();
  } catch (error) {
    console.error("VOICE START ERROR:", error);
    setIsListening(false);
  }
};

  // =========================================================
  // HANDLE SUBMIT
  // =========================================================

  const handleSubmit = async (event) => {
    event?.preventDefault();

    const text =
      input.trim();

    if (
      !text ||
      thinking
    ) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text,
      },
    ]);

    setInput("");
    setThinking(true);

    setTimeout(async () => {
      try {
        const normalized =
          text
            .trim()
            .toLowerCase();


                    // ===================================================
        // AIRTIME DETAILS
        // ===================================================

        if (pendingAirtime) {
          const details =
            extractAirtimeDetails(text);

          if (
            details.network &&
            details.mobileNumber
          ) {
            const updatedPayment = {
              ...pendingAirtime,
              network:
                details.network,
              mobileNumber:
                details.mobileNumber,
            };

            setPendingAirtime(
              updatedPayment
            );

            setMessages((prev) => [
              ...prev,
              {
                sender: "ai",
                text:
                  `📱 Airtime Details Received!\n\n` +
                  `📱 Network: ${details.network.toUpperCase()}\n` +
                  `📞 Number: ${details.mobileNumber}\n` +
                  `💰 Amount: R ${formatMoney(
                    pendingAirtime.amount
                  )}\n` +
                  `💳 Payment From: Main Account\n\n` +
                  `Would You Like Me To Proceed?`,
              },
            ]);

            setThinking(false);
            return;
          }
        }

        // ===================================================
        // ELECTRICITY DETAILS
        // ===================================================

        if (pendingElectricity) {
          const meterNumber =
            extractMeterNumber(text);

          if (meterNumber) {
            const updatedPayment = {
              ...pendingElectricity,
              meterNumber,
            };

            setPendingElectricity(
              updatedPayment
            );

            setMessages((prev) => [
              ...prev,
              {
                sender: "ai",
                text:
                  `⚡ Electricity Details Received!\n\n` +
                  `🔢 Meter Number: ${meterNumber}\n` +
                  `💰 Amount: R ${formatMoney(
                    pendingElectricity.amount
                  )}\n` +
                  `💳 Payment From: Main Account\n\n` +
                  `Would You Like Me To Proceed?`,
              },
            ]);

            setThinking(false);
            return;
          }
        }

        // ===================================================
        // BILL DETAILS
        // ===================================================

        if (pendingBill) {
          const details =
            extractBillDetails(text);

          if (details.billAccount) {
            const updatedPayment = {
              ...pendingBill,
              billType:
                details.billType,
              billAccount:
                details.billAccount,
            };

            setPendingBill(
              updatedPayment
            );

            setMessages((prev) => [
              ...prev,
              {
                sender: "ai",
                text:
                  `📄 Bill Details Received!\n\n` +
                  `📄 Bill Type: ${details.billType.toUpperCase()}\n` +
                  `🔢 Reference: ${details.billAccount}\n` +
                  `💰 Amount: R ${formatMoney(
                    pendingBill.amount
                  )}\n` +
                  `💳 Payment From: Main Account\n\n` +
                  `Would You Like Me To Proceed?`,
              },
            ]);

            setThinking(false);
            return;
          }
        }

        // ===================================================
        // YES
        // ===================================================

        const isYes =
          normalized === "yes" ||
          normalized === "y" ||
          normalized.includes("yes please") ||
          normalized.includes("go ahead") ||
          normalized.includes("confirm");

        // ===================================================
        // NO
        // ===================================================

        const isNo =
          normalized === "no" ||
          normalized === "n" ||
          normalized.includes("cancel") ||
          normalized.includes("stop");

// ===================================================
// CONFIRM
// ===================================================
if (isYes) {
  // 📱 AIRTIME
  if (pendingAirtime) {
    await executeAIAirtime(
      pendingAirtime
    );
    return;
  }

  // ⚡ ELECTRICITY
  if (pendingElectricity) {
    await executeAIElectricity(
      pendingElectricity
    );
    return;
  }

  // 📄 BILL PAYMENT
  if (pendingBill) {
    await executeAIBill(
      pendingBill
    );
    return;
  }

  // 💸 WITHDRAWAL
  if (pendingWithdrawal) {
    await executeAIWithdrawal(
      pendingWithdrawal
    );
    return;
  }

  // 💰 DEPOSIT
  if (pendingDeposit) {
    await executeAIDeposit(
      pendingDeposit
    );
    return;
  }

  // 🔄 MAIN ↔ SAVINGS
  if (pendingInterAccountTransfer) {
    await executeAIInterAccountTransfer(
      pendingInterAccountTransfer
    );
    return;
  }

  // 👤 BENEFICIARY TRANSFER
  if (pendingTransfer) {
    await executeAITransfer(
      pendingTransfer
    );
    return;
  }

  setMessages((prev) => [
    ...prev,
    {
      sender: "ai",
      text:
        "👍 There Is No Pending Banking Action Waiting For Confirmation.",
    },
  ]);

  setThinking(false);
  return;
}


        // ===================================================
        // CANCEL
        // ===================================================

        if (isNo) {
          const hadPendingAction =
            pendingWithdrawal ||
            pendingDeposit ||
            pendingInterAccountTransfer ||
            pendingTransfer ||
            pendingAirtime ||
            pendingElectricity ||
            pendingBill;

          setPendingWithdrawal(null);
          setPendingDeposit(null);
          setPendingInterAccountTransfer(null);
          setPendingTransfer(null);
          setPendingAirtime(null);
          setPendingElectricity(null);
          setPendingBill(null);

          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: hadPendingAction
                ? "❌ Okay, I've Cancelled That Action."
                : "👍 Okay.",
            },
          ]);

          setThinking(false);
          return;
        }

        // ===================================================
        // NEW COMMAND
        // ===================================================



        const response =
          generateAIResponse(text);

        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: response,
          },
        ]);
      } catch (error) {
        console.error(
          "AI ASSISTANT ERROR:",
          error
        );

        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text:
              "❌ Something Went Wrong While Processing Your Request. Please Try Again.",
          },
        ]);
      } finally {
        setThinking(false);
      }
    }, 500);
  };

  // =========================================================
  // SUGGESTIONS
  // =========================================================

  const suggestions = [
    "What's My Balance?",
    "How Much Is In Savings?",
    "Buy Me R50 Airtime",
    "Buy R200 Electricity",
    "Pay My R500 Bill",
    "Can I Afford R1,000?",
    "Where Am I Spending Most?",
    "How Am I Doing Financially?",
    "How Much Did I Spend This Month?",
    "Show My Recent Transactions",
    "How Much Did I Spend On Airtime?",
    "Compare This Month To Last Month",
    "Show My Beneficiaries",
  ];

  const handleSuggestion = (
    suggestion
  ) => {
    setInput(suggestion);
  };

  // =========================================================
  // DISPLAY BALANCES
  // =========================================================

  const totalBalance =
    Number(mainBalance || 0) +
    Number(savingsBalance || 0);

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #050816 0%, #0f172a 50%, #111827 100%)",
        color: "#ffffff",
      }}
    >
      <Navbar />

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "30px 20px 50px",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            marginBottom: "25px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: "700",
            }}
          >
            🤖 Baseline AI
          </h1>

          <p
            style={{
              marginTop: "8px",
              color: "#94a3b8",
            }}
          >
            Ask Me Anything About Your Banking Activity.
          </p>
        </div>

        {/* BALANCE CARDS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "25px",
          }}
        >
          <div
            style={{
              padding: "22px",
              borderRadius: "18px",
              background:
                "rgba(255,255,255,0.06)",
              border:
                "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              style={{
                color: "#94a3b8",
                fontSize: "14px",
              }}
            >
              💳 Main Account
            </div>

            <div
              style={{
                fontSize: "26px",
                fontWeight: "700",
                marginTop: "8px",
              }}
            >
              R {formatMoney(mainBalance)}
            </div>
          </div>

          <div
            style={{
              padding: "22px",
              borderRadius: "18px",
              background:
                "rgba(255,255,255,0.06)",
              border:
                "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              style={{
                color: "#94a3b8",
                fontSize: "14px",
              }}
            >
              🏦 Savings
            </div>

            <div
              style={{
                fontSize: "26px",
                fontWeight: "700",
                marginTop: "8px",
              }}
            >
              R {formatMoney(savingsBalance)}
            </div>
          </div>

          <div
            style={{
              padding: "22px",
              borderRadius: "18px",
              background:
                "rgba(255,255,255,0.06)",
              border:
                "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              style={{
                color: "#94a3b8",
                fontSize: "14px",
              }}
            >
              💰 Total Balance
            </div>

            <div
              style={{
                fontSize: "26px",
                fontWeight: "700",
                marginTop: "8px",
              }}
            >
              R {formatMoney(totalBalance)}
            </div>
          </div>
        </div>

        {/* CHAT CONTAINER */}

        <div
          style={{
            borderRadius: "22px",
            background:
              "rgba(255,255,255,0.05)",
            border:
              "1px solid rgba(255,255,255,0.08)",
            overflow: "hidden",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.25)",
          }}
        >
          {/* CHAT MESSAGES */}

          <div
            style={{
              minHeight: "480px",
              maxHeight: "600px",
              overflowY: "auto",
              padding: "24px",
            }}
          >
            {messages.map(
              (message, index) => {
                const isUser =
                  message.sender ===
                  "user";

                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent:
                        isUser
                          ? "flex-end"
                          : "flex-start",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "78%",
                        padding:
                          "14px 17px",
                        borderRadius:
                          "16px",
                        background:
                          isUser
                            ? "rgba(59,130,246,0.22)"
                            : "rgba(255,255,255,0.07)",
                        border:
                          "1px solid rgba(255,255,255,0.08)",
                        whiteSpace:
                          "pre-wrap",
                        lineHeight: 1.5,
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            "12px",
                          color:
                            "#94a3b8",
                          marginBottom:
                            "5px",
                        }}
                      >
                        {isUser
                          ? "👤 You"
                          : "🤖 Baseline AI"}
                      </div>

                      {message.text}
                    </div>
                  </div>
                );
              }
            )}

            {thinking && (
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-start",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    padding:
                      "14px 17px",
                    borderRadius:
                      "16px",
                    background:
                      "rgba(255,255,255,0.07)",
                    color:
                      "#94a3b8",
                  }}
                >
                  🤖 Thinking...
                </div>
              </div>
            )}
          </div>

          {/* SUGGESTIONS */}

          <div
            style={{
              padding:
                "0 24px 18px",
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {suggestions.map(
              (suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() =>
                    handleSuggestion(
                      suggestion
                    )
                  }
                  style={{
                    border:
                      "1px solid rgba(255,255,255,0.12)",
                    background:
                      "rgba(255,255,255,0.05)",
                    color:
                      "#e2e8f0",
                    borderRadius:
                      "999px",
                    padding:
                      "9px 13px",
                    cursor:
                      "pointer",
                    fontSize:
                      "13px",
                  }}
                >
                  {suggestion}
                </button>
              )
            )}
          </div>

          {/* INPUT */}
<form
  onSubmit={handleSubmit}
  style={{
    display: "flex",
    gap: "10px",
    alignItems: "center",
  }}
>
  <input
    type="text"
    value={input}
    onChange={(e) => setInput(e.target.value)}
    placeholder={
      isListening
        ? "Listening..."
        : "Ask Baseline Bank AI..."
    }
    disabled={thinking}
    style={{
      flex: 1,
      padding: "14px 16px",
      borderRadius: "12px",
      border: "1px solid rgba(255,255,255,0.15)",
      background: "rgba(255,255,255,0.08)",
      color: "white",
      outline: "none",
      fontSize: "15px",
    }}
  />

  <button
    type="button"
    onClick={handleVoiceInput}
    disabled={thinking}
    title={
      isListening
        ? "Stop Listening"
        : "Voice Input"
    }
    style={{
      width: "50px",
      height: "50px",
      borderRadius: "12px",
      border: "none",
      cursor: thinking ? "not-allowed" : "pointer",
      background: isListening
        ? "#dc2626"
        : "rgba(255,255,255,0.12)",
      color: "white",
      fontSize: "22px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "0.2s",
    }}
  >
    {isListening ? "⏹️" : "🎤"}
  </button>

  <button
    type="submit"
    disabled={thinking || !input.trim()}
    style={{
      padding: "14px 20px",
      borderRadius: "12px",
      border: "none",
      cursor:
        thinking || !input.trim()
          ? "not-allowed"
          : "pointer",
      background:
        thinking || !input.trim()
          ? "rgba(255,255,255,0.15)"
          : "#2563eb",
      color: "white",
      fontWeight: "600",
      fontSize: "15px",
    }}
  >
    Send
  </button>
</form>
        </div>
      </div>
    </div>
  );
}