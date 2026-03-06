<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import SummaryCards from '@/components/SummaryCards.vue';
import RecentTransactionsList from '@/components/RecentTransactionsList.vue';
import TrendChart from '@/components/TrendChart.vue';
import CategoryPieChart from '@/components/CategoryPieChart.vue';
import BudgetRadarChart from '@/components/BudgetRadarChart.vue';
import { mockAPI } from '@/api/mock';
import type { Summary, Transaction, Category, ChartData, Budget } from '@/api/mock-data';

defineOptions({ name: 'DashboardPage' });

const summaryData = ref<Summary | null>(null);
const recentTransactions = ref<Transaction[]>([]);
const categories = ref<Category[]>([]);
const chartData = ref<ChartData | null>(null);
const budgets = ref<Budget[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

const pieItems = computed(() => {
  const expenseCategories = categories.value.filter((category) => category.type === 'expense');

  return expenseCategories
    .map((category) => {
      const total = recentTransactions.value
        .filter((transaction) => transaction.categoryId === category.id)
        .reduce((sum, transaction) => sum + transaction.amount, 0);

      return {
        name: category.name,
        value: total,
      };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
});

const radarItems = computed(() => {
  return budgets.value.map((budget) => ({
    name: budget.name,
    value: budget.actualSpending,
    maxValue: budget.amountLimit,
  }));
});

async function fetchDashboardData() {
  isLoading.value = true;
  error.value = null;

  try {
    const [summary, transactions, categoriesData, trendData, budgetsData] = await Promise.all([
      mockAPI.dashboard.getSummary(),
      mockAPI.transactions.getTransactions(),
      mockAPI.categories.getCategories(),
      mockAPI.dashboard.getChartData(),
      mockAPI.budgets.getBudgets(),
    ]);

    summaryData.value = summary;
    recentTransactions.value = transactions;
    categories.value = categoriesData;
    chartData.value = trendData;
    budgets.value = budgetsData;
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
    error.value = 'Unable to load dashboard. Please try again.';
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  void fetchDashboardData();
});
</script>

<template>
  <div class="space-y-6">
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>

    <SummaryCards :data="summaryData" :is-loading="isLoading" />

    <TrendChart :points="chartData?.data ?? []" :is-loading="isLoading" />

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <CategoryPieChart :items="pieItems" :is-loading="isLoading" />
      <BudgetRadarChart :items="radarItems" :is-loading="isLoading" />
    </div>

    <RecentTransactionsList
      :transactions="recentTransactions"
      :categories="categories"
      :is-loading="isLoading"
    />
  </div>
</template>
