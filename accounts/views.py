
import random
from decimal import Decimal, InvalidOperation
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction as db_transaction


from .models import (
    BankAccount,
    Transaction,
    Beneficiary,
    BankCard,
)
from .serializers import (
    BankAccountSerializer,
    TransactionSerializer,
    BeneficiarySerializer,
    BankCardSerializer,
)


# =========================================================
# HELPER - GET CURRENT USER ACCOUNT
# =========================================================

def get_user_account(user):
    account, _ = BankAccount.objects.get_or_create(
        user=user
    )

    # Existing accounts created before account numbers
    # were introduced may have account_number = None.
    if not account.account_number:
        account.save()

    return account


# =========================================================
# HELPER - VALIDATE AMOUNT
# =========================================================

def validate_amount(value):

    try:
        amount = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None

    if amount <= Decimal("0"):
        return None

    return amount


# =========================================================
# GET ACCOUNT BALANCE
# =========================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def balance(request):

    account = get_user_account(request.user)

    serializer = BankAccountSerializer(account)

    return Response(serializer.data)


# =========================================================
# DEPOSIT
# =========================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def deposit(request):

    account = get_user_account(request.user)

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
                "success": False,
                "error": (
                    "Deposit amount must be "
                    "greater than zero."
                )
            },
            status=400
        )

    if account_type not in [
        "main",
        "savings"
    ]:
        return Response(
            {
                "success": False,
                "error": (
                    "Account type must be "
                    "'main' or 'savings'."
                )
            },
            status=400
        )

    try:

        account.deposit(
            amount,
            account_type
        )

        return Response(
            {
                "success": True,
                "message": "Deposit successful.",
                "account_number": (
                    account.account_number
                ),
                "main_balance": (
                    account.main_balance
                ),
                "savings_balance": (
                    account.savings_balance
                ),
                "total_balance": (
                    account.main_balance
                    + account.savings_balance
                )
            }
        )

    except ValueError as exc:

        return Response(
            {
                "success": False,
                "error": str(exc)
            },
            status=400
        )


# =========================================================
# WITHDRAW
# =========================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def withdraw(request):

    account = get_user_account(request.user)

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
                "success": False,
                "error": (
                    "Withdrawal amount must be "
                    "greater than zero."
                )
            },
            status=400
        )

    if account_type not in [
        "main",
        "savings"
    ]:
        return Response(
            {
                "success": False,
                "error": (
                    "Account type must be "
                    "'main' or 'savings'."
                )
            },
            status=400
        )

    try:

        account.withdraw(
            amount,
            account_type
        )

        return Response(
            {
                "success": True,
                "message": "Withdrawal successful.",
                "account_number": (
                    account.account_number
                ),
                "main_balance": (
                    account.main_balance
                ),
                "savings_balance": (
                    account.savings_balance
                ),
                "total_balance": (
                    account.main_balance
                    + account.savings_balance
                )
            }
        )

    except ValueError as exc:

        return Response(
            {
                "success": False,
                "error": str(exc)
            },
            status=400
        )

# =========================================================
# BUY AIRTIME
# =========================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def buy_airtime(request):

    account = get_user_account(request.user)

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

    # =====================================================
    # VALIDATE MOBILE NUMBER
    # =====================================================

    if not mobile_number.isdigit() or len(mobile_number) != 10:

        return Response(
            {
                "success": False,
                "error": (
                    "Please enter a valid "
                    "10-digit mobile number."
                )
            },
            status=400
        )

    # =====================================================
    # VALIDATE NETWORK
    # =====================================================

    allowed_networks = [
        "vodacom",
        "mtn",
        "telkom",
        "cellc",
    ]

    if network not in allowed_networks:

        return Response(
            {
                "success": False,
                "error": "Please select a valid network."
            },
            status=400
        )

    # =====================================================
    # VALIDATE AMOUNT
    # =====================================================

    if amount is None:

        return Response(
            {
                "success": False,
                "error": (
                    "Airtime amount must be "
                    "greater than zero."
                )
            },
            status=400
        )

    # =====================================================
    # CHECK BALANCE
    # =====================================================

    if amount > account.main_balance:

        return Response(
            {
                "success": False,
                "error": (
                    "Insufficient main account balance."
                )
            },
            status=400
        )

    # =====================================================
    # PROCESS AIRTIME PURCHASE
    # =====================================================

    account.main_balance -= amount

    account.save(
        update_fields=[
            "main_balance"
        ]
    )

    # =====================================================
    # CREATE TRANSACTION
    # =====================================================

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

    return Response(
        {
            "success": True,
            "message": (
                f"R {amount:.2f} airtime "
                "purchased successfully."
            ),
            "mobile_number": mobile_number,
            "network": network.upper(),
            "amount": amount,
            "main_balance": account.main_balance,
            "savings_balance": account.savings_balance,
            "total_balance": (
                account.main_balance
                + account.savings_balance
            )
        }
    )

# =========================================================
# TRANSFER BETWEEN MAIN AND SAVINGS
# =========================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def transfer(request):

    account = get_user_account(request.user)

    amount = validate_amount(
        request.data.get("amount")
    )

    direction = request.data.get(
        "direction"
    )

    if amount is None:
        return Response(
            {
                "success": False,
                "error": (
                    "Transfer amount must be "
                    "greater than zero."
                )
            },
            status=400
        )

    if direction not in [
        "to_savings",
        "to_main"
    ]:
        return Response(
            {
                "success": False,
                "error": (
                    "Direction must be "
                    "'to_savings' or 'to_main'."
                )
            },
            status=400
        )

    try:

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

        return Response(
            {
                "success": True,
                "message": message,
                "account_number": (
                    account.account_number
                ),
                "main_balance": (
                    account.main_balance
                ),
                "savings_balance": (
                    account.savings_balance
                ),
                "total_balance": (
                    account.main_balance
                    + account.savings_balance
                )
            }
        )

    except ValueError as exc:

        return Response(
            {
                "success": False,
                "error": str(exc)
            },
            status=400
        )


# =========================================================
# TRANSFER TO ANOTHER USER
# =========================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def transfer_user(request):

    sender_account = get_user_account(
        request.user
    )

    amount = validate_amount(
        request.data.get("amount")
    )

    username = str(
        request.data.get(
            "username",
            ""
        )
    ).strip()

    if amount is None:
        return Response(
            {
                "success": False,
                "error": (
                    "Transfer amount must be "
                    "greater than zero."
                )
            },
            status=400
        )

    if not username:
        return Response(
            {
                "success": False,
                "error": (
                    "Recipient username is required."
                )
            },
            status=400
        )

    try:

        recipient_user = User.objects.get(
            username=username
        )

    except User.DoesNotExist:

        return Response(
            {
                "success": False,
                "error": (
                    "Recipient username does not exist."
                )
            },
            status=404
        )

    if recipient_user == request.user:

        return Response(
            {
                "success": False,
                "error": (
                    "You cannot transfer money "
                    "to yourself."
                )
            },
            status=400
        )

    try:

        sender_account.transfer_to_user(
            amount,
            recipient_user
        )

        recipient_account = get_user_account(
            recipient_user
        )

        return Response(
            {
                "success": True,
                "message": (
                    f"R {amount:.2f} successfully "
                    f"transferred to "
                    f"{recipient_user.username}."
                ),
                "sender_account_number": (
                    sender_account.account_number
                ),
                "recipient_account_number": (
                    recipient_account.account_number
                ),
                "main_balance": (
                    sender_account.main_balance
                ),
                "savings_balance": (
                    sender_account.savings_balance
                ),
                "total_balance": (
                    sender_account.main_balance
                    + sender_account.savings_balance
                )
            }
        )

    except ValueError as exc:

        return Response(
            {
                "success": False,
                "error": str(exc)
            },
            status=400
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

    tx = (
        Transaction.objects
        .filter(
            bank_account=account
        )
        .select_related("recipient")
        .order_by("-timestamp")
    )

    serializer = TransactionSerializer(
        tx,
        many=True
    )

    return Response(
        serializer.data
    )


# =========================================================
# ACCOUNT SUMMARY / DASHBOARD
# =========================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard(request):

    account = get_user_account(
        request.user
    )

    recent_transactions = (
        Transaction.objects
        .filter(
            bank_account=account
        )
        .select_related("recipient")
        .order_by("-timestamp")[:5]
    )

    return Response(
        {
            "username": request.user.username,

            "account_number": (
                account.account_number
            ),

            "main_balance": (
                account.main_balance
            ),

            "savings_balance": (
                account.savings_balance
            ),

            "total_balance": (
                account.main_balance
                + account.savings_balance
            ),

            "recent_transactions": (
                TransactionSerializer(
                    recent_transactions,
                    many=True
                ).data
            )
        }
    )
# =========================================================
# CHANGE PIN
# =========================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_pin(request):

    current_pin = str(
        request.data.get("current_pin", "")
    ).strip()

    new_pin = str(
        request.data.get("new_pin", "")
    ).strip()

    confirm_pin = str(
        request.data.get("confirm_pin", "")
    ).strip()

    # -----------------------------------------
    # VALIDATE CURRENT PIN
    # -----------------------------------------

    if not current_pin:
        return Response(
            {
                "success": False,
                "error": "Current PIN is required."
            },
            status=400
        )

    # -----------------------------------------
    # VALIDATE NEW PIN
    # -----------------------------------------

    if not new_pin:
        return Response(
            {
                "success": False,
                "error": "New PIN is required."
            },
            status=400
        )

    if not new_pin.isdigit():
        return Response(
            {
                "success": False,
                "error": "PIN must contain numbers only."
            },
            status=400
        )

    if len(new_pin) != 4:
        return Response(
            {
                "success": False,
                "error": "PIN must be exactly 4 digits."
            },
            status=400
        )

    if new_pin != confirm_pin:
        return Response(
            {
                "success": False,
                "error": "New PINs do not match."
            },
            status=400
        )

    if current_pin == new_pin:
        return Response(
            {
                "success": False,
                "error": "New PIN must be different from current PIN."
            },
            status=400
        )

    # -----------------------------------------
    # GET ACCOUNT
    # -----------------------------------------

    account = get_user_account(request.user)

    # -----------------------------------------
    # CHECK CURRENT PIN
    # -----------------------------------------

    if not account.pin:
        return Response(
            {
                "success": False,
                "error": "No PIN has been set for this account."
            },
            status=400
        )

    if not check_password(
        current_pin,
        account.pin
    ):
        return Response(
            {
                "success": False,
                "error": "Current PIN is incorrect."
            },
            status=400
        )

    # -----------------------------------------
    # SAVE NEW PIN
    # -----------------------------------------

    account.pin = make_password(new_pin)

    account.save(
        update_fields=["pin"]
    )

    return Response(
        {
            "success": True,
            "message": "PIN changed successfully."
        }
    )
# =========================================================
# RESET PASSWORD
# =========================================================

@api_view(["POST"])
def reset_password(request):

    username = str(
        request.data.get("username", "")
    ).strip()

    new_password = str(
        request.data.get("new_password", "")
    ).strip()

    confirm_password = str(
        request.data.get("confirm_password", "")
    ).strip()

    if not username:
        return Response(
            {
                "success": False,
                "error": "Username is required."
            },
            status=400
        )

    if not new_password:
        return Response(
            {
                "success": False,
                "error": "New password is required."
            },
            status=400
        )

    if len(new_password) < 8:
        return Response(
            {
                "success": False,
                "error": "Password must be at least 8 characters."
            },
            status=400
        )

    if new_password != confirm_password:
        return Response(
            {
                "success": False,
                "error": "Passwords do not match."
            },
            status=400
        )

    try:
        user = User.objects.get(
            username=username
        )

    except User.DoesNotExist:
        return Response(
            {
                "success": False,
                "error": "Username does not exist."
            },
            status=404
        )

    user.set_password(new_password)
    user.save()

    return Response(
        {
            "success": True,
            "message": "Password reset successfully. You can now log in."
        }
    )
# =========================================================
# BENEFICIARIES
# =========================================================

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def beneficiaries(request):

    # =====================================================
    # GET BENEFICIARIES
    # =====================================================

    if request.method == "GET":

        beneficiary_list = (
            Beneficiary.objects
            .filter(user=request.user)
            .order_by("-created_at")
        )

        serializer = BeneficiarySerializer(
            beneficiary_list,
            many=True
        )

        return Response(
            serializer.data
        )

    # =====================================================
    # POST - ADD BENEFICIARY
    # =====================================================

    name = str(
        request.data.get("name", "")
    ).strip()

    account_number = str(
        request.data.get("account_number", "")
    ).strip()

    bank = str(
        request.data.get("bank", "")
    ).strip()

    account_type = str(
        request.data.get(
            "account_type",
            "main"
        )
    ).strip()

    # =====================================================
    # VALIDATION
    # =====================================================

    if not name:
        return Response(
            {
                "success": False,
                "error": "Beneficiary name is required."
            },
            status=400
        )

    if not account_number:
        return Response(
            {
                "success": False,
                "error": "Account number is required."
            },
            status=400
        )

    if not account_number.isdigit():
        return Response(
            {
                "success": False,
                "error": "Account number must contain numbers only."
            },
            status=400
        )

    if not bank:
        return Response(
            {
                "success": False,
                "error": "Bank is required."
            },
            status=400
        )

    valid_banks = [
        "Baseline BANK",
        "ABSA",
        "Capitec",
        "FNB",
        "Nedbank",
        "Standard Bank",
        "TymeBank",
    ]

    if bank not in valid_banks:
        return Response(
            {
                "success": False,
                "error": "Invalid bank selected."
            },
            status=400
        )

    if account_type not in [
        "main",
        "savings"
    ]:
        return Response(
            {
                "success": False,
                "error": "Invalid account type."
            },
            status=400
        )

    # =====================================================
    # PREVENT DUPLICATE BENEFICIARY
    # =====================================================

    existing = Beneficiary.objects.filter(
        user=request.user,
        account_number=account_number,
        bank=bank
    ).first()

    if existing:
        return Response(
            {
                "success": False,
                "error": "This beneficiary already exists."
            },
            status=400
        )

    # =====================================================
    # CREATE BENEFICIARY
    # =====================================================

    beneficiary = Beneficiary.objects.create(
        user=request.user,
        name=name,
        account_number=account_number,
        bank=bank,
        account_type=account_type,
    )

    serializer = BeneficiarySerializer(
        beneficiary
    )

    return Response(
        {
            "success": True,
            "message": "Beneficiary added successfully.",
            "beneficiary": serializer.data,
        },
        status=201
    )


# =========================================================
# DELETE BENEFICIARY
# =========================================================

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_beneficiary(request, beneficiary_id):

    try:

        beneficiary = Beneficiary.objects.get(
            id=beneficiary_id,
            user=request.user
        )

    except Beneficiary.DoesNotExist:

        return Response(
            {
                "success": False,
                "error": "Beneficiary not found."
            },
            status=404
        )

    beneficiary.delete()

    return Response(
        {
            "success": True,
            "message": "Beneficiary deleted successfully."
        }
    ) 
# =========================================================
# TRANSFER TO BENEFICIARY
# =========================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def transfer_to_beneficiary(request):

    account = get_user_account(request.user)

    beneficiary_id = request.data.get(
        "beneficiary_id"
    )

    amount = validate_amount(
        request.data.get("amount")
    )

    account_type = str(
        request.data.get(
            "account_type",
            "main"
        )
    ).strip()

    # =====================================================
    # VALIDATE BENEFICIARY
    # =====================================================

    if not beneficiary_id:
        return Response(
            {
                "success": False,
                "error": "Beneficiary is required."
            },
            status=400
        )

    try:
        beneficiary = Beneficiary.objects.get(
            id=beneficiary_id,
            user=request.user
        )

    except Beneficiary.DoesNotExist:
        return Response(
            {
                "success": False,
                "error": "Beneficiary not found."
            },
            status=404
        )

    # =====================================================
    # VALIDATE AMOUNT
    # =====================================================

    if amount is None:
        return Response(
            {
                "success": False,
                "error": (
                    "Transfer amount must be "
                    "greater than zero."
                )
            },
            status=400
        )

    # =====================================================
    # VALIDATE ACCOUNT TYPE
    # =====================================================

    if account_type not in [
        "main",
        "savings"
    ]:
        return Response(
            {
                "success": False,
                "error": (
                    "Account type must be "
                    "'main' or 'savings'."
                )
            },
            status=400
        )

    # =====================================================
    # CHECK BALANCE
    # =====================================================

    if account_type == "main":

        if amount > account.main_balance:
            return Response(
                {
                    "success": False,
                    "error": "Insufficient main account balance."
                },
                status=400
            )

    else:

        if amount > account.savings_balance:
            return Response(
                {
                    "success": False,
                    "error": "Insufficient savings balance."
                },
                status=400
            )

    # =====================================================
    # BASELINE BANK TRANSFER
    # =====================================================

    if beneficiary.bank == "Baseline BANK":

        try:
            recipient_account = BankAccount.objects.get(
                account_number=beneficiary.account_number
            )

        except BankAccount.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "error": (
                        "The Baseline BANK account "
                        "could not be found."
                    )
                },
                status=404
            )

        if recipient_account == account:

            return Response(
                {
                    "success": False,
                    "error": (
                        "You cannot transfer money "
                        "to your own account."
                    )
                },
                status=400
            )

        # -----------------------------------------------
        # REMOVE MONEY FROM SENDER
        # -----------------------------------------------

        if account_type == "main":
            account.main_balance -= amount
        else:
            account.savings_balance -= amount

        account.save(
            update_fields=[
                "main_balance",
                "savings_balance"
            ]
        )

        # -----------------------------------------------
        # ADD MONEY TO RECIPIENT
        # -----------------------------------------------

        recipient_account.main_balance += amount

        recipient_account.save(
            update_fields=[
                "main_balance"
            ]
        )

        # -----------------------------------------------
        # TRANSACTION - SENDER
        # -----------------------------------------------

        Transaction.objects.create(
            bank_account=account,
            transaction_type="TRANSFER",
            account_type=account_type,
            amount=amount,
            recipient=recipient_account.user,
            description=(
                f"Transfer to beneficiary "
                f"{beneficiary.name}"
            )
        )

        # -----------------------------------------------
        # TRANSACTION - RECIPIENT
        # -----------------------------------------------

        Transaction.objects.create(
            bank_account=recipient_account,
            transaction_type="TRANSFER",
            account_type="main",
            amount=amount,
            recipient=account.user,
            description=(
                f"Transfer from "
                f"{account.user.username}"
            )
        )

        return Response(
            {
                "success": True,
                "message": (
                    f"R {amount:.2f} successfully "
                    f"transferred to "
                    f"{beneficiary.name}."
                ),
                "beneficiary": (
                    BeneficiarySerializer(
                        beneficiary
                    ).data
                ),
                "main_balance": (
                    account.main_balance
                ),
                "savings_balance": (
                    account.savings_balance
                ),
                "total_balance": (
                    account.main_balance
                    + account.savings_balance
                )
            }
        )

    # =====================================================
    # EXTERNAL BANK TRANSFER
    # =====================================================

    if account_type == "main":
        account.main_balance -= amount
    else:
        account.savings_balance -= amount

    account.save(
        update_fields=[
            "main_balance",
            "savings_balance"
        ]
    )

    Transaction.objects.create(
        bank_account=account,
        transaction_type="TRANSFER",
        account_type=account_type,
        amount=amount,
        description=(
            f"Transfer to {beneficiary.name} "
            f"({beneficiary.bank}) - "
            f"{beneficiary.account_number}"
        )
    )

    return Response(
        {
            "success": True,
            "message": (
                f"R {amount:.2f} successfully "
                f"transferred to "
                f"{beneficiary.name}."
            ),
            "beneficiary": (
                BeneficiarySerializer(
                    beneficiary
                ).data
            ),
            "main_balance": (
                account.main_balance
            ),
            "savings_balance": (
                account.savings_balance
            ),
            "total_balance": (
                account.main_balance
                + account.savings_balance
            )
        }
    )

    # =========================================================
# PAYSHAP TRANSFER
# =========================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def payshap_transfer(request):

    account = get_user_account(request.user)

    # =====================================================
    # GET REQUEST DATA
    # =====================================================

    proxy = str(
        request.data.get(
            "proxy",
            ""
        )
    ).strip()

    amount = validate_amount(
        request.data.get("amount")
    )

    account_type = str(
        request.data.get(
            "account_type",
            "main"
        )
    ).strip().lower()

    # =====================================================
    # VALIDATE PAYSHAP PROXY
    # =====================================================

    if not proxy:
        return Response(
            {
                "success": False,
                "error": "PayShap proxy is required."
            },
            status=400
        )

    # Allow South African mobile numbers
    # and PayShap-style proxy identifiers.

    if proxy.isdigit():

        if len(proxy) != 10 or not proxy.startswith("0"):
            return Response(
                {
                    "success": False,
                    "error": (
                        "Please enter a valid "
                        "10-digit PayShap mobile number."
                    )
                },
                status=400
            )

    # =====================================================
    # VALIDATE AMOUNT
    # =====================================================

    if amount is None:
        return Response(
            {
                "success": False,
                "error": (
                    "PayShap amount must be "
                    "greater than zero."
                )
            },
            status=400
        )

    # =====================================================
    # VALIDATE SOURCE ACCOUNT
    # =====================================================

    if account_type not in [
        "main",
        "savings"
    ]:
        return Response(
            {
                "success": False,
                "error": (
                    "Account type must be "
                    "'main' or 'savings'."
                )
            },
            status=400
        )

    # =====================================================
    # CHECK BALANCE
    # =====================================================

    if account_type == "main":

        if amount > account.main_balance:
            return Response(
                {
                    "success": False,
                    "error": (
                        "Insufficient main "
                        "account balance."
                    )
                },
                status=400
            )

    else:

        if amount > account.savings_balance:
            return Response(
                {
                    "success": False,
                    "error": (
                        "Insufficient savings "
                        "balance."
                    )
                },
                status=400
            )

    # =====================================================
    # GENERATE PAYSHAP REFERENCE
    # =====================================================

    payshap_reference = (
        "PS-"
        + str(random.randint(100000, 999999))
    )

    # =====================================================
    # DEDUCT MONEY
    # =====================================================

    if account_type == "main":

        account.main_balance -= amount

    else:

        account.savings_balance -= amount

    account.save(
        update_fields=[
            "main_balance",
            "savings_balance"
        ]
    )

    # =====================================================
    # CREATE TRANSACTION
    # =====================================================

    Transaction.objects.create(
        bank_account=account,
        transaction_type="PAYSHAP",
        account_type=account_type,
        amount=amount,
        description=(
            f"PayShap payment to "
            f"{proxy} - "
            f"Reference {payshap_reference}"
        )
    )

    # =====================================================
    # RESPONSE
    # =====================================================

    return Response(
        {
            "success": True,
            "message": (
                f"R {amount:.2f} successfully "
                f"sent via PayShap."
            ),

            "proxy": proxy,

            "amount": amount,

            "account_type": account_type,

            "reference": payshap_reference,

            "main_balance": (
                account.main_balance
            ),

            "savings_balance": (
                account.savings_balance
            ),

            "total_balance": (
                account.main_balance
                + account.savings_balance
            )
        }
    )
# =========================================================
# BUY ELECTRICITY
# =========================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def buy_electricity(request):

    account = get_user_account(request.user)

    meter_number = str(
        request.data.get(
            "meter_number",
            ""
        )
    ).strip()

    provider = str(
        request.data.get(
            "provider",
            ""
        )
    ).strip().lower()

    amount = validate_amount(
        request.data.get("amount")
    )

    # =====================================================
    # VALIDATE METER NUMBER
    # =====================================================

    if not meter_number:
        return Response(
            {
                "success": False,
                "error": "Meter number is required."
            },
            status=400
        )

    if not meter_number.isdigit():
        return Response(
            {
                "success": False,
                "error": (
                    "Meter number must contain "
                    "numbers only."
                )
            },
            status=400
        )

    if len(meter_number) < 10 or len(meter_number) > 20:
        return Response(
            {
                "success": False,
                "error": (
                    "Please enter a valid meter number."
                )
            },
            status=400
        )

    # =====================================================
    # VALIDATE PROVIDER
    # =====================================================

    allowed_providers = [
        "eskom",
        "municipality",
    ]

    if provider not in allowed_providers:
        return Response(
            {
                "success": False,
                "error": (
                    "Please select a valid "
                    "electricity provider."
                )
            },
            status=400
        )

    # =====================================================
    # VALIDATE AMOUNT
    # =====================================================

    if amount is None:
        return Response(
            {
                "success": False,
                "error": (
                    "Electricity amount must be "
                    "greater than zero."
                )
            },
            status=400
        )

    # =====================================================
    # CHECK BALANCE
    # =====================================================

    if amount > account.main_balance:
        return Response(
            {
                "success": False,
                "error": (
                    "Insufficient main account balance."
                )
            },
            status=400
        )

    # =====================================================
    # PROCESS ELECTRICITY PURCHASE
    # =====================================================

    account.main_balance -= amount

    account.save(
        update_fields=[
            "main_balance"
        ]
    )

    # =====================================================
    # CREATE TRANSACTION
    # =====================================================

    Transaction.objects.create(
        bank_account=account,
        transaction_type="ELECTRICITY",
        account_type="main",
        amount=amount,
        description=(
            f"Electricity purchase - "
            f"{provider.upper()} - "
            f"Meter {meter_number}"
        )
    )

    # =====================================================
    # RESPONSE
    # =====================================================

    return Response(
        {
            "success": True,
            "message": (
                f"R {amount:.2f} electricity "
                "purchased successfully."
            ),
            "meter_number": meter_number,
            "provider": provider.upper(),
            "amount": amount,
            "main_balance": account.main_balance,
            "savings_balance": account.savings_balance,
            "total_balance": (
                account.main_balance
                + account.savings_balance
            )
        }
    )
# =========================================================
# PAY BILLS
# =========================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def pay_bill(request):

    account = get_user_account(request.user)

    bill_type = str(
        request.data.get(
            "bill_type",
            ""
        )
    ).strip().lower()

    bill_account = str(
        request.data.get(
            "bill_account",
            ""
        )
    ).strip()

    amount = validate_amount(
        request.data.get("amount")
    )

    allowed_bill_types = [
        "water",
        "municipality",
        "internet",
        "insurance",
        "other",
    ]

    if bill_type not in allowed_bill_types:
        return Response(
            {
                "success": False,
                "error": "Please select a valid bill type."
            },
            status=400
        )

    if not bill_account:
        return Response(
            {
                "success": False,
                "error": (
                    "Account / Reference Number is required."
                )
            },
            status=400
        )

    if amount is None:
        return Response(
            {
                "success": False,
                "error": (
                    "Bill payment amount must be "
                    "greater than zero."
                )
            },
            status=400
        )

    if amount > account.main_balance:
        return Response(
            {
                "success": False,
                "error": (
                    "Insufficient main account balance."
                )
            },
            status=400
        )

    account.main_balance -= amount

    account.save(
        update_fields=[
            "main_balance"
        ]
    )

    Transaction.objects.create(
        bank_account=account,
        transaction_type="BILL_PAYMENT",
        account_type="main",
        amount=amount,
        description=(
            f"Bill payment - "
            f"{bill_type.upper()} - "
            f"Account {bill_account}"
        )
    )

    return Response(
        {
            "success": True,
            "message": (
                f"R {amount:.2f} "
                f"{bill_type.upper()} bill "
                "paid successfully."
            ),
            "bill_type": bill_type.upper(),
            "bill_account": bill_account,
            "amount": amount,
            "main_balance": account.main_balance,
            "savings_balance": account.savings_balance,
            "total_balance": (
                account.main_balance
                + account.savings_balance
            )
        }
    )

    # =========================================================
# BANK CARD API
# =========================================================

@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def bank_card(request):

    user = request.user

    card, created = BankCard.objects.get_or_create(
        user=user,
        defaults={
            "cardholder_name": (
                user.get_full_name()
                or user.username
            ),
            "last_four": str(
                random.randint(1000, 9999)
            ),
            "expiry_date": "09/30",
            "card_type": "DEBIT",
            "status": "ACTIVE",
        }
    )

    # =====================================================
    # GET CARD DETAILS
    # =====================================================

    if request.method == "GET":

        serializer = BankCardSerializer(card)

        return Response({
            "success": True,
            "card": serializer.data
        })

    # =====================================================
    # FREEZE / UNFREEZE CARD
    # =====================================================

    new_status = str(
        request.data.get(
            "status",
            ""
        )
    ).strip().upper()

    if new_status not in [
        "ACTIVE",
        "FROZEN",
        "BLOCKED"
    ]:
        return Response(
            {
                "success": False,
                "error": (
                    "Status must be ACTIVE, "
                    "FROZEN, or BLOCKED."
                )
            },
            status=400
        )

    if card.status == "BLOCKED":
        return Response(
            {
                "success": False,
                "error": (
                    "This card is permanently blocked "
                    "and cannot be changed."
                )
            },
            status=400
        )

    card.status = new_status

    card.save(
        update_fields=["status"]
    )

    serializer = BankCardSerializer(card)

    return Response({
        "success": True,
        "message": (
            "Card status updated successfully."
        ),
        "card": serializer.data
    })