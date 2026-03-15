<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { CalendarIcon } from '@heroicons/vue/20/solid';
import TrendChart from '@/components/TrendChart.vue';
import CategoryPieChart from '@/components/CategoryPieChart.vue';
import apiService from '@/api/services';
import type { Transaction, Category, ChartDataPoint } from '@/api/types';
import { formatCurrencyWithPreference } from '@/utils/userPreferences';

defineOptions({ name: 'ReportsPage' });

const { t } = useI18n();

const startDateInput = ref<string>(
  toDateInputValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
);
const endDateInput = ref<string>(toDateInputValue(new Date()));
const allTransactions = ref<Transaction[]>([]);
const categories = ref<Category[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

const datePresets = [
  {
    labelKey: 'reports.thisMonth',
    getValue: () => ({
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date(),
    }),
  },
  {
    labelKey: 'reports.lastMonth',
    getValue: () => {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0),
      };
    },
  },
  {
    labelKey: 'reports.last3Months',
    getValue: () => {
      const end = new Date();
      const start = new Date(end);
      start.setMonth(start.getMonth() - 3);
      return { start, end };
    },
  },
  {
    labelKey: 'reports.thisYear',
    getValue: () => ({
      start: new Date(new Date().getFullYear(), 0, 1),
      end: new Date(),
    }),
  },
];

const startDate = computed(() => parseDateInput(startDateInput.value, false));

const endDate = computed(() => parseDateInput(endDateInput.value, true));

const transactions = computed(() => {
  return allTransactions.value.filter((transaction) => {
    const transactionDate = new Date(transaction.transactionDate);
    return transactionDate >= startDate.value && transactionDate <= endDate.value;
  });
});

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

const chartPoints = computed<ChartDataPoint[]>(() => {
  const pointsMap = new Map<string, ChartDataPoint>();

  for (
    let current = new Date(startDate.value);
    current <= endDate.value;
    current.setDate(current.getDate() + 1)
  ) {
    const key = toDateInputValue(current);
    pointsMap.set(key, {
      date: key,
      income: 0,
      expense: 0,
    });
  }

  for (const transaction of transactions.value) {
    const key = toDateInputValue(new Date(transaction.transactionDate));
    const category = categories.value.find((item) => item.id === transaction.categoryId);
    const point = pointsMap.get(key);

    if (!point || !category) {
      continue;
    }

    if (category.type === 'income') {
      point.income += transaction.amount;
    } else if (category.type === 'expense') {
      point.expense += transaction.amount;
    }
  }

  return Array.from(pointsMap.values());
});

async function fetchReportData() {
  isLoading.value = true;
  error.value = null;

  try {
    const [transactionsResponse, categoriesResponse] = await Promise.all([
      apiService.transactions.getTransactions(),
      apiService.categories.getCategories(),
    ]);

    allTransactions.value = transactionsResponse;
    categories.value = categoriesResponse;
  } catch (err) {
    console.error('Failed to load report data:', err);
    error.value = t('reports.loadFailed');
  } finally {
    isLoading.value = false;
  }
}

function formatCurrency(amount: number): string {
  return formatCurrencyWithPreference(amount, { absolute: true });
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string, endOfDay: boolean): Date {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return new Date();
  }

  if (endOfDay) {
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }

  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function setDatePreset(getValue: () => { start: Date; end: Date }) {
  const { start, end } = getValue();
  startDateInput.value = toDateInputValue(start);
  endDateInput.value = toDateInputValue(end);
}

onMounted(() => {
  void fetchReportData();
});
</script>

<template>
  <div class="space-y-6">
    <div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3">
      <div>
        <p class="text-xs uppercase tracking-wide text-neutral-500 mb-2">
          {{ t('reports.quickSelect') }}
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="preset in datePresets"
            :key="preset.labelKey"
            class="px-3 py-1.5 text-sm font-medium border border-neutral-300 text-neutral-700 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition"
            @click="setDatePreset(preset.getValue)"
          >
            {{ t(preset.labelKey) }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label
            for="start-date"
            class="block text-xs uppercase tracking-wide text-neutral-500 mb-2"
          >
            {{ t('reports.from') }}
          </label>
          <div class="relative">
            <CalendarIcon
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400"
            />
            <input
              id="start-date"
              v-model="startDateInput"
              type="date"
              class="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 hover:bg-white hover:border-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
            />
          </div>
        </div>
        <div>
          <label for="end-date" class="block text-xs uppercase tracking-wide text-neutral-500 mb-2">
            {{ t('reports.to') }}
          </label>
          <div class="relative">
            <CalendarIcon
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400"
            />
            <input
              id="end-date"
              v-model="endDateInput"
              type="date"
              class="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 hover:bg-white hover:border-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
      {{ error }}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-neutral-500 mb-1">
          {{ t('reports.totalIncome') }}
        </p>
        <p class="text-2xl font-bold text-green-600">{{ formatCurrency(totalIncome) }}</p>
      </div>

      <div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-neutral-500 mb-1">
          {{ t('reports.totalExpenses') }}
        </p>
        <p class="text-2xl font-bold text-red-600">{{ formatCurrency(totalExpense) }}</p>
      </div>
    </div>

    <div v-if="isLoading" class="space-y-4">
      <div class="h-96 bg-neutral-100 rounded-xl animate-pulse" />
      <div class="h-80 bg-neutral-100 rounded-xl animate-pulse" />
    </div>

    <template v-else>
      <TrendChart :points="chartPoints" :is-loading="isLoading" />

      <CategoryPieChart :items="categoryData" :is-loading="isLoading" />
    </template>
  </div>
</template>
