<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch, onMounted, onUnmounted } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

const appSidebar = defineAsyncComponent(async () => import('../components/AppSidebar.vue'));
const notificationBell = defineAsyncComponent(
  async () => import('../components/NotificationBell.vue'),
);

const route = useRoute();
const { t } = useI18n();
const sidebarOpen = ref(false);
const isDesktop = ref(false);
let mq: MediaQueryList | null = null;
let handleMqChange: ((e: MediaQueryListEvent) => void) | null = null;

onMounted(() => {
  mq = window.matchMedia('(min-width: 768px)');
  isDesktop.value = mq.matches;
  sidebarOpen.value = mq.matches;

  handleMqChange = (e: MediaQueryListEvent) => {
    isDesktop.value = e.matches;
    sidebarOpen.value = e.matches;
  };

  mq.addEventListener('change', handleMqChange);
});

onUnmounted(() => {
  if (mq && handleMqChange) {
    mq.removeEventListener('change', handleMqChange);
  }
});

const pageTitle = computed(() => {
  const key = String(route.name ?? '');
  const titleMap: Record<string, string> = {
    dashboard: 'nav.dashboard',
    transactions: 'nav.transactions',
    accounts: 'nav.accounts',
    reports: 'nav.reports',
    budgets: 'nav.budgets',
    settings: 'nav.settings',
  };

  return titleMap[key] ? t(titleMap[key]) : t('common.moneyio');
});

const pageSubtitle = computed(() => {
  const key = String(route.name ?? '');
  const subtitleMap: Record<string, string> = {
    dashboard: 'subtitle.dashboard',
    transactions: 'subtitle.transactions',
    accounts: 'subtitle.accounts',
    reports: 'subtitle.reports',
    budgets: 'subtitle.budgets',
    settings: 'subtitle.settings',
  };

  return subtitleMap[key] ? t(subtitleMap[key]) : '';
});

watch(
  () => route.fullPath,
  () => {
    if (!isDesktop.value) {
      sidebarOpen.value = false;
    }
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

  <div class="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
    <appSidebar
      v-if="isDesktop || sidebarOpen"
      :is-open="sidebarOpen"
      @close="sidebarOpen = false"
    />

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

    <div class="flex-1 flex min-w-0 flex-col overflow-hidden">
      <header
        class="mx-3 mt-3 flex items-center justify-between rounded-2xl border border-border-light bg-card-light px-4 shadow-[var(--shadow-card)] dark:border-border-dark dark:bg-card-dark sm:mx-4 sm:px-6 lg:mx-6 lg:px-8"
        role="banner"
      >
        <div class="min-w-0 flex-1">
          <div class="flex min-h-16 items-center py-2">
            <button
              type="button"
              class="mr-4 rounded-xl p-1.5 text-subtext-light transition hover:bg-blue-50 hover:text-primary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden dark:text-subtext-dark dark:hover:bg-slate-800 dark:hover:text-blue-300"
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
            <div class="min-w-0">
              <h2 class="text-xl font-semibold text-text-light dark:text-text-dark">
                {{ pageTitle }}
              </h2>
              <p
                v-if="pageSubtitle"
                class="mt-0.5 text-sm text-subtext-light dark:text-subtext-dark"
              >
                {{ pageSubtitle }}
              </p>
            </div>
          </div>
        </div>
        <div id="page-actions" class="flex shrink-0 items-center space-x-4">
          <notificationBell />
        </div>
      </header>

      <main id="main-content" class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" tabindex="-1">
        <RouterView />
      </main>
    </div>
  </div>
</template>
