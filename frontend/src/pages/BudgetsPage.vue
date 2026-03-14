<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/vue/20/solid';
import BudgetFormModal from '@/components/BudgetFormModal.vue';
import apiService from '@/api/services';
import type { Budget } from '@/api/types';

defineOptions({ name: 'BudgetsPage' });

const router = useRouter();

const budgets = ref<Budget[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const isModalOpen = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const selectedBudget = ref<Budget | null>(null);
const deleteConfirmId = ref<number | null>(null);
const selectedView = ref<'monthly' | 'yearly'>('monthly');
const budgetMutationsSupported = false;

async function fetchBudgets() {
  isLoading.value = true;
  error.value = null;

  try {
    budgets.value = await apiService.budgets.getBudgets();
  } catch (err) {
    console.error('Failed to load budgets:', err);
    error.value = 'Failed to load budgets. Please try again.';
  } finally {
    isLoading.value = false;
  }
}

const totalBudget = computed(() =>
  budgets.value.reduce((sum, budget) => sum + budget.amountLimit, 0),
);

const totalSpent = computed(() => {
  return budgets.value.reduce((sum, budget) => sum + budget.actualSpending, 0);
});

const remainingBudget = computed(() => {
  return Math.max(totalBudget.value - totalSpent.value, 0);
});

const isOverallOverBudget = computed(() => totalSpent.value > totalBudget.value);

const currentPeriodLabel = computed(() => {
  const sourceMonth = budgets.value[0]?.budgetMonth;

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
  return `$${Math.abs(amount).toFixed(2)}`;
}

function progressPercent(budget: Budget): number {
  return Math.min((budget.actualSpending / budget.amountLimit) * 100, 100);
}

function getRemainingAmount(budget: Budget): number {
  return Math.max(budget.amountLimit - budget.actualSpending, 0);
}

const sortedBudgets = computed(() => {
  return [...budgets.value].sort((left, right) => progressPercent(right) - progressPercent(left));
});

const mostAtRiskBudget = computed(() => sortedBudgets.value[0] ?? null);

const biggestOpportunityBudget = computed(() => {
  return (
    [...budgets.value].sort(
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

function getBudgetDescription(budget: Budget): string {
  return (
    budget.description ?? (budget.isRecurring ? 'Monthly spending plan' : 'One-time spending plan')
  );
}

function getBudgetStateLabel(budget: Budget): string {
  if (isOverBudget(budget)) {
    return `Over by ${formatCurrency(Math.abs(budget.amountLimit - budget.actualSpending))}`;
  }

  if (isNearLimit(budget)) {
    return `Near limit: ${formatCurrency(getRemainingAmount(budget))} left`;
  }

  return `Under by ${formatCurrency(getRemainingAmount(budget))}`;
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
  if (!budgetMutationsSupported) {
    error.value = 'Budget create and update are not supported by backend API yet.';
    return;
  }

  modalMode.value = 'create';
  selectedBudget.value = null;
  isModalOpen.value = true;
}

function openEditModal(budget: Budget) {
  if (!budgetMutationsSupported) {
    error.value = 'Budget create and update are not supported by backend API yet.';
    return;
  }

  modalMode.value = 'edit';
  selectedBudget.value = budget;
  isModalOpen.value = true;
}

function startDeleteConfirm(id: number) {
  if (!budgetMutationsSupported) {
    error.value = 'Budget deletion is not supported by backend API yet.';
    return;
  }

  deleteConfirmId.value = id;
}

function cancelDelete() {
  deleteConfirmId.value = null;
}

async function confirmDelete(id: number) {
  if (!budgetMutationsSupported) {
    deleteConfirmId.value = null;
    error.value = 'Budget deletion is not supported by backend API yet.';
    return;
  }

  try {
    await apiService.budgets.deleteBudget(id);
    deleteConfirmId.value = null;
    await fetchBudgets();
  } catch (err) {
    console.error('Failed to delete budget:', err);
    error.value = err instanceof Error ? err.message : 'Failed to delete budget. Please try again.';
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
          <p class="mt-1 text-sm text-slate-600">Manage your monthly spending limits</p>
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
              Monthly
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
              Yearly
            </button>
          </div>

          <button
            type="button"
            :disabled="!budgetMutationsSupported"
            class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            @click="openCreateModal"
          >
            <PlusIcon class="size-4" aria-hidden="true" />
            Add Budget
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
                Total Budget
              </p>
              <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {{ formatCurrency(totalBudget) }}
              </p>
            </div>
            <span class="rounded-2xl bg-slate-100 p-2.5 text-slate-600 shadow-sm">
              <BanknotesIcon class="size-5" aria-hidden="true" />
            </span>
          </div>
        </div>

        <div class="rounded-2xl border border-blue-100/80 bg-white px-5 py-4 shadow-sm">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Total Spent
              </p>
              <p class="mt-2 text-3xl font-bold tracking-tight text-blue-600">
                {{ formatCurrency(totalSpent) }}
              </p>
            </div>
            <span class="rounded-2xl bg-blue-50 p-2.5 text-blue-600 shadow-sm">
              <CreditCardIcon class="size-5" aria-hidden="true" />
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
                {{ isOverallOverBudget ? 'Over Budget' : 'Remaining' }}
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
              <CurrencyDollarIcon class="size-5" aria-hidden="true" />
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
      v-else-if="budgets.length === 0"
      class="rounded-[28px] border border-slate-200 bg-white py-16 text-center shadow-sm"
    >
      <SparklesIcon class="mx-auto mb-4 size-12 text-slate-300" aria-hidden="true" />
      <p class="text-base font-semibold text-slate-700">No budgets yet</p>
      <p class="mt-1 text-sm text-slate-500">
        Create your first budget to track category spending.
      </p>
      <button
        type="button"
        :disabled="!budgetMutationsSupported"
        class="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        @click="openCreateModal"
      >
        <PlusIcon class="size-4" aria-hidden="true" />
        Create Budget
      </button>
    </div>

    <template v-else>
      <section class="rounded-[28px] bg-sky-50/70 p-5 sm:p-6">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Category Budgets</h2>
            <p class="mt-1 text-sm text-slate-500">
              Monitor spending by category and spot risks early.
            </p>
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
                        {{ budget.isRecurring ? 'Monthly' : 'One-time' }}
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
                        :disabled="!budgetMutationsSupported"
                        class="rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        :aria-label="`Edit ${budget.name}`"
                        @click="openEditModal(budget)"
                      >
                        <PencilIcon class="size-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        :disabled="!budgetMutationsSupported"
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
                    <span>{{ progressPercent(budget).toFixed(0) }}% spent</span>
                    <span :class="getBudgetStateTextClass(budget)">
                      {{
                        isOverBudget(budget)
                          ? 'Action needed'
                          : isNearLimit(budget)
                            ? 'Close to limit'
                            : 'Healthy pace'
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
              <p class="text-sm font-semibold text-slate-800">Delete this budget?</p>
              <p class="text-xs text-slate-500">This action cannot be undone.</p>
              <div class="flex w-full max-w-xs gap-2">
                <button
                  type="button"
                  class="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  @click="cancelDelete"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="flex-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                  @click="confirmDelete(budget.id)"
                >
                  Delete
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
            <h3 class="text-lg font-bold text-slate-900">Smart Insights</h3>
          </div>

          <p class="mt-4 text-sm leading-6 text-slate-600">
            <template v-if="mostAtRiskBudget">
              <span class="font-semibold text-slate-900">{{ mostAtRiskBudget.name }}</span>
              is your highest-spend category at
              <span class="font-semibold text-slate-900">
                {{ progressPercent(mostAtRiskBudget).toFixed(0) }}%
              </span>
              of its budget. Review upcoming expenses to keep the month on track.
            </template>
            <template v-else>
              Add a budget to unlock spending insights and recommendations.
            </template>
          </p>

          <button
            type="button"
            class="mt-6 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
            @click="openReportsPage"
          >
            View analysis →
          </button>
        </article>

        <article class="rounded-3xl border border-emerald-100/80 bg-emerald-50/70 p-6 shadow-sm">
          <div class="flex items-center gap-3">
            <span class="rounded-2xl bg-white p-2.5 text-emerald-600 shadow-sm">
              <ArrowTrendingUpIcon class="size-5" aria-hidden="true" />
            </span>
            <h3 class="text-lg font-bold text-slate-900">Savings Potential</h3>
          </div>

          <p class="mt-4 text-sm leading-6 text-slate-600">
            <template v-if="biggestOpportunityBudget">
              You still have
              <span class="font-semibold text-emerald-600">
                {{ formatCurrency(getRemainingAmount(biggestOpportunityBudget)) }}
              </span>
              available in
              <span class="font-semibold text-slate-900">{{ biggestOpportunityBudget.name }}</span>
              <span>. Keep this pace to improve your savings by month end.</span>
            </template>
            <template v-else>
              Add budgets to discover how much room is left across your spending plan.
            </template>
          </p>

          <button
            type="button"
            class="mt-6 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
            @click="openSettingsPage"
          >
            Set savings goal →
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
