from django.contrib import admin
from .models import User, Account, Category, Transaction, Budget
# Register your models here.

admin.site.register(User)
admin.site.register(Account)
admin.site.register(Category)
admin.site.register(Transaction)
admin.site.register(Budget)