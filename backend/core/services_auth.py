from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.utils import timezone

from .models import Account, Budget, Category, Transaction, User

DEFAULT_CATEGORIES = [
    {"name": "Food", "category_type": Category.CategoryType.EXPENSE},
    {"name": "Transport", "category_type": Category.CategoryType.EXPENSE},
    {"name": "Shopping", "category_type": Category.CategoryType.EXPENSE},
    {"name": "Entertainment", "category_type": Category.CategoryType.EXPENSE},
    {"name": "Bills", "category_type": Category.CategoryType.EXPENSE},
    {"name": "Health", "category_type": Category.CategoryType.EXPENSE},
    {"name": "Education", "category_type": Category.CategoryType.EXPENSE},
    {"name": "Other Expense", "category_type": Category.CategoryType.EXPENSE},
    {"name": "Salary", "category_type": Category.CategoryType.INCOME},
    {"name": "Bonus", "category_type": Category.CategoryType.INCOME},
    {"name": "Gift", "category_type": Category.CategoryType.INCOME},
    {"name": "Refund", "category_type": Category.CategoryType.INCOME},
    {"name": "Other Income", "category_type": Category.CategoryType.INCOME},
]

DEFAULT_ACCOUNTS = [
    {"name": "Cash", "account_type": "Cash", "balance": 0.00},
    {"name": "Bank Card", "account_type": "Bank Card", "balance": 0.00},
]


def create_default_categories_for_user(user):
    existing_names = set(
        Category.objects.filter(user=user).values_list("name", flat=True)
    )

    categories = []
    for item in DEFAULT_CATEGORIES:
        if item["name"] not in existing_names:
            categories.append(
                Category(
                    user=user,
                    name=item["name"],
                    category_type=item["category_type"],
                    parent=None,
                    tree_level=1,
                )
            )

    if categories:
        Category.objects.bulk_create(categories)


def create_default_accounts_for_user(user):
    existing_names = set(
        Account.objects.filter(user=user).values_list("name", flat=True)
    )

    accounts = []
    for item in DEFAULT_ACCOUNTS:
        if item["name"] not in existing_names:
            accounts.append(
                Account(
                    user=user,
                    name=item["name"],
                    account_type=item["account_type"],
                    balance=item["balance"],
                )
            )

    if accounts:
        Account.objects.bulk_create(accounts)


def register_user(username, email, password):
    user = User.objects.create(
        username=username, email=email, password=make_password(password)
    )

    create_default_categories_for_user(user)
    create_default_accounts_for_user(user)

    return user


def authenticate_user(username, password):
    return authenticate(username=username, password=password)


def update_password(user, new_password):
    user.password = make_password(new_password)
    user.save()
    return user


def export_user_data(user):
    accounts = [
        {
            "id": account.id,
            "name": account.name,
            "account_type": account.account_type,
            "balance": str(account.balance),
        }
        for account in Account.objects.filter(user=user).order_by("id")
    ]

    categories = [
        {
            "id": category.id,
            "name": category.name,
            "category_type": category.category_type,
            "parent_id": category.parent_id,
            "tree_level": category.tree_level,
            "icon_id": category.icon_id,
        }
        for category in Category.objects.filter(user=user).order_by("id")
    ]

    transactions = [
        {
            "id": transaction.id,
            "account_id": transaction.account_id,
            "category_id": transaction.category_id,
            "amount": str(transaction.amount),
            "trans_date": transaction.trans_date.isoformat(),
            "note": transaction.note,
            "created_at": transaction.crt_time.isoformat(),
            "updated_at": transaction.upt_time.isoformat(),
        }
        for transaction in Transaction.objects.filter(user=user)
        .select_related("account", "category")
        .order_by("-trans_date", "-id")
    ]

    budgets = [
        {
            "id": budget.id,
            "name": budget.name,
            "description": budget.description,
            "amount_limit": str(budget.amount_limit),
            "actual_spending": str(budget.actual_spending),
            "budget_month": budget.budget_month.strftime("%Y-%m"),
            "is_recurring": budget.is_recurring,
            "updated_at": budget.upt_time.isoformat(),
        }
        for budget in Budget.objects.filter(user=user).order_by("-budget_month", "id")
    ]

    return {
        "exported_at": timezone.now().isoformat(),
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "registered_at": user.reg_date.isoformat(),
        },
        "accounts": accounts,
        "categories": categories,
        "transactions": transactions,
        "budgets": budgets,
    }


def delete_user_account(user):
    user.delete()
