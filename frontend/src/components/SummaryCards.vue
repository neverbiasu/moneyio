<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Summary } from '@/api/types';
import { formatCurrencyWithPreference } from '@/utils/userPreferences';

defineOptions({ name: 'SummaryCards' });

interface Props {
  data?: Summary | null;
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  data: null,
  isLoading: false,
});

const { t } = useI18n();
const fallbackCurrency = formatCurrencyWithPreference(0);

const formattedBalance = computed(() => {
  return props.data ? formatCurrencyWithPreference(props.data.totalBalance) : fallbackCurrency;
});

const formattedIncome = computed(() => {
  return props.data ? formatCurrencyWithPreference(props.data.monthlyIncome) : fallbackCurrency;
});

const formattedExpense = computed(() => {
  return props.data ? formatCurrencyWithPreference(props.data.monthlyExpense) : fallbackCurrency;
});
</script>

<template>
  <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
    <!-- Total Balance Card -->
    <div
      class="bg-white rounded-3xl border border-blue-100 p-7 shadow-[var(--shadow-card)] md:col-span-2 xl:col-span-2"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {{ t('summary.totalBalance') }}
        </h3>
        <div class="bg-blue-100 rounded-full p-2.5">
          <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>
      <div v-if="isLoading" class="h-10 bg-gray-200 rounded-2xl animate-pulse"></div>
      <p v-else class="text-4xl font-extrabold tracking-tight text-slate-900">
        {{ formattedBalance }}
      </p>
    </div>

    <!-- Monthly Income Card -->
    <div class="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-medium text-gray-600">{{ t('summary.monthlyIncome') }}</h3>
        <div class="bg-green-100 rounded-full p-2">
          <svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
      </div>
      <div v-if="isLoading" class="h-8 bg-gray-200 rounded animate-pulse"></div>
      <p v-else class="text-2xl font-bold text-green-600">{{ formattedIncome }}</p>
    </div>

    <!-- Monthly Expense Card -->
    <div class="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-medium text-gray-600">{{ t('summary.monthlyExpense') }}</h3>
        <div class="bg-red-100 rounded-full p-2">
          <svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
          </svg>
        </div>
      </div>
      <div v-if="isLoading" class="h-8 bg-gray-200 rounded animate-pulse"></div>
      <p v-else class="text-2xl font-bold text-red-600">{{ formattedExpense }}</p>
    </div>

    <!-- Savings Rate Card -->
    <div class="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-medium text-gray-600">{{ t('summary.savingsRate') }}</h3>
        <div class="bg-purple-100 rounded-full p-2">
          <svg
            class="w-5 h-5 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
      </div>
      <div v-if="isLoading" class="h-8 bg-gray-200 rounded animate-pulse"></div>
      <p v-else class="text-2xl font-bold text-purple-600">{{ data?.savingsRate ?? 0 }}%</p>
    </div>
  </div>
</template>
