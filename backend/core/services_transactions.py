import decimal

from django.core.exceptions import ValidationError
from django.db.models import Q
from django.utils.dateparse import parse_datetime

from .models import Account, Category, Transaction


def _parse_amount(amount_value):
    """
    Validate and convert the input amount into Decimal.

    Ensures:
    - amount is a valid decimal number
    - amount is greater than 0
    """
    try:
        amount = decimal.Decimal(str(amount_value))
    except (decimal.InvalidOperation, TypeError, ValueError):
        raise ValidationError("amount must be a valid decimal number")

    if amount <= 0:
        raise ValidationError("amount must be greater than 0")

    return amount


def _parse_trans_date(trans_date_str):
    """
    Parse ISO datetime string into a datetime object.
    """
    dt = parse_datetime(trans_date_str)

    if not dt:
        raise ValidationError("trans_date must be a valid ISO datetime string")

    return dt


def _get_user_account(user, account_id):
    """
    Retrieve an account belonging to the current user.
    Prevents accessing accounts of other users.
    """
    account = Account.objects.filter(id=account_id, user=user).first()

    if not account:
        raise ValidationError("invalid account_id")

    return account


def _get_user_category(user, category_id):
    """
    Retrieve a category belonging to the current user.
    """
    category = Category.objects.filter(id=category_id, user=user).first()

    if not category:
        raise ValidationError("invalid category_id")

    return category


def apply_transaction_to_account(account, category, amount):
    """
    Apply transaction impact to account balance.

    Income  -> increase balance
    Expense -> decrease balance
    """
    if category.category_type == Category.CategoryType.INCOME:
        account.balance += amount

    elif category.category_type == Category.CategoryType.EXPENSE:
        account.balance -= amount

    account.save()


def reverse_transaction_from_account(account, category, amount):
    """
    Reverse the impact of a transaction.

    Used when:
    - updating a transaction
    - deleting a transaction
    """
    if category.category_type == Category.CategoryType.INCOME:
        account.balance -= amount

    elif category.category_type == Category.CategoryType.EXPENSE:
        account.balance += amount

    account.save()


def create_transaction_for_user(user, payload):
    """
    Create a transaction and update account balance accordingly.
    """

    account_id = payload.get("account_id")
    category_id = payload.get("category_id")
    amount_value = payload.get("amount")
    trans_date_str = payload.get("trans_date")
    note = payload.get("note", "")

    # Validate required fields
    if not account_id or not category_id or amount_value is None or not trans_date_str:
        raise ValidationError(
            "account_id, category_id, amount and trans_date are required"
        )

    # Retrieve related objects
    account = _get_user_account(user, account_id)
    category = _get_user_category(user, category_id)

    # Validate amount and datetime
    amount = _parse_amount(amount_value)
    trans_date = _parse_trans_date(trans_date_str)

    # Create transaction
    tx = Transaction.objects.create(
        user=user,
        account=account,
        category=category,
        amount=amount,
        trans_date=trans_date,
        note=note,
    )

    # Update account balance
    apply_transaction_to_account(account, category, amount)

    return tx


def list_transactions_for_user(user, account_id=None, keyword=None):
    qs = (
        Transaction.objects
        .filter(user=user)
        .select_related("account", "category")
        .only(
            "id",
            "amount",
            "trans_date",
            "note",
            "account__id",
            "account__name",
            "account__balance",
            "account__account_type",
            "category__id",
            "category__name",
            "category__category_type",
        )
        .order_by("-trans_date", "-id")
    )

    # Existing account filter
    if account_id:
        qs = qs.filter(account_id=account_id, account__user=user)

    # Optional keyword search
    if keyword:
        keyword = keyword.strip()
        if keyword:
            qs = qs.filter(
                Q(note__icontains=keyword)
                | Q(category__name__icontains=keyword)
                | Q(account__name__icontains=keyword)
            )

    return qs


def get_transaction_for_user(user, tx_id):
    """
    Retrieve a single transaction for the user.

    select_related improves performance when
    accessing related account and category data.
    """

    return (
        Transaction.objects
        .filter(id=tx_id, user=user)
        .select_related("account", "category")
        .first()
    )


def update_transaction_for_user(user, tx_id, payload):
    """
    Update an existing transaction.

    Steps:
    1. Reverse the previous balance impact
    2. Apply updated transaction values
    3. Apply new balance impact
    """

    tx = get_transaction_for_user(user, tx_id)

    if not tx:
        return None

    # Save old values
    old_account = tx.account
    old_category = tx.category
    old_amount = tx.amount

    # Reverse old transaction impact
    reverse_transaction_from_account(old_account, old_category, old_amount)

    # Update fields if provided
    if "account_id" in payload:
        tx.account = _get_user_account(user, payload["account_id"])

    if "category_id" in payload:
        tx.category = _get_user_category(user, payload["category_id"])

    if "amount" in payload:
        tx.amount = _parse_amount(payload["amount"])

    if "trans_date" in payload:
        tx.trans_date = _parse_trans_date(payload["trans_date"])

    if "note" in payload:
        tx.note = payload.get("note", "")

    tx.save()

    # Apply new transaction impact
    apply_transaction_to_account(tx.account, tx.category, tx.amount)

    return tx


def delete_transaction_for_user(user, tx_id):
    """
    Delete a transaction and restore account balance.
    """

    tx = get_transaction_for_user(user, tx_id)

    if not tx:
        return False

    # Reverse the transaction impact
    reverse_transaction_from_account(tx.account, tx.category, tx.amount)

    tx.delete()

    return True