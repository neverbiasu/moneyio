<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { BellIcon } from '@heroicons/vue/20/solid';

const isOpen = ref(false);
const notifications = ref<Array<{ id: number; message: string; time: string; read: boolean }>>([
  {
    id: 1,
    message: 'Your monthly budget for Groceries is running low',
    time: '2 hours ago',
    read: false,
  },
  {
    id: 2,
    message: 'Transaction over $100 detected',
    time: 'Yesterday',
    read: false,
  },
  {
    id: 3,
    message: 'Weekly spending report is ready',
    time: '3 days ago',
    read: true,
  },
]);

const unreadNotifications = computed(() => {
  return notifications.value.filter((n) => !n.read).length;
});

function toggleNotifications() {
  isOpen.value = !isOpen.value;
}

function markAsRead(id: number) {
  const notification = notifications.value.find((n) => n.id === id);
  if (notification && !notification.read) {
    notification.read = true;
  }
}

function clearAll() {
  notifications.value = notifications.value.map((n) => ({ ...n, read: true }));
}

let handleClickOutside: ((e: MouseEvent) => void) | null = null;

onMounted(() => {
  // Close notifications when clicking outside
  handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-notifications]')) {
      isOpen.value = false;
    }
  };

  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  if (handleClickOutside) {
    document.removeEventListener('click', handleClickOutside);
  }
});
</script>

<template>
  <div data-notifications class="relative">
    <!-- Notification Bell Button -->
    <button
      type="button"
      class="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition"
      :aria-label="
        unreadNotifications > 0 ? `Notifications (${unreadNotifications} unread)` : 'Notifications'
      "
      :aria-expanded="isOpen"
      aria-controls="notifications-dropdown"
      aria-haspopup="menu"
      @click="toggleNotifications"
    >
      <BellIcon class="size-6" />
      <!-- Unread Badge -->
      <span
        v-if="unreadNotifications > 0"
        class="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full"
        aria-hidden="true"
      />
    </button>

    <!-- Notification Dropdown -->
    <div
      v-show="isOpen"
      id="notifications-dropdown"
      class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
      role="menu"
      aria-labelledby="notifications-title"
    >
      <!-- Header -->
      <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 id="notifications-title" class="text-sm font-semibold text-gray-900">Notifications</h3>
        <span
          v-if="unreadNotifications > 0"
          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"
        >
          {{ unreadNotifications }} new
        </span>
      </div>

      <!-- Notification List -->
      <div class="max-h-96 overflow-y-auto">
        <div v-if="notifications.length === 0" class="px-4 py-8 text-center text-gray-500">
          <p class="text-sm">No notifications</p>
        </div>

        <button
          v-for="notification in notifications"
          :key="notification.id"
          type="button"
          role="menuitem"
          :class="[
            'w-full px-4 py-3 text-left border-b border-gray-100 hover:bg-gray-50 transition',
            notification.read ? 'opacity-60' : 'bg-blue-50',
          ]"
          @click="markAsRead(notification.id)"
        >
          <div class="flex items-start gap-3">
            <div v-if="!notification.read" class="mt-2 h-2 w-2 bg-blue-600 rounded-full shrink-0" />
            <div v-else class="mt-2 h-2 w-2 shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900">{{ notification.message }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ notification.time }}</p>
            </div>
          </div>
        </button>
      </div>

      <!-- Footer -->
      <div v-if="notifications.length > 0" class="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <button
          type="button"
          role="menuitem"
          class="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
          @click="clearAll"
        >
          Mark all as read
        </button>
      </div>
    </div>
  </div>
</template>
