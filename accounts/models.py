from decimal import Decimal
import random

from django.db import models
from django.contrib.auth.models import User


# =========================================================
# ACCOUNT NUMBER GENERATOR
# =========================================================

def generate_account_number():
    """
    Generate a unique 13-digit bank account number.
    """

    while True:
        account_number = str(
            random.randint(
                1000000000000,
                9999999999999
            )
        )

        if not BankAccount.objects.filter(
            account_number=account_number
        ).exists():
            return account_number


# =========================================================
# TRANSACTION MODEL
# =========================================================
class Transaction(models.Model):

    TRANSACTION_TYPES = [
        ("DEPOSIT", "Deposit"),
        ("WITHDRAW", "Withdraw"),
        ("TRANSFER", "Transfer"),
        ("AIRTIME", "Airtime"),
        ("ELECTRICITY", "Electricity"),
        ("BILL_PAYMENT", "Bill Payment"),
    ]

    ACCOUNT_TYPES = [
        ("main", "Main Account"),
        ("savings", "Savings Account"),
    ]

    bank_account = models.ForeignKey(
        "BankAccount",
        on_delete=models.CASCADE,
        related_name="transactions"
    )

    transaction_type = models.CharField(
        max_length=20,
        choices=TRANSACTION_TYPES
    )

    account_type = models.CharField(
        max_length=10,
        choices=ACCOUNT_TYPES,
        default="main"
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    recipient = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="received_transactions"
    )

    timestamp = models.DateTimeField(
        auto_now_add=True
    )

    description = models.TextField(
        blank=True,
        null=True
    )

    def __str__(self):

        return (
            f"{self.transaction_type} - "
            f"R {self.amount:.2f}"
        )


# =========================================================
# BANK ACCOUNT MODEL
# =========================================================

class BankAccount(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="account"
    )

    account_number = models.CharField(
        max_length=13,
        unique=True,
        blank=True,
        null=True
    )

    pin = models.CharField(
        max_length=128,
        blank=True,
        null=True
    )

    main_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00")
    )

    savings_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00")
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    # =====================================================
    # SAVE
    # =====================================================

    def save(self, *args, **kwargs):

        if not self.account_number:
            self.account_number = (
                generate_account_number()
            )

        super().save(*args, **kwargs)

    # =====================================================
    # GET BALANCE
    # =====================================================

    def _get_balance(self, account_type):

        if account_type == "savings":
            return self.savings_balance

        return self.main_balance

    # =====================================================
    # SET BALANCE
    # =====================================================

    def _set_balance(self, account_type, value):

        if account_type == "savings":
            self.savings_balance = value
        else:
            self.main_balance = value

    # =====================================================
    # DEPOSIT
    # =====================================================

    def deposit(self, amount, account_type="main"):

        amount = Decimal(str(amount))

        if amount <= Decimal("0"):
            raise ValueError(
                "Deposit must be greater than 0"
            )

        if account_type not in [
            "main",
            "savings"
        ]:
            raise ValueError(
                "Invalid account type"
            )

        balance = self._get_balance(
            account_type
        )

        self._set_balance(
            account_type,
            balance + amount
        )

        self.save(
            update_fields=[
                "main_balance",
                "savings_balance"
            ]
        )

        Transaction.objects.create(
            bank_account=self,
            transaction_type="DEPOSIT",
            account_type=account_type,
            amount=amount,
            description=(
                f"Deposit to {account_type}"
            )
        )

    # =====================================================
    # WITHDRAW
    # =====================================================

    def withdraw(self, amount, account_type="main"):

        amount = Decimal(str(amount))

        if amount <= Decimal("0"):
            raise ValueError(
                "Withdraw must be greater than 0"
            )

        if account_type not in [
            "main",
            "savings"
        ]:
            raise ValueError(
                "Invalid account type"
            )

        balance = self._get_balance(
            account_type
        )

        if amount > balance:
            raise ValueError(
                "Insufficient balance"
            )

        self._set_balance(
            account_type,
            balance - amount
        )

        self.save(
            update_fields=[
                "main_balance",
                "savings_balance"
            ]
        )

        Transaction.objects.create(
            bank_account=self,
            transaction_type="WITHDRAW",
            account_type=account_type,
            amount=amount,
            description=(
                f"Withdraw from {account_type}"
            )
        )

    # =====================================================
    # MAIN → SAVINGS
    # =====================================================

    def transfer_to_savings(self, amount):

        amount = Decimal(str(amount))

        if amount <= Decimal("0"):
            raise ValueError(
                "Transfer must be greater than 0"
            )

        if amount > self.main_balance:
            raise ValueError(
                "Not enough main balance"
            )

        self.main_balance -= amount
        self.savings_balance += amount

        self.save(
            update_fields=[
                "main_balance",
                "savings_balance"
            ]
        )

        Transaction.objects.create(
            bank_account=self,
            transaction_type="TRANSFER",
            account_type="main",
            amount=amount,
            description="Main → Savings"
        )

    # =====================================================
    # SAVINGS → MAIN
    # =====================================================

    def transfer_to_main(self, amount):

        amount = Decimal(str(amount))

        if amount <= Decimal("0"):
            raise ValueError(
                "Transfer must be greater than 0"
            )

        if amount > self.savings_balance:
            raise ValueError(
                "Not enough savings balance"
            )

        self.savings_balance -= amount
        self.main_balance += amount

        self.save(
            update_fields=[
                "main_balance",
                "savings_balance"
            ]
        )

        Transaction.objects.create(
            bank_account=self,
            transaction_type="TRANSFER",
            account_type="savings",
            amount=amount,
            description="Savings → Main"
        )

    # =====================================================
    # TRANSFER TO ANOTHER USER
    # =====================================================

    def transfer_to_user(
        self,
        amount,
        recipient_user
    ):

        amount = Decimal(str(amount))

        if amount <= Decimal("0"):
            raise ValueError(
                "Transfer must be greater than 0"
            )

        if not recipient_user:
            raise ValueError(
                "Recipient is required"
            )

        if recipient_user == self.user:
            raise ValueError(
                "You cannot transfer money to yourself"
            )

        if amount > self.main_balance:
            raise ValueError(
                "Not enough main balance"
            )

        recipient_account, _ = (
            BankAccount.objects.get_or_create(
                user=recipient_user
            )
        )

        self.main_balance -= amount

        self.save(
            update_fields=[
                "main_balance"
            ]
        )

        recipient_account.main_balance += amount

        recipient_account.save(
            update_fields=[
                "main_balance"
            ]
        )

        # Sender transaction
        Transaction.objects.create(
            bank_account=self,
            transaction_type="TRANSFER",
            account_type="main",
            amount=amount,
            recipient=recipient_user,
            description=(
                f"Transfer to "
                f"{recipient_user.username}"
            )
        )

        # Recipient transaction
        Transaction.objects.create(
            bank_account=recipient_account,
            transaction_type="TRANSFER",
            account_type="main",
            amount=amount,
            recipient=self.user,
            description=(
                f"Transfer from "
                f"{self.user.username}"
            )
        )

    # =====================================================
    # STRING
    # =====================================================

    def __str__(self):

        return (
            f"{self.user.username} - "
            f"{self.account_number}"
        )


# =========================================================
# BENEFICIARY MODEL
# =========================================================

class Beneficiary(models.Model):

    BANK_CHOICES = [
        ("Baseline BANK", "Baseline BANK"),
        ("ABSA", "ABSA"),
        ("Capitec", "Capitec"),
        ("FNB", "FNB"),
        ("Nedbank", "Nedbank"),
        ("Standard Bank", "Standard Bank"),
        ("TymeBank", "TymeBank"),
    ]

    ACCOUNT_TYPES = [
        ("main", "Main Account"),
        ("savings", "Savings Account"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="beneficiaries"
    )

    name = models.CharField(
        max_length=100
    )

    account_number = models.CharField(
        max_length=20
    )

    bank = models.CharField(
        max_length=50,
        choices=BANK_CHOICES
    )

    account_type = models.CharField(
        max_length=10,
        choices=ACCOUNT_TYPES,
        default="main"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):

        return (
            f"{self.name} - "
            f"{self.account_number}"
        )
  # =========================================================
# BANK CARD MODEL
# =========================================================

class BankCard(models.Model):

    STATUS_CHOICES = [
        ("ACTIVE", "Active"),
        ("FROZEN", "Frozen"),
        ("BLOCKED", "Blocked"),
    ]

    CARD_TYPE_CHOICES = [
        ("DEBIT", "Debit Card"),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="bank_card"
    )

    cardholder_name = models.CharField(
        max_length=150
    )

    last_four = models.CharField(
        max_length=4
    )

    expiry_date = models.CharField(
        max_length=5
    )

    card_type = models.CharField(
        max_length=20,
        choices=CARD_TYPE_CHOICES,
        default="DEBIT"
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="ACTIVE"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def masked_card_number(self):
        return (
            "•••• •••• •••• "
            f"{self.last_four}"
        )

    def __str__(self):
        return (
            f"{self.cardholder_name} - "
            f"{self.masked_card_number()}"
        )