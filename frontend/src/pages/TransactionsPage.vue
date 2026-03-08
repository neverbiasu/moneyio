<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue';
import { DatePicker } from 'v-calendar';
import 'v-calendar/style.css';
import {
  ChevronDownIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  XMarkIcon,
  FunnelIcon,
} from '@heroicons/vue/20/solid';
import TransactionFormModal from '@/components/TransactionFormModal.vue';
import type { Transaction, Category, Account } from '@/api/mock-data';
import { mockAPI } from '@/api/mock';

defineOptions({ name: 'TransactionsPage' });

// ── State ──────────────────────────────────────────────────────────────
const transactions = ref<Transaction[]>([]);
const categories = ref<Category[]>([]);
const accounts = ref<Account[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const isModalOpen = ref(false);

// Pending filter state (form — not yet applied)
const searchQuery = ref('');
const selectedCategoryId = ref<number | null>(null);
const selectedAccountId = ref<number | null>(null);
const startDate = ref<Date | null>(null);
const endDate = ref<Date | null>(null);

// Active filter state (applied — drives the fetch)
const activeSearch = ref('');
const activeFilters = reactive({
  categoryId: null as number | null,
  accountId: null as number | null,
  startDate: null as Date | null,
  endDate: null as Date | null,
});

const pagination = reactive({ page: 1, limit: 20, total: 0 });

// ── Option types ──────────────────────────────────────────────────────
type CategoryOption = { id: number | null; name: string; type: Category['type'] };
type AccountOption = { id: number | null; name: string };

// ── Computed ───────────────────────────────────────────────────────────
const ALL_CATEGORY: CategoryOption = { id: null, name: 'All', type: 'expense' };
const ALL_ACCOUNT: AccountOption = { id: null, name: 'All' };

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

// ── Data fetching ──────────────────────────────────────────────────────
async function fetchTransactions() {
  isLoading.value = true;
  error.value = null;
  try {
    let filtered = await mockAPI.transactions.getTransactions();

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

    filtered.sort(
      (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime(),
    );
    transactions.value = filtered;
    pagination.total = filtered.length;
  } catch (err) {
    console.error('Failed to load transactions:', err);
    error.value = 'Failed to load transactions. Please try again.';
  } finally {
    isLoading.value = false;
  }
}

async function fetchMetadata() {
  try {
    const [cres, ares] = await Promise.all([
      mockAPI.categories.getCategories(),
      mockAPI.accounts.getAccounts(),
    ]);
    categories.value = cres;
    accounts.value = ares;
  } catch (err) {
    console.error('Failed to load metadata:', err);
  }
}

// ── Actions ────────────────────────────────────────────────────────────
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

// ── Helpers ────────────────────────────────────────────────────────────
function getCategoryName(id: number | null): string {
  if (id === null) return 'Transfer';
  return categories.value.find((c) => c.id === id)?.name ?? 'Unknown';
}

function getAccountName(id: number): string {
  return accounts.value.find((a) => a.id === id)?.name ?? 'Unknown';
}

function formatCurrency(amount: number): string {
  return `$${Math.abs(amount).toFixed(2)}`;
}

function getCategoryType(id: number | null): 'income' | 'expense' | 'transfer' {
  if (id === null) return 'transfer';
  return categories.value.find((c) => c.id === id)?.type ?? 'expense';
}

// Badge color per category — extend as categories grow
const CATEGORY_BADGE: Record<number, string> = {
  1: 'bg-orange-100 text-orange-700', // Food & Dining
  2: 'bg-amber-100 text-amber-700', // Breakfast
  3: 'bg-yellow-100 text-yellow-800', // Lunch
  4: 'bg-sky-100 text-sky-700', // Transportation
  5: 'bg-purple-100 text-purple-700', // Entertainment
  10: 'bg-green-100 text-green-700', // Salary
  11: 'bg-emerald-100 text-emerald-700', // Bonus
};

function getCategoryBadgeClass(id: number | null): string {
  if (id === null) return 'bg-blue-100 text-blue-700'; // Transfer
  return CATEGORY_BADGE[id] ?? 'bg-neutral-100 text-neutral-700';
}

// ── Pagination jump ────────────────────────────────────────────────────
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

onMounted(() => {
  void Promise.all([fetchMetadata(), fetchTransactions()]);
});

async function handleTransactionSaved() {
  isModalOpen.value = false;
  pagination.page = 1;
  await fetchTransactions();
}
</script>

<template>
  <div class="space-y-4">
    <!-- Filter panel -->
    <div class="rounded-xl border border-neutral-200 bg-white p-4 space-y-3 shadow-sm">
      <!-- Row 1: Search + Add Transaction -->
      <div class="flex gap-2">
        <div class="relative flex-1">
          <MagnifyingGlassIcon
            class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400"
          />
          <input
            v-model="searchQuery"
            type="text"
            aria-label="Search transactions by notes"
            placeholder="Search by notes..."
            class="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
            @keydown="handleSearchKeydown"
          />
        </div>
        <button
          class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition"
          @click="commitAndFetch"
        >
          <MagnifyingGlassIcon class="size-4" />
          Search
        </button>
        <button
          class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition"
          @click="isModalOpen = true"
        >
          + Add
        </button>
      </div>

      <!-- Row 2: Filters -->
      <div class="flex flex-wrap items-end gap-2">
        <!-- Category -->
        <div class="flex-1 min-w-36">
          <label class="block text-xs font-medium text-neutral-500 mb-1">Category</label>
          <Listbox v-model="selectedCategoryId">
            <div class="relative">
              <ListboxButton
                class="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 hover:bg-white hover:border-neutral-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-left"
              >
                <span class="truncate text-neutral-800">{{ selectedCategory.name }}</span>
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
                    <span>{{ opt.name }}</span>
                    <CheckIcon v-if="selected" class="size-4 text-blue-600 shrink-0" />
                  </li>
                </ListboxOption>
              </ListboxOptions>
            </div>
          </Listbox>
        </div>

        <!-- Account -->
        <div class="flex-1 min-w-36">
          <label class="block text-xs font-medium text-neutral-500 mb-1">Account</label>
          <Listbox v-model="selectedAccountId">
            <div class="relative">
              <ListboxButton
                class="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 hover:bg-white hover:border-neutral-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-left"
              >
                <span class="truncate text-neutral-800">{{ selectedAccount.name }}</span>
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
                    <span>{{ opt.name }}</span>
                    <CheckIcon v-if="selected" class="size-4 text-blue-600 shrink-0" />
                  </li>
                </ListboxOption>
              </ListboxOptions>
            </div>
          </Listbox>
        </div>

        <!-- From date -->
        <div class="flex-1 min-w-36">
          <label class="block text-xs font-medium text-neutral-500 mb-1">From</label>
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
                  placeholder="Start date"
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

        <!-- To date -->
        <div class="flex-1 min-w-36">
          <label class="block text-xs font-medium text-neutral-500 mb-1">To</label>
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
                  placeholder="End date"
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

        <!-- Action buttons -->
        <div class="flex gap-2 shrink-0">
          <button
            class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition"
            @click="commitAndFetch"
          >
            <FunnelIcon class="size-4" />
            Apply
          </button>
          <button
            v-if="hasActiveFilters"
            class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-neutral-300 text-neutral-600 rounded-lg hover:bg-neutral-50 transition"
            @click="resetFilters"
          >
            <XMarkIcon class="size-4" />
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
      {{ error }}
    </div>

    <!-- Loading skeleton -->
    <div v-if="isLoading" class="space-y-2">
      <div v-for="i in 8" :key="i" class="h-12 bg-neutral-100 rounded-xl animate-pulse" />
    </div>

    <!-- Empty -->
    <div
      v-else-if="!isLoading && transactions.length === 0"
      class="py-16 text-center rounded-xl border border-neutral-200 bg-white"
    >
      <MagnifyingGlassIcon class="mx-auto size-8 text-neutral-300 mb-3" />
      <p class="text-sm font-medium text-neutral-500">No transactions found</p>
      <p class="text-xs text-neutral-400 mt-1">Try adjusting your search or filters</p>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-neutral-200 bg-neutral-50">
            <th
              class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500"
            >
              Date
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500"
            >
              Category
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500"
            >
              Account
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500"
            >
              Notes
            </th>
            <th
              class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500"
            >
              Amount
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-100">
          <tr
            v-for="t in paginatedTransactions"
            :key="t.id"
            class="hover:bg-neutral-50 transition-colors"
          >
            <td class="px-4 py-3 text-xs text-neutral-500 tabular-nums">
              {{ t.transactionDate.slice(0, 10) }}
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md"
                :class="getCategoryBadgeClass(t.categoryId)"
              >
                {{ getCategoryName(t.categoryId) }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-neutral-600">{{ getAccountName(t.accountId) }}</td>
            <td class="px-4 py-3 text-sm text-neutral-500">{{ t.note ?? '—' }}</td>
            <td
              class="px-4 py-3 text-right text-sm font-semibold tabular-nums"
              :class="
                getCategoryType(t.categoryId) === 'income' || (getCategoryType(t.categoryId) === 'transfer' && t.amount > 0) ? 'text-green-600' : 'text-red-600'
              "
            >
              {{ getCategoryType(t.categoryId) === 'income' || (getCategoryType(t.categoryId) === 'transfer' && t.amount > 0) ? '+' : '-'
              }}{{ formatCurrency(t.amount) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="transactions.length > 0"
      class="flex items-center justify-between px-4 py-3 bg-white border border-neutral-200 rounded-xl shadow-sm"
    >
      <p class="text-sm text-neutral-500">
        Page <span class="font-medium text-neutral-800">{{ pagination.page }}</span> of
        <span class="font-medium text-neutral-800">{{ totalPages }}</span>
        · {{ pagination.total }} total
      </p>
      <div class="flex items-center gap-2">
        <button
          :disabled="!canPrevious"
          class="px-3 py-1.5 text-sm font-medium border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          @click="prevPage"
        >
          ← Previous
        </button>
        <!-- Jump to page -->
        <div class="flex items-center gap-1 text-sm text-neutral-500">
          <span class="hidden sm:inline">Go to</span>
          <input
            v-model="jumpInput"
            type="number"
            min="1"
            :max="totalPages"
            placeholder="#"
            class="w-14 px-2 py-1.5 text-sm text-center border border-neutral-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
            @keydown.enter="jumpToPage"
          />
          <button
            class="px-2.5 py-1.5 text-sm font-medium border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition"
            @click="jumpToPage"
          >
            Go
          </button>
        </div>
        <button
          :disabled="!canNext"
          class="px-3 py-1.5 text-sm font-medium border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          @click="nextPage"
        >
          Next →
        </button>
      </div>
    </div>

    <TransactionFormModal
      v-if="isModalOpen"
      :is-open="isModalOpen"
      :categories="categories"
      :accounts="accounts"
      @close="isModalOpen = false"
      @saved="handleTransactionSaved"
    />
  </div>
</template>
