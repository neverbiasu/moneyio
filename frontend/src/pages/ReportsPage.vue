<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { CalendarIcon, ArrowPathIcon } from '@heroicons/vue/20/solid';
import TrendChart from '@/components/TrendChart.vue';
import CategoryPieChart from '@/components/CategoryPieChart.vue';
import { mockAPI } from '@/api/mock';
import type { Transaction, Category, ChartData } from '@/api/mock-data';

defineOptions({ name: 'ReportsPage' });

// ── State ──────────────────────────────────────────────────────────────
const startDate = ref<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
const endDate = ref<Date>(new Date());
const transactions = ref<Transaction[]>([]);
const categories = ref<Category[]>([]);
const chartData = ref<ChartData | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Date presets
const datePresets = [
  {
    label: 'This Month',
    getValue: () => ({
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date(),
    }),
  },
  {
    label: 'Last Month',
    getValue: () => {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0),
      };
    },
  },
  {
    label: 'Last 3 Months',
    getValue: () => {
      const end = new Date();
      const start = new Date(end);
      start.setMonth(start.getMonth() - 3);
      return { start, end };
    },
  },
  {
    label: 'This Year',
    getValue: () => ({
      start: new Date(new Date().getFullYear(), 0, 1),
      end: new Date(),
    }),
  },
];

// ── Computed ───────────────────────────────────────────────────────────
const categoryData = computed(() => {
  if (!categories.value.length) return [];

  const expenseCategories = categories.value.filter((c) => c.type === 'expense');
  return expenseCategories
    .map((category) => {
      const total = transactions.value
        .filter((t) => t.categoryId === category.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: category.name, value: total };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
});

const totalIncome = computed(() => {
  return transactions.value
    .filter((t) => {
      const category = categories.value.find((c) => c.id === t.categoryId);
      return category?.type === 'income';
    })
    .reduce((sum, t) => sum + t.amount, 0);
});

const totalExpense = computed(() => {
  return transactions.value
    .filter((t) => {
      const category = categories.value.find((c) => c.id === t.categoryId);
      return category?.type === 'expense';
    })
    .reduce((sum, t) => sum + t.amount, 0);
});

// ── Data fetching ──────────────────────────────────────────────────────
async function fetchReportData() {
  isLoading.value = true;
  error.value = null;
  try {
    // Fetch transactions for the selected period
    const allTransactions = await mockAPI.transactions.getTransactions();
    transactions.value = allTransactions.filter((t) => {
      const tDate = new Date(t.transactionDate);
      return tDate >= startDate.value && tDate <= endDate.value;
    });

    // Fetch chart data
    chartData.value = await mockAPI.dashboard.getChartData();

    // Fetch categories
    categories.value = await mockAPI.categories.getCategories();
  } catch (err) {
    console.error('Failed to load report data:', err);
    error.value = 'Failed to load report data. Please try again.';
  } finally {
    isLoading.value = false;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return `$${Math.abs(amount).toFixed(2)}`;
}

function setDatePreset(getValue: () => { start: Date; end: Date }) {
  const { start, end } = getValue();
  startDate.value = start;
  endDate.value = end;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ── Watchers ───────────────────────────────────────────────────────────
watch(
  [startDate, endDate],
  () => {
    void fetchReportData();
  },
  { deep: true },
);

// ── Lifecycle ──────────────────────────────────────────────────────────
onMounted(() => {
  void fetchReportData();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-neutral-900">Analytics & Reports</h1>
      <p class="text-sm text-neutral-500 mt-1">Analyze your income, expenses, and spending patterns</p>
    </div>

    <!-- Date range controls -->
    <div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3">
      <!-- Presets -->
      <div>
        <p class="text-xs uppercase tracking-wide text-neutral-500 mb-2">Quick Select</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="preset in datePresets"
            :key="preset.label"
            class="px-3 py-1.5 text-sm font-medium border border-neutral-300 text-neutral-700 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition"
            @click="setDatePreset(preset.getValue)"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>

      <!-- Custom date range -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="start-date" class="block text-xs uppercase tracking-wide text-neutral-500 mb-2">
            From
          </label>
          <div class="relative">
            <CalendarIcon class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <input
              id="start-date"
              v-model="startDate"
              type="date"
              class="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 hover:bg-white hover:border-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
            />
          </div>
        </div>
        <div>
          <label for="end-date" class="block text-xs uppercase tracking-wide text-neutral-500 mb-2">
            To
          </label>
          <div class="relative">
            <CalendarIcon class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <input
              id="end-date"
              v-model="endDate"
              type="date"
              class="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 hover:bg-white hover:border-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
      {{ error }}
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Total Income -->
      <div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-neutral-500 mb-1">Total Income</p>
        <p class="text-2xl font-bold text-green-600">{{ formatCurrency(totalIncome) }}</p>
      </div>

      <!-- Total Expense -->
      <div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-neutral-500 mb-1">Total Expenses</p>
        <p class="text-2xl font-bold text-red-600">{{ formatCurrency(totalExpense) }}</p>
      </div>
    </div>

    <!-- Charts -->
    <div v-if="isLoading" class="space-y-4">
      <div class="h-96 bg-neutral-100 rounded-xl animate-pulse" />
      <div class="h-80 bg-neutral-100 rounded-xl animate-pulse" />
    </div>

    <template v-else>
      <!-- Trend Chart -->
      <div class="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-neutral-900 mb-4">Income vs. Expenses Trend</h2>
        <div v-if="chartData" class="w-full h-80">
          <TrendChart :data="chartData" />
        </div>
        <div v-else class="flex items-center justify-center h-80 text-neutral-400">
          <div class="flex items-center gap-2">
            <ArrowPathIcon class="size-4 animate-spin" />
            <span>Loading chart data...</span>
          </div>
        </div>
      </div>

      <!-- Category Pie Chart -->
      <div class="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-neutral-900 mb-4">Expense Breakdown by Category</h2>
        <div v-if="categoryData.length > 0" class="w-full h-80">
          <CategoryPieChart :items="categoryData" />
        </div>
        <div v-else class="flex items-center justify-center h-80 text-neutral-500">
          <p>No expense data available for the selected period</p>
        </div>
      </div>
    </template>
  </div>
</template>
