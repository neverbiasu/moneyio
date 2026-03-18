import { createRouter, createWebHistory } from 'vue-router';
import GlobalLayout from '../layouts/GlobalLayout.vue';
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
      component: async () => import('@/pages/LandingPage.vue'),
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
          component: async () => import('@/pages/DashboardPage.vue'),
          meta: { subtitle: "Here's what's happening with your money today" },
        },
        {
          path: 'transactions',
          name: 'transactions',
          component: async () => import('@/pages/TransactionsPage.vue'),
          meta: { subtitle: 'View and manage all your transactions' },
        },
        {
          path: 'accounts',
          name: 'accounts',
          component: async () => import('@/pages/AccountsPage.vue'),
          meta: { subtitle: 'Manage your bank and financial accounts' },
        },
        {
          path: 'reports',
          name: 'reports',
          component: async () => import('@/pages/ReportsPage.vue'),
          meta: { subtitle: 'Analyze your spending and income trends' },
        },
        {
          path: 'budgets',
          name: 'budgets',
          component: async () => import('@/pages/BudgetsPage.vue'),
          meta: { subtitle: 'Set and track your budgets' },
        },
        {
          path: 'settings',
          name: 'settings',
          component: async () => import('@/pages/SettingsPage.vue'),
          meta: { subtitle: 'Manage your account and preferences' },
        },
      ],
    },
    {
      path: '/login',
      name: 'login',
      component: async () => import('@/pages/LoginPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/register',
      name: 'register',
      component: async () => import('@/pages/RegisterPage.vue'),
      meta: { requiresAuth: false },
    },
  ],
});

router.beforeEach(async (to): Promise<{ name: string } | undefined> => {
  const authStore = useAuthStore();

  if (!authStore.isLoaded) {
    if (to.meta.requiresAuth !== false && authStore.hasSessionHint) {
      void authStore.ensureAuthLoaded();
    } else {
      await authStore.ensureAuthLoaded();
    }
  }

  if (authStore.isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    return { name: 'dashboard' };
  }

  if (to.meta.requiresAuth !== false && !authStore.isAuthenticated) {
    return { name: 'login' };
  }

  return undefined;
});

export default router;
