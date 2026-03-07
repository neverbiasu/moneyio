<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue';
import { Dialog, DialogPanel, TransitionRoot, TransitionChild } from '@headlessui/vue';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue';
import { DatePicker } from 'v-calendar';
import 'v-calendar/style.css';
import { CheckIcon, ChevronDownIcon, CalendarIcon } from '@heroicons/vue/20/solid';
import type { Category, Account, Transaction } from '@/api/mock-data';
import { mockAPI } from '@/api/mock';

defineOptions({ name: 'TransactionFormModal' });

// ── Props & Emits ──────────────────────────────────────────────────────
const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

// ── State ──────────────────────────────────────────────────────────────
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

const categories = ref<Category[]>([]);
const accounts = ref<Account[]>([]);
const isSaving = ref(false);
const isLoading = ref(false);

// ── Computed ───────────────────────────────────────────────────────────
const selectedCategory = computed(() =>
  categories.value.find((c) => c.id === form.categoryId) ?? null
);

const selectedAccount = computed(() =>
  accounts.value.find((a) => a.id === form.accountId) ?? null
);

const hasErrors = computed(
  () => !!errors.amount || !!errors.categoryId || !!errors.accountId
);

// ── Methods ────────────────────────────────────────────────────────────
function validate(): boolean {
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
}

async function submitForm(): Promise<void> {
  if (!validate()) return;

  isSaving.value = true;
  try {
    const date =  form.date || new Date();
    const dateStr = date instanceof Date 
      ? date.toISOString().split('T')[0] 
      : (date as any).slice(0, 10);
    
    const transaction: Omit<Transaction, 'id' | 'userId' | 'crtTime' | 'uptTime'> = {
      amount: Number(form.amount),
      categoryId: form.categoryId!,
      accountId: form.accountId!,
      note: form.notes || null,
      transactionDate: dateStr,
    };
    await mockAPI.transactions.createTransaction(transaction);
    emit('saved');
    resetForm();
    handleClose();
  } catch (err) {
    console.error('Failed to save transaction', err);
    errors.amount = 'Failed to save. Please try again.';
  } finally {
    isSaving.value = false;
  }
}

function handleClose(): void {
  resetForm();
  emit('close');
}

const handleKeyDown = (e: KeyboardEvent): void => {
  if (e.key === 'Escape') {
    handleClose();
  }
};

onMounted(async () => {
  isLoading.value = true;
  try {
    const [cats, accs] = await Promise.all([
      mockAPI.categories.getCategories(),
      mockAPI.accounts.getAccounts(),
    ]);
    categories.value = cats;
    accounts.value = accs;
  } catch (err) {
    console.error('Failed to load categories or accounts', err);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <TransitionRoot :show="isOpen">
    <Dialog :open="isOpen" as="div" @close="handleClose" @keydown="handleKeyDown" class="relative z-50">
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
              <h2 id="modal-title" class="text-xl font-bold text-gray-900 mb-6">Add Transaction</h2>

              <!-- Loading state -->
              <div v-if="isLoading" class="text-center py-8">
                <div class="inline-block animate-spin">
                  <div class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
              </div>

              <!-- Form -->
              <form v-else @submit.prevent="submitForm" class="space-y-4">
                <!-- Amount -->
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

                <!-- Category -->
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
                          v-for="cat in categories"
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

                <!-- Account -->
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

                <!-- Date -->
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

                <!-- Notes -->
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

                <!-- Buttons -->
                <div class="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    @click="handleClose"
                    class="px-4 py-2 text-sm font-medium text-gray-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    :disabled="isSaving"
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {{ isSaving ? 'Saving...' : 'Add Transaction' }}
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

<style scoped>
/* HeadlessUI transition styles */
</style>
