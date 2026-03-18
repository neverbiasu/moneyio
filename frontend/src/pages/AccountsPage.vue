<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { PlusIcon, PencilIcon, TrashIcon, BanknotesIcon } from '@heroicons/vue/20/solid';
import AccountFormModal from '@/components/AccountFormModal.vue';
import apiService from '@/api/services';
import type { Account } from '@/api/types';
import { formatCurrencyWithPreference } from '@/utils/userPreferences';

defineOptions({ name: 'AccountsPage' });

const { t } = useI18n();

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
    accounts.value = await apiService.accounts.getAccounts();
  } catch (err) {
    console.error('Failed to load accounts:', err);
    error.value = t('accounts.loadFailed');
  } finally {
    isLoading.value = false;
  }
}

// ── Account type badge colors ──────────────────────────────────────────
const ACCOUNT_TYPE_CONFIG: Record<Account['type'], { label: string; color: string }> = {
  savings: { label: 'accounts.typeSavings', color: 'bg-green-100 text-green-700' },
  checking: { label: 'accounts.typeChecking', color: 'bg-blue-100 text-blue-700' },
  credit: { label: 'accounts.typeCredit', color: 'bg-orange-100 text-orange-700' },
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
    await apiService.accounts.deleteAccount(id);
    deleteConfirmId.value = null;
    await fetchAccounts();
  } catch (err) {
    console.error('Failed to delete account:', err);
    error.value = t('accounts.deleteFailed');
  }
}

// ── Helpers ────────────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return formatCurrencyWithPreference(amount);
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
        class="duo-btn-primary flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
        @click="openCreateModal"
      >
        <PlusIcon class="size-5" aria-hidden="true" />
        {{ t('accounts.addAccount') }}
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
      <p class="text-sm font-medium text-neutral-500">{{ t('accounts.noAccounts') }}</p>
      <p class="text-xs text-neutral-400 mt-1">{{ t('accounts.noAccountsHint') }}</p>
      <button
        type="button"
        class="duo-btn-primary mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium"
        @click="openCreateModal"
      >
        <PlusIcon class="size-4" aria-hidden="true" />
        {{ t('accounts.createAccount') }}
      </button>
    </div>

    <!-- Accounts grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="account in accounts"
        :key="account.id"
        class="relative rounded-xl border border-neutral-200 bg-white p-5 shadow-[0_4px_0_0_rgba(148,163,184,0.42)] transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_6px_0_0_rgba(148,163,184,0.52)]"
      >
        <!-- Account type badge -->
        <div class="flex items-start justify-between mb-4">
          <div>
            <span
              :class="getAccountTypeConfig(account.type).color"
              class="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full"
            >
              {{ t(getAccountTypeConfig(account.type).label) }}
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
          <p class="text-xs uppercase tracking-wide text-neutral-500 mb-1">
            {{ t('accounts.balance') }}
          </p>
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
          <p class="text-sm font-medium text-neutral-700">{{ t('accounts.deleteConfirm') }}</p>
          <div class="flex gap-2 w-full">
            <button
              type="button"
              class="duo-btn-secondary flex-1 px-3 py-1.5 text-sm font-medium"
              @click="cancelDelete"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              class="duo-btn-danger flex-1 px-3 py-1.5 text-sm font-medium"
              @click="confirmDelete(account.id)"
            >
              {{ t('common.delete') }}
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
