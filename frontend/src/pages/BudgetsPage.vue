<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import {
  ArrowTrendingUpIcon,
  CalculatorIcon,
  ReceiptPercentIcon,
  ShieldCheckIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/vue/20/solid';
import BudgetFormModal from '@/components/BudgetFormModal.vue';
import apiService from '@/api/services';
import type { Budget } from '@/api/types';
import { formatCurrencyWithPreference } from '@/utils/userPreferences';

defineOptions({ name: 'BudgetsPage' });

const router = useRouter();
const { t } = useI18n();

const budgets = ref<Budget[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const isModalOpen = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const selectedBudget = ref<Budget | null>(null);
const deleteConfirmId = ref<number | null>(null);
const selectedView = ref<'monthly' | 'yearly'>('monthly');
const selectedYear = ref<number | null>(null);
const budgetMutationsSupported = true;

type BudgetViewModel = Budget & {
  sourceCount: number;
};

async function fetchBudgets() {
  isLoading.value = true;
  error.value = null;

  try {
    budgets.value = await apiService.budgets.getBudgets();
    syncSelectedYear();
  } catch (err) {
    console.error('Failed to load budgets:', err);
    error.value = t('budgets.loadFailed');
  } finally {
    isLoading.value = false;
  }
}

function parseBudgetYear(budgetMonth: string): number | null {
  const parts = budgetMonth.split('-');
  const year = Number(parts[0]);
  return Number.isNaN(year) ? null : year;
}

const availableYears = computed<number[]>(() => {
  const years = budgets.value
    .map((item) => parseBudgetYear(item.budgetMonth))
    .filter((item): item is number => item !== null);

  return Array.from(new Set(years)).sort((left, right) => right - left);
});

function syncSelectedYear() {
  const years = availableYears.value;
  if (years.length === 0) {
    selectedYear.value = new Date().getFullYear();
    return;
  }

  if (selectedYear.value !== null && years.includes(selectedYear.value)) {
    return;
  }

  const latestYear = years[0];
  selectedYear.value = latestYear ?? new Date().getFullYear();
}

const latestBudgetMonth = computed(() => {
  if (budgets.value.length === 0) {
    return null;
  }

  const sortedMonths = budgets.value
    .map((item) => item.budgetMonth)
    .filter((item) => /^\d{4}-\d{2}$/.test(item))
    .sort((left, right) => right.localeCompare(left));

  return sortedMonths[0] ?? null;
});

const activeYear = computed(
  () => selectedYear.value ?? availableYears.value[0] ?? new Date().getFullYear(),
);

const monthlyBudgets = computed<BudgetViewModel[]>(() => {
  if (budgets.value.length === 0) {
    return [];
  }

  const month = latestBudgetMonth.value;
  if (!month) {
    return [];
  }

  return budgets.value
    .filter((item) => item.budgetMonth === month)
    .map((item) => ({ ...item, sourceCount: 1 }));
});

const yearlyBudgets = computed<BudgetViewModel[]>(() => {
  if (budgets.value.length === 0) {
    return [];
  }

  const year = String(activeYear.value);
  const yearlySource = budgets.value.filter((item) => item.budgetMonth.startsWith(`${year}-`));

  const grouped = new Map<string, BudgetViewModel>();

  for (const item of yearlySource) {
    const key = item.name.trim().toLowerCase();
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        ...item,
        sourceCount: 1,
      });
      continue;
    }

    grouped.set(key, {
      ...existing,
      amountLimit: existing.amountLimit + item.amountLimit,
      actualSpending: existing.actualSpending + item.actualSpending,
      isRecurring: existing.isRecurring || item.isRecurring,
      budgetMonth: `${year}-01`,
      sourceCount: existing.sourceCount + 1,
      updatedAt: existing.updatedAt > item.updatedAt ? existing.updatedAt : item.updatedAt,
    });
  }

  return Array.from(grouped.values());
});

const activeBudgets = computed<BudgetViewModel[]>(() =>
  selectedView.value === 'yearly' ? yearlyBudgets.value : monthlyBudgets.value,
);

const totalBudget = computed(() =>
  activeBudgets.value.reduce((sum, budget) => sum + budget.amountLimit, 0),
);

const totalSpent = computed(() => {
  return activeBudgets.value.reduce((sum, budget) => sum + budget.actualSpending, 0);
});

const remainingBudget = computed(() => {
  return Math.max(totalBudget.value - totalSpent.value, 0);
});

const isOverallOverBudget = computed(() => totalSpent.value > totalBudget.value);

const currentPeriodLabel = computed(() => {
  const sourceMonth = latestBudgetMonth.value;

  if (selectedView.value === 'yearly') {
    return String(activeYear.value);
  }

  if (!sourceMonth) {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  const [year, month] = sourceMonth.split('-').map(Number);

  if (year == null || month == null || Number.isNaN(year) || Number.isNaN(month)) {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
});

function formatCurrency(amount: number): string {
  return formatCurrencyWithPreference(amount, { absolute: true });
}

function progressPercent(budget: Budget): number {
  return Math.min((budget.actualSpending / budget.amountLimit) * 100, 100);
}

function getRemainingAmount(budget: Budget): number {
  return Math.max(budget.amountLimit - budget.actualSpending, 0);
}

const sortedBudgets = computed(() => {
  return [...activeBudgets.value].sort(
    (left, right) => progressPercent(right) - progressPercent(left),
  );
});

const mostAtRiskBudget = computed(() => sortedBudgets.value[0] ?? null);

const biggestOpportunityBudget = computed(() => {
  return (
    [...activeBudgets.value].sort(
      (left, right) => getRemainingAmount(right) - getRemainingAmount(left),
    )[0] ?? null
  );
});

function isOverBudget(budget: Budget): boolean {
  return budget.actualSpending > budget.amountLimit;
}

function isNearLimit(budget: Budget): boolean {
  return !isOverBudget(budget) && progressPercent(budget) >= 80;
}

function getBudgetDescription(budget: BudgetViewModel): string {
  if (selectedView.value === 'yearly' && budget.sourceCount > 1) {
    return t('budgets.yearlyAggregated', { count: String(budget.sourceCount) });
  }

  return (
    budget.description ?? (budget.isRecurring ? t('budgets.monthlyPlan') : t('budgets.oneTimePlan'))
  );
}

const allowBudgetMutations = computed(
  () => budgetMutationsSupported && selectedView.value === 'monthly',
);

function getBudgetStateLabel(budget: Budget): string {
  if (isOverBudget(budget)) {
    return t('budgets.overBy', {
      amount: formatCurrency(Math.abs(budget.amountLimit - budget.actualSpending)),
    });
  }

  if (isNearLimit(budget)) {
    return t('budgets.nearLimit', { amount: formatCurrency(getRemainingAmount(budget)) });
  }

  return t('budgets.underBy', { amount: formatCurrency(getRemainingAmount(budget)) });
}

function getBudgetStateTextClass(budget: Budget): string {
  if (isOverBudget(budget)) {
    return 'text-red-600';
  }

  if (isNearLimit(budget)) {
    return 'text-orange-600';
  }

  return 'text-emerald-600';
}

function getProgressWidth(budget: Budget): string {
  return `${Math.min((budget.actualSpending / budget.amountLimit) * 100, 100)}%`;
}

function getProgressColor(budget: Budget): string {
  if (isOverBudget(budget)) {
    return 'bg-red-600';
  }

  if (isNearLimit(budget)) {
    return 'bg-orange-500';
  }

  return 'bg-blue-600';
}

function getProgressBackground(budget: Budget): string {
  if (isOverBudget(budget)) {
    return 'bg-red-100';
  }

  if (isNearLimit(budget)) {
    return 'bg-orange-100';
  }

  return 'bg-slate-200/70';
}

function getBudgetAccentClasses(budget: Budget): string {
  switch (budget.name) {
    case 'Food & Dining':
      return 'bg-orange-100 text-orange-600';
    case 'Entertainment':
      return 'bg-violet-100 text-violet-600';
    case 'Transportation':
      return 'bg-blue-100 text-blue-600';
    case 'Shopping':
      return 'bg-teal-100 text-teal-600';
    case 'Health':
      return 'bg-emerald-100 text-emerald-600';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function getBudgetInitial(budget: Budget): string {
  return budget.name.charAt(0).toUpperCase();
}

function openCreateModal() {
  modalMode.value = 'create';
  selectedBudget.value = null;
  isModalOpen.value = true;
}

function openEditModal(budget: Budget) {
  modalMode.value = 'edit';
  selectedBudget.value = budget;
  isModalOpen.value = true;
}

function startDeleteConfirm(id: number) {
  deleteConfirmId.value = id;
}

function cancelDelete() {
  deleteConfirmId.value = null;
}

async function confirmDelete(id: number) {
  try {
    await apiService.budgets.deleteBudget(id);
    deleteConfirmId.value = null;
    await fetchBudgets();
  } catch (err) {
    console.error('Failed to delete budget:', err);
    error.value = err instanceof Error ? err.message : t('budgets.loadFailed');
  }
}

function handleModalSaved() {
  isModalOpen.value = false;
  void fetchBudgets();
}

function openReportsPage() {
  void router.push({ name: 'reports' });
}

function openSettingsPage() {
  void router.push({ name: 'settings' });
}

onMounted(() => {
  void fetchBudgets();
});
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-[28px] bg-sky-50/70 p-5 sm:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-sm font-medium text-slate-500">{{ currentPeriodLabel }}</p>
          <p class="mt-1 text-sm text-slate-600">{{ t('budgets.manageLimit') }}</p>
        </div>

        <div class="flex items-center gap-3 self-start">
          <div class="inline-flex rounded-xl border border-white/80 bg-white/80 p-1 shadow-sm">
            <button
              type="button"
              class="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
              :class="
                selectedView === 'monthly'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              "
              @click="selectedView = 'monthly'"
            >
              {{ t('budgets.monthly') }}
            </button>
            <button
              type="button"
              class="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
              :class="
                selectedView === 'yearly'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              "
              @click="selectedView = 'yearly'"
            >
              {{ t('budgets.yearly') }}
            </button>
          </div>

          <label
            v-if="selectedView === 'yearly' && availableYears.length > 0"
            class="inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600"
          >
            <span>{{ t('budgets.year') }}</span>
            <select
              v-model.number="selectedYear"
              class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option v-for="year in availableYears" :key="year" :value="year">
                {{ year }}
              </option>
            </select>
          </label>

          <button
            type="button"
            :disabled="!budgetMutationsSupported"
            class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            @click="openCreateModal"
          >
            <PlusIcon class="size-4" aria-hidden="true" />
            {{ t('budgets.addBudget') }}
          </button>
        </div>
      </div>

      <div
        v-if="!isLoading && budgets.length > 0"
        class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <div class="rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-sm">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {{ t('budgets.totalBudget') }}
              </p>
              <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {{ formatCurrency(totalBudget) }}
              </p>
            </div>
            <span class="rounded-2xl bg-slate-100 p-2.5 text-slate-600 shadow-sm">
              <CalculatorIcon class="size-5" aria-hidden="true" />
            </span>
          </div>
        </div>

        <div class="rounded-2xl border border-blue-100/80 bg-white px-5 py-4 shadow-sm">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {{ t('budgets.totalSpent') }}
              </p>
              <p class="mt-2 text-3xl font-bold tracking-tight text-blue-600">
                {{ formatCurrency(totalSpent) }}
              </p>
            </div>
            <span class="rounded-2xl bg-blue-50 p-2.5 text-blue-600 shadow-sm">
              <ReceiptPercentIcon class="size-5" aria-hidden="true" />
            </span>
          </div>
        </div>

        <div
          class="rounded-2xl bg-white px-5 py-4 shadow-sm"
          :class="isOverallOverBudget ? 'border border-red-100/80' : 'border border-emerald-100/80'"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {{ isOverallOverBudget ? t('budgets.overBudgetLabel') : t('budgets.remaining') }}
              </p>
              <p
                class="mt-2 text-3xl font-bold tracking-tight"
                :class="isOverallOverBudget ? 'text-red-600' : 'text-emerald-600'"
              >
                {{
                  formatCurrency(isOverallOverBudget ? totalSpent - totalBudget : remainingBudget)
                }}
              </p>
            </div>
            <span
              class="rounded-2xl p-2.5 shadow-sm"
              :class="
                isOverallOverBudget ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
              "
            >
              <ShieldCheckIcon class="size-5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </section>

    <div v-if="error" class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {{ error }}
    </div>

    <div v-if="isLoading" class="space-y-4 rounded-[28px] bg-sky-50/70 p-5 sm:p-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div
          v-for="i in 3"
          :key="`summary-${i}`"
          class="h-28 animate-pulse rounded-2xl bg-white/80"
        />
      </div>
      <div v-for="i in 4" :key="`budget-${i}`" class="h-40 animate-pulse rounded-2xl bg-white/80" />
    </div>

    <div
      v-else-if="activeBudgets.length === 0"
      class="rounded-[28px] border border-slate-200 bg-white py-16 text-center shadow-sm"
    >
      <SparklesIcon class="mx-auto mb-4 size-12 text-slate-300" aria-hidden="true" />
      <p class="text-base font-semibold text-slate-700">{{ t('budgets.noBudgets') }}</p>
      <p class="mt-1 text-sm text-slate-500">{{ t('budgets.noBudgetsHint') }}</p>
      <button
        type="button"
        :disabled="!allowBudgetMutations"
        class="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        @click="openCreateModal"
      >
        <PlusIcon class="size-4" aria-hidden="true" />
        {{ t('budgets.createBudget') }}
      </button>
    </div>

    <template v-else>
      <section class="rounded-[28px] bg-sky-50/70 p-5 sm:p-6">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-slate-900">{{ t('budgets.categoryBudgets') }}</h2>
            <p class="mt-1 text-sm text-slate-500">{{ t('budgets.categoryBudgetsHint') }}</p>
          </div>
        </div>

        <div class="space-y-4">
          <article
            v-for="budget in sortedBudgets"
            :key="budget.id"
            class="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="flex items-start gap-4">
              <div
                class="flex size-12 shrink-0 items-center justify-center rounded-2xl text-base font-bold"
                :class="getBudgetAccentClasses(budget)"
              >
                {{ getBudgetInitial(budget) }}
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <h3 class="truncate text-lg font-bold text-slate-900">
                        {{ budget.name }}
                      </h3>
                      <span
                        class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500"
                      >
                        {{ budget.isRecurring ? t('budgets.isRecurring') : t('budgets.oneTime') }}
                      </span>
                    </div>
                    <p class="mt-1 text-sm text-slate-500">{{ getBudgetDescription(budget) }}</p>
                  </div>

                  <div class="flex items-start gap-4">
                    <div class="text-right">
                      <p class="text-base font-bold text-slate-900">
                        {{ formatCurrency(budget.actualSpending) }} /
                        {{ formatCurrency(budget.amountLimit) }}
                      </p>
                      <p class="mt-1 text-xs font-medium" :class="getBudgetStateTextClass(budget)">
                        {{ getBudgetStateLabel(budget) }}
                      </p>
                    </div>

                    <div class="flex shrink-0 gap-1">
                      <button
                        type="button"
                        :disabled="!allowBudgetMutations"
                        class="rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        :aria-label="`Edit ${budget.name}`"
                        @click="openEditModal(budget)"
                      >
                        <PencilIcon class="size-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        :disabled="!allowBudgetMutations"
                        class="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        :aria-label="`Delete ${budget.name}`"
                        @click="startDeleteConfirm(budget.id)"
                      >
                        <TrashIcon class="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>

                <div class="mt-4 space-y-2">
                  <span :id="`budget-progress-${budget.id}`" class="sr-only">
                    {{ budget.name }}: {{ formatCurrency(budget.actualSpending) }} of
                    {{ formatCurrency(budget.amountLimit) }} spent
                  </span>
                  <div
                    :class="getProgressBackground(budget)"
                    class="h-2 rounded-full overflow-hidden"
                  >
                    <div
                      :class="getProgressColor(budget)"
                      class="h-full rounded-full transition-all duration-300"
                      :style="{ width: getProgressWidth(budget) }"
                      role="progressbar"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      :aria-valuenow="progressPercent(budget)"
                      :aria-labelledby="`budget-progress-${budget.id}`"
                    />
                  </div>

                  <div class="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>{{
                      t('budgets.spentPercent', { percent: progressPercent(budget).toFixed(0) })
                    }}</span>
                    <span :class="getBudgetStateTextClass(budget)">
                      {{
                        isOverBudget(budget)
                          ? t('budgets.actionNeeded')
                          : isNearLimit(budget)
                            ? t('budgets.closeToLimit')
                            : t('budgets.healthyPace')
                      }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="deleteConfirmId === budget.id"
              class="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-red-300 bg-white/95 p-5 backdrop-blur-sm"
            >
              <p class="text-sm font-semibold text-slate-800">{{ t('budgets.deleteConfirm') }}</p>
              <p class="text-xs text-slate-500">{{ t('budgets.deleteUndone') }}</p>
              <div class="flex w-full max-w-xs gap-2">
                <button
                  type="button"
                  class="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  @click="cancelDelete"
                >
                  {{ t('common.cancel') }}
                </button>
                <button
                  type="button"
                  class="flex-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                  @click="confirmDelete(budget.id)"
                >
                  {{ t('common.delete') }}
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article class="rounded-3xl border border-blue-100/80 bg-blue-50/70 p-6 shadow-sm">
          <div class="flex items-center gap-3">
            <span class="rounded-2xl bg-white p-2.5 text-blue-600 shadow-sm">
              <SparklesIcon class="size-5" aria-hidden="true" />
            </span>
            <h3 class="text-lg font-bold text-slate-900">{{ t('budgets.smartInsights') }}</h3>
          </div>

          <p class="mt-4 text-sm leading-6 text-slate-600">
            <template v-if="mostAtRiskBudget">
              {{
                t('budgets.smartInsightsText', {
                  name: mostAtRiskBudget.name,
                  percent: progressPercent(mostAtRiskBudget).toFixed(0),
                })
              }}
            </template>
            <template v-else>
              {{ t('budgets.smartInsightsEmpty') }}
            </template>
          </p>

          <button
            type="button"
            class="mt-6 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
            @click="openReportsPage"
          >
            {{ t('budgets.viewAnalysis') }}
          </button>
        </article>

        <article class="rounded-3xl border border-emerald-100/80 bg-emerald-50/70 p-6 shadow-sm">
          <div class="flex items-center gap-3">
            <span class="rounded-2xl bg-white p-2.5 text-emerald-600 shadow-sm">
              <ArrowTrendingUpIcon class="size-5" aria-hidden="true" />
            </span>
            <h3 class="text-lg font-bold text-slate-900">{{ t('budgets.savingsPotential') }}</h3>
          </div>

          <p class="mt-4 text-sm leading-6 text-slate-600">
            <template v-if="biggestOpportunityBudget">
              {{
                t('budgets.savingsPotentialText', {
                  amount: formatCurrency(getRemainingAmount(biggestOpportunityBudget)),
                  name: biggestOpportunityBudget.name,
                })
              }}
            </template>
            <template v-else>
              {{ t('budgets.savingsPotentialEmpty') }}
            </template>
          </p>

          <button
            type="button"
            class="mt-6 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
            @click="openSettingsPage"
          >
            {{ t('budgets.setSavingsGoal') }}
          </button>
        </article>
      </section>
    </template>

    <BudgetFormModal
      v-if="isModalOpen"
      :is-open="isModalOpen"
      :mode="modalMode"
      :budget="selectedBudget"
      @close="isModalOpen = false"
      @saved="handleModalSaved"
    />
  </div>
</template>
