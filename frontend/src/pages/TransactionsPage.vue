<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue';
import { DatePicker } from 'v-calendar';
import 'v-calendar/style.css';
import axios from 'axios';
import {
  ArrowDownLeftIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  BuildingStorefrontIcon,
  ChevronDownIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  SparklesIcon,
  XMarkIcon,
  FunnelIcon,
} from '@heroicons/vue/20/solid';
import TransactionFormModal from '@/components/TransactionFormModal.vue';
import type { Transaction, Category, Account } from '@/api/types';
import apiService from '@/api/services';
import { formatCurrencyWithPreference } from '@/utils/userPreferences';

defineOptions({ name: 'TransactionsPage' });

const { t } = useI18n();

const transactions = ref<Transaction[]>([]);
const categories = ref<Category[]>([]);
const accounts = ref<Account[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const isModalOpen = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const selectedTransaction = ref<Transaction | null>(null);

const searchQuery = ref('');
const selectedCategoryId = ref<number | null>(null);
const selectedAccountId = ref<number | null>(null);
const startDate = ref<Date | null>(null);
const endDate = ref<Date | null>(null);

const activeSearch = ref('');
const activeFilters = reactive({
  categoryId: null as number | null,
  accountId: null as number | null,
  startDate: null as Date | null,
  endDate: null as Date | null,
});

const pagination = reactive({ page: 1, limit: 20, total: 0 });
const pageSizeOptions = [10, 20, 50];

interface CategoryOption {
  id: number | null;
  name: string;
  type: Category['type'];
}
interface AccountOption {
  id: number | null;
  name: string;
}

const ALL_CATEGORY: CategoryOption = { id: null, name: '__all__', type: 'expense' };
const ALL_ACCOUNT: AccountOption = { id: null, name: '__all__' };

const categoryOptions = computed<CategoryOption[]>(() => [ALL_CATEGORY, ...categories.value]);
const accountOptions = computed<AccountOption[]>(() => [ALL_ACCOUNT, ...accounts.value]);

const selectedCategory = computed<CategoryOption>(
  () => categoryOptions.value.find((c) => c.id === selectedCategoryId.value) ?? ALL_CATEGORY,
);
const selectedAccount = computed<AccountOption>(
  () => accountOptions.value.find((a) => a.id === selectedAccountId.value) ?? ALL_ACCOUNT,
);

const paginatedTransactions = computed(() => {
  const start = (pagination.page - 1) * pagination.limit;
  return transactions.value.slice(start, start + pagination.limit);
});

const totalPages = computed(() => Math.ceil(pagination.total / pagination.limit));
const canPrevious = computed(() => pagination.page > 1);
const canNext = computed(() => pagination.page < totalPages.value);

const hasActiveFilters = computed(
  () =>
    activeSearch.value ||
    activeFilters.categoryId !== null ||
    activeFilters.accountId !== null ||
    activeFilters.startDate !== null ||
    activeFilters.endDate !== null,
);

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const backendError = (err.response?.data as { error?: unknown } | undefined)?.error;
    if (typeof backendError === 'string' && backendError.trim() !== '') {
      return backendError;
    }
  }

  if (err instanceof Error && err.message.trim() !== '') {
    return err.message;
  }

  return fallback;
}

async function fetchTransactions() {
  isLoading.value = true;
  error.value = null;
  try {
    let filtered = await apiService.transactions.getTransactions();

    if (activeSearch.value) {
      const sl = activeSearch.value.toLowerCase();
      filtered = filtered.filter((t) => t.note?.toLowerCase().includes(sl) ?? false);
    }
    if (activeFilters.categoryId !== null) {
      filtered = filtered.filter((t) => t.categoryId === activeFilters.categoryId);
    }
    if (activeFilters.accountId !== null) {
      filtered = filtered.filter((t) => t.accountId === activeFilters.accountId);
    }
    if (activeFilters.startDate) {
      const sd = activeFilters.startDate;
      filtered = filtered.filter((t) => new Date(t.transactionDate) >= sd);
    }
    if (activeFilters.endDate) {
      const ed = new Date(activeFilters.endDate);
      ed.setHours(23, 59, 59, 999);
      filtered = filtered.filter((t) => new Date(t.transactionDate) <= ed);
    }

    filtered.sort((a, b) => {
      const dateDiff =
        new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }
      return b.id - a.id;
    });
    transactions.value = filtered;
    pagination.total = filtered.length;
  } catch (err) {
    console.error('Failed to load transactions:', err);
    error.value = getApiErrorMessage(err, t('transactions.loadFailed'));
  } finally {
    isLoading.value = false;
  }
}

async function fetchMetadata() {
  try {
    const [cres, ares] = await Promise.all([
      apiService.categories.getCategories(),
      apiService.accounts.getAccounts(),
    ]);
    categories.value = cres;
    accounts.value = ares;
  } catch (err) {
    console.error('Failed to load metadata:', err);
  }
}

function commitAndFetch() {
  activeSearch.value = searchQuery.value;
  activeFilters.categoryId = selectedCategoryId.value;
  activeFilters.accountId = selectedAccountId.value;
  activeFilters.startDate = startDate.value;
  activeFilters.endDate = endDate.value;
  pagination.page = 1;
  void fetchTransactions();
}

function handleSearchKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') commitAndFetch();
}

function resetFilters() {
  searchQuery.value = '';
  selectedCategoryId.value = null;
  selectedAccountId.value = null;
  startDate.value = null;
  endDate.value = null;
  activeSearch.value = '';
  Object.assign(activeFilters, {
    categoryId: null,
    accountId: null,
    startDate: null,
    endDate: null,
  });
  pagination.page = 1;
  void fetchTransactions();
}

function getCategoryName(id: number | null): string {
  if (id === null) return t('common.transfer');
  return categories.value.find((c) => c.id === id)?.name ?? t('common.unknown');
}

function getAccountName(id: number): string {
  return accounts.value.find((a) => a.id === id)?.name ?? t('common.unknown');
}

function formatCurrency(amount: number): string {
  return formatCurrencyWithPreference(amount, { absolute: true });
}

function getCategoryType(id: number | null): 'income' | 'expense' | 'transfer' {
  if (id === null) return 'transfer';
  return categories.value.find((c) => c.id === id)?.type ?? 'expense';
}

const CATEGORY_BADGE = new Map<number, string>([
  [1, 'bg-orange-100 text-orange-700'],
  [2, 'bg-amber-100 text-amber-700'],
  [3, 'bg-yellow-100 text-yellow-800'],
  [4, 'bg-sky-100 text-sky-700'],
  [5, 'bg-purple-100 text-purple-700'],
  [10, 'bg-green-100 text-green-700'],
  [11, 'bg-emerald-100 text-emerald-700'],
]);

function getCategoryBadgeClass(id: number | null): string {
  if (id === null) return 'bg-blue-100 text-blue-700';
  return CATEGORY_BADGE.get(id) ?? 'bg-neutral-100 text-neutral-700';
}

function getCategoryIcon(categoryId: number | null) {
  const type = getCategoryType(categoryId);
  if (type === 'income') return ArrowDownLeftIcon;

  const categoryName = getCategoryName(categoryId).toLowerCase();

  if (
    categoryName.includes('entertainment') ||
    categoryName.includes('movie') ||
    categoryName.includes('game') ||
    categoryName.includes('fun')
  ) {
    return SparklesIcon;
  }

  if (
    categoryName.includes('food') ||
    categoryName.includes('dining') ||
    categoryName.includes('lunch') ||
    categoryName.includes('breakfast')
  ) {
    return BuildingStorefrontIcon;
  }

  if (categoryName.includes('transport') || categoryName.includes('travel')) {
    return BoltIcon;
  }

  return ArrowTrendingUpIcon;
}

function getCategoryIconClass(categoryId: number | null): string {
  const type = getCategoryType(categoryId);

  if (type === 'income') {
    return 'border-emerald-200 bg-emerald-100 text-emerald-700 shadow-[0_2px_0_0_rgba(16,185,129,0.45)]';
  }

  const categoryName = getCategoryName(categoryId).toLowerCase();

  if (
    categoryName.includes('entertainment') ||
    categoryName.includes('movie') ||
    categoryName.includes('game') ||
    categoryName.includes('fun')
  ) {
    return 'border-violet-200 bg-violet-100 text-violet-700 shadow-[0_2px_0_0_rgba(139,92,246,0.45)]';
  }

  if (
    categoryName.includes('food') ||
    categoryName.includes('dining') ||
    categoryName.includes('lunch') ||
    categoryName.includes('breakfast')
  ) {
    return 'border-amber-200 bg-amber-100 text-amber-700 shadow-[0_2px_0_0_rgba(245,158,11,0.45)]';
  }

  if (categoryName.includes('transport') || categoryName.includes('travel')) {
    return 'border-sky-200 bg-sky-100 text-sky-700 shadow-[0_2px_0_0_rgba(14,165,233,0.45)]';
  }

  return 'border-rose-200 bg-rose-100 text-rose-700 shadow-[0_2px_0_0_rgba(244,63,94,0.4)]';
}

const jumpInput = ref('');

function jumpToPage() {
  const n = parseInt(jumpInput.value, 10);
  if (!isNaN(n) && n >= 1 && n <= totalPages.value) {
    pagination.page = n;
  }
  jumpInput.value = '';
}
function prevPage() {
  pagination.page--;
}
function nextPage() {
  pagination.page++;
}
watch(
  () => pagination.page,
  () => window.scrollTo(0, 0),
);

watch(
  () => pagination.limit,
  () => {
    pagination.page = 1;
  },
);

onMounted(() => {
  void Promise.all([fetchMetadata(), fetchTransactions()]);
});

function openCreateModal() {
  modalMode.value = 'create';
  selectedTransaction.value = null;
  isModalOpen.value = true;
}

function openEditModal(transaction: Transaction) {
  modalMode.value = 'edit';
  selectedTransaction.value = transaction;
  isModalOpen.value = true;
}
async function handleTransactionSaved() {
  isModalOpen.value = false;
  selectedTransaction.value = null;
  pagination.page = 1;
  await fetchTransactions();
}

async function handleTransactionDeleted() {
  isModalOpen.value = false;
  selectedTransaction.value = null;
  pagination.page = 1;
  await fetchTransactions();
}
</script>

<template>
  <div class="space-y-4">
    <div
      class="rounded-xl border border-neutral-200 bg-white p-4 space-y-3 shadow-[0_4px_0_0_rgba(148,163,184,0.42)]"
    >
      <div class="flex gap-2">
        <div class="relative flex-1">
          <MagnifyingGlassIcon
            class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400"
          />
          <input
            v-model="searchQuery"
            type="text"
            aria-label="Search transactions by notes"
            :placeholder="t('transactions.searchPlaceholder')"
            class="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
            @keydown="handleSearchKeydown"
          />
        </div>
        <button
          class="duo-btn-primary flex items-center gap-1.5 px-4 py-2 text-sm font-medium"
          @click="commitAndFetch"
        >
          <MagnifyingGlassIcon class="size-4" />
          {{ t('transactions.search') }}
        </button>
        <button class="duo-btn-primary px-4 py-2 text-sm font-medium" @click="openCreateModal">
          {{ t('transactions.add') }}
        </button>
      </div>

      <div class="flex flex-wrap items-end gap-2">
        <div class="flex-1 min-w-36">
          <label class="block text-xs font-medium text-neutral-500 mb-1">{{
            t('transactions.category')
          }}</label>
          <Listbox v-model="selectedCategoryId">
            <div class="relative">
              <ListboxButton
                class="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 hover:bg-white hover:border-neutral-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-left"
              >
                <span class="truncate text-neutral-800">{{
                  selectedCategory.name === '__all__' ? t('common.all') : selectedCategory.name
                }}</span>
                <ChevronDownIcon class="size-4 text-neutral-400 shrink-0" />
              </ListboxButton>
              <ListboxOptions
                class="absolute z-20 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg overflow-hidden focus:outline-none"
              >
                <ListboxOption
                  v-for="opt in categoryOptions"
                  :key="opt.id ?? 'all'"
                  v-slot="{ active, selected }"
                  :value="opt.id"
                >
                  <li
                    :class="[
                      'flex items-center justify-between px-3 py-2 text-sm cursor-pointer select-none',
                      active ? 'bg-blue-50 text-blue-700' : 'text-neutral-800',
                    ]"
                  >
                    <span>{{ opt.name === '__all__' ? t('common.all') : opt.name }}</span>
                    <CheckIcon v-if="selected" class="size-4 text-blue-600 shrink-0" />
                  </li>
                </ListboxOption>
              </ListboxOptions>
            </div>
          </Listbox>
        </div>

        <div class="flex-1 min-w-36">
          <label class="block text-xs font-medium text-neutral-500 mb-1">{{
            t('transactions.account')
          }}</label>
          <Listbox v-model="selectedAccountId">
            <div class="relative">
              <ListboxButton
                class="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 hover:bg-white hover:border-neutral-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-left"
              >
                <span class="truncate text-neutral-800">{{
                  selectedAccount.name === '__all__' ? t('common.all') : selectedAccount.name
                }}</span>
                <ChevronDownIcon class="size-4 text-neutral-400 shrink-0" />
              </ListboxButton>
              <ListboxOptions
                class="absolute z-20 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg overflow-hidden focus:outline-none"
              >
                <ListboxOption
                  v-for="opt in accountOptions"
                  :key="opt.id ?? 'all'"
                  v-slot="{ active, selected }"
                  :value="opt.id"
                >
                  <li
                    :class="[
                      'flex items-center justify-between px-3 py-2 text-sm cursor-pointer select-none',
                      active ? 'bg-blue-50 text-blue-700' : 'text-neutral-800',
                    ]"
                  >
                    <span>{{ opt.name === '__all__' ? t('common.all') : opt.name }}</span>
                    <CheckIcon v-if="selected" class="size-4 text-blue-600 shrink-0" />
                  </li>
                </ListboxOption>
              </ListboxOptions>
            </div>
          </Listbox>
        </div>

        <div class="flex-1 min-w-36">
          <label class="block text-xs font-medium text-neutral-500 mb-1">{{
            t('transactions.from')
          }}</label>
          <DatePicker v-model="startDate" locale="en" :max-date="endDate ?? undefined">
            <template #default="{ togglePopover, inputValue, inputEvents }">
              <div class="relative">
                <CalendarIcon
                  class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400"
                />
                <input
                  v-bind="inputEvents"
                  :value="inputValue"
                  type="text"
                  :placeholder="t('transactions.startDate')"
                  readonly
                  class="w-full pl-9 pr-8 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 hover:bg-white hover:border-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition cursor-pointer"
                  @click="togglePopover"
                />
                <button
                  v-if="startDate"
                  type="button"
                  aria-label="Clear start date"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  @click.stop="startDate = null"
                >
                  <XMarkIcon class="size-4" />
                </button>
              </div>
            </template>
          </DatePicker>
        </div>

        <div class="flex-1 min-w-36">
          <label class="block text-xs font-medium text-neutral-500 mb-1">{{
            t('transactions.to')
          }}</label>
          <DatePicker v-model="endDate" locale="en" :min-date="startDate ?? undefined">
            <template #default="{ togglePopover, inputValue, inputEvents }">
              <div class="relative">
                <CalendarIcon
                  class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400"
                />
                <input
                  v-bind="inputEvents"
                  :value="inputValue"
                  type="text"
                  :placeholder="t('transactions.endDate')"
                  readonly
                  class="w-full pl-9 pr-8 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 hover:bg-white hover:border-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition cursor-pointer"
                  @click="togglePopover"
                />
                <button
                  v-if="endDate"
                  type="button"
                  aria-label="Clear end date"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  @click.stop="endDate = null"
                >
                  <XMarkIcon class="size-4" />
                </button>
              </div>
            </template>
          </DatePicker>
        </div>

        <div class="flex gap-2 shrink-0">
          <button
            class="duo-btn-secondary flex items-center gap-1.5 px-4 py-2 text-sm font-medium"
            @click="commitAndFetch"
          >
            <FunnelIcon class="size-4" />
            {{ t('transactions.apply') }}
          </button>
          <button
            v-if="hasActiveFilters"
            class="duo-btn-secondary flex items-center gap-1.5 px-3 py-2 text-sm font-medium"
            @click="resetFilters"
          >
            <XMarkIcon class="size-4" />
            {{ t('transactions.reset') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="error" class="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
      {{ error }}
    </div>

    <div v-if="isLoading" class="space-y-2">
      <div v-for="i in 8" :key="i" class="h-12 bg-neutral-100 rounded-xl animate-pulse" />
    </div>

    <div
      v-else-if="!isLoading && transactions.length === 0"
      class="py-16 text-center rounded-xl border border-neutral-200 bg-white"
    >
      <MagnifyingGlassIcon class="mx-auto size-8 text-neutral-300 mb-3" />
      <p class="text-sm font-medium text-neutral-500">{{ t('transactions.noTransactions') }}</p>
      <p class="text-xs text-neutral-400 mt-1">{{ t('transactions.noTransactionsHint') }}</p>
    </div>

    <div
      v-else
      class="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-[0_4px_0_0_rgba(148,163,184,0.42)]"
    >
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-neutral-200 bg-neutral-50">
            <th
              class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500"
            >
              {{ t('transactions.dateCol') }}
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500"
            >
              {{ t('transactions.categoryCol') }}
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500"
            >
              {{ t('transactions.accountCol') }}
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500"
            >
              {{ t('transactions.notesCol') }}
            </th>
            <th
              class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500"
            >
              {{ t('transactions.amountCol') }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-100">
          <tr
            v-for="transaction in paginatedTransactions"
            :key="transaction.id"
            class="hover:bg-neutral-50 transition-colors cursor-pointer"
            role="button"
            tabindex="0"
            @click="openEditModal(transaction)"
            @keydown.enter.prevent="openEditModal(transaction)"
            @keydown.space.prevent="openEditModal(transaction)"
          >
            <td class="px-4 py-3 text-xs text-neutral-500 tabular-nums">
              {{ transaction.transactionDate.slice(0, 10) }}
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center gap-2 rounded-xl border px-2.5 py-1 text-xs font-semibold"
                :class="getCategoryBadgeClass(transaction.categoryId)"
              >
                <span
                  class="inline-flex h-5 w-5 items-center justify-center rounded-lg border"
                  :class="getCategoryIconClass(transaction.categoryId)"
                >
                  <component :is="getCategoryIcon(transaction.categoryId)" class="h-3.5 w-3.5" />
                </span>
                {{ getCategoryName(transaction.categoryId) }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-neutral-600">
              {{ getAccountName(transaction.accountId) }}
            </td>
            <td class="px-4 py-3 text-sm text-neutral-500">{{ transaction.note ?? '—' }}</td>
            <td
              class="px-4 py-3 text-right text-sm font-semibold tabular-nums"
              :class="
                getCategoryType(transaction.categoryId) === 'income' ||
                (getCategoryType(transaction.categoryId) === 'transfer' && transaction.amount > 0)
                  ? 'text-green-600'
                  : 'text-red-600'
              "
            >
              {{
                getCategoryType(transaction.categoryId) === 'income' ||
                (getCategoryType(transaction.categoryId) === 'transfer' && transaction.amount > 0)
                  ? '+'
                  : '-'
              }}{{ formatCurrency(transaction.amount) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="transactions.length > 0"
      class="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-[0_4px_0_0_rgba(148,163,184,0.42)]"
    >
      <p class="text-sm text-neutral-500">
        {{
          t('transactions.pageInfo', {
            page: pagination.page,
            total: totalPages,
            count: pagination.total,
          })
        }}
      </p>
      <div class="flex items-center gap-2">
        <label class="text-sm text-neutral-500" for="page-size">{{
          t('transactions.perPage')
        }}</label>
        <select
          id="page-size"
          v-model.number="pagination.limit"
          class="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-700"
        >
          <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
        </select>
        <button
          :disabled="!canPrevious"
          class="duo-btn-secondary px-3 py-1.5 text-sm font-medium"
          @click="prevPage"
        >
          {{ t('transactions.previous') }}
        </button>
        <div class="flex items-center gap-1 text-sm text-neutral-500">
          <span class="hidden sm:inline">{{ t('transactions.goTo') }}</span>
          <input
            v-model="jumpInput"
            type="number"
            min="1"
            :max="totalPages"
            placeholder="#"
            class="w-14 px-2 py-1.5 text-sm text-center border border-neutral-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
            @keydown.enter="jumpToPage"
          />
          <button class="duo-btn-secondary px-2.5 py-1.5 text-sm font-medium" @click="jumpToPage">
            {{ t('transactions.go') }}
          </button>
        </div>
        <button
          :disabled="!canNext"
          class="duo-btn-secondary px-3 py-1.5 text-sm font-medium"
          @click="nextPage"
        >
          {{ t('transactions.next') }}
        </button>
      </div>
    </div>

    <TransactionFormModal
      v-if="isModalOpen"
      :is-open="isModalOpen"
      :mode="modalMode"
      :transaction="selectedTransaction"
      :categories="categories"
      :accounts="accounts"
      @close="isModalOpen = false"
      @saved="handleTransactionSaved"
      @deleted="handleTransactionDeleted"
    />
  </div>
</template>
