<script setup lang="ts">
import {
  ArrowDownLeftIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  BuildingStorefrontIcon,
  PlusIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline';
import { SparklesIcon } from '@heroicons/vue/20/solid';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import TransactionFormModal from '@/components/TransactionFormModal.vue';
import TrendChart from '@/components/TrendChart.vue';
import CategoryPieChart from '@/components/CategoryPieChart.vue';
import BudgetRadarChart from '@/components/BudgetRadarChart.vue';
import apiService from '@/api/services';
import type { Summary, Transaction, Category, ChartData, Budget } from '@/api/types';
import { formatCurrencyWithPreference } from '@/utils/userPreferences';

defineOptions({ name: 'DashboardPage' });

const { t } = useI18n();

const summaryData = ref<Summary | null>(null);
const recentTransactions = ref<Transaction[]>([]);
const categories = ref<Category[]>([]);
const chartData = ref<ChartData | null>(null);
const budgets = ref<Budget[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const isModalOpen = ref(false);

const activeBalance = computed(() =>
  formatCurrencyWithPreference(summaryData.value?.totalBalance ?? 0),
);

const incomeAmount = computed(() =>
  formatCurrencyWithPreference(summaryData.value?.monthlyIncome ?? 0),
);

const expenseAmount = computed(() =>
  formatCurrencyWithPreference(summaryData.value?.monthlyExpense ?? 0),
);

const savingsRate = computed(() => `${summaryData.value?.savingsRate ?? 0}%`);

const recentAchievements = computed(() => {
  return [...recentTransactions.value]
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
    .slice(0, 5);
});

const topCategory = computed(() => {
  const expenseMap = new Map<number, number>();

  for (const tx of recentTransactions.value) {
    if (tx.categoryId === null) continue;
    const category = categories.value.find((item) => item.id === tx.categoryId);
    if (category?.type !== 'expense') continue;
    expenseMap.set(category.id, (expenseMap.get(category.id) ?? 0) + tx.amount);
  }

  let maxCategoryName = 'General';
  let maxAmount = -1;

  for (const [categoryId, amount] of expenseMap) {
    const category = categories.value.find((item) => item.id === categoryId);
    if (category && amount > maxAmount) {
      maxAmount = amount;
      maxCategoryName = category.name;
    }
  }

  return maxCategoryName;
});

const streakDays = computed(() => {
  const positiveDays = recentTransactions.value.filter((tx) => tx.amount > 0).length;
  return Math.max(positiveDays, 3);
});

const trendPoints = computed(() => chartData.value?.data ?? []);

const categoryPieItems = computed(() => {
  const expenseByCategory = new Map<string, number>();

  for (const tx of recentTransactions.value) {
    if (tx.categoryId === null) continue;
    const category = categories.value.find((item) => item.id === tx.categoryId);
    if (category?.type !== 'expense') continue;

    expenseByCategory.set(category.name, (expenseByCategory.get(category.name) ?? 0) + tx.amount);
  }

  return Array.from(expenseByCategory.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
});

const budgetRadarItems = computed(() => {
  return budgets.value
    .map((budget) => {
      const maxValue =
        budget.amountLimit > 0 ? budget.amountLimit : Math.max(budget.actualSpending, 1);

      return {
        name: budget.name,
        value: budget.actualSpending,
        maxValue,
      };
    })
    .slice(0, 6);
});

function getCategoryName(categoryId: number | null): string {
  if (categoryId === null) return t('common.transfer');
  return categories.value.find((item) => item.id === categoryId)?.name ?? t('common.unknown');
}

function getCategoryType(categoryId: number | null): string {
  if (categoryId === null) return 'transfer';
  return categories.value.find((item) => item.id === categoryId)?.type ?? 'expense';
}

function getTransactionIcon(categoryId: number | null) {
  const type = getCategoryType(categoryId);
  if (type === 'income') return ArrowDownLeftIcon;

  const categoryName = getCategoryName(categoryId).toLowerCase();
  if (
    categoryName.includes('entertainment') ||
    categoryName.includes('movie') ||
    categoryName.includes('game') ||
    categoryName.includes('fun')
  ) {
    return SparklesIcon;
  }
  if (
    categoryName.includes('food') ||
    categoryName.includes('dining') ||
    categoryName.includes('lunch') ||
    categoryName.includes('breakfast')
  ) {
    return BuildingStorefrontIcon;
  }
  if (categoryName.includes('transport') || categoryName.includes('travel')) {
    return BoltIcon;
  }

  return ArrowTrendingUpIcon;
}

function getTransactionIconClass(categoryId: number | null): string {
  const type = getCategoryType(categoryId);
  if (type === 'income') {
    return 'border-emerald-200 bg-emerald-100 text-emerald-700 shadow-[0_3px_0_0_rgba(16,185,129,0.45)]';
  }

  const categoryName = getCategoryName(categoryId).toLowerCase();
  if (
    categoryName.includes('entertainment') ||
    categoryName.includes('movie') ||
    categoryName.includes('game') ||
    categoryName.includes('fun')
  ) {
    return 'border-violet-200 bg-violet-100 text-violet-700 shadow-[0_3px_0_0_rgba(139,92,246,0.45)]';
  }
  if (
    categoryName.includes('food') ||
    categoryName.includes('dining') ||
    categoryName.includes('lunch') ||
    categoryName.includes('breakfast')
  ) {
    return 'border-amber-200 bg-amber-100 text-amber-700 shadow-[0_3px_0_0_rgba(245,158,11,0.45)]';
  }
  if (categoryName.includes('transport') || categoryName.includes('travel')) {
    return 'border-sky-200 bg-sky-100 text-sky-700 shadow-[0_3px_0_0_rgba(14,165,233,0.45)]';
  }

  return 'border-rose-200 bg-rose-100 text-rose-700 shadow-[0_3px_0_0_rgba(244,63,94,0.4)]';
}

function getAmountColor(type: string, amount: number): string {
  if (type === 'income') return 'text-emerald-600';
  if (type === 'transfer') return amount >= 0 ? 'text-emerald-600' : 'text-rose-600';
  return 'text-rose-600';
}

function formatAmount(type: string, amount: number): string {
  const formatted = formatCurrencyWithPreference(amount, { absolute: true });
  if (type === 'income') return `+${formatted}`;
  if (type === 'transfer') return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  return `-${formatted}`;
}

function formatDateLabel(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays <= 0) return t('dashboard.dateLabel.today');
  if (diffDays === 1) return t('dashboard.dateLabel.yesterday');
  return t('dashboard.dateLabel.daysAgo', { count: diffDays });
}

async function fetchDashboardData() {
  isLoading.value = true;
  error.value = null;

  try {
    const [summary, transactions, categoriesData, trendData, budgetsData] = await Promise.all([
      apiService.dashboard.getSummary(),
      apiService.transactions.getTransactions(),
      apiService.categories.getCategories(),
      apiService.dashboard.getChartData(),
      apiService.budgets.getBudgets(),
    ]);

    summaryData.value = summary;
    recentTransactions.value = transactions;
    categories.value = categoriesData;
    chartData.value = trendData;
    budgets.value = budgetsData;
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
    error.value = t('dashboard.loadFailed');
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  void fetchDashboardData();
});

async function handleTransactionSaved() {
  await fetchDashboardData();
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>

    <section
      class="rounded-[28px] border border-blue-100 bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white shadow-[0_6px_0_0_rgba(29,78,216,0.62)]"
    >
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p
            class="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider"
          >
            {{ t('dashboard.activeBalance') }}
          </p>
          <p v-if="isLoading" class="mt-4 h-12 w-56 animate-pulse rounded-2xl bg-white/25"></p>
          <p v-else class="mt-3 text-5xl font-extrabold tracking-tight">{{ activeBalance }}</p>
          <p class="mt-2 text-sm font-medium text-blue-100">
            {{ t('dashboard.topSpending') }}: {{ topCategory }}
          </p>
        </div>

        <div
          class="rounded-2xl border border-white/30 bg-white/15 px-5 py-4 text-center backdrop-blur-sm"
        >
          <p class="text-2xl">🔥</p>
          <p class="mt-1 text-2xl font-bold">{{ streakDays }}</p>
          <p class="text-xs font-semibold uppercase tracking-wide text-blue-100">
            {{ t('dashboard.dayStreak') }}
          </p>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      <article
        class="rounded-3xl border border-blue-200 bg-white p-6 shadow-[0_5px_0_0_rgba(59,130,246,0.25)] transition hover:-translate-y-0.5"
      >
        <div class="mb-4 flex items-center justify-between">
          <span
            class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600"
          >
            <ArrowDownLeftIcon class="h-5 w-5" />
          </span>
          <span class="text-xs font-semibold text-blue-700">+12%</span>
        </div>
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Income</p>
        <p v-if="isLoading" class="mt-2 h-8 w-28 animate-pulse rounded-xl bg-slate-200"></p>
        <p v-else class="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
          {{ incomeAmount }}
        </p>
      </article>

      <article
        class="rounded-3xl border border-orange-200 bg-white p-6 shadow-[0_5px_0_0_rgba(245,158,11,0.25)] transition hover:-translate-y-0.5"
      >
        <div class="mb-4 flex items-center justify-between">
          <span
            class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-600"
          >
            <ArrowTrendingDownIcon class="h-5 w-5" />
          </span>
          <span class="text-xs font-semibold text-orange-700">-5%</span>
        </div>
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Expenses</p>
        <p v-if="isLoading" class="mt-2 h-8 w-28 animate-pulse rounded-xl bg-slate-200"></p>
        <p v-else class="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
          {{ expenseAmount }}
        </p>
      </article>

      <article
        class="rounded-3xl border border-emerald-200 bg-white p-6 shadow-[0_5px_0_0_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5"
      >
        <div class="mb-4 flex items-center justify-between">
          <span
            class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"
          >
            <ShieldCheckIcon class="h-5 w-5" />
          </span>
          <span class="text-xs font-semibold text-emerald-700">+2%</span>
        </div>
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Savings Rate</p>
        <p v-if="isLoading" class="mt-2 h-8 w-28 animate-pulse rounded-xl bg-slate-200"></p>
        <p v-else class="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
          {{ savingsRate }}
        </p>
      </article>
    </section>

    <section class="space-y-5">
      <div
        class="rounded-[30px] border border-blue-100 bg-white p-6 shadow-[0_4px_0_0_rgba(148,163,184,0.42)]"
      >
        <TrendChart :points="trendPoints" :is-loading="isLoading" :embedded="true" />
      </div>

      <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div
          class="rounded-[30px] border border-blue-100 bg-white p-6 shadow-[0_4px_0_0_rgba(148,163,184,0.42)]"
        >
          <CategoryPieChart :items="categoryPieItems" :is-loading="isLoading" :embedded="true" />
        </div>
        <div
          class="rounded-[30px] border border-blue-100 bg-white p-6 shadow-[0_4px_0_0_rgba(148,163,184,0.42)]"
        >
          <BudgetRadarChart :items="budgetRadarItems" :is-loading="isLoading" :embedded="true" />
        </div>
      </div>
    </section>

    <section
      class="rounded-[30px] border border-blue-100 bg-white p-6 shadow-[0_4px_0_0_rgba(148,163,184,0.42)]"
    >
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-3xl font-bold tracking-tight text-slate-900">Recent Achievements</h2>
        <button
          type="button"
          class="duo-btn-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
          @click="isModalOpen = true"
        >
          <PlusIcon class="h-4 w-4" />
          Add Transaction
        </button>
      </div>

      <div v-if="isLoading" class="space-y-3">
        <div v-for="n in 5" :key="n" class="h-16 animate-pulse rounded-2xl bg-slate-100"></div>
      </div>

      <div
        v-else-if="recentAchievements.length === 0"
        class="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-8 text-center text-slate-500"
      >
        No transactions yet.
      </div>

      <div v-else class="space-y-2">
        <article
          v-for="transaction in recentAchievements"
          :key="transaction.id"
          class="flex items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-blue-50/70"
        >
          <div class="flex min-w-0 items-center gap-3">
            <span
              class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
              :class="getTransactionIconClass(transaction.categoryId)"
            >
              <component :is="getTransactionIcon(transaction.categoryId)" class="h-5 w-5" />
            </span>
            <div class="min-w-0">
              <p class="truncate text-base font-semibold text-slate-900">
                {{ getCategoryName(transaction.categoryId) }}
              </p>
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                {{ getCategoryType(transaction.categoryId) }} •
                {{ formatDateLabel(transaction.transactionDate) }}
              </p>
            </div>
          </div>

          <div class="text-right">
            <p
              class="text-lg font-bold"
              :class="getAmountColor(getCategoryType(transaction.categoryId), transaction.amount)"
            >
              {{ formatAmount(getCategoryType(transaction.categoryId), transaction.amount) }}
            </p>
            <p class="text-xs font-semibold text-slate-400">+5 XP</p>
          </div>
        </article>
      </div>

      <div class="mt-5 flex justify-center">
        <button
          type="button"
          class="duo-btn-secondary w-full max-w-sm rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-wide"
        >
          View all history
        </button>
      </div>
    </section>

    <TransactionFormModal
      v-if="isModalOpen"
      :is-open="isModalOpen"
      :categories="categories"
      @close="isModalOpen = false"
      @saved="handleTransactionSaved"
    />
  </div>
</template>
