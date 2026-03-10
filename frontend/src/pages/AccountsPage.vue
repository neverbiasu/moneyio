<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { PlusIcon, PencilIcon, TrashIcon, BanknotesIcon } from '@heroicons/vue/20/solid';
import AccountFormModal from '@/components/AccountFormModal.vue';
import { mockAPI } from '@/api/mock';
import type { Account } from '@/api/mock-data';

defineOptions({ name: 'AccountsPage' });

// ── State ──────────────────────────────────────────────────────────────
const accounts = ref<Account[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const isModalOpen = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const selectedAccount = ref<Account | null>(null);
const deleteConfirmId = ref<number | null>(null);

// ── Data fetching ──────────────────────────────────────────────────────
async function fetchAccounts() {
  isLoading.value = true;
  error.value = null;
  try {
    accounts.value = await mockAPI.accounts.getAccounts();
  } catch (err) {
    console.error('Failed to load accounts:', err);
    error.value = 'Failed to load accounts. Please try again.';
  } finally {
    isLoading.value = false;
  }
}

// ── Account type badge colors ──────────────────────────────────────────
const ACCOUNT_TYPE_CONFIG: Record<Account['type'], { label: string; color: string }> = {
  savings: { label: 'Savings', color: 'bg-green-100 text-green-700' },
  checking: { label: 'Checking', color: 'bg-blue-100 text-blue-700' },
  credit: { label: 'Credit', color: 'bg-orange-100 text-orange-700' },
};

// ── Actions ────────────────────────────────────────────────────────────
function openCreateModal() {
  modalMode.value = 'create';
  selectedAccount.value = null;
  isModalOpen.value = true;
}

function openEditModal(account: Account) {
  modalMode.value = 'edit';
  selectedAccount.value = account;
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
    await mockAPI.accounts.deleteAccount(id);
    deleteConfirmId.value = null;
    await fetchAccounts();
  } catch (err) {
    console.error('Failed to delete account:', err);
    error.value = 'Failed to delete account. Please try again.';
  }
}

// ── Helpers ────────────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
}

function getAccountTypeConfig(type: Account['type']) {
  return ACCOUNT_TYPE_CONFIG[type];
}

function handleModalSaved() {
  isModalOpen.value = false;
  void fetchAccounts();
}

// ── Lifecycle ──────────────────────────────────────────────────────────
onMounted(() => {
  void fetchAccounts();
});
</script>

<template>
  <div class="space-y-4">
    <!-- Top toolbar with add button (page title handled by GlobalLayout) -->
    <div class="flex justify-end">
      <button
        type="button"
        class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition"
        @click="openCreateModal"
      >
        <PlusIcon class="size-5" aria-hidden="true" />
        Add Account
      </button>
    </div>

    <!-- Error message -->
    <div v-if="error" class="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
      {{ error }}
    </div>

    <!-- Loading skeleton -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="h-40 bg-neutral-100 rounded-xl animate-pulse" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!isLoading && accounts.length === 0"
      class="py-16 text-center rounded-xl border border-neutral-200 bg-white"
    >
      <BanknotesIcon class="mx-auto size-12 text-neutral-300 mb-3" aria-hidden="true" />
      <p class="text-sm font-medium text-neutral-500">No accounts yet</p>
      <p class="text-xs text-neutral-400 mt-1">Create your first account to get started</p>
      <button
        type="button"
        class="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        @click="openCreateModal"
      >
        <PlusIcon class="size-4" aria-hidden="true" />
        Create Account
      </button>
    </div>

    <!-- Accounts grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="account in accounts"
        :key="account.id"
        class="relative rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-neutral-300 transition"
      >
        <!-- Account type badge -->
        <div class="flex items-start justify-between mb-4">
          <div>
            <span
              :class="getAccountTypeConfig(account.type).color"
              class="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full"
            >
              {{ getAccountTypeConfig(account.type).label }}
            </span>
          </div>
          <!-- Action buttons -->
          <div class="flex gap-2">
            <button
              type="button"
              class="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              :aria-label="`Edit ${account.name}`"
              @click="openEditModal(account)"
            >
              <PencilIcon class="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              :aria-label="`Delete ${account.name}`"
              @click="startDeleteConfirm(account.id)"
            >
              <TrashIcon class="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <!-- Account name -->
        <h3 class="text-lg font-semibold text-neutral-900 mb-1">{{ account.name }}</h3>

        <!-- Account balance -->
        <div class="mb-4 pt-4 border-t border-neutral-100">
          <p class="text-xs uppercase tracking-wide text-neutral-500 mb-1">Balance</p>
          <p
            class="text-2xl font-bold tabular-nums"
            :class="account.balance >= 0 ? 'text-green-600' : 'text-red-600'"
          >
            {{ formatCurrency(account.balance) }}
          </p>
        </div>

        <!-- Delete confirmation -->
        <div
          v-if="deleteConfirmId === account.id"
          class="absolute inset-0 rounded-xl bg-white border-2 border-red-300 p-5 flex flex-col items-center justify-center gap-3 backdrop-blur-sm bg-opacity-95"
        >
          <p class="text-sm font-medium text-neutral-700">Delete this account?</p>
          <div class="flex gap-2 w-full">
            <button
              type="button"
              class="flex-1 px-3 py-1.5 text-sm font-medium border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition"
              @click="cancelDelete"
            >
              Cancel
            </button>
            <button
              type="button"
              class="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
              @click="confirmDelete(account.id)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Account Form Modal -->
    <AccountFormModal
      v-if="isModalOpen"
      :is-open="isModalOpen"
      :mode="modalMode"
      :account="selectedAccount"
      @close="isModalOpen = false"
      @saved="handleModalSaved"
    />
  </div>
</template>
