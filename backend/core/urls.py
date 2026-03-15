from django.urls import path

from .views_accounts import accounts_collection, accounts_item
from .views_auth import (
    change_password,
    current_user,
    login_view,
    logout_view,
    register,
)
from .views_budgets import budgets_collection, budgets_item
from .views_categories import categories_collection, categories_item
from .views_transactions import (
    transactions_collection,
    transactions_item,
    transactions_summary,
)

urlpatterns = [
    # Auth
    path("auth/register/", register),
    path("auth/login/", login_view),
    path("auth/logout/", logout_view),
    path("auth/me/", current_user),
    path("auth/change-password/", change_password),
    # Accounts
    path("accounts/", accounts_collection),
    path("accounts/<int:account_id>/", accounts_item),
    # Categories
    path("categories/", categories_collection),
    path("categories/<int:category_id>/", categories_item),
    # Budgets
    path("budgets/", budgets_collection),
    path("budgets/<int:budget_id>/", budgets_item),
    # Transactions
    path("transactions/summary/", transactions_summary),
    path("transactions/", transactions_collection),
    path("transactions/<int:tx_id>/", transactions_item),
]
