from decimal import Decimal, InvalidOperation
from django.core.exceptions import ValidationError

from .models import Account


def _parse_balance(balance_value):
    try:
        balance = Decimal(str(balance_value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValidationError("balance must be a valid decimal number")
    return balance


def list_accounts_for_user(user):
    return Account.objects.filter(user=user).order_by("name")


def get_account_for_user(user, account_id):
    return Account.objects.filter(id=account_id, user=user).first()


def create_account_for_user(user, payload):
    name = payload.get("name")
    account_type = payload.get("account_type")
    balance_value = payload.get("balance", 0)

    if not name or not account_type:
        raise ValidationError("name and account_type are required")

    balance = _parse_balance(balance_value)

    account = Account.objects.create(
        user=user,
        name=name,
        account_type=account_type,
        balance=balance,
    )
    return account


def update_account_for_user(user, account_id, payload):
    account = get_account_for_user(user, account_id)
    if not account:
        return None

    if "name" in payload:
        if not payload["name"]:
            raise ValidationError("name cannot be empty")
        account.name = payload["name"]

    if "account_type" in payload:
        if not payload["account_type"]:
            raise ValidationError("account_type cannot be empty")
        account.account_type = payload["account_type"]

    if "balance" in payload:
        account.balance = _parse_balance(payload["balance"])

    account.save()
    return account


def delete_account_for_user(user, account_id):
    account = get_account_for_user(user, account_id)
    if not account:
        return False

    if account.transactions.exists():
        raise ValidationError("cannot delete account with existing transactions")

    account.delete()
    return True