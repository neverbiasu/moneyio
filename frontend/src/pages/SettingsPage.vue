<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { CheckIcon } from '@heroicons/vue/20/solid';

defineOptions({ name: 'SettingsPage' });

type ThemePreference = 'light' | 'dark' | 'system';
type CurrencyPreference = 'USD' | 'EUR' | 'GBP' | 'CNY';
type LanguagePreference = 'en' | 'zh';

const activeTab = ref<'profile' | 'preferences'>('profile');
const authStore = useAuthStore();

const preferences = reactive({
  theme: 'light' as ThemePreference,
  currency: 'USD' as CurrencyPreference,
  language: 'en' as LanguagePreference,
  notifications: true,
});

const isSaving = ref(false);
const saveSuccess = ref(false);
const saveError = ref(false);
const saveMessage = ref('');

const currentUser = computed(() => {
  const user = authStore.user;
  return {
    name: user?.username ?? 'User',
    email: user?.email ?? 'user@example.com',
  };
});

const currencyOptions = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'CNY', label: 'Chinese Yuan (¥)' },
];

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
];

async function savePreferences() {
  isSaving.value = true;
  saveSuccess.value = false;
  saveError.value = false;

  try {
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (preferences.theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', preferences.theme);
    }

    localStorage.setItem('userPreferences', JSON.stringify(preferences));

    saveSuccess.value = true;
    saveMessage.value = 'Preferences saved successfully!';

    setTimeout(() => {
      saveSuccess.value = false;
    }, 3000);
  } catch (err) {
    console.error('Failed to save preferences:', err);
    saveSuccess.value = false;
    saveError.value = true;
    saveMessage.value = 'Failed to save preferences. Please try again.';

    setTimeout(() => {
      saveError.value = false;
    }, 3000);
  } finally {
    isSaving.value = false;
  }
}

onMounted(() => {
  const saved = localStorage.getItem('userPreferences');
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Record<string, unknown>;

      if (parsed.theme === 'light' || parsed.theme === 'dark' || parsed.theme === 'system') {
        preferences.theme = parsed.theme;
      }

      if (
        parsed.currency === 'USD' ||
        parsed.currency === 'EUR' ||
        parsed.currency === 'GBP' ||
        parsed.currency === 'CNY'
      ) {
        preferences.currency = parsed.currency;
      }

      if (parsed.language === 'en' || parsed.language === 'zh') {
        preferences.language = parsed.language;
      }

      if (typeof parsed.notifications === 'boolean') {
        preferences.notifications = parsed.notifications;
      }
    } catch (err) {
      console.warn('Ignoring invalid userPreferences in localStorage', err);
    }
  }
});
</script>

<template>
  <div class="space-y-6">
    <div>
      <p class="text-sm text-neutral-500 mt-1">Manage your account and preferences</p>
    </div>

    <div class="border-b border-neutral-200">
      <nav class="flex gap-8" aria-label="Settings navigation">
        <button
          :class="[
            'px-1 py-3 text-sm font-medium border-b-2 transition',
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-neutral-600 hover:text-neutral-900',
          ]"
          :aria-current="activeTab === 'profile' ? 'page' : undefined"
          @click="activeTab = 'profile'"
        >
          Profile
        </button>
        <button
          :class="[
            'px-1 py-3 text-sm font-medium border-b-2 transition',
            activeTab === 'preferences'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-neutral-600 hover:text-neutral-900',
          ]"
          :aria-current="activeTab === 'preferences' ? 'page' : undefined"
          @click="activeTab = 'preferences'"
        >
          Preferences
        </button>
      </nav>
    </div>

    <section v-if="activeTab === 'profile'" class="space-y-6">
      <div class="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-neutral-900 mb-4">Profile Information</h2>

        <div class="space-y-4">
          <div>
            <label for="username" class="block text-sm font-medium text-neutral-700 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              :value="currentUser.name"
              disabled
              class="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-600"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-neutral-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              :value="currentUser.email"
              disabled
              class="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-600"
            />
          </div>

          <div class="pt-4 border-t border-neutral-200">
            <button class="text-sm font-medium text-blue-600 hover:text-blue-700 transition">
              Change Password
            </button>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-neutral-900 mb-4">Account Actions</h2>

        <div class="space-y-3">
          <button
            class="w-full px-4 py-2 text-sm font-medium text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition text-left"
          >
            Export Data
          </button>
          <button
            class="w-full px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition text-left"
          >
            Delete Account
          </button>
        </div>
      </div>
    </section>

    <section v-if="activeTab === 'preferences'" class="space-y-6">
      <div class="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-neutral-900 mb-4">Preferences</h2>

        <div
          v-if="saveSuccess"
          class="mb-4 p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
          role="alert"
          aria-live="polite"
        >
          <CheckIcon class="size-4 shrink-0" />
          {{ saveMessage }}
        </div>

        <div
          v-if="saveError"
          class="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          {{ saveMessage }}
        </div>

        <form class="space-y-6" @submit.prevent="savePreferences">
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-3">Theme</label>
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="option in themeOptions"
                :key="option.value"
                type="button"
                :class="[
                  'px-3 py-2 text-sm font-medium rounded-lg border-2 transition',
                  preferences.theme === option.value
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-neutral-300 text-neutral-700 hover:border-neutral-400',
                ]"
                @click="preferences.theme = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div>
            <label for="currency" class="block text-sm font-medium text-neutral-700 mb-1">
              Currency
            </label>
            <select
              id="currency"
              v-model="preferences.currency"
              class="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white hover:border-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
            >
              <option v-for="option in currencyOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <div>
            <label for="language" class="block text-sm font-medium text-neutral-700 mb-1">
              Language
            </label>
            <select
              id="language"
              v-model="preferences.language"
              class="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white hover:border-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
            >
              <option v-for="option in languageOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <div class="flex items-center justify-between">
            <label for="notifications" class="text-sm font-medium text-neutral-700">
              Email Notifications
            </label>
            <button
              id="notifications"
              type="button"
              role="switch"
              :aria-checked="preferences.notifications.toString()"
              :class="preferences.notifications ? 'bg-blue-600' : 'bg-neutral-300'"
              class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors"
              @click="preferences.notifications = !preferences.notifications"
            >
              <span
                :class="preferences.notifications ? 'translate-x-5' : 'translate-x-0'"
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              />
            </button>
          </div>

          <div class="flex gap-2 justify-end pt-4 border-t border-neutral-200">
            <button
              type="submit"
              :disabled="isSaving"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {{ isSaving ? 'Saving...' : 'Save Preferences' }}
            </button>
          </div>
        </form>
      </div>
    </section>
  </div>
</template>
