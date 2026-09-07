import { useEffect, useState } from "react";
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
        "Hello! 👋 I'm Your Baseline Bank AI Assistant. Ask Me About Your Balance, Savings, Spending, Income, Transactions, Transfers, Deposits, Withdrawals, Or Your Financial Health.",
    },
  ]);

  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const [pendingTransfer, setPendingTransfer] = useState(null);
  const [pendingDeposit, setPendingDeposit] = useState(null);
  const [pendingWithdrawal, setPendingWithdrawal] = useState(null);
  const [pendingInterAccountTransfer, setPendingInterAccountTransfer] =
    useState(null);

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

      console.log("AI MAIN BALANCE:", newMainBalance);
      console.log("AI SAVINGS BALANCE:", newSavingsBalance);

      setMainBalance(
        Number.isFinite(newMainBalance) ? newMainBalance : 0
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

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchBankData();
  }, []);

  // =========================================================
  // AMOUNT EXTRACTION
  // Supports:
  // 500
  // 500.50
  // R500
  // R 500
  // 2k
  // 2.5k
  // R2k
  // R 2.5k
  // R2,000
  // R 2,000
  // =========================================================

  const extractAmount = (text) => {
    if (!text) return null;

    const normalized = String(text)
      .toLowerCase()
      .replace(/,/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const match = normalized.match(
      /(?:r\s*)?(\d+(?:\.\d+)?)\s*(k)?\b/i
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

    return Number.isFinite(amount) ? amount : 0;
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
        ""
    );
  };

  // =========================================================
  // INTERNAL TRANSFERS
  // =========================================================

  const isInternalTransfer = (transaction) => {
    const description =
      getTransactionDescription(transaction).toLowerCase();

    const type = getTransactionType(transaction);

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
    const type = getTransactionType(transaction);

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
    const type = getTransactionType(transaction);

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

    const expenses = transactions.filter(
      (transaction) =>
        isExpenseTransaction(transaction) &&
        !isInternalTransfer(transaction) &&
        getTransactionAmount(transaction) > 0
    );

    if (expenses.length === 0) {
      return null;
    }

    return expenses.reduce(
      (largest, current) => {
        return getTransactionAmount(current) >
          getTransactionAmount(largest)
          ? current
          : largest;
      },
      expenses[0]
    );
  };

  // =========================================================
  // NATURAL-LANGUAGE BANKING INTELLIGENCE
  // =========================================================

  // =========================================================
  // AFFORDABILITY
  // =========================================================

  const isAffordabilityCommand = (text) => {
    const normalized = text.trim().toLowerCase();

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

    const availableBalance = Number(
      mainBalance || 0
    );

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
      `⚠️ Short By: R ${formatMoney(shortfall)}.`
    );
  };

  // =========================================================
  // SPENDING CATEGORIES
  // =========================================================

  const getSpendingCategory = (transaction) => {
    const type = getTransactionType(transaction);

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
      normalized.includes(
        "where am i spending"
      ) ||
      normalized.includes(
        "what do i spend the most"
      ) ||
      normalized.includes(
        "what am i spending the most"
      ) ||
      normalized.includes(
        "biggest spending category"
      ) ||
      normalized.includes(
        "largest spending category"
      ) ||
      normalized.includes(
        "where does my money go"
      ) ||
      normalized.includes(
        "what category do i spend the most"
      ) ||
      normalized.includes(
        "what do i spend most on"
      ) ||
      normalized.includes(
        "what am i spending most on"
      )
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
  // FINANCIAL HEALTH
  // =========================================================

  const isFinancialHealthCommand = (text) => {
    const normalized =
      text.trim().toLowerCase();

    return (
      normalized.includes(
        "how am i doing financially"
      ) ||
      normalized.includes(
        "how am i doing with my money"
      ) ||
      normalized.includes(
        "financial health"
      ) ||
      normalized.includes(
        "financial checkup"
      ) ||
      normalized.includes(
        "money checkup"
      ) ||
      normalized.includes(
        "managing my money"
      ) ||
      normalized.includes(
        "am i managing my money"
      ) ||
      normalized.includes(
        "financial situation"
      ) ||
      normalized.includes(
        "financial score"
      )
    );
  };

  const getFinancialHealthResponse = () => {
    const main = Number(
      mainBalance || 0
    );

    const savings = Number(
      savingsBalance || 0
    );

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
    } else if (
      savingsPercentage >= 10
    ) {
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

        recipient = recipient
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

    // Savings -> Main
    if (
      hasSavings &&
      hasMain &&
      (
        /from\s+(?:my\s+)?savings?\b.*to\s+(?:my\s+)?main\b/i.test(
          normalized
        ) ||
        /from\s+(?:my\s+)?saving\b.*to\s+(?:my\s+)?main\b/i.test(
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
        direction: "savings_to_main",
      };
    }

    // Main -> Savings
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

    // Move To Savings Without Explicit Source
    if (
      !hasMain &&
      /\b(?:to|into)\s+(?:my\s+)?savings?\b/i.test(
        normalized
      )
    ) {
      return {
        amount,
        direction: "main_to_savings",
      };
    }

    // Move To Main Without Explicit Source
    if (
      !hasSavings &&
      /\b(?:to|into)\s+(?:my\s+)?main\b/i.test(
        normalized
      )
    ) {
      return {
        amount,
        direction: "savings_to_main",
      };
    }

    return null;
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
      normalized.includes("put ") &&
        normalized.includes("into ") ||
      normalized.includes("add ") &&
        normalized.includes("to ")
    );
  };

  const extractDepositAccount = (text) => {
    const normalized =
      text.trim().toLowerCase();

    if (
      /\b(?:into|to|in)\s+(?:my\s+)?savings?\b/i.test(
        normalized
      ) ||
      /\b(?:into|to|in)\s+(?:my\s+)?saving\b/i.test(
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
      /\bfrom\s+(?:my\s+)?saving(?:s)?(?:\s+account)?\b/i.test(
        normalized
      ) ||
      /\bfrom\s+(?:my\s+)?saving\b/i.test(
        normalized
      ) ||
      /\bfrom\s+savings\b/i.test(
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
        transfer.direction ===
        "main_to_savings"
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
        direction ===
        "main_to_savings";

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
      normalized.includes(
        "good morning"
      ) ||
      normalized.includes(
        "good afternoon"
      ) ||
      normalized.includes(
        "good evening"
      )
    ) {
      return (
        "👋 Hello! I'm Your Baseline Bank AI Assistant.\n\n" +
        "I Can Help You With:\n" +
        "💳 Balances\n" +
        "💰 Savings\n" +
        "💸 Spending\n" +
        "📊 Spending Categories\n" +
        "📈 Financial Health\n" +
        "🔄 Transfers\n" +
        "💵 Deposits\n" +
        "🏧 Withdrawals\n" +
        "📋 Transactions\n\n" +
        "What Would You Like To Know?"
      );
    }

    // =======================================================
    // TOTAL BALANCE
    // =======================================================

    if (
      normalized.includes(
        "total balance"
      ) ||
      normalized.includes(
        "combined balance"
      ) ||
      normalized.includes(
        "overall balance"
      ) ||
      normalized.includes(
        "how much money do i have total"
      )
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
      normalized.includes(
        "savings balance"
      ) ||
      normalized.includes(
        "saving balance"
      ) ||
      normalized.includes(
        "how much is in savings"
      ) ||
      normalized.includes(
        "how much is in my savings"
      ) ||
      normalized.includes(
        "money in savings"
      )
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
      normalized.includes(
        "main balance"
      ) ||
      normalized.includes(
        "current balance"
      ) ||
      normalized.includes(
        "bank balance"
      ) ||
      normalized.includes(
        "account balance"
      ) ||
      normalized.includes(
        "what's my balance"
      ) ||
      normalized.includes(
        "what is my balance"
      ) ||
      normalized.includes(
        "whats my balance"
      ) ||
      normalized.includes(
        "how much do i have"
      ) ||
      normalized.includes(
        "how much money do i have"
      ) ||
      normalized.includes(
        "how much is in my account"
      ) ||
      normalized.includes(
        "how much do i currently have"
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
      normalized.includes(
        "spent this month"
      ) ||
      normalized.includes(
        "spending this month"
      ) ||
      normalized.includes(
        "monthly spending"
      ) ||
      normalized.includes(
        "how much did i spend"
      )
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
      normalized.includes(
        "biggest expense"
      ) ||
      normalized.includes(
        "largest expense"
      ) ||
      normalized.includes(
        "most expensive transaction"
      )
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
      normalized.includes(
        "total spending"
      ) ||
      normalized.includes(
        "how much have i spent"
      ) ||
      normalized.includes(
        "how much money have i spent"
      )
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
      normalized.includes(
        "total income"
      ) ||
      normalized.includes(
        "how much have i earned"
      ) ||
      normalized.includes(
        "how much money have i received"
      ) ||
      normalized.includes(
        "my income"
      )
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
      normalized.includes(
        "recent transactions"
      ) ||
      normalized.includes(
        "latest transactions"
      ) ||
      normalized.includes(
        "show my transactions"
      ) ||
      normalized.includes(
        "show transactions"
      ) ||
      normalized.includes(
        "my transactions"
      )
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
      normalized.includes(
        "financial summary"
      ) ||
      normalized.includes(
        "money summary"
      ) ||
      normalized.includes(
        "give me a summary"
      ) ||
      normalized.includes(
        "account summary"
      )
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
      normalized.includes(
        "what can you do"
      ) ||
      normalized.includes(
        "how can you help"
      )
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
        "💸 Withdraw Money\n" +
        "💰 Deposit Money\n" +
        "🔄 Move Money Between Main And Savings\n" +
        "👤 Send Money To Beneficiaries\n" +
        "💡 Check Whether You Can Afford Something\n\n" +
        "Try: \"Can I Afford R1,000?\""
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
      "• Can I Afford R1,000?\n" +
      "• Where Am I Spending Most?\n" +
      "• How Am I Doing Financially?\n" +
      "• How Much Did I Spend This Month?\n" +
      "• Show My Recent Transactions"
    );
  };

  // =========================================================
  // HANDLE SUBMIT
  // =========================================================

  const handleSubmit = async (
    event
  ) => {
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
        // YES / CONFIRMATION
        // ===================================================

        const isYes =
          normalized === "yes" ||
          normalized === "y" ||
          normalized.includes(
            "yes please"
          ) ||
          normalized.includes(
            "go ahead"
          ) ||
          normalized.includes(
            "confirm"
          );

        // ===================================================
        // NO / CANCELLATION
        // ===================================================

        const isNo =
          normalized === "no" ||
          normalized === "n" ||
          normalized.includes(
            "cancel"
          ) ||
          normalized.includes(
            "stop"
          );

        // ===================================================
        // CONFIRM PENDING ACTION
        // ===================================================

        if (isYes) {
          if (pendingWithdrawal) {
            await executeAIWithdrawal(
              pendingWithdrawal
            );
            return;
          }

          if (pendingDeposit) {
            await executeAIDeposit(
              pendingDeposit
            );
            return;
          }

          if (
            pendingInterAccountTransfer
          ) {
            await executeAIInterAccountTransfer(
              pendingInterAccountTransfer
            );
            return;
          }

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
        // CANCEL PENDING ACTION
        // ===================================================

        if (isNo) {
          const hadPendingAction =
            pendingWithdrawal ||
            pendingDeposit ||
            pendingInterAccountTransfer ||
            pendingTransfer;

          setPendingWithdrawal(null);
          setPendingDeposit(null);
          setPendingInterAccountTransfer(
            null
          );
          setPendingTransfer(null);

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
        // Clear Previous Pending Actions
        // ===================================================

        setPendingWithdrawal(null);
        setPendingDeposit(null);
        setPendingInterAccountTransfer(
          null
        );
        setPendingTransfer(null);

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
    "Can I Afford R1,000?",
    "Where Am I Spending Most?",
    "How Am I Doing Financially?",
    "How Much Did I Spend This Month?",
    "Show My Recent Transactions",
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
        {/* ===================================================
            HEADER
        =================================================== */}

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

        {/* ===================================================
            BALANCE CARDS
        =================================================== */}

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

        {/* ===================================================
            CHAT CONTAINER
        =================================================== */}

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
          {/* =================================================
              CHAT MESSAGES
          ================================================= */}

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

          {/* =================================================
              SUGGESTIONS
          ================================================= */}

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

          {/* =================================================
              INPUT
          ================================================= */}

          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              gap: "10px",
              padding: "18px 24px 24px",
              borderTop:
                "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <input
              value={input}
              onChange={(event) =>
                setInput(
                  event.target.value
                )
              }
              placeholder="Ask Baseline AI..."
              disabled={thinking}
              style={{
                flex: 1,
                padding:
                  "14px 16px",
                borderRadius:
                  "12px",
                border:
                  "1px solid rgba(255,255,255,0.12)",
                background:
                  "rgba(0,0,0,0.25)",
                color:
                  "#ffffff",
                outline:
                  "none",
                fontSize:
                  "15px",
              }}
            />

            <button
              type="submit"
              disabled={
                thinking ||
                !input.trim()
              }
              style={{
                padding:
                  "14px 22px",
                borderRadius:
                  "12px",
                border: "none",
                background:
                  thinking ||
                  !input.trim()
                    ? "#475569"
                    : "#2563eb",
                color:
                  "#ffffff",
                fontWeight:
                  "600",
                cursor:
                  thinking ||
                  !input.trim()
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {thinking
                ? "..."
                : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}