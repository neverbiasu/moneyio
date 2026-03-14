<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from 'vue';
import { Dialog, DialogPanel, TransitionRoot, TransitionChild } from '@headlessui/vue';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue';
import { DatePicker } from 'v-calendar';
import 'v-calendar/style.css';
import {
  CheckIcon,
  ChevronDownIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from '@heroicons/vue/20/solid';
import type { Category, Account, Transaction } from '@/api/types';
import apiService from '@/api/services';
import axios from 'axios';

defineOptions({ name: 'TransactionFormModal' });

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    mode?: 'create' | 'edit';
    transaction?: Transaction | null;
    categories?: Category[];
    accounts?: Account[];
  }>(),
  {
    mode: 'create',
    transaction: null,
    categories: () => [],
    accounts: () => [],
  },
);

const emit = defineEmits<{
  close: [];
  saved: [];
  deleted: [];
}>();

const transactionType = ref<'expense' | 'income'>('expense');
const form = reactive({
  amount: '',
  categoryId: null as number | null,
  accountId: null as number | null,
  notes: '',
  date: new Date() as Date | null,
});

const errors = reactive({
  amount: '',
  categoryId: '',
  accountId: '',
});
const submitError = ref<string>('');

const localCategories = ref<Category[]>([]);
const localAccounts = ref<Account[]>([]);
const isSaving = ref(false);
const isDeleting = ref(false);
const isLoading = ref(false);

const categories = computed(() =>
  props.categories && props.categories.length > 0 ? props.categories : localCategories.value,
);

const accounts = computed(() =>
  props.accounts && props.accounts.length > 0 ? props.accounts : localAccounts.value,
);

const selectedCategory = computed(
  () => categories.value.find((c) => c.id === form.categoryId) ?? null,
);

const selectedAccount = computed(() => accounts.value.find((a) => a.id === form.accountId) ?? null);

const hasErrors = computed(() => !!errors.amount || !!errors.categoryId || !!errors.accountId);

const isEditMode = computed(() => props.mode === 'edit' && !!props.transaction);
const isTransferEdit = computed(
  () => isEditMode.value && props.transaction !== null && props.transaction.categoryId === null,
);

const filteredCategories = computed(() => {
  return categories.value.filter((c) => c.type === transactionType.value);
});

const typeConfig = computed(() => {
  const configs = {
    expense: { label: 'Expense', color: 'red', icon: ArrowUpTrayIcon },
    income: { label: 'Income', color: 'green', icon: ArrowDownTrayIcon },
  };
  return configs[transactionType.value];
});

function validate(): boolean {
  if (isTransferEdit.value) {
    errors.amount = '';
    errors.categoryId = 'Transfer transactions are not supported in this form.';
    errors.accountId = '';
    submitError.value = 'Transfer transactions are not supported in this form.';
    return false;
  }

  errors.amount = form.amount && Number(form.amount) > 0 ? '' : 'Please enter a valid amount';
  errors.categoryId = form.categoryId ? '' : 'Please select a category';
  errors.accountId = form.accountId ? '' : 'Please select an account';
  return !hasErrors.value;
}

function resetForm(): void {
  form.amount = '';
  form.categoryId = null;
  form.accountId = null;
  form.notes = '';
  form.date = new Date();
  errors.amount = '';
  errors.categoryId = '';
  errors.accountId = '';
  submitError.value = '';
}

function selectTransactionType(type: 'expense' | 'income'): void {
  if (isEditMode.value) {
    return;
  }

  transactionType.value = type;
  form.categoryId = null;
  errors.categoryId = '';
}

function detectTransactionType(categoryId: number | null): 'expense' | 'income' {
  if (categoryId === null) {
    return 'expense';
  }

  const target = categories.value.find((item) => item.id === categoryId);
  return target?.type === 'income' ? 'income' : 'expense';
}

function initializeEditForm(): void {
  if (!props.transaction) {
    resetForm();
    transactionType.value = 'expense';
    return;
  }

  form.amount = String(props.transaction.amount);
  form.categoryId = props.transaction.categoryId;
  form.accountId = props.transaction.accountId;
  form.notes = props.transaction.note ?? '';
  form.date = new Date(props.transaction.transactionDate);
  transactionType.value = detectTransactionType(props.transaction.categoryId);
  errors.amount = '';
  errors.categoryId = '';
  errors.accountId = '';
  submitError.value = isTransferEdit.value
    ? 'Transfer transactions are not supported in this form.'
    : '';
}

async function submitForm(): Promise<void> {
  if (!validate()) return;

  isSaving.value = true;
  submitError.value = '';
  try {
    if (isTransferEdit.value) {
      submitError.value = 'Transfer transactions are not supported in this form.';
      return;
    }

    const date = form.date ?? new Date();
    const transactionDate = date.toISOString();

    const accountId = form.accountId;
    if (accountId === null) {
      errors.accountId = 'Please select an account';
      return;
    }

    const categoryId = form.categoryId;
    if (categoryId === null) {
      errors.categoryId = 'Please select a category';
      return;
    }

    const transaction: Omit<Transaction, 'id' | 'userId' | 'crtTime' | 'uptTime'> = {
      amount: Number(form.amount),
      categoryId,
      accountId,
      note: form.notes.trim() === '' ? null : form.notes,
      transactionDate,
    };

    if (isEditMode.value && props.transaction) {
      await apiService.transactions.updateTransaction(props.transaction.id, transaction);
    } else {
      await apiService.transactions.createTransaction(transaction);
    }

    emit('saved');
    handleClose();
  } catch (err) {
    console.error('Failed to save transaction', err);
    if (axios.isAxiosError(err)) {
      submitError.value =
        (err.response?.data as { error?: string } | undefined)?.error ??
        'Failed to save transaction. Please try again.';
    } else if (err instanceof Error) {
      submitError.value = err.message;
    } else {
      submitError.value = 'Failed to save transaction. Please try again.';
    }
  } finally {
    isSaving.value = false;
  }
}

async function deleteCurrentTransaction(): Promise<void> {
  if (!isEditMode.value || !props.transaction) {
    return;
  }

  const confirmed = window.confirm('Delete this transaction? This action cannot be undone.');
  if (!confirmed) {
    return;
  }

  isDeleting.value = true;
  submitError.value = '';
  try {
    await apiService.transactions.deleteTransaction(props.transaction.id);
    emit('deleted');
    handleClose();
  } catch (err) {
    console.error('Failed to delete transaction', err);
    if (axios.isAxiosError(err)) {
      submitError.value =
        (err.response?.data as { error?: string } | undefined)?.error ??
        'Failed to delete transaction. Please try again.';
    } else if (err instanceof Error) {
      submitError.value = err.message;
    } else {
      submitError.value = 'Failed to delete transaction. Please try again.';
    }
  } finally {
    isDeleting.value = false;
  }
}

function handleClose(): void {
  resetForm();
  emit('close');
}

onMounted(async () => {
  const shouldFetchCategories = !props.categories || props.categories.length === 0;
  const shouldFetchAccounts = !props.accounts || props.accounts.length === 0;

  if (!shouldFetchCategories && !shouldFetchAccounts) {
    return;
  }

  isLoading.value = true;
  try {
    if (shouldFetchCategories) {
      try {
        localCategories.value = await apiService.categories.getCategories();
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }

    if (shouldFetchAccounts) {
      try {
        localAccounts.value = await apiService.accounts.getAccounts();
      } catch (err) {
        console.error('Failed to load accounts', err);
      }
    }
  } finally {
    isLoading.value = false;
    if (isEditMode.value) {
      initializeEditForm();
    }
  }
});

watch(
  () => [props.isOpen, props.mode, props.transaction?.id, categories.value.length],
  () => {
    if (!props.isOpen) {
      return;
    }

    if (isEditMode.value) {
      initializeEditForm();
      return;
    }

    resetForm();
    transactionType.value = 'expense';
  },
);
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
              aria-labelledby="modal-title"
            >
              <h2 id="modal-title" class="text-xl font-bold text-gray-900 mb-6">
                {{ isEditMode ? 'Edit Transaction' : 'Add Transaction' }}
              </h2>

              <div class="mb-6 flex gap-2">
                <button
                  :class="[
                    transactionType === 'expense'
                      ? 'bg-red-100 border-2 border-red-500 text-red-700'
                      : 'bg-gray-100 border-2 border-gray-300 text-gray-600',
                    isEditMode ? 'cursor-not-allowed opacity-60' : '',
                  ]"
                  class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-colors"
                  :aria-pressed="transactionType === 'expense'"
                  title="Expense Transaction"
                  :disabled="isEditMode"
                  :aria-disabled="isEditMode"
                  @click="selectTransactionType('expense')"
                >
                  <ArrowUpTrayIcon class="size-5" />
                  <span>Expense</span>
                </button>
                <button
                  :class="[
                    transactionType === 'income'
                      ? 'bg-green-100 border-2 border-green-500 text-green-700'
                      : 'bg-gray-100 border-2 border-gray-300 text-gray-600',
                    isEditMode ? 'cursor-not-allowed opacity-60' : '',
                  ]"
                  class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-colors"
                  :aria-pressed="transactionType === 'income'"
                  title="Income Transaction"
                  :disabled="isEditMode"
                  :aria-disabled="isEditMode"
                  @click="selectTransactionType('income')"
                >
                  <ArrowDownTrayIcon class="size-5" />
                  <span>Income</span>
                </button>
              </div>

              <p v-if="isEditMode" class="mb-4 text-xs text-neutral-500">
                Transaction type is fixed in edit mode.
              </p>

              <div v-if="isLoading" class="text-center py-8">
                <div class="inline-block animate-spin">
                  <div
                    class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"
                  ></div>
                </div>
              </div>

              <form v-else class="space-y-4" @submit.prevent="submitForm">
                <div v-if="submitError" class="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p class="text-sm text-red-700">{{ submitError }}</p>
                </div>

                <div>
                  <label for="amount" class="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    id="amount"
                    v-model="form.amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    class="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                    :aria-invalid="!!errors.amount"
                  />
                  <p v-if="errors.amount" class="mt-1 text-sm text-red-600">{{ errors.amount }}</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <Listbox v-model="form.categoryId">
                    <div class="relative">
                      <ListboxButton
                        class="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 hover:bg-white hover:border-neutral-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-left"
                        :aria-invalid="!!errors.categoryId"
                      >
                        <span class="truncate text-neutral-800">
                          {{ selectedCategory?.name || 'Select a category' }}
                        </span>
                        <ChevronDownIcon class="size-4 text-neutral-400 shrink-0" />
                      </ListboxButton>
                      <ListboxOptions
                        class="absolute z-20 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg overflow-hidden focus:outline-none"
                      >
                        <ListboxOption
                          v-for="cat in filteredCategories"
                          :key="cat.id"
                          v-slot="{ active, selected }"
                          :value="cat.id"
                        >
                          <li
                            :class="[
                              'flex items-center justify-between px-3 py-2 text-sm cursor-pointer select-none',
                              active ? 'bg-blue-50 text-blue-700' : 'text-neutral-800',
                            ]"
                          >
                            <span>{{ cat.name }}</span>
                            <CheckIcon v-if="selected" class="size-4 text-blue-600 shrink-0" />
                          </li>
                        </ListboxOption>
                      </ListboxOptions>
                    </div>
                  </Listbox>
                  <p v-if="errors.categoryId" class="mt-1 text-sm text-red-600">
                    {{ errors.categoryId }}
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Account</label>
                  <Listbox v-model="form.accountId">
                    <div class="relative">
                      <ListboxButton
                        class="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 hover:bg-white hover:border-neutral-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-left"
                        :aria-invalid="!!errors.accountId"
                      >
                        <span class="truncate text-neutral-800">
                          {{ selectedAccount?.name || 'Select an account' }}
                        </span>
                        <ChevronDownIcon class="size-4 text-neutral-400 shrink-0" />
                      </ListboxButton>
                      <ListboxOptions
                        class="absolute z-20 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg overflow-hidden focus:outline-none"
                      >
                        <ListboxOption
                          v-for="acc in accounts"
                          :key="acc.id"
                          v-slot="{ active, selected }"
                          :value="acc.id"
                        >
                          <li
                            :class="[
                              'flex items-center justify-between px-3 py-2 text-sm cursor-pointer select-none',
                              active ? 'bg-blue-50 text-blue-700' : 'text-neutral-800',
                            ]"
                          >
                            <span>{{ acc.name }}</span>
                            <CheckIcon v-if="selected" class="size-4 text-blue-600 shrink-0" />
                          </li>
                        </ListboxOption>
                      </ListboxOptions>
                    </div>
                  </Listbox>
                  <p v-if="errors.accountId" class="mt-1 text-sm text-red-600">
                    {{ errors.accountId }}
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <DatePicker v-model="form.date" locale="en">
                    <template #default="{ togglePopover, inputValue, inputEvents }">
                      <div class="relative">
                        <CalendarIcon
                          class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400"
                        />
                        <input
                          v-bind="inputEvents"
                          :value="inputValue"
                          type="text"
                          placeholder="Select date"
                          readonly
                          class="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 hover:bg-white hover:border-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition cursor-pointer"
                          @click="togglePopover"
                        />
                      </div>
                    </template>
                  </DatePicker>
                </div>

                <div>
                  <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    v-model="form.notes"
                    placeholder="Add any notes..."
                    rows="3"
                    class="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition resize-none"
                  />
                </div>

                <div class="flex gap-2 justify-end pt-4">
                  <button
                    v-if="isEditMode"
                    type="button"
                    :disabled="isSaving || isDeleting"
                    class="mr-auto px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    @click="deleteCurrentTransaction"
                  >
                    {{ isDeleting ? 'Deleting...' : 'Delete' }}
                  </button>
                  <button
                    type="button"
                    class="px-4 py-2 text-sm font-medium text-gray-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition"
                    @click="handleClose"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    :disabled="isSaving || isDeleting || isTransferEdit"
                    :class="{
                      'bg-red-600 hover:bg-red-700': transactionType === 'expense',
                      'bg-green-600 hover:bg-green-700': transactionType === 'income',
                    }"
                    class="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {{
                      isSaving
                        ? 'Saving...'
                        : isEditMode
                          ? 'Update Transaction'
                          : `Add ${typeConfig.label}`
                    }}
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

<style scoped></style>
