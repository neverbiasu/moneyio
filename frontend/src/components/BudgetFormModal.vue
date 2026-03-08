<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue';
import { Dialog, DialogPanel, TransitionRoot, TransitionChild, Switch } from '@headlessui/vue';
import { mockAPI } from '@/api/mock';
import type { Budget } from '@/api/mock-data';

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

// ── Validation ──────────────────────────────────────────────────────────
function validate(): boolean {
  errors.name = form.name.trim() ? '' : 'Budget name is required';
  errors.amountLimit =
    form.amountLimit && !isNaN(Number(form.amountLimit)) && Number(form.amountLimit) > 0
      ? ''
      : 'Please enter a valid amount';
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
      // Update existing budget
      await mockAPI.budgets.updateBudget(props.budget.id, {
        name: form.name.trim(),
        amountLimit: Number(form.amountLimit),
        isRecurring: form.isRecurring,
        budgetMonth: form.budgetMonth,
      });
    } else {
      // Create new budget
      await mockAPI.budgets.createBudget({
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
    submitError.value = 'Failed to save budget. Please try again.';
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
    <Dialog
      :open="isOpen"
      as="div"
      class="relative z-50"
      @close="handleClose"
    >
      <TransitionChild
        as="template"
        enter="ease-out duration-200"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-150"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-40" />
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
              class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
              role="dialog"
              aria-modal="true"
              :aria-labelledby="isEditMode ? 'modal-title-edit' : 'modal-title-create'"
            >
              <h2 :id="isEditMode ? 'modal-title-edit' : 'modal-title-create'" class="text-xl font-bold text-gray-900 mb-6">
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
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">$</span>
                    <input
                      id="amount"
                      v-model="form.amountLimit"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      class="w-full pl-7 pr-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                      :aria-invalid="!!errors.amountLimit"
                    />
                  </div>
                  <p v-if="errors.amountLimit" class="mt-1 text-sm text-red-600">{{ errors.amountLimit }}</p>
                </div>

                <!-- Budget Month -->
                <div>
                  <label for="month" class="block text-sm font-medium text-gray-700 mb-1">
                    Month
                  </label>
                  <input
                    id="month"
                    v-model="form.budgetMonth"
                    type="month"
                    class="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                  />
                </div>

                <!-- Recurring Toggle -->
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
                  <label class="text-sm font-medium text-gray-700">
                    Recurring every month
                  </label>
                </div>

                <!-- Buttons -->
                <div class="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    class="px-4 py-2 text-sm font-medium text-gray-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition"
                    @click="handleClose"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    :disabled="isSaving"
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
