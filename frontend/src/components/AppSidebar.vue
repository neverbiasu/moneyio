<script setup lang="ts">
import {
  Squares2X2Icon,
  ArrowsUpDownIcon,
  ChartBarIcon,
  BanknotesIcon,
  WalletIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
} from '@heroicons/vue/24/outline';
import { ref, onMounted, onBeforeUnmount, computed, defineAsyncComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import UserMenuPopup from './UserMenuPopup.vue';

const userProfileModal = defineAsyncComponent(async () => import('./UserProfileModal.vue'));

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<(e: 'close') => void>();

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const navItems = [
  { to: '/app/dashboard', labelKey: 'nav.dashboard', icon: Squares2X2Icon },
  { to: '/app/transactions', labelKey: 'nav.transactions', icon: ArrowsUpDownIcon },
  { to: '/app/accounts', labelKey: 'nav.accounts', icon: WalletIcon },
  { to: '/app/reports', labelKey: 'nav.reports', icon: ChartBarIcon },
  { to: '/app/budgets', labelKey: 'nav.budgets', icon: BanknotesIcon },
  { to: '/app/settings', labelKey: 'nav.settings', icon: Cog6ToothIcon },
];

const avatarUrl = ref('/avatar.png');

const currentUser = computed(() => {
  const user = authStore.user as { username?: string; email?: string } | null;
  return {
    name: user?.username ?? 'User',
    email: user?.email ?? 'user@example.com',
    avatar: avatarUrl.value,
  };
});

const userMenuOpen = ref(false);
const profileModalOpen = ref(false);

const mq = typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)') : null;
const isDesktop = ref(mq?.matches ?? true);

function handleNavClick() {
  emit('close');
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value;
}

async function handleUserAction(key: string) {
  userMenuOpen.value = false;

  if (key === 'logout') {
    await authStore.logout();
    emit('close');
    await router.push('/login');
    return;
  }

  if (key === 'profile') {
    profileModalOpen.value = true;
    return;
  }

  if (key === 'security') {
    emit('close');
    await router.push('/app/settings');
  }
}

function handleProfileSaved(newAvatar: string) {
  avatarUrl.value = newAvatar;
  localStorage.setItem('userAvatarDataUrl', newAvatar);
}

function onMqChange(e: MediaQueryListEvent) {
  isDesktop.value = e.matches;
}

onMounted(() => {
  mq?.addEventListener('change', onMqChange);
  const savedAvatar = localStorage.getItem('userAvatarDataUrl');
  if (savedAvatar) {
    avatarUrl.value = savedAvatar;
  }
});

onBeforeUnmount(() => {
  mq?.removeEventListener('change', onMqChange);
});
</script>

<template>
  <aside
    id="primary-navigation"
    class="fixed inset-y-0 left-0 z-40 w-64 transform border-r border-blue-100 bg-card-light transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-card-dark md:translate-x-0 md:static md:flex md:flex-col"
    :class="[
      isOpen ? 'translate-x-0' : '-translate-x-full',
      { 'pointer-events-none md:pointer-events-auto': !isOpen },
    ]"
    aria-label="Primary navigation"
    :aria-hidden="!isOpen && !isDesktop"
    :inert="!isOpen && !isDesktop"
  >
    <div
      class="flex h-16 items-center justify-center border-b border-blue-100 bg-card-light px-4 dark:border-slate-800 dark:bg-card-dark"
    >
      <img src="/logo.svg" alt="MoneyIO Logo" class="w-8 h-8 mr-2" />
      <h1 class="text-xl font-bold text-text-light dark:text-text-dark">
        {{ t('common.moneyio') }}
      </h1>
    </div>

    <nav class="flex-1 overflow-y-auto py-5">
      <ul class="space-y-2 px-3">
        <li v-for="item in navItems" :key="item.to">
          <RouterLink
            :to="item.to"
            class="flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-sm font-semibold transition-all duration-200"
            :class="[
              route.path.startsWith(item.to)
                ? 'border-primary/30 bg-blue-50 text-blue-700 shadow-[0_4px_0_0_rgba(37,99,235,0.42)] dark:border-blue-700/50 dark:bg-slate-800 dark:text-blue-300'
                : 'border-transparent text-slate-600 hover:border-blue-200 hover:bg-blue-50/70 hover:text-primary dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/80 dark:hover:text-blue-300',
            ]"
            @click="handleNavClick"
          >
            <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
            {{ t(item.labelKey) }}
          </RouterLink>
        </li>
      </ul>
    </nav>

    <div class="relative border-t border-blue-100 p-4 dark:border-slate-800">
      <userProfileModal
        :is-open="profileModalOpen"
        :name="currentUser.name"
        :email="currentUser.email"
        :avatar="currentUser.avatar"
        @close="profileModalOpen = false"
        @saved="handleProfileSaved"
      />

      <UserMenuPopup v-if="userMenuOpen" @action="handleUserAction" @close="userMenuOpen = false" />

      <button
        type="button"
        class="flex w-full items-center gap-3 rounded-2xl border border-blue-100 p-2.5 text-left transition-colors hover:bg-blue-50/70 dark:border-slate-700 dark:hover:bg-slate-800"
        :aria-expanded="userMenuOpen"
        aria-haspopup="menu"
        @click.stop="toggleUserMenu"
      >
        <div
          class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white"
        >
          <img
            :src="currentUser.avatar"
            alt="User Avatar"
            class="w-full h-full rounded-full object-cover"
          />
        </div>
        <div class="flex-1 min-w-0">
          <p class="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {{ currentUser.name }}
          </p>
          <p class="truncate text-xs text-slate-500 dark:text-slate-400">{{ currentUser.email }}</p>
        </div>
        <component
          :is="ChevronDownIcon"
          class="h-4 w-4 text-slate-500 transition-transform duration-200 dark:text-slate-400"
          :class="userMenuOpen ? 'rotate-180' : ''"
        />
      </button>
    </div>
  </aside>
</template>
