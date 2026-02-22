<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import AppSidebar from '../components/AppSidebar.vue';

const route = useRoute();
const sidebarOpen = ref(false);

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/reports', label: 'Analytics' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/settings', label: 'Settings' },
];

const pageTitle = computed(() => {
  const matchedItem = navItems.find((item) => route.path.startsWith(item.to));
  return matchedItem?.label ?? 'MoneyIO';
});

watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false;
  },
);
</script>

<template>
  <a
    class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-gray-900 focus:text-white focus:rounded-br-lg"
    href="#main-content"
  >
    Skip to main content
  </a>

  <div class="flex h-screen bg-gray-50 overflow-hidden">
    <AppSidebar :is-open="sidebarOpen" @close="sidebarOpen = false" />

    <div
      v-if="sidebarOpen"
      role="button"
      tabindex="0"
      class="fixed inset-0 z-30 bg-gray-900/50 transition-opacity md:hidden"
      aria-label="Close navigation"
      @click="sidebarOpen = false"
      @keydown.enter.prevent="sidebarOpen = false"
      @keydown.space.prevent="sidebarOpen = false"
      @keydown.esc.prevent="sidebarOpen = false"
    ></div>

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header
        class="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8"
        role="banner"
      >
        <div class="flex items-center">
          <button
            type="button"
            class="md:hidden mr-4 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            aria-label="Open navigation"
            aria-controls="primary-navigation"
            :aria-expanded="sidebarOpen"
            @click="sidebarOpen = !sidebarOpen"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h2 class="text-xl font-semibold text-gray-800">{{ pageTitle }}</h2>
        </div>
        <div id="page-actions" class="flex items-center space-x-4"></div>
      </header>

      <main id="main-content" class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" tabindex="-1">
        <RouterView />
      </main>
    </div>
  </div>
</template>
