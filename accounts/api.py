from decimal import Decimal, InvalidOperation

from django.contrib.auth.models import User
from django.db import transaction as db_transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import BankAccount, Transaction


# =========================================================
# HELPER - GET CURRENT USER'S BANK ACCOUNT
# =========================================================

def get_user_account(user):
    account, created = BankAccount.objects.get_or_create(
        user=user
    )

    return account


# =========================================================
# HELPER - VALIDATE AMOUNT
# =========================================================

def validate_amount(value):
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None

    if amount <= 0:
        return None

    return amount


# =========================================================
# DASHBOARD
# =========================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard(request):

    account = get_user_account(request.user)

   return Response({
    "username": request.user.username,
    "account_number": account.account_number,
    "main_balance": account.main_balance,
    "savings_balance": account.savings_balance,
})


# =========================================================
# DEPOSIT
# =========================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def deposit(request):

    amount = validate_amount(
        request.data.get("amount")
    )

    account_type = request.data.get(
        "account_type",
        "main"
    )

    if amount is None:
        return Response(
            {
                "error": "Please enter a valid deposit amount."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if account_type not in ["main", "savings"]:
        return Response(
            {
                "error": "Invalid account type."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:

        account = get_user_account(request.user)

        account.deposit(
            amount,
            account_type
        )

        return Response({
            "message": "Deposit successful.",
            "main_balance": account.main_balance,
            "savings_balance": account.savings_balance,
        })

    except ValueError as exc:

        return Response(
            {"error": str(exc)},
            status=status.HTTP_400_BAD_REQUEST
        )


# =========================================================
# WITHDRAW
# =========================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def withdraw(request):

    amount = validate_amount(
        request.data.get("amount")
    )

    account_type = request.data.get(
        "account_type",
        "main"
    )

    if amount is None:
        return Response(
            {
                "error": "Please enter a valid withdrawal amount."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if account_type not in ["main", "savings"]:
        return Response(
            {
                "error": "Invalid account type."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:

        account = get_user_account(request.user)

        account.withdraw(
            amount,
            account_type
        )

        return Response({
            "message": "Withdrawal successful.",
            "main_balance": account.main_balance,
            "savings_balance": account.savings_balance,
        })

     except ValueError as exc:

        return Response(
            {"error": str(exc)},
            status=status.HTTP_400_BAD_REQUEST
        )

        # =========================================================
# BUY AIRTIME
# =========================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def buy_airtime(request):

    mobile_number = str(
        request.data.get(
            "mobile_number",
            ""
        )
    ).strip()

    network = str(
        request.data.get(
            "network",
            ""
        )
    ).strip().lower()

    amount = validate_amount(
        request.data.get("amount")
    )

    # -----------------------------------------
    # VALIDATE MOBILE NUMBER
    # -----------------------------------------

    if not mobile_number.isdigit() or len(mobile_number) != 10:

        return Response(
            {
                "error": (
                    "Please enter a valid "
                    "10-digit mobile number."
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # -----------------------------------------
    # VALIDATE NETWORK
    # -----------------------------------------

    allowed_networks = [
        "vodacom",
        "mtn",
        "telkom",
        "cellc",
    ]

    if network not in allowed_networks:

        return Response(
            {
                "error": "Please select a valid network."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # -----------------------------------------
    # VALIDATE AMOUNT
    # -----------------------------------------

    if amount is None:

        return Response(
            {
                "error": (
                    "Please enter a valid "
                    "airtime amount."
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # -----------------------------------------
    # PROCESS AIRTIME PURCHASE
    # -----------------------------------------

    try:

        account = get_user_account(
            request.user
        )

        with db_transaction.atomic():

            if amount > account.main_balance:

                raise ValueError(
                    "Insufficient main account balance."
                )

            account.main_balance -= amount

            account.save(
                update_fields=[
                    "main_balance"
                ]
            )

            Transaction.objects.create(
                bank_account=account,
                transaction_type="AIRTIME",
                account_type="main",
                amount=amount,
                description=(
                    f"Airtime purchase - "
                    f"{network.upper()} - "
                    f"{mobile_number}"
                )
            )

        return Response({
            "message": (
                f"R {amount:.2f} airtime "
                "purchased successfully."
            ),
            "mobile_number": mobile_number,
            "network": network.upper(),
            "amount": amount,
            "main_balance": account.main_balance,
            "savings_balance": account.savings_balance,
        })

    except ValueError as exc:

        return Response(
            {"error": str(exc)},
            status=status.HTTP_400_BAD_REQUEST
        )


# =========================================================
# TRANSFER BETWEEN MAIN AND SAVINGS
# =========================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def transfer(request):

    amount = validate_amount(
        request.data.get("amount")
    )

    direction = request.data.get(
        "direction",
        "to_savings"
    )

    if amount is None:
        return Response(
            {
                "error": "Please enter a valid transfer amount."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if direction not in [
        "to_savings",
        "to_main"
    ]:
        return Response(
            {
                "error": "Invalid transfer direction."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:

        account = get_user_account(request.user)

        if direction == "to_savings":

            account.transfer_to_savings(
                amount
            )

            message = (
                "Transfer from Main Account "
                "to Savings Account successful."
            )

        else:

            account.transfer_to_main(
                amount
            )

            message = (
                "Transfer from Savings Account "
                "to Main Account successful."
            )

        return Response({
            "message": message,
            "main_balance": account.main_balance,
            "savings_balance": account.savings_balance,
        })

    except ValueError as exc:

        return Response(
            {"error": str(exc)},
            status=status.HTTP_400_BAD_REQUEST
        )


# =========================================================
# TRANSFER TO ANOTHER USER
# =========================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def transfer_user(request):

    username = str(
        request.data.get(
            "username",
            ""
        )
    ).strip()

    amount = validate_amount(
        request.data.get("amount")
    )

    # -----------------------------------------
    # VALIDATE USERNAME
    # -----------------------------------------

    if not username:

        return Response(
            {
                "error": "Recipient username is required."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # -----------------------------------------
    # VALIDATE AMOUNT
    # -----------------------------------------

    if amount is None:

        return Response(
            {
                "error": "Please enter a valid transfer amount."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # -----------------------------------------
    # FIND RECIPIENT
    # -----------------------------------------

    try:

        recipient = User.objects.get(
            username=username
        )

    except User.DoesNotExist:

        return Response(
            {
                "error": (
                    f"User '{username}' "
                    "does not exist."
                )
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # -----------------------------------------
    # PERFORM TRANSFER
    # -----------------------------------------

    try:

        account = get_user_account(
            request.user
        )

        with db_transaction.atomic():

            account.transfer_to_user(
                amount,
                recipient
            )

        return Response({
            "message": (
                f"R {amount:.2f} "
                f"transferred successfully "
                f"to {recipient.username}."
            ),
            "main_balance": account.main_balance,
            "savings_balance": account.savings_balance,
        })

    except ValueError as exc:

        return Response(
            {"error": str(exc)},
            status=status.HTTP_400_BAD_REQUEST
        )


# =========================================================
# TRANSACTION HISTORY
# =========================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def transactions(request):

    account = get_user_account(
        request.user
    )

    transaction_list = (
        Transaction.objects
        .filter(bank_account=account)
        .select_related("recipient")
        .order_by("-timestamp")
    )

    data = []

    for item in transaction_list:

        recipient_data = None

        if item.recipient:

            recipient_data = {
                "username": item.recipient.username,
                "email": item.recipient.email,
                "name": (
                    item.recipient.get_full_name()
                    or item.recipient.username
                ),
            }

        data.append({

            "id": item.id,

            "transaction_type":
                item.transaction_type,

            "type":
                item.transaction_type,

            "account_type":
                item.account_type,

            "amount":
                item.amount,

            "recipient":
                recipient_data,

            "timestamp":
                item.timestamp,

            "created_at":
                item.timestamp,

            "description":
                item.description,

            "status":
                "SUCCESSFUL",
        })

    return Response(data)