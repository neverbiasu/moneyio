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
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import UserMenuPopup from './UserMenuPopup.vue';
import UserProfileModal from './UserProfileModal.vue';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<(e: 'close') => void>();

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const navItems = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: Squares2X2Icon },
  { to: '/transactions', labelKey: 'nav.transactions', icon: ArrowsUpDownIcon },
  { to: '/accounts', labelKey: 'nav.accounts', icon: WalletIcon },
  { to: '/reports', labelKey: 'nav.reports', icon: ChartBarIcon },
  { to: '/budgets', labelKey: 'nav.budgets', icon: BanknotesIcon },
  { to: '/settings', labelKey: 'nav.settings', icon: Cog6ToothIcon },
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
    await router.push('/settings');
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
    class="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex md:flex-col"
    :class="[
      isOpen ? 'translate-x-0' : '-translate-x-full',
      { 'pointer-events-none md:pointer-events-auto': !isOpen },
    ]"
    aria-label="Primary navigation"
    :aria-hidden="!isOpen && !isDesktop"
    :inert="!isOpen && !isDesktop"
  >
    <div class="flex items-center justify-center h-16 border-b border-gray-200 px-4 bg-white">
      <img src="/logo.svg" alt="MoneyIO Logo" class="w-8 h-8 mr-2" />
      <h1 class="text-xl font-bold text-gray-800">{{ t('common.moneyio') }}</h1>
    </div>

    <nav class="flex-1 overflow-y-auto py-4">
      <ul class="space-y-1 px-3">
        <li v-for="item in navItems" :key="item.to">
          <RouterLink
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors border-l-[3px] border-transparent"
            :class="[
              route.path.startsWith(item.to)
                ? 'border-l-blue-600 bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
            ]"
            @click="handleNavClick"
          >
            <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
            {{ t(item.labelKey) }}
          </RouterLink>
        </li>
      </ul>
    </nav>

    <div class="relative border-t border-gray-200 p-4">
      <UserProfileModal
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
        class="flex items-center w-full text-left gap-3 hover:bg-gray-50 p-2 rounded-md transition-colors"
        :aria-expanded="userMenuOpen"
        aria-haspopup="menu"
        @click.stop="toggleUserMenu"
      >
        <div
          class="flex-shrink-0 w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-white font-bold text-sm"
        >
          <img
            :src="currentUser.avatar"
            alt="User Avatar"
            class="w-full h-full rounded-full object-cover"
          />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">{{ currentUser.name }}</p>
          <p class="text-xs text-gray-500 truncate">{{ currentUser.email }}</p>
        </div>
        <component
          :is="ChevronDownIcon"
          class="w-4 h-4 text-gray-500 transition-transform duration-200"
          :class="userMenuOpen ? 'rotate-180' : ''"
        />
      </button>
    </div>
  </aside>
</template>
