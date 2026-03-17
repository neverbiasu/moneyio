import { createRouter, createWebHistory } from 'vue-router';
import GlobalLayout from '../layouts/GlobalLayout.vue';
import DashboardPage from '../pages/DashboardPage.vue';
import TransactionsPage from '../pages/TransactionsPage.vue';
import AccountsPage from '../pages/AccountsPage.vue';
import ReportsPage from '../pages/ReportsPage.vue';
import BudgetsPage from '../pages/BudgetsPage.vue';
import SettingsPage from '../pages/SettingsPage.vue';
import LoginPage from '@/pages/LoginPage.vue';
import LandingPage from '@/pages/LandingPage.vue';
import RegisterPage from '@/pages/RegisterPage.vue';
import { useAuthStore } from '@/stores/auth';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    subtitle?: string;
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingPage,
      meta: { requiresAuth: false },
    },
    {
      path: '/app',
      component: GlobalLayout,
      children: [
        { path: '', redirect: '/app/dashboard' },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardPage,
          meta: { subtitle: "Here's what's happening with your money today" },
        },
        {
          path: 'transactions',
          name: 'transactions',
          component: TransactionsPage,
          meta: { subtitle: 'View and manage all your transactions' },
        },
        {
          path: 'accounts',
          name: 'accounts',
          component: AccountsPage,
          meta: { subtitle: 'Manage your bank and financial accounts' },
        },
        {
          path: 'reports',
          name: 'reports',
          component: ReportsPage,
          meta: { subtitle: 'Analyze your spending and income trends' },
        },
        {
          path: 'budgets',
          name: 'budgets',
          component: BudgetsPage,
          meta: { subtitle: 'Set and track your budgets' },
        },
        {
          path: 'settings',
          name: 'settings',
          component: SettingsPage,
          meta: { subtitle: 'Manage your account and preferences' },
        },
      ],
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: { requiresAuth: false },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterPage,
      meta: { requiresAuth: false },
    },
  ],
});

router.beforeEach(async (to): Promise<{ name: string } | undefined> => {
  const authStore = useAuthStore();
  await authStore.ensureAuthLoaded();

  if (authStore.isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    return { name: 'dashboard' };
  }

  if (to.meta.requiresAuth !== false && !authStore.isAuthenticated) {
    return { name: 'login' };
  }

  return undefined;
});

export default router;
