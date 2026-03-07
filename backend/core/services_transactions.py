import decimal
from django.utils.dateparse import parse_datetime
from django.core.exceptions import ValidationError
from .models import Transaction, Account, Category


def _parse_amount(amount_str):
    try:
        amount = decimal.Decimal(str(amount_str))
    except Exception:
        raise ValidationError("amount must be a decimal number")

    if amount == 0:
        raise ValidationError("amount cannot be 0")

    return amount


def _parse_trans_date(dt_str):
    dt = parse_datetime(dt_str) if dt_str else None
    if not dt:
        raise ValidationError("trans_date must be ISO datetime string")
    return dt


def create_transaction_for_user(user, payload):

    account_id = payload.get("account_id")
    category_id = payload.get("category_id")

    if not account_id or not category_id:
        raise ValidationError("account_id and category_id are required")

    account = Account.objects.filter(id=account_id, user=user).first()
    if not account:
        raise ValidationError("invalid account_id")

    category = Category.objects.filter(id=category_id, user=user).first()
    if not category:
        raise ValidationError("invalid category_id")

    amount = _parse_amount(payload.get("amount"))
    trans_date = _parse_trans_date(payload.get("trans_date"))
    note = payload.get("note", "")

    tx = Transaction.objects.create(
        user=user,
        account=account,
        category=category,
        amount=amount,
        trans_date=trans_date,
        note=note
    )

    return tx


def get_transaction_for_user(user, tx_id):

    tx = Transaction.objects.filter(id=tx_id, user=user).select_related("account", "category").first()
    return tx


def list_transactions_for_user(user):

    return Transaction.objects.filter(user=user).select_related("account", "category").order_by("-trans_date", "-id")


def update_transaction_for_user(user, tx_id, payload):

    tx = get_transaction_for_user(user, tx_id)
    if not tx:
        return None

    if "account_id" in payload:
        account = Account.objects.filter(id=payload["account_id"], user=user).first()
        if not account:
            raise ValidationError("invalid account_id")
        tx.account = account

    if "category_id" in payload:
        category = Category.objects.filter(id=payload["category_id"], user=user).first()
        if not category:
            raise ValidationError("invalid category_id")
        tx.category = category

    if "amount" in payload:
        tx.amount = _parse_amount(payload["amount"])

    if "trans_date" in payload:
        tx.trans_date = _parse_trans_date(payload["trans_date"])

    if "note" in payload:
        tx.note = payload.get("note", "")

    tx.save()
    return tx


def delete_transaction_for_user(user, tx_id):

    tx = get_transaction_for_user(user, tx_id)
    if not tx:
        return False

    tx.delete()
    return True