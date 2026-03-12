from rest_framework import status
from rest_framework.test import APITestCase
from core.models import User, Transaction, Category, Account
from django.utils import timezone

class TransactionAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testadmin', password='password123', email='testadmin@test.com'
        )
        self.client.login(username='testadmin', password='password123')

        self.acc = Account.objects.create(
            user=self.user, name="Test Acc", account_type="Bank Card", balance=1000
        )
        self.cat_income = Category.objects.create(
            user=self.user, name="Salary", category_type="IN"
        )
        self.cat_expense = Category.objects.create(
            user=self.user, name="Food", category_type="OUT"
        )

        Transaction.objects.create(
            user=self.user, account=self.acc, category=self.cat_income,
            amount=100, note="Monthly Salary", trans_date=timezone.now()
        )
        Transaction.objects.create(
            user=self.user, account=self.acc, category=self.cat_expense,
            amount=40, note="Lunch at Uni", trans_date=timezone.now()
        )

        for i in range(10):
            Transaction.objects.create(
                user=self.user,
                account=self.acc,
                category=self.cat_expense,
                amount=10,
                note=f"Extra Expense {i}",
                trans_date=timezone.now()
            )

    def test_monthly_summary(self):
        url = "/api/transactions/summary/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_json = response.json()
        self.assertEqual(float(res_json['income']), 100.0)
        self.assertEqual(float(res_json['expense']), 140.0)
        self.assertEqual(float(res_json['net_balance']), -40.0)
    
    def test_summary_no_data(self):
        self.client.logout()
        new_user = User.objects.create_user(username='initialisation_user', password='password', email='initialisation_user@test.com')
        self.client.force_login(new_user)

        url = "/api/transactions/summary/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_json = response.json()

        self.assertEqual(float(res_json['income']), 0.0)
        self.assertEqual(float(res_json['expense']), 0.0)
        self.assertEqual(float(res_json['net_balance']), 0.0)

    def test_transaction_list_search(self):
        url = "/api/transactions/"
        resp = self.client.get(url, {'search': 'Salary'})
        res_json = resp.json()
        self.assertEqual(len(res_json['results']), 1)
        self.assertEqual(res_json['results'][0]['note'], "Monthly Salary")

        resp_fuzzy = self.client.get(url, {'search': 'sal'})
        self.assertEqual(len(resp_fuzzy.json()['results']), 1)

        resp_none = self.client.get(url, {'search': 'unknown'})
        self.assertEqual(len(resp_none.json()['results']), 0)

    def test_filter_by_category(self):
        url = "/api/transactions/"
        response = self.client.get(url, {'category_id': self.cat_income.id})
        res_json = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_json['results']), 1)
        self.assertEqual(res_json['results'][0]['category']['name'], "Salary")

    def test_filter_by_account(self):
        url = "/api/transactions/"
        response = self.client.get(url, {'account_id': self.acc.id})
        res_json = response.json()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_json['results']), 10)

    def test_filter_by_date_range(self):
        url = "/api/transactions/"
        today_date = timezone.localdate()
        today_str = today_date.strftime('%Y-%m-%d')

        response_today = self.client.get(url, {'start': today_str})
        self.assertEqual(response_today.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_today.json()['results']), 10)

        yesterday_str = (today_date - timezone.timedelta(days=1)).strftime('%Y-%m-%d')
        response_yesterday = self.client.get(url, {'end': yesterday_str})
        self.assertEqual(len(response_yesterday.json()['results']), 0)

    def test_pagination_out_of_range(self):
        url = "/api/transactions/"
        resp4 = self.client.get(url, {'page': 3, 'page_size': 5})
        res_json = resp4.json()
        self.assertEqual(resp4.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_json['results']), 2)

        resp5 = self.client.get(url, {'page': 15, 'page_size': 10})
        res_json = resp5.json()
        self.assertEqual(resp5.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_json['results']), 2)

    def test_pagination_and_filter_combined(self):
        url = "/api/transactions/"
        params = {
            'search': 'Extra',
            'category_id': self.cat_expense.id,
            'page': 1,
            'page_size': 5
        }

        response = self.client.get(url, params)
        res_json = response.json()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_json['results']), 5)
        self.assertEqual(res_json['total_count'], 10)
        for item in res_json['results']:
            self.assertIn('Extra', item['note'])


    def test_unauthenticated_access(self):
        self.client.logout()
        url = "/api/transactions/summary/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_data_isolation(self):
        new_user = User.objects.create_user(
            username='new_user', password='password', email='new_user@test.com'
        )
        acc_new_user = Account.objects.create(
            user=new_user, name="B's Private Acc", account_type="Cash", balance=0
        )
        cat_b = Category.objects.create(user=new_user, name="B's Cat", category_type="IN")
        secret_note = "New_user's Private Secret"
        Transaction.objects.create(
            user=new_user, account=acc_new_user, category=cat_b,
            amount=5000, note=secret_note, trans_date=timezone.now()
        )
        self.client.force_authenticate(user=self.user)
        url = "/api/transactions/"
        response = self.client.get(url, {'page_size': 20})
        res_json = response.json()

        self.assertEqual(len(res_json['results']), 12)
        notes = [item['note'] for item in res_json['results']]
        self.assertNotIn(secret_note, notes)