<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
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
import { getPreferredLocale } from '@/utils/userPreferences';

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

const { t, locale } = useI18n();

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
    expense: {
      label: t('transactionModal.expense'),
      color: 'red',
      icon: ArrowUpTrayIcon,
    },
    income: {
      label: t('transactionModal.income'),
      color: 'green',
      icon: ArrowDownTrayIcon,
    },
  };
  return configs[transactionType.value];
});

const datePickerLocale = computed(() => getPreferredLocale(locale.value === 'zh' ? 'zh' : 'en'));

function validate(): boolean {
  if (isTransferEdit.value) {
    errors.amount = '';
    errors.categoryId = t('transactionModal.transferNotSupported');
    errors.accountId = '';
    submitError.value = t('transactionModal.transferNotSupported');
    return false;
  }

  errors.amount = form.amount && Number(form.amount) > 0 ? '' : t('transactionModal.invalidAmount');
  errors.categoryId = form.categoryId ? '' : t('transactionModal.chooseCategory');
  errors.accountId = form.accountId ? '' : t('transactionModal.chooseAccount');
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
  submitError.value = isTransferEdit.value ? t('transactionModal.transferNotSupported') : '';
}

async function submitForm(): Promise<void> {
  if (!validate()) return;

  isSaving.value = true;
  submitError.value = '';
  try {
    if (isTransferEdit.value) {
      submitError.value = t('transactionModal.transferNotSupported');
      return;
    }

    const date = form.date ?? new Date();
    const transactionDate = date.toISOString();

    const accountId = form.accountId;
    if (accountId === null) {
      errors.accountId = t('transactionModal.chooseAccount');
      return;
    }

    const categoryId = form.categoryId;
    if (categoryId === null) {
      errors.categoryId = t('transactionModal.chooseCategory');
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
        t('transactionModal.saveFailed');
    } else if (err instanceof Error) {
      submitError.value = err.message;
    } else {
      submitError.value = t('transactionModal.saveFailed');
    }
  } finally {
    isSaving.value = false;
  }
}

async function deleteCurrentTransaction(): Promise<void> {
  if (!isEditMode.value || !props.transaction) {
    return;
  }

  const confirmed = window.confirm(t('transactionModal.deleteConfirm'));
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
        t('transactionModal.deleteFailed');
    } else if (err instanceof Error) {
      submitError.value = err.message;
    } else {
      submitError.value = t('transactionModal.deleteFailed');
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
  { immediate: true }
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
              aria-labelledby="modal-title"
            >
              <h2 id="modal-title" class="mb-6 text-2xl font-bold tracking-tight text-slate-900">
                {{ isEditMode ? t('transactionModal.editTitle') : t('transactionModal.addTitle') }}
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
                  :title="t('transactionModal.expenseTitle')"
                  :disabled="isEditMode"
                  :aria-disabled="isEditMode"
                  @click="selectTransactionType('expense')"
                >
                  <ArrowUpTrayIcon class="size-5" />
                  <span>{{ t('transactionModal.expense') }}</span>
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
                  :title="t('transactionModal.incomeTitle')"
                  :disabled="isEditMode"
                  :aria-disabled="isEditMode"
                  @click="selectTransactionType('income')"
                >
                  <ArrowDownTrayIcon class="size-5" />
                  <span>{{ t('transactionModal.income') }}</span>
                </button>
              </div>

              <p v-if="isEditMode" class="mb-4 text-xs text-neutral-500">
                {{ t('transactionModal.typeFixed') }}
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
                    {{ t('transactionModal.amount') }}
                  </label>
                  <input
                    id="amount"
                    v-model="form.amount"
                    type="number"
                    step="0.01"
                    min="0"
                    :placeholder="t('transactionModal.amountPlaceholder')"
                    class="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                    :aria-invalid="!!errors.amount"
                  />
                  <p v-if="errors.amount" class="mt-1 text-sm text-red-600">{{ errors.amount }}</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{
                    t('transactionModal.category')
                  }}</label>
                  <Listbox v-model="form.categoryId">
                    <div class="relative">
                      <ListboxButton
                        class="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 hover:bg-white hover:border-neutral-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-left"
                        :aria-invalid="!!errors.categoryId"
                      >
                        <span class="truncate text-neutral-800">
                          {{ selectedCategory?.name || t('transactionModal.selectCategory') }}
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
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{
                    t('transactionModal.account')
                  }}</label>
                  <Listbox v-model="form.accountId">
                    <div class="relative">
                      <ListboxButton
                        class="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 hover:bg-white hover:border-neutral-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-left"
                        :aria-invalid="!!errors.accountId"
                      >
                        <span class="truncate text-neutral-800">
                          {{ selectedAccount?.name || t('transactionModal.selectAccount') }}
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
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{
                    t('transactionModal.date')
                  }}</label>
                  <DatePicker v-model="form.date" :locale="datePickerLocale">
                    <template #default="{ togglePopover, inputValue, inputEvents }">
                      <div class="relative">
                        <CalendarIcon
                          class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400"
                        />
                        <input
                          v-bind="inputEvents"
                          :value="inputValue"
                          type="text"
                          :placeholder="t('transactionModal.selectDate')"
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
                    {{ t('transactionModal.notesOptional') }}
                  </label>
                  <textarea
                    id="notes"
                    v-model="form.notes"
                    :placeholder="t('transactionModal.notesPlaceholder')"
                    rows="3"
                    class="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition resize-none"
                  />
                </div>

                <div class="flex gap-2 justify-end pt-4">
                  <button
                    v-if="isEditMode"
                    type="button"
                    :disabled="isSaving || isDeleting"
                    class="duo-btn-danger mr-auto px-4 py-2 text-sm font-medium"
                    @click="deleteCurrentTransaction"
                  >
                    {{ isDeleting ? t('transactionModal.deleting') : t('common.delete') }}
                  </button>
                  <button
                    type="button"
                    class="duo-btn-secondary px-4 py-2 text-sm font-medium"
                    @click="handleClose"
                  >
                    {{ t('common.cancel') }}
                  </button>
                  <button
                    type="submit"
                    :disabled="isSaving || isDeleting || isTransferEdit"
                    :class="{
                      'bg-red-600 shadow-[0_4px_0_0_rgba(185,28,28,0.7)] hover:bg-red-700 active:shadow-[0_1px_0_0_rgba(185,28,28,0.7)]':
                        transactionType === 'expense',
                      'bg-green-600 shadow-[0_4px_0_0_rgba(21,128,61,0.7)] hover:bg-green-700 active:shadow-[0_1px_0_0_rgba(21,128,61,0.7)]':
                        transactionType === 'income',
                    }"
                    class="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {{
                      isSaving
                        ? t('transactionModal.saving')
                        : isEditMode
                          ? t('transactionModal.update')
                          : t('transactionModal.addType', { type: typeConfig.label })
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
