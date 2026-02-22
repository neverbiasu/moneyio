<script setup lang="ts">
import { UserIcon, ShieldCheckIcon, ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline';
import type { Component } from 'vue';

interface UserInfo {
  name: string;
  email: string;
  avatarUrl?: string;
}

interface MenuItem {
  key: string;
  label: string;
  icon: Component;
  badge?: string;
}

defineProps<{
  user?: UserInfo;
}>();

const emit = defineEmits<{
  (e: 'action', key: string): void;
  (e: 'close'): void;
}>();

const menuItems: MenuItem[] = [
  { key: 'profile', label: 'Personal Profile', icon: UserIcon },
  { key: 'security', label: 'Security Settings', icon: ShieldCheckIcon },
  { key: 'logout', label: 'Logout', icon: ArrowRightOnRectangleIcon },
];

function handleAction(key: string) {
  emit('action', key);
  emit('close');
}
</script>

<template>
  <div
    class="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
    role="menu"
    aria-label="User menu"
  >
    <hr class="border-gray-100" />

    <ul class="py-1" role="none">
      <li v-for="item in menuItems" :key="item.key" role="none">
        <button
          type="button"
          role="menuitem"
          class="flex items-center w-full gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          @click="handleAction(item.key)"
        >
          <component :is="item.icon" class="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span class="flex-1 text-left">{{ item.label }}</span>
          <span
            v-if="item.badge"
            class="px-1.5 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded"
          >
            {{ item.badge }}
          </span>
        </button>
      </li>
    </ul>

    <hr class="border-gray-100" />
  </div>
</template>
