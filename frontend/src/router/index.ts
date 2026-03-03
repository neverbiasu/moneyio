import { createRouter, createWebHistory } from 'vue-router';
import GlobalLayout from '../layouts/GlobalLayout.vue';
import DashboardPage from '../pages/DashboardPage.vue';
import TransactionsPage from '../pages/TransactionsPage.vue';
import ReportsPage from '../pages/ReportsPage.vue';
import BudgetsPage from '../pages/BudgetsPage.vue';
import SettingsPage from '../pages/SettingsPage.vue';
import LoginPage from '@/pages/LoginPage.vue';
import RegisterPage from '@/pages/RegisterPage.vue';
import { useAuthStore } from '@/stores/auth';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
  }
}

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

router.beforeEach((to): { name: string } | undefined => {
  const authStore = useAuthStore();

  // Redirect authenticated users away from auth pages
  if (authStore.isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    return { name: 'dashboard' };
  }

  // Redirect unauthenticated users to login for protected routes
  if (to.meta.requiresAuth !== false && !authStore.isAuthenticated) {
    return { name: 'login' };
  }

  return undefined;
});

export default router;
