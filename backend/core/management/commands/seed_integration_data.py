from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from core.models import Account, Budget, Category, Transaction, User


class Command(BaseCommand):
    help = "Seed deterministic integration test data for frontend-backend testing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing integration seed user data before seeding.",
        )
        parser.add_argument(
            "--i-understand",
            action="store_true",
            help=(
                "Acknowledge deterministic credentials for local/integration testing. "
                "Required when DEBUG is False."
            ),
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.DEBUG and not options["i_understand"]:
            raise CommandError(
                "Refusing to seed deterministic credentials while DEBUG is False. "
                "Re-run with --i-understand to continue."
            )

        username = "tomori"
        email = "tomori@mygo.bandream"
        password = "MyGO!!!!!No.1"

        user = User.objects.filter(username=username).first()

        if options["reset"] and user:
            Transaction.objects.filter(user=user).delete()
            Budget.objects.filter(user=user).delete()
            Category.objects.filter(user=user).delete()
            Account.objects.filter(user=user).delete()
            user.delete()
            user = None

        if not user:
            user = User.objects.create(
                username=username,
                email=email,
                password=make_password(password),
            )

        account_map = self._seed_accounts(user)
        category_map = self._seed_categories(user)
        self._seed_transactions(user, account_map, category_map)
        self._seed_budgets(user, timezone.localtime(timezone.now()))

        self.stdout.write(self.style.SUCCESS("Integration seed data is ready."))
        self.stdout.write(
            f"username={username}, email={email}, password={password}"
        )

    def _seed_accounts(self, user):
        accounts = {
            "salary_account": {
                "name": "Salary Card",
                "account_type": "Savings",
                "balance": Decimal("50000.00"),
            },
            "debit_card": {
                "name": "Debit Card",
                "account_type": "Checking",
                "balance": Decimal("8500.50"),
            },
            "credit_card": {
                "name": "Credit Card",
                "account_type": "Credit",
                "balance": Decimal("5000.00"),
            },
        }

        result = {}
        for key, payload in accounts.items():
            account, _ = Account.objects.update_or_create(
                user=user,
                name=payload["name"],
                defaults={
                    "account_type": payload["account_type"],
                    "balance": payload["balance"],
                },
            )
            result[key] = account

        return result

    def _seed_categories(self, user):
        food, _ = Category.objects.update_or_create(
            user=user,
            name="Food & Dining",
            defaults={
                "category_type": Category.CategoryType.EXPENSE,
                "parent": None,
                "tree_level": 1,
                "icon_id": "utensils",
            },
        )

        breakfast, _ = Category.objects.update_or_create(
            user=user,
            name="Breakfast",
            defaults={
                "category_type": Category.CategoryType.EXPENSE,
                "parent": food,
                "tree_level": 2,
                "icon_id": "breakfast",
            },
        )

        lunch, _ = Category.objects.update_or_create(
            user=user,
            name="Lunch",
            defaults={
                "category_type": Category.CategoryType.EXPENSE,
                "parent": food,
                "tree_level": 2,
                "icon_id": "lunch",
            },
        )

        transportation, _ = Category.objects.update_or_create(
            user=user,
            name="Transportation",
            defaults={
                "category_type": Category.CategoryType.EXPENSE,
                "parent": None,
                "tree_level": 1,
                "icon_id": "local_taxi",
            },
        )

        entertainment, _ = Category.objects.update_or_create(
            user=user,
            name="Entertainment",
            defaults={
                "category_type": Category.CategoryType.EXPENSE,
                "parent": None,
                "tree_level": 1,
                "icon_id": "movie",
            },
        )

        salary, _ = Category.objects.update_or_create(
            user=user,
            name="Salary",
            defaults={
                "category_type": Category.CategoryType.INCOME,
                "parent": None,
                "tree_level": 1,
                "icon_id": "attach_money",
            },
        )

        bonus, _ = Category.objects.update_or_create(
            user=user,
            name="Bonus",
            defaults={
                "category_type": Category.CategoryType.INCOME,
                "parent": None,
                "tree_level": 1,
                "icon_id": "card_giftcard",
            },
        )

        return {
            "food": food,
            "breakfast": breakfast,
            "lunch": lunch,
            "transportation": transportation,
            "entertainment": entertainment,
            "salary": salary,
            "bonus": bonus,
        }

    def _seed_transactions(self, user, accounts, categories):
        now = timezone.localtime(timezone.now())
        month_start = now.replace(day=1, hour=9, minute=0, second=0, microsecond=0)

        data = [
            {
                "slug": "salary-main",
                "account": accounts["salary_account"],
                "category": categories["salary"],
                "amount": Decimal("4250.00"),
                "trans_date": month_start,
                "note": "Monthly salary",
            },
            {
                "slug": "bonus-quarterly",
                "account": accounts["salary_account"],
                "category": categories["bonus"],
                "amount": Decimal("500.00"),
                "trans_date": month_start + timedelta(days=9),
                "note": "Project bonus",
            },
            {
                "slug": "breakfast-1",
                "account": accounts["debit_card"],
                "category": categories["breakfast"],
                "amount": Decimal("12.00"),
                "trans_date": month_start + timedelta(days=4),
                "note": "Breakfast",
            },
            {
                "slug": "lunch-1",
                "account": accounts["debit_card"],
                "category": categories["lunch"],
                "amount": Decimal("25.00"),
                "trans_date": month_start + timedelta(days=5),
                "note": "Lunch",
            },
            {
                "slug": "transport-1",
                "account": accounts["debit_card"],
                "category": categories["transportation"],
                "amount": Decimal("18.00"),
                "trans_date": month_start + timedelta(days=6),
                "note": "Metro card top-up",
            },
            {
                "slug": "lunch-2",
                "account": accounts["debit_card"],
                "category": categories["lunch"],
                "amount": Decimal("30.00"),
                "trans_date": month_start + timedelta(days=7),
                "note": "Lunch with colleague",
            },
            {
                "slug": "entertainment-1",
                "account": accounts["debit_card"],
                "category": categories["entertainment"],
                "amount": Decimal("55.00"),
                "trans_date": month_start + timedelta(days=8),
                "note": "Concert ticket",
            },
            {
                "slug": "breakfast-2",
                "account": accounts["debit_card"],
                "category": categories["breakfast"],
                "amount": Decimal("14.00"),
                "trans_date": month_start + timedelta(days=11),
                "note": "Breakfast",
            },
            {
                "slug": "lunch-3",
                "account": accounts["debit_card"],
                "category": categories["lunch"],
                "amount": Decimal("28.00"),
                "trans_date": month_start + timedelta(days=12),
                "note": "Lunch",
            },
            {
                "slug": "transport-2",
                "account": accounts["debit_card"],
                "category": categories["transportation"],
                "amount": Decimal("22.00"),
                "trans_date": month_start + timedelta(days=13),
                "note": "Taxi",
            },
            {
                "slug": "entertainment-2",
                "account": accounts["debit_card"],
                "category": categories["entertainment"],
                "amount": Decimal("80.00"),
                "trans_date": month_start + timedelta(days=14),
                "note": "Movie and dinner",
            },
            {
                "slug": "lunch-prev-month",
                "account": accounts["debit_card"],
                "category": categories["lunch"],
                "amount": Decimal("16.00"),
                "trans_date": month_start - timedelta(days=4),
                "note": "Lunch",
            },
        ]

        for item in data:
            Transaction.objects.update_or_create(
                user=user,
                note=item["note"],
                trans_date=item["trans_date"],
                defaults={
                    "account": item["account"],
                    "category": item["category"],
                    "amount": item["amount"],
                },
            )

    def _seed_budgets(self, user, now):
        month_start = now.replace(day=1).date()
        previous_month_start = (month_start - timedelta(days=1)).replace(day=1)

        data = [
            {
                "name": "Food & Dining",
                "description": "Monthly meals budget",
                "amount_limit": Decimal("600.00"),
                "actual_spending": Decimal("365.00"),
                "budget_month": month_start,
                "is_recurring": True,
            },
            {
                "name": "Transportation",
                "description": "Metro, taxi, and commute",
                "amount_limit": Decimal("300.00"),
                "actual_spending": Decimal("210.00"),
                "budget_month": month_start,
                "is_recurring": True,
            },
            {
                "name": "Entertainment",
                "description": "Movies, concerts, and events",
                "amount_limit": Decimal("250.00"),
                "actual_spending": Decimal("175.00"),
                "budget_month": month_start,
                "is_recurring": False,
            },
            {
                "name": "Shopping",
                "description": "General discretionary spending",
                "amount_limit": Decimal("400.00"),
                "actual_spending": Decimal("95.00"),
                "budget_month": month_start,
                "is_recurring": False,
            },
            {
                "name": "Food & Dining",
                "description": "Monthly meals budget",
                "amount_limit": Decimal("580.00"),
                "actual_spending": Decimal("420.00"),
                "budget_month": previous_month_start,
                "is_recurring": True,
            },
            {
                "name": "Transportation",
                "description": "Metro, taxi, and commute",
                "amount_limit": Decimal("280.00"),
                "actual_spending": Decimal("185.00"),
                "budget_month": previous_month_start,
                "is_recurring": True,
            },
            {
                "name": "Entertainment",
                "description": "Movies, concerts, and events",
                "amount_limit": Decimal("220.00"),
                "actual_spending": Decimal("132.00"),
                "budget_month": previous_month_start,
                "is_recurring": False,
            },
            {
                "name": "Shopping",
                "description": "General discretionary spending",
                "amount_limit": Decimal("380.00"),
                "actual_spending": Decimal("148.00"),
                "budget_month": previous_month_start,
                "is_recurring": False,
            },
        ]

        for item in data:
            Budget.objects.update_or_create(
                user=user,
                name=item["name"],
                budget_month=item["budget_month"],
                defaults={
                    "description": item["description"],
                    "amount_limit": item["amount_limit"],
                    "actual_spending": item["actual_spending"],
                    "is_recurring": item["is_recurring"],
                },
            )
