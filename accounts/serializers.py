
from rest_framework import serializers

from .models import (
    BankAccount,
    Transaction,
    Beneficiary,
    BankCard,
)

# =========================================================
# BANK ACCOUNT SERIALIZER
# =========================================================

class BankAccountSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        source="user.username",
        read_only=True
    )

    class Meta:
        model = BankAccount

        fields = [
            "id",
            "username",
            "account_number",
            "main_balance",
            "savings_balance",
            "created_at",
        ]

        read_only_fields = fields


# =========================================================
# TRANSACTION SERIALIZER
# =========================================================

class TransactionSerializer(serializers.ModelSerializer):

    account_user = serializers.CharField(
        source="bank_account.user.username",
        read_only=True
    )

    class Meta:
        model = Transaction

        fields = [
            "id",
            "account_user",
            "transaction_type",
            "amount",
            "timestamp",
            "description",
        ]

        read_only_fields = fields


# =========================================================
# BENEFICIARY SERIALIZER
# =========================================================

class BeneficiarySerializer(serializers.ModelSerializer):

    class Meta:
        model = Beneficiary

        fields = [
            "id",
            "name",
            "account_number",
            "bank",
            "account_type",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]
        # =========================================================
# BANK CARD SERIALIZER
# =========================================================

class BankCardSerializer(serializers.ModelSerializer):

    masked_card_number = serializers.SerializerMethodField()

    class Meta:
        model = BankCard

        fields = [
            "id",
            "cardholder_name",
            "masked_card_number",
            "expiry_date",
            "card_type",
            "status",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "masked_card_number",
            "card_type",
            "status",
            "created_at",
        ]

    def get_masked_card_number(self, obj):

        return obj.masked_card_number()

