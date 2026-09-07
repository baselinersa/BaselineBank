
from decimal import Decimal

from django.contrib import admin
from django.contrib.admin import AdminSite
from django.contrib.auth import get_user_model
from django.db.models import Sum, DecimalField, Q
from django.db.models.functions import Coalesce

from .models import BankAccount, Transaction


# =========================================================
# BASELINE BANK ADMIN SITE
# =========================================================

class BaselineBankAdminSite(AdminSite):

    site_header = "🏦 Baseline Bank Administration"
    site_title = "Baseline Bank Admin"
    index_title = "Baseline Bank Dashboard"

    def index(self, request, extra_context=None):

        User = get_user_model()

        ZERO = Decimal("0.00")

        MONEY_FIELD = DecimalField(
            max_digits=12,
            decimal_places=2
        )

        # =====================================================
        # CUSTOMER STATISTICS
        # =====================================================

        user_count = User.objects.count()

        active_user_count = User.objects.filter(
            is_active=True
        ).count()

        inactive_user_count = User.objects.filter(
            is_active=False
        ).count()

        # =====================================================
        # BANK ACCOUNT STATISTICS
        # =====================================================

        account_count = BankAccount.objects.count()

        # =====================================================
        # TRANSACTION STATISTICS
        # =====================================================

        transaction_count = Transaction.objects.count()

        # =====================================================
        # MAIN ACCOUNT FUNDS
        # =====================================================

        main_total = (
            BankAccount.objects.aggregate(
                total=Coalesce(
                    Sum("main_balance"),
                    ZERO,
                    output_field=MONEY_FIELD
                )
            )["total"]
            or ZERO
        )

        # =====================================================
        # SAVINGS FUNDS
        # =====================================================

        savings_total = (
            BankAccount.objects.aggregate(
                total=Coalesce(
                    Sum("savings_balance"),
                    ZERO,
                    output_field=MONEY_FIELD
                )
            )["total"]
            or ZERO
        )

        # =====================================================
        # TOTAL BANK FUNDS
        # =====================================================

        total_funds = (
            main_total +
            savings_total
        )

        # =====================================================
        # LOW BALANCE ACCOUNTS
        # =====================================================

        low_balance_count = BankAccount.objects.filter(
            Q(main_balance__lt=Decimal("200.00")) |
            Q(savings_balance__lt=Decimal("200.00"))
        ).count()

        # =====================================================
        # TRANSACTION TYPE TOTALS
        # =====================================================

        deposit_total = (
            Transaction.objects.filter(
                transaction_type__iexact="deposit"
            ).aggregate(
                total=Coalesce(
                    Sum("amount"),
                    ZERO,
                    output_field=MONEY_FIELD
                )
            )["total"]
            or ZERO
        )

        withdrawal_total = (
            Transaction.objects.filter(
                transaction_type__iexact="withdraw"
            ).aggregate(
                total=Coalesce(
                    Sum("amount"),
                    ZERO,
                    output_field=MONEY_FIELD
                )
            )["total"]
            or ZERO
        )

        transfer_total = (
            Transaction.objects.filter(
                transaction_type__icontains="transfer"
            ).aggregate(
                total=Coalesce(
                    Sum("amount"),
                    ZERO,
                    output_field=MONEY_FIELD
                )
            )["total"]
            or ZERO
        )

        # =====================================================
        # TRANSACTION TYPE COUNTS
        # =====================================================

        deposit_count = Transaction.objects.filter(
            transaction_type__iexact="deposit"
        ).count()

        withdrawal_count = Transaction.objects.filter(
            transaction_type__iexact="withdraw"
        ).count()

        transfer_count = Transaction.objects.filter(
            transaction_type__icontains="transfer"
        ).count()

        # =====================================================
        # RECENT TRANSACTIONS
        # =====================================================

        recent_transactions = (
            Transaction.objects
            .select_related(
                "bank_account",
                "bank_account__user"
            )
            .order_by("-timestamp")[:10]
        )

        # =====================================================
        # DASHBOARD CONTEXT
        # =====================================================

        context = {

            # Customers
            "user_count": user_count,
            "active_user_count": active_user_count,
            "inactive_user_count": inactive_user_count,

            # Accounts
            "account_count": account_count,

            # Transactions
            "transaction_count": transaction_count,

            # Funds
            "main_total": main_total,
            "savings_total": savings_total,
            "total_funds": total_funds,

            # Transaction totals
            "deposit_total": deposit_total,
            "withdrawal_total": withdrawal_total,
            "transfer_total": transfer_total,

            # Transaction counts
            "deposit_count": deposit_count,
            "withdrawal_count": withdrawal_count,
            "transfer_count": transfer_count,

            # Alerts
            "low_balance_count": low_balance_count,

            # Recent activity
            "recent_transactions": recent_transactions,
        }

        if extra_context:
            context.update(extra_context)

        return super().index(
            request,
            extra_context=context
        )


# =========================================================
# CREATE ADMIN SITE
# =========================================================

baseline_admin_site = BaselineBankAdminSite(
    name="baseline_admin"
)


# =========================================================
# BANK ACCOUNT ADMIN
# =========================================================

@admin.register(
    BankAccount,
    site=baseline_admin_site
)
class BankAccountAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "user",
        "account_number",
        "main_balance",
        "savings_balance",
        "total_balance",
    )

    search_fields = (
        "user__username",
        "user__email",
        "account_number",
    )

    list_filter = (
        "user__is_active",
    )

    ordering = (
        "-id",
    )

    readonly_fields = (
        "total_balance",
    )

    fieldsets = (
        (
            "👤 Account Owner",
            {
                "fields": (
                    "user",
                    "account_number",
                )
            },
        ),
        (
            "💰 Account Balances",
            {
                "fields": (
                    "main_balance",
                    "savings_balance",
                    "total_balance",
                )
            },
        ),
    )

    @admin.display(
        description="Total Balance"
    )
    def total_balance(self, obj):

        return (
            obj.main_balance +
            obj.savings_balance
        )


# =========================================================
# TRANSACTION ADMIN
# =========================================================

@admin.register(
    Transaction,
    site=baseline_admin_site
)
class TransactionAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "bank_account",
        "transaction_type",
        "account_type",
        "amount",
        "description",
        "timestamp",
    )

    search_fields = (
        "bank_account__user__username",
        "bank_account__account_number",
        "description",
        "transaction_type",
    )

    list_filter = (
        "transaction_type",
        "account_type",
        "timestamp",
    )

    ordering = (
        "-timestamp",
    )

    readonly_fields = (
        "timestamp",
    )

    date_hierarchy = "timestamp"

    list_per_page = 25


# =========================================================
# REGISTER USERS
# =========================================================

baseline_admin_site.register(
    get_user_model()
)

