
from django.urls import path

from . import views


urlpatterns = [

    # =========================================================
    # ACCOUNT
    # =========================================================

    path(
        "balance/",
        views.balance,
        name="balance"
    ),

    path(
        "dashboard/",
        views.dashboard,
        name="dashboard"
    ),


    # =========================================================
    # DEPOSIT / WITHDRAW
    # =========================================================

    path(
        "deposit/",
        views.deposit,
        name="deposit"
    ),

    path(
        "withdraw/",
        views.withdraw,
        name="withdraw"
    ),


    # =========================================================
    # TRANSFERS
    # =========================================================

    path(
        "transfer/",
        views.transfer,
        name="transfer"
    ),

    path(
        "transfer-user/",
        views.transfer_user,
        name="transfer-user"
    ),

    path(
    "transfer-beneficiary/",
    views.transfer_to_beneficiary,
    name="transfer-beneficiary"
),
# =========================================================
# PAYSHAP
# =========================================================

path(
    "payshap/",
    views.payshap_transfer,
    name="payshap"
),

    # =========================================================
    # TRANSACTION HISTORY
    # =========================================================

    path(
        "transactions/",
        views.transactions,
        name="transactions"
    ),


    # =========================================================
    # PIN
    # =========================================================

    path(
        "change-pin/",
        views.change_pin,
        name="change-pin"
    ),


    # =========================================================
    # PASSWORD RESET
    # =========================================================

    path(
        "reset-password/",
        views.reset_password,
        name="reset-password"
    ),


    # =========================================================
    # BENEFICIARIES
    # =========================================================

    path(
        "beneficiaries/",
        views.beneficiaries,
        name="beneficiaries"
    ),

    path(
        "beneficiaries/<int:beneficiary_id>/",
        views.delete_beneficiary,
        name="delete-beneficiary"
    ),
    path(
    "buy-airtime/",
    views.buy_airtime,
    name="buy-airtime"
),
# =========================================================
# BUY ELECTRICITY
# =========================================================

path(
    "buy-electricity/",
    views.buy_electricity,
    name="buy-electricity"
),
# =========================================================
# PAY BILLS
# =========================================================

path(
    "pay-bill/",
    views.pay_bill,
    name="pay-bill"
),

path(
    "bank-card/",
    views.bank_card,
    name="bank-card"
),

]

