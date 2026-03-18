<script setup lang="ts">
import {
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  ChartPieIcon,
  CheckCircleIcon,
  LanguageIcon,
  MoonIcon,
  ShieldCheckIcon,
  SunIcon,
  WalletIcon,
} from '@heroicons/vue/24/outline';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import CategoryPieChart from '@/components/CategoryPieChart.vue';
import SummaryCards from '@/components/SummaryCards.vue';
import TrendChart from '@/components/TrendChart.vue';
import type { ChartDataPoint, Summary } from '@/api/types';
import { syncI18nLocale } from '@/i18n';
import { useAuthStore } from '@/stores/auth';
import {
  applyUserPreferencesToDocument,
  loadUserPreferences,
  resolveThemePreference,
  saveUserPreferences,
  type LanguagePreference,
  type ThemePreference,
} from '@/utils/userPreferences';

defineOptions({ name: 'LandingPage' });

const { t, locale } = useI18n();
const authStore = useAuthStore();
const preferences = ref(loadUserPreferences());

const isDarkTheme = computed(() => resolveThemePreference(preferences.value.theme) === 'dark');

const languageOptions: Array<{ value: LanguagePreference; label: string }> = [
  { value: 'en', label: 'EN' },
  { value: 'zh', label: '中' },
];

const heroMetrics = computed(() => [
  {
    value: t('landing.metrics.budgetsTrackedValue'),
    label: t('landing.metrics.budgetsTrackedLabel'),
  },
  {
    value: t('landing.metrics.trackedValue'),
    label: t('landing.metrics.trackedLabel'),
  },
  {
    value: t('landing.metrics.setupValue'),
    label: t('landing.metrics.setupLabel'),
  },
]);

const featureCards = computed(() => [
  {
    key: 'cashflow',
    icon: WalletIcon,
    title: t('landing.features.cashflowTitle'),
    description: t('landing.features.cashflowDescription'),
  },
  {
    key: 'budgets',
    icon: ChartPieIcon,
    title: t('landing.features.budgetsTitle'),
    description: t('landing.features.budgetsDescription'),
  },
  {
    key: 'security',
    icon: ShieldCheckIcon,
    title: t('landing.features.securityTitle'),
    description: t('landing.features.securityDescription'),
  },
]);

const workflowSteps = computed(() => [
  {
    id: '01',
    title: t('landing.workflow.captureTitle'),
    description: t('landing.workflow.captureDescription'),
  },
  {
    id: '02',
    title: t('landing.workflow.reviewTitle'),
    description: t('landing.workflow.reviewDescription'),
  },
  {
    id: '03',
    title: t('landing.workflow.improveTitle'),
    description: t('landing.workflow.improveDescription'),
  },
]);

const demoSummary = computed<Summary>(() => ({
  totalBalance: 63500.5,
  monthlyIncome: 4750,
  monthlyExpense: 1860,
  savingsRate: 61,
}));

const demoTrendPoints = computed<ChartDataPoint[]>(() => [
  { date: '2026-01-01', income: 3200, expense: 1800 },
  { date: '2026-01-08', income: 4100, expense: 1950 },
  { date: '2026-01-15', income: 3900, expense: 1720 },
  { date: '2026-01-22', income: 4550, expense: 1880 },
  { date: '2026-01-29', income: 4750, expense: 1860 },
]);

const demoPieItems = computed(() => [
  { name: 'Housing', value: 680 },
  { name: 'Food', value: 410 },
  { name: 'Transport', value: 290 },
  { name: 'Utilities', value: 240 },
  { name: 'Health', value: 150 },
  { name: 'Education', value: 90 },
]);

function updatePreferences(nextTheme?: ThemePreference, nextLanguage?: LanguagePreference): void {
  preferences.value = {
    ...preferences.value,
    ...(nextTheme ? { theme: nextTheme } : {}),
    ...(nextLanguage ? { language: nextLanguage } : {}),
  };

  saveUserPreferences(preferences.value);
  applyUserPreferencesToDocument(preferences.value);

  if (nextLanguage) {
    locale.value = nextLanguage;
    syncI18nLocale(nextLanguage);
  }
}

function toggleTheme(): void {
  updatePreferences(isDarkTheme.value ? 'light' : 'dark');
}

function setLanguage(language: LanguagePreference): void {
  updatePreferences(undefined, language);
}
</script>

<template>
  <div
    class="min-h-screen overflow-hidden transition-colors duration-300"
    :class="isDarkTheme ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-950'"
  >
    <div
      class="absolute inset-0 -z-10 transition-opacity duration-300"
      :class="
        isDarkTheme
          ? 'bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.28),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.2),_transparent_28%)]'
          : 'bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_28%)]'
      "
    ></div>

    <header class="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
      <RouterLink to="/" class="flex items-center gap-3">
        <img src="/logo.svg" alt="MoneyIO Logo" class="h-11 w-11 object-contain" />
        <div>
          <p class="text-lg font-semibold tracking-tight">{{ t('common.moneyio') }}</p>
          <p class="text-sm" :class="isDarkTheme ? 'text-slate-300' : 'text-slate-600'">
            {{ t('landing.navTagline') }}
          </p>
        </div>
      </RouterLink>

      <nav class="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-full border transition"
          :class="
            isDarkTheme
              ? 'border-white/15 text-white hover:border-white/30 hover:bg-white/8'
              : 'border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-white'
          "
          :aria-label="isDarkTheme ? t('settings.light') : t('settings.dark')"
          @click="toggleTheme"
        >
          <SunIcon v-if="isDarkTheme" class="h-5 w-5" />
          <MoonIcon v-else class="h-5 w-5" />
        </button>

        <div
          class="inline-flex items-center gap-1 rounded-full border px-1 py-1"
          :class="isDarkTheme ? 'border-white/15 bg-white/6' : 'border-slate-300 bg-white/90'"
        >
          <span
            class="inline-flex h-8 w-8 items-center justify-center"
            :class="isDarkTheme ? 'text-slate-300' : 'text-slate-500'"
          >
            <LanguageIcon class="h-4 w-4" />
          </span>
          <button
            v-for="option in languageOptions"
            :key="option.value"
            type="button"
            class="rounded-full px-3 py-1.5 text-sm font-medium transition"
            :class="
              locale === option.value
                ? 'bg-primary text-white'
                : isDarkTheme
                  ? 'text-slate-300 hover:bg-white/8 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            "
            @click="setLanguage(option.value)"
          >
            {{ option.label }}
          </button>
        </div>

        <RouterLink
          v-if="authStore.isAuthenticated"
          to="/app/dashboard"
          class="duo-btn-secondary inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition"
          :class="
            isDarkTheme
              ? 'border-white/20 bg-slate-900 text-white shadow-[0_3px_0_0_rgba(51,65,85,0.9)] hover:bg-slate-800'
              : 'text-slate-700'
          "
        >
          {{ t('landing.openApp') }}
        </RouterLink>
        <RouterLink
          v-else
          to="/login"
          class="duo-btn-secondary inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition"
          :class="
            isDarkTheme
              ? 'border-white/20 bg-slate-900 text-white shadow-[0_3px_0_0_rgba(51,65,85,0.9)] hover:bg-slate-800'
              : 'text-slate-700'
          "
        >
          {{ t('auth.signIn') }}
        </RouterLink>
      </nav>
    </header>

    <main class="mx-auto flex w-full max-w-7xl flex-col gap-24 px-6 pb-20 pt-6 lg:px-8 lg:pt-10">
      <section class="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div class="max-w-2xl">
          <div
            class="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
            :class="
              isDarkTheme
                ? 'border-primary/30 bg-primary/10 text-blue-100'
                : 'border-primary/20 bg-primary/8 text-primary'
            "
          >
            <ArrowTrendingUpIcon class="h-4 w-4" />
            <span>{{ t('landing.badge') }}</span>
          </div>

          <h1
            class="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
            :class="isDarkTheme ? 'text-white' : 'text-slate-950'"
          >
            {{ t('landing.heroTitle') }}
          </h1>
          <p
            class="mt-6 max-w-xl text-lg leading-8"
            :class="isDarkTheme ? 'text-slate-300' : 'text-slate-600'"
          >
            {{ t('landing.heroDescription') }}
          </p>

          <div class="mt-8 flex flex-col gap-4 sm:flex-row">
            <RouterLink
              :to="authStore.isAuthenticated ? '/app/dashboard' : '/login'"
              class="duo-btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-base font-semibold text-white"
              :class="
                isDarkTheme
                  ? 'border-white/15 bg-primary shadow-[0_4px_0_0_rgba(30,64,175,0.9)] hover:bg-primary-hover'
                  : ''
              "
            >
              <span>
                {{ authStore.isAuthenticated ? t('landing.openApp') : t('auth.signIn') }}
              </span>
              <ArrowRightIcon class="h-5 w-5" />
            </RouterLink>
            <RouterLink
              v-if="authStore.isAuthenticated"
              to="/app/transactions"
              class="duo-btn-secondary inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-base font-semibold transition"
              :class="
                isDarkTheme
                  ? 'border-white/20 bg-slate-900 text-white shadow-[0_3px_0_0_rgba(51,65,85,0.9)] hover:bg-slate-800'
                  : 'text-slate-800'
              "
            >
              {{ t('nav.transactions') }}
            </RouterLink>
            <RouterLink
              v-else
              to="/register"
              class="duo-btn-secondary inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-base font-semibold transition"
              :class="
                isDarkTheme
                  ? 'border-white/20 bg-slate-900 text-white shadow-[0_3px_0_0_rgba(51,65,85,0.9)] hover:bg-slate-800'
                  : 'text-slate-800'
              "
            >
              {{ t('auth.signUp') }}
            </RouterLink>
          </div>

          <dl class="mt-10 grid gap-4 sm:grid-cols-3">
            <div
              v-for="metric in heroMetrics"
              :key="metric.label"
              class="rounded-2xl border p-4 backdrop-blur transition-colors"
              :class="
                isDarkTheme
                  ? 'border-white/10 bg-white/6'
                  : 'border-slate-200 bg-white/80 shadow-sm'
              "
            >
              <dt class="text-sm" :class="isDarkTheme ? 'text-slate-300' : 'text-slate-500'">
                {{ metric.label }}
              </dt>
              <dd
                class="mt-2 text-2xl font-semibold"
                :class="isDarkTheme ? 'text-white' : 'text-slate-950'"
              >
                {{ metric.value }}
              </dd>
            </div>
          </dl>
        </div>

        <div class="relative">
          <div
            class="absolute inset-x-8 top-6 -z-10 h-80 rounded-full blur-3xl"
            :class="isDarkTheme ? 'bg-primary/20' : 'bg-primary/12'"
          ></div>
          <div
            class="rounded-[32px] border p-6 shadow-2xl backdrop-blur-xl"
            :class="
              isDarkTheme
                ? 'border-white/10 bg-slate-900/85 shadow-slate-950/40'
                : 'border-slate-200 bg-white/88 shadow-slate-300/30'
            "
          >
            <div
              class="flex items-center justify-between border-b pb-5"
              :class="isDarkTheme ? 'border-white/10' : 'border-slate-200'"
            >
              <div>
                <p class="text-sm" :class="isDarkTheme ? 'text-slate-400' : 'text-slate-500'">
                  {{ t('landing.previewHeader') }}
                </p>
                <h2
                  class="mt-1 text-2xl font-semibold"
                  :class="isDarkTheme ? 'text-white' : 'text-slate-950'"
                >
                  {{ t('landing.previewTitle') }}
                </h2>
              </div>
              <div
                class="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300"
              >
                <CheckCircleIcon class="h-4 w-4" />
                <span>{{ t('landing.previewStatus') }}</span>
              </div>
            </div>

            <div class="mt-6 grid gap-4 sm:grid-cols-2">
              <div class="rounded-3xl bg-white p-5 text-slate-900 shadow-lg shadow-slate-900/10">
                <p class="text-sm text-slate-500">{{ t('landing.previewBalanceLabel') }}</p>
                <p class="mt-3 text-4xl font-semibold tracking-tight">$24,860</p>
                <div class="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-600">
                  <ArrowTrendingUpIcon class="h-4 w-4" />
                  <span>{{ t('landing.previewBalanceTrend') }}</span>
                </div>
              </div>

              <div
                class="rounded-3xl border p-5"
                :class="
                  isDarkTheme ? 'border-white/10 bg-white/6' : 'border-slate-200 bg-slate-50/90'
                "
              >
                <div
                  class="flex items-center justify-between text-sm"
                  :class="isDarkTheme ? 'text-slate-300' : 'text-slate-600'"
                >
                  <span>{{ t('landing.previewBudgetLabel') }}</span>
                  <span>{{ t('landing.previewBudgetValue') }}</span>
                </div>
                <div
                  class="mt-4 h-3 rounded-full"
                  :class="isDarkTheme ? 'bg-white/10' : 'bg-slate-200'"
                >
                  <div
                    class="h-3 w-[72%] rounded-full bg-gradient-to-r from-sky-400 to-blue-500"
                  ></div>
                </div>
                <p
                  class="mt-4 text-sm leading-6"
                  :class="isDarkTheme ? 'text-slate-300' : 'text-slate-600'"
                >
                  {{ t('landing.previewBudgetHint') }}
                </p>
              </div>
            </div>

            <div class="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div
                class="rounded-3xl border p-5"
                :class="
                  isDarkTheme ? 'border-white/10 bg-white/6' : 'border-slate-200 bg-slate-50/90'
                "
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm" :class="isDarkTheme ? 'text-slate-400' : 'text-slate-500'">
                      {{ t('landing.previewInsightsLabel') }}
                    </p>
                    <p
                      class="mt-1 text-lg font-semibold"
                      :class="isDarkTheme ? 'text-white' : 'text-slate-950'"
                    >
                      {{ t('landing.previewInsightsTitle') }}
                    </p>
                  </div>
                  <ChartPieIcon
                    class="h-8 w-8"
                    :class="isDarkTheme ? 'text-sky-300' : 'text-sky-600'"
                  />
                </div>
                <p
                  class="mt-4 text-sm leading-6"
                  :class="isDarkTheme ? 'text-slate-300' : 'text-slate-600'"
                >
                  {{ t('landing.previewInsightsDescription') }}
                </p>
              </div>

              <div
                class="rounded-3xl border p-5"
                :class="
                  isDarkTheme ? 'border-white/10 bg-white/6' : 'border-slate-200 bg-slate-50/90'
                "
              >
                <p class="text-sm" :class="isDarkTheme ? 'text-slate-400' : 'text-slate-500'">
                  {{ t('landing.previewChecklistLabel') }}
                </p>
                <ul class="mt-4 space-y-3">
                  <li
                    class="flex items-center gap-3 text-sm"
                    :class="isDarkTheme ? 'text-slate-200' : 'text-slate-700'"
                  >
                    <CheckCircleIcon
                      class="h-5 w-5"
                      :class="isDarkTheme ? 'text-emerald-300' : 'text-emerald-600'"
                    />
                    <span>{{ t('landing.previewChecklistFirst') }}</span>
                  </li>
                  <li
                    class="flex items-center gap-3 text-sm"
                    :class="isDarkTheme ? 'text-slate-200' : 'text-slate-700'"
                  >
                    <CheckCircleIcon
                      class="h-5 w-5"
                      :class="isDarkTheme ? 'text-emerald-300' : 'text-emerald-600'"
                    />
                    <span>{{ t('landing.previewChecklistSecond') }}</span>
                  </li>
                  <li
                    class="flex items-center gap-3 text-sm"
                    :class="isDarkTheme ? 'text-slate-200' : 'text-slate-700'"
                  >
                    <CheckCircleIcon
                      class="h-5 w-5"
                      :class="isDarkTheme ? 'text-emerald-300' : 'text-emerald-600'"
                    />
                    <span>{{ t('landing.previewChecklistThird') }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features">
        <div class="max-w-2xl">
          <p
            class="text-sm font-semibold uppercase tracking-[0.24em]"
            :class="isDarkTheme ? 'text-sky-300' : 'text-sky-700'"
          >
            {{ t('landing.featuresEyebrow') }}
          </p>
          <h2
            class="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl"
            :class="isDarkTheme ? 'text-white' : 'text-slate-950'"
          >
            {{ t('landing.featuresTitle') }}
          </h2>
          <p
            class="mt-4 text-lg leading-8"
            :class="isDarkTheme ? 'text-slate-300' : 'text-slate-600'"
          >
            {{ t('landing.featuresDescription') }}
          </p>
        </div>

        <div class="mt-10 grid gap-6 lg:grid-cols-3">
          <article
            v-for="feature in featureCards"
            :key="feature.key"
            class="rounded-3xl border p-6 backdrop-blur transition hover:-translate-y-1"
            :class="
              isDarkTheme
                ? 'border-white/10 bg-white/6 hover:border-white/20 hover:bg-white/8'
                : 'border-slate-200 bg-white/90 shadow-sm hover:border-slate-300 hover:bg-white'
            "
          >
            <div
              class="flex h-12 w-12 items-center justify-center rounded-2xl"
              :class="isDarkTheme ? 'bg-primary/15 text-sky-200' : 'bg-sky-100 text-sky-700'"
            >
              <component :is="feature.icon" class="h-6 w-6" />
            </div>
            <h3
              class="mt-5 text-xl font-semibold"
              :class="isDarkTheme ? 'text-white' : 'text-slate-950'"
            >
              {{ feature.title }}
            </h3>
            <p
              class="mt-3 text-base leading-7"
              :class="isDarkTheme ? 'text-slate-300' : 'text-slate-600'"
            >
              {{ feature.description }}
            </p>
          </article>
        </div>
      </section>

      <section id="demo" class="space-y-8">
        <div class="max-w-2xl">
          <p
            class="text-sm font-semibold uppercase tracking-[0.24em]"
            :class="isDarkTheme ? 'text-sky-300' : 'text-sky-700'"
          >
            {{ t('landing.demoEyebrow') }}
          </p>
          <h2
            class="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl"
            :class="isDarkTheme ? 'text-white' : 'text-slate-950'"
          >
            {{ t('landing.demoTitle') }}
          </h2>
          <p
            class="mt-4 text-lg leading-8"
            :class="isDarkTheme ? 'text-slate-300' : 'text-slate-600'"
          >
            {{ t('landing.demoDescription') }}
          </p>
        </div>

        <div
          class="rounded-[32px] border p-6 sm:p-8"
          :class="
            isDarkTheme
              ? 'border-white/10 bg-slate-900/75'
              : 'border-slate-200 bg-white/92 shadow-sm'
          "
        >
          <div class="space-y-6">
            <SummaryCards :data="demoSummary" />
            <TrendChart :points="demoTrendPoints" :embedded="true" />
            <CategoryPieChart :items="demoPieItems" :embedded="true" />
          </div>
        </div>
      </section>

      <section
        class="grid gap-8 rounded-[32px] border p-8 backdrop-blur lg:grid-cols-[0.9fr_1.1fr] lg:p-10"
        :class="
          isDarkTheme ? 'border-white/10 bg-white/6' : 'border-slate-200 bg-white/86 shadow-sm'
        "
      >
        <div>
          <p
            class="text-sm font-semibold uppercase tracking-[0.24em]"
            :class="isDarkTheme ? 'text-sky-300' : 'text-sky-700'"
          >
            {{ t('landing.workflowEyebrow') }}
          </p>
          <h2
            class="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl"
            :class="isDarkTheme ? 'text-white' : 'text-slate-950'"
          >
            {{ t('landing.workflowTitle') }}
          </h2>
          <p
            class="mt-4 text-lg leading-8"
            :class="isDarkTheme ? 'text-slate-300' : 'text-slate-600'"
          >
            {{ t('landing.workflowDescription') }}
          </p>
        </div>

        <div class="space-y-4">
          <article
            v-for="step in workflowSteps"
            :key="step.id"
            class="flex gap-4 rounded-3xl border p-5"
            :class="
              isDarkTheme ? 'border-white/10 bg-slate-950/45' : 'border-slate-200 bg-slate-50/90'
            "
          >
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold"
              :class="isDarkTheme ? 'bg-white/10 text-sky-200' : 'bg-sky-100 text-sky-700'"
            >
              {{ step.id }}
            </div>
            <div>
              <h3
                class="text-lg font-semibold"
                :class="isDarkTheme ? 'text-white' : 'text-slate-950'"
              >
                {{ step.title }}
              </h3>
              <p
                class="mt-2 text-sm leading-7"
                :class="isDarkTheme ? 'text-slate-300' : 'text-slate-600'"
              >
                {{ step.description }}
              </p>
            </div>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>
