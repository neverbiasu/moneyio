import { createRouter, createWebHistory } from 'vue-router';
import GlobalLayout from '../layouts/GlobalLayout.vue';
import DashboardPage from '../pages/DashboardPage.vue';
import TransactionsPage from '../pages/TransactionsPage.vue';
import ReportsPage from '../pages/ReportsPage.vue';
import BudgetsPage from '../pages/BudgetsPage.vue';
import SettingsPage from '../pages/SettingsPage.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: GlobalLayout,
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', name: 'dashboard', component: DashboardPage },
        { path: 'transactions', name: 'transactions', component: TransactionsPage },
        { path: 'reports', name: 'reports', component: ReportsPage },
        { path: 'budgets', name: 'budgets', component: BudgetsPage },
        { path: 'settings', name: 'settings', component: SettingsPage },
      ],
    },
  ],
});

export default router;
