from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class User(AbstractUser):
    # reg_date add index
    reg_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email'], name='idx_users_email'),
            models.Index(fields=['reg_date'], name='idx_users_reg_date'),
        ]

class Account(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accounts')
    name = models.CharField(max_length=128)
    account_type = models.CharField(max_length=50)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        db_table = 'accounts'
        indexes = [
            # Optimize the speed of account query
            models.Index(fields=['user'], name='idx_accounts_user_id'),
        ]

class Category(models.Model):
    class CategoryType(models.TextChoices):
        INCOME = 'IN', 'Income'
        EXPENSE = 'OUT', 'Expense'

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=50)
    category_type = models.CharField(max_length=10, choices=CategoryType.choices)
    icon_id = models.CharField(max_length=100, null=True, blank=True)
    tree_level = models.IntegerField(default=1)

    class Meta:
        db_table = 'categories'
        indexes = [
            # Optimize by user and category_type
            models.Index(fields=['user', 'category_type'], name='idx_categories_user_type'),
        ]

class Transaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    account = models.ForeignKey(Account, on_delete=models.PROTECT)
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    trans_date = models.DateTimeField()
    note = models.CharField(max_length=254, blank=True)
    crt_time = models.DateTimeField(auto_now_add=True)
    upt_time = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transactions'
        indexes = [
            # index
            models.Index(fields=['user'], name='idx_trans_user_id'),
            models.Index(fields=['trans_date'], name='idx_trans_date'),
            models.Index(fields=['crt_time'], name='idx_trans_created'),
        ]

class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount_limit = models.DecimalField(max_digits=12, decimal_places=2)
    actual_spending = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    budget_month = models.DateField()
    is_recurring = models.BooleanField(default=False)
    # automatically update time after save() 
    upt_time = models.DateTimeField(auto_now=True) 
    

    class Meta:
        db_table = 'budgets'
        indexes = [
            # index, optimize search
            models.Index(fields=['user', 'budget_month'], name='idx_budgets_user_month'),
        ]