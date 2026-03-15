from decimal import Decimal, InvalidOperation

from django.core.exceptions import ValidationError
from django.utils.dateparse import parse_date

from .models import Budget


def _parse_amount(amount_value, field_name: str) -> Decimal:
    try:
        amount = Decimal(str(amount_value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValidationError(f"{field_name} must be a valid decimal number")

    if amount < 0:
        raise ValidationError(f"{field_name} must be greater than or equal to 0")

    return amount


def _parse_budget_month(month_value):
    if month_value in (None, ""):
        raise ValidationError("budget_month is required")

    if isinstance(month_value, str):
        normalized = month_value.strip()
        if len(normalized) == 7 and normalized.count("-") == 1:
            normalized = f"{normalized}-01"
        parsed = parse_date(normalized)
    else:
        parsed = month_value

    if not parsed:
        raise ValidationError("budget_month must be a valid date or YYYY-MM")

    return parsed


def list_budgets_for_user(user):
    return Budget.objects.filter(user=user).order_by("-budget_month", "id")


def get_budget_for_user(user, budget_id):
    return Budget.objects.filter(id=budget_id, user=user).first()


def create_budget_for_user(user, payload):
    name = (payload.get("name") or "").strip()
    if not name:
        raise ValidationError("name is required")

    amount_limit = _parse_amount(payload.get("amount_limit"), "amount_limit")
    actual_spending = _parse_amount(
        payload.get("actual_spending", 0),
        "actual_spending",
    )
    budget_month = _parse_budget_month(payload.get("budget_month"))
    is_recurring = bool(payload.get("is_recurring", False))
    description = (payload.get("description") or "").strip()

    budget = Budget.objects.create(
        user=user,
        name=name,
        description=description,
        amount_limit=amount_limit,
        actual_spending=actual_spending,
        budget_month=budget_month,
        is_recurring=is_recurring,
    )

    return budget


def update_budget_for_user(user, budget_id, payload):
    budget = get_budget_for_user(user, budget_id)
    if not budget:
        return None

    if "name" in payload:
        name = (payload.get("name") or "").strip()
        if not name:
            raise ValidationError("name cannot be empty")
        budget.name = name

    if "description" in payload:
        budget.description = (payload.get("description") or "").strip()

    if "amount_limit" in payload:
        budget.amount_limit = _parse_amount(payload.get("amount_limit"), "amount_limit")

    if "actual_spending" in payload:
        budget.actual_spending = _parse_amount(
            payload.get("actual_spending"),
            "actual_spending",
        )

    if "budget_month" in payload:
        budget.budget_month = _parse_budget_month(payload.get("budget_month"))

    if "is_recurring" in payload:
        budget.is_recurring = bool(payload.get("is_recurring"))

    budget.save()
    return budget


def delete_budget_for_user(user, budget_id):
    budget = get_budget_for_user(user, budget_id)
    if not budget:
        return False

    budget.delete()
    return True
