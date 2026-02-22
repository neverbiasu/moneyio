<script setup lang="ts">
import {
  Squares2X2Icon,
  ArrowsUpDownIcon,
  ChartBarIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
} from '@heroicons/vue/24/outline';
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import UserMenuPopup from './UserMenuPopup.vue';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<(e: 'close') => void>();

const route = useRoute();

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Squares2X2Icon },
  { to: '/transactions', label: 'Transactions', icon: ArrowsUpDownIcon },
  { to: '/reports', label: 'Analytics', icon: ChartBarIcon },
  { to: '/budgets', label: 'Budgets', icon: BanknotesIcon },
  { to: '/settings', label: 'Settings', icon: Cog6ToothIcon },
];

const currentUser = {
  name: 'Takamatsu Tomori',
  email: 'tomori@mygo.bandream',
  avatar: '/avatar.png',
};

const userMenuOpen = ref(false);
const userEntryRef = ref<HTMLDivElement | null>(null);

function handleNavClick() {
  emit('close');
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value;
}

function handleUserAction(key: string) {
  if (key === 'logout') {
    console.warn('Logout triggered');
  }
  userMenuOpen.value = false;
}

function handleClickOutside(event: MouseEvent) {
  if (userEntryRef.value && !userEntryRef.value.contains(event.target as Node)) {
    userMenuOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <aside
    id="primary-navigation"
    class="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex md:flex-col"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
    aria-label="Primary navigation"
  >
    <div class="flex items-center justify-center h-16 border-b border-gray-200 px-4 bg-white">
      <img src="/logo.svg" alt="MoneyIO Logo" class="w-8 h-8 mr-2" />
      <h1 class="text-xl font-bold text-gray-800">MoneyIO</h1>
    </div>

    <nav class="flex-1 overflow-y-auto py-4">
      <ul class="space-y-1 px-3">
        <li v-for="item in navItems" :key="item.to">
          <RouterLink
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            :class="[
              route.path.startsWith(item.to)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
            ]"
            @click="handleNavClick"
          >
            <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
            {{ item.label }}
          </RouterLink>
        </li>
      </ul>
    </nav>

    <div ref="userEntryRef" class="relative border-t border-gray-200 p-4">
      <UserMenuPopup
        v-if="userMenuOpen"
        :user="currentUser"
        @action="handleUserAction"
        @close="userMenuOpen = false"
      />

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
