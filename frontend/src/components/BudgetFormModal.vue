<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue';
import { DatePicker } from 'v-calendar';
import 'v-calendar/style.css';
import {
  Dialog,
  DialogPanel,
  TransitionRoot,
  TransitionChild,
  Switch,
  SwitchGroup,
  SwitchLabel,
} from '@headlessui/vue';
import apiService from '@/api/services';
import type { Budget } from '@/api/types';

defineOptions({ name: 'BudgetFormModal' });

// ── Props & Emits ──────────────────────────────────────────────────────
const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    budget?: Budget | null;
  }>(),
  {
    budget: null,
  },
);

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

// ── State ──────────────────────────────────────────────────────────────
const form = reactive({
  name: '',
  amountLimit: '',
  isRecurring: true,
  budgetMonth: new Date().toISOString().slice(0, 7),
});

const errors = reactive({
  name: '',
  amountLimit: '',
});

const submitError = ref<string>('');
const isSaving = ref(false);

// ── Computed ───────────────────────────────────────────────────────────
const hasErrors = computed(() => !!errors.name || !!errors.amountLimit);

const isEditMode = computed(() => props.mode === 'edit');

const selectedMonth = computed<Date>({
  get() {
    const [year, month] = form.budgetMonth.split('-').map(Number);
    if (!year || !month) {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return new Date(year, month - 1, 1);
  },
  set(value) {
    form.budgetMonth = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
  },
});

// ── Validation ──────────────────────────────────────────────────────────
function validate(): boolean {
  errors.name = form.name.trim() ? '' : 'Budget name is required';
  errors.amountLimit =
    form.amountLimit && !isNaN(Number(form.amountLimit)) && Number(form.amountLimit) > 0
      ? ''
      : 'Please enter a valid amount greater than 0';
  return !hasErrors.value;
}

// ── Form reset ──────────────────────────────────────────────────────────
function resetForm(): void {
  form.name = '';
  form.amountLimit = '';
  form.isRecurring = true;
  form.budgetMonth = new Date().toISOString().slice(0, 7);
  errors.name = '';
  errors.amountLimit = '';
  submitError.value = '';
}

// ── Form initialization for edit mode ──────────────────────────────────
function initializeForm(): void {
  if (isEditMode.value && props.budget) {
    form.name = props.budget.name;
    form.amountLimit = props.budget.amountLimit.toString();
    form.isRecurring = props.budget.isRecurring;
    form.budgetMonth = props.budget.budgetMonth;
  } else {
    resetForm();
  }
}

// ── Submit form ──────────────────────────────────────────────────────────
async function submitForm(): Promise<void> {
  if (!validate()) return;

  isSaving.value = true;
  submitError.value = '';
  try {
    if (isEditMode.value && props.budget) {
      await apiService.budgets.updateBudget(props.budget.id, {
        name: form.name.trim(),
        amountLimit: Number(form.amountLimit),
        isRecurring: form.isRecurring,
        budgetMonth: form.budgetMonth,
      });
    } else {
      await apiService.budgets.createBudget({
        name: form.name.trim(),
        amountLimit: Number(form.amountLimit),
        isRecurring: form.isRecurring,
        budgetMonth: form.budgetMonth,
        actualSpending: 0,
      });
    }
    emit('saved');
    handleClose();
  } catch (err) {
    console.error('Failed to save budget', err);
    submitError.value =
      err instanceof Error ? err.message : 'Failed to save budget. Please try again.';
  } finally {
    isSaving.value = false;
  }
}

// ── Close modal ──────────────────────────────────────────────────────────
function handleClose(): void {
  resetForm();
  emit('close');
}

// ── Lifecycle ──────────────────────────────────────────────────────────
onMounted(() => {
  initializeForm();
});
</script>

<template>
  <TransitionRoot :show="isOpen">
    <Dialog :open="isOpen" as="div" class="relative z-50" @close="handleClose">
      <TransitionChild
        as="template"
        enter="ease-out duration-200"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-150"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-slate-900/35 backdrop-blur-[2px]" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="ease-out duration-200"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-150"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_0_0_rgba(148,163,184,0.45)]"
              role="dialog"
              aria-modal="true"
              :aria-labelledby="isEditMode ? 'modal-title-edit' : 'modal-title-create'"
            >
              <h2
                :id="isEditMode ? 'modal-title-edit' : 'modal-title-create'"
                class="mb-6 text-2xl font-bold tracking-tight text-slate-900"
              >
                {{ isEditMode ? 'Edit Budget' : 'Create New Budget' }}
              </h2>

              <form class="space-y-4" @submit.prevent="submitForm">
                <!-- Submit Error -->
                <div v-if="submitError" class="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p class="text-sm text-red-700">{{ submitError }}</p>
                </div>

                <!-- Budget Name -->
                <div>
                  <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                    Budget Name
                  </label>
                  <input
                    id="name"
                    v-model="form.name"
                    type="text"
                    placeholder="e.g., Groceries, Entertainment"
                    class="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                    :aria-invalid="!!errors.name"
                  />
                  <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
                </div>

                <!-- Budget Amount -->
                <div>
                  <label for="amount" class="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Limit
                  </label>
                  <div class="relative">
                    <span
                      class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-medium"
                      >$</span
                    >
                    <input
                      id="amount"
                      v-model="form.amountLimit"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      class="w-full pl-7 pr-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                      :aria-invalid="!!errors.amountLimit"
                    />
                  </div>
                  <p v-if="errors.amountLimit" class="mt-1 text-sm text-red-600">
                    {{ errors.amountLimit }}
                  </p>
                </div>

                <!-- Budget Month -->
                <div>
                  <label for="month" class="block text-sm font-medium text-gray-700 mb-1">
                    Month
                  </label>
                  <DatePicker
                    id="month"
                    v-model="selectedMonth"
                    locale="en"
                    :masks="{ input: 'MMMM YYYY' }"
                  >
                    <template #default="{ inputValue, inputEvents }">
                      <input
                        :value="inputValue"
                        class="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                        readonly
                        v-on="inputEvents"
                      />
                    </template>
                  </DatePicker>
                </div>

                <!-- Recurring Toggle -->
                <SwitchGroup>
                  <div class="flex items-center gap-3">
                    <Switch
                      v-model="form.isRecurring"
                      :class="form.isRecurring ? 'bg-blue-600' : 'bg-neutral-300'"
                      class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors"
                    >
                      <span
                        :class="form.isRecurring ? 'translate-x-5' : 'translate-x-0'"
                        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      />
                    </Switch>
                    <SwitchLabel class="text-sm font-medium text-gray-700">
                      Recurring every month
                    </SwitchLabel>
                  </div>
                </SwitchGroup>

                <!-- Buttons -->
                <div class="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    class="duo-btn-secondary px-4 py-2 text-sm font-medium"
                    @click="handleClose"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    :disabled="isSaving"
                    class="duo-btn-primary px-4 py-2 text-sm font-medium"
                  >
                    {{ isSaving ? 'Saving...' : isEditMode ? 'Update' : 'Create' }}
                  </button>
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
