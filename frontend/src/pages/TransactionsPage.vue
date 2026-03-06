<template>
  <section class="grid gap-3">
    <p class="text-sm text-gray-500">Transactions page — content coming soon.</p>
  </section>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import type { Transaction, Category, Account } from '@/api/mock-data';
import { mockAPI } from '@/api/mock';

// State
const transactions = ref<Transaction[]>([]);
const categories = ref<Category[]>([]);
const accounts = ref<Account[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

const filters = reactive({
  search: '',
  categoryId: null as number | null,
  accountId: null as number | null,
  startDate: null as string | null,
  endDate: null as string | null,
});

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
});

// Computed
const paginatedTransactions = computed(() => {
  const start = (pagination.page - 1) * pagination.limit;
  return transactions.value.slice(start, start + pagination.limit);
});

const totalPages = computed(() => Math.ceil(pagination.total / pagination.limit));
const canPrevious = computed(() => pagination.page > 1);
const canNext = computed(() => pagination.page < totalPages.value);

// Functions
async function fetchTransactions() {
  isLoading.value = true;
  error.value = null;
  try {
    const allTransactions = await mockAPI.transactions.getTransactions();
    let filtered = allTransactions;

    if (filters.search) {
      const sl = filters.search.toLowerCase();
      filtered = filtered.filter((t) => t.note?.toLowerCase().includes(sl) ?? false);
    }
    if (filters.categoryId) {
      filtered = filtered.filter((t) => t.categoryId === filters.categoryId);
    }
    if (filters.accountId) {
      filtered = filtered.filter((t) => t.accountId === filters.accountId);
    }
    if (filters.startDate) {
      const startDate = filters.startDate;
      filtered = filtered.filter((t) => t.transactionDate >= startDate);
    }
    if (filters.endDate) {
      const endDate = filters.endDate;
      filtered = filtered.filter((t) => t.transactionDate <= endDate);
    }

    filtered.sort(
      (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime(),
    );

    transactions.value = filtered;
    pagination.total = filtered.length;
  } catch (err) {
    console.error('Failed to load transactions:', err);
    error.value = '无法加载交易记录，请稍后重试。';
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

function resetFilters() {
  Object.assign(filters, {
    search: '',
    categoryId: null,
    accountId: null,
    startDate: null,
    endDate: null,
  });
  pagination.page = 1;
}

function getCategoryName(id: number): string {
  return categories.value.find((c) => c.id === id)?.name ?? 'Unknown';
}

function getAccountName(id: number): string {
  return accounts.value.find((a) => a.id === id)?.name ?? 'Unknown';
}

function formatCurrency(amount: number): string {
  return `$${Math.abs(amount).toFixed(2)}`;
}

function getCategoryType(id: number): 'income' | 'expense' {
  return categories.value.find((c) => c.id === id)?.type ?? 'expense';
}

const debouncedFetch = (() => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      pagination.page = 1;
      void fetchTransactions();
    }, 300);
  };
})();

watch(filters, debouncedFetch, { deep: true });
watch(
  () => pagination.page,
  () => window.scrollTo(0, 0),
);

onMounted(() => {
  void Promise.all([fetchMetadata(), fetchTransactions()]);
});
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-neutral-900">Transactions</h1>

    <!-- Filters -->
    <div class="rounded-lg border border-neutral-200 bg-white p-4 space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label for="search" class="block text-sm font-medium text-neutral-700 mb-1">Search</label>
          <input
            id="search"
            v-model="filters.search"
            type="text"
            placeholder="By notes..."
            class="w-full px-3 py-2 text-sm border border-neutral-300 rounded focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label for="cat" class="block text-sm font-medium text-neutral-700 mb-1">Category</label>
          <select
            id="cat"
            v-model.number="filters.categoryId"
            class="w-full px-3 py-2 text-sm border border-neutral-300 rounded focus:border-blue-500 focus:outline-none"
          >
            <option :value="null">All</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label for="acc" class="block text-sm font-medium text-neutral-700 mb-1">Account</label>
          <select
            id="acc"
            v-model.number="filters.accountId"
            class="w-full px-3 py-2 text-sm border border-neutral-300 rounded focus:border-blue-500 focus:outline-none"
          >
            <option :value="null">All</option>
            <option v-for="a in accounts" :key="a.id" :value="a.id">{{ a.name }}</option>
          </select>
        </div>
        <div>
          <label for="from" class="block text-sm font-medium text-neutral-700 mb-1">From</label>
          <input
            v-model="filters.startDate"
            id="from"
            type="date"
            class="w-full px-3 py-2 text-sm border border-neutral-300 rounded focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label for="to" class="block text-sm font-medium text-neutral-700 mb-1">To</label>
          <input
            v-model="filters.endDate"
            id="to"
            type="date"
            class="w-full px-3 py-2 text-sm border border-neutral-300 rounded focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>
      <div class="flex justify-end">
        <button
          @click="resetFilters"
          class="px-4 py-2 text-sm font-medium bg-neutral-200 text-neutral-700 rounded hover:bg-neutral-300"
        >
          Reset
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="h-12 bg-neutral-200 rounded animate-pulse" />
    </div>

    <!-- Empty -->
    <div
      v-else-if="transactions.length === 0"
      class="p-8 text-center text-neural-500 rounded-lg border border-neutral-200 bg-white"
    >
      No transactions found
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto border border-neutral-200 rounded-lg bg-white">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-neutral-200 bg-neutral-50">
            <th class="px-4 py-3 text-left font-semibold text-neutral-700">Date</th>
            <th class="px-4 py-3 text-left font-semibold text-neutral-700">Category</th>
            <th class="px-4 py-3 text-left font-semibold text-neutral-700">Account</th>
            <th class="px-4 py-3 text-left font-semibold text-neutral-700">Notes</th>
            <th class="px-4 py-3 text-right font-semibold text-neutral-700">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="t in paginatedTransactions"
            :key="t.id"
            class="border-b border-neutral-100 hover:bg-neutral-50"
          >
            <td class="px-4 py-3 text-neutral-900">{{ t.transactionDate }}</td>
            <td class="px-4 py-3 text-neutral-700">{{ getCategoryName(t.categoryId) }}</td>
            <td class="px-4 py-3 text-neutral-700">{{ getAccountName(t.accountId) }}</td>
            <td class="px-4 py-3 text-neutral-500">{{ t.note ?? '—' }}</td>
            <td
              class="px-4 py-3 text-right font-medium"
              :class="
                getCategoryType(t.categoryId) === 'income' ? 'text-green-600' : 'text-red-600'
              "
            >
              {{ getCategoryType(t.categoryId) === 'income' ? '+' : '-'
              }}{{ formatCurrency(t.amount) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="transactions.length > 0"
      class="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-lg"
    >
      <div class="text-sm text-neutral-600">
        Page {{ pagination.page }} of {{ totalPages }} · {{ pagination.total }} total
      </div>
      <div class="flex gap-2">
        <button
          @click="() => pagination.page--"
          :disabled="!canPrevious"
          class="px-3 py-2 text-sm font-medium border border-neutral-300 text-neutral-700 rounded hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <button
          @click="() => pagination.page++"
          :disabled="!canNext"
          class="px-3 py-2 text-sm font-medium border border-neutral-300 text-neutral-700 rounded hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  </div>
</template>
