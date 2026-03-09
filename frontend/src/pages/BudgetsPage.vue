<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { PlusIcon, PencilIcon, TrashIcon, SparklesIcon } from '@heroicons/vue/20/solid';
import BudgetFormModal from '@/components/BudgetFormModal.vue';
import { mockAPI } from '@/api/mock';
import type { Budget } from '@/api/mock-data';

defineOptions({ name: 'BudgetsPage' });

// ── State ──────────────────────────────────────────────────────────────
const budgets = ref<Budget[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const isModalOpen = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const selectedBudget = ref<Budget | null>(null);
const deleteConfirmId = ref<number | null>(null);

// ── Data fetching ──────────────────────────────────────────────────────
async function fetchBudgets() {
  isLoading.value = true;
  error.value = null;
  try {
    budgets.value = await mockAPI.budgets.getBudgets();
  } catch (err) {
    console.error('Failed to load budgets:', err);
    error.value = 'Failed to load budgets. Please try again.';
  } finally {
    isLoading.value = false;
  }
}

// ── Computed properties ────────────────────────────────────────────────
const totalBudget = computed(() => budgets.value.reduce((sum, b) => sum + b.amountLimit, 0));

const totalSpent = computed(() => budgets.value.reduce((sum, b) => sum + b.actualSpending, 0));

// ── Helpers ────────────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return `$${Math.abs(amount).toFixed(2)}`;
}

function progressPercent(budget: Budget): number {
  return Math.min((budget.actualSpending / budget.amountLimit) * 100, 100);
}

function isOverBudget(budget: Budget): boolean {
  return budget.actualSpending > budget.amountLimit;
}

function getProgressColor(budget: Budget): string {
  if (isOverBudget(budget)) {
    return 'bg-red-600';
  }
  return 'bg-blue-600';
}

function getProgressBackground(budget: Budget): string {
  if (isOverBudget(budget)) {
    return 'bg-red-100';
  }
  return 'bg-neutral-100';
}

// ── Modal actions ──────────────────────────────────────────────────────
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
    await mockAPI.budgets.deleteBudget(id);
    deleteConfirmId.value = null;
    await fetchBudgets();
  } catch (err) {
    console.error('Failed to delete budget:', err);
    error.value = 'Failed to delete budget. Please try again.';
  }
}

function handleModalSaved() {
  isModalOpen.value = false;
  void fetchBudgets();
}

// ── Lifecycle ──────────────────────────────────────────────────────────
onMounted(() => {
  void fetchBudgets();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header with summary and add button -->
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900">Budgets</h1>
        <p class="text-sm text-neutral-500 mt-1">
          Set and track your monthly budgets for each category
        </p>
      </div>
      <button
        class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition"
        @click="openCreateModal"
      >
        <PlusIcon class="size-5" />
        Add Budget
      </button>
    </div>

    <!-- Summary cards -->
    <div v-if="!isLoading && budgets.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Total Budget -->
      <div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-neutral-500 mb-1">Total Budget</p>
        <p class="text-2xl font-bold text-neutral-900">{{ formatCurrency(totalBudget) }}</p>
      </div>

      <!-- Total Spent -->
      <div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-neutral-500 mb-1">Total Spent</p>
        <p
          class="text-2xl font-bold tabular-nums"
          :class="totalSpent > totalBudget ? 'text-red-600' : 'text-green-600'"
        >
          {{ formatCurrency(totalSpent) }}
        </p>
      </div>

      <!-- Remaining / Over -->
      <div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-neutral-500 mb-1">
          {{ totalSpent > totalBudget ? 'Over Budget' : 'Remaining' }}
        </p>
        <p
          class="text-2xl font-bold tabular-nums"
          :class="totalSpent > totalBudget ? 'text-red-600' : 'text-green-600'"
        >
          {{ formatCurrency(Math.abs(totalBudget - totalSpent)) }}
        </p>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
      {{ error }}
    </div>

    <!-- Loading skeleton -->
    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 6" :key="i" class="h-24 bg-neutral-100 rounded-xl animate-pulse" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!isLoading && budgets.length === 0"
      class="py-16 text-center rounded-xl border border-neutral-200 bg-white"
    >
      <SparklesIcon class="mx-auto size-12 text-neutral-300 mb-3" />
      <p class="text-sm font-medium text-neutral-500">No budgets yet</p>
      <p class="text-xs text-neutral-400 mt-1">Create your first budget to track your spending</p>
      <button
        class="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        @click="openCreateModal"
      >
        <PlusIcon class="size-4" />
        Create Budget
      </button>
    </div>

    <!-- Budget list -->
    <div v-else class="space-y-3">
      <div
        v-for="budget in budgets"
        :key="budget.id"
        class="relative rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-neutral-300 transition"
      >
        <!-- Header with title and actions -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-neutral-900">{{ budget.name }}</h3>
            <p class="text-sm text-neutral-500 mt-0.5">
              {{ budget.isRecurring ? 'Monthly' : 'One-time' }} Budget
            </p>
          </div>

          <!-- Action buttons -->
          <div class="flex gap-2 shrink-0">
            <button
              type="button"
              class="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              :aria-label="`Edit ${budget.name}`"
              @click="openEditModal(budget)"
            >
              <PencilIcon class="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              :aria-label="`Delete ${budget.name}`"
              @click="startDeleteConfirm(budget.id)"
            >
              <TrashIcon class="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <!-- Progress section -->
        <div class="space-y-2">
          <!-- Spending info -->
          <div class="flex items-center justify-between text-sm">
            <span class="text-neutral-600">
              {{ formatCurrency(budget.actualSpending) }} / {{ formatCurrency(budget.amountLimit) }}
            </span>
            <span :class="isOverBudget(budget) ? 'text-red-600 font-semibold' : 'text-green-600'">
              {{ isOverBudget(budget) ? 'Over by' : 'Under by' }}
              {{ formatCurrency(Math.abs(budget.amountLimit - budget.actualSpending)) }}
            </span>
          </div>

          <!-- Progress bar -->
          <span :id="`budget-progress-${budget.id}`" class="sr-only">
            {{ budget.name }}: {{ formatCurrency(budget.actualSpending) }} of
            {{ formatCurrency(budget.amountLimit) }} spent
          </span>
          <div :class="getProgressBackground(budget)" class="h-2 rounded-full overflow-hidden">
            <div
              :class="getProgressColor(budget)"
              class="h-full rounded-full transition-all duration-300"
              :style="{ width: `${progressPercent(budget)}%` }"
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-valuenow="progressPercent(budget)"
              :aria-labelledby="`budget-progress-${budget.id}`"
            />
          </div>

          <!-- Progress percentage -->
          <div class="flex justify-between items-center text-xs text-neutral-500">
            <span>{{ progressPercent(budget).toFixed(0) }}% spent</span>
            <span v-if="isOverBudget(budget)" class="text-red-600 font-medium">
              ⚠ Over budget
            </span>
          </div>
        </div>

        <!-- Delete confirmation -->
        <div
          v-if="deleteConfirmId === budget.id"
          class="absolute inset-0 rounded-xl bg-white border-2 border-red-300 p-5 flex flex-col items-center justify-center gap-3 backdrop-blur-sm bg-opacity-95"
        >
          <p class="text-sm font-medium text-neutral-700">Delete this budget?</p>
          <div class="flex gap-2 w-full">
            <button
              class="flex-1 px-3 py-1.5 text-sm font-medium border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition"
              @click="cancelDelete"
            >
              Cancel
            </button>
            <button
              class="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
              @click="confirmDelete(budget.id)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Budget Form Modal -->
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
