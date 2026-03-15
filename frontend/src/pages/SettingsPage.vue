<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { CheckIcon } from '@heroicons/vue/20/solid';
import axios from 'axios';

defineOptions({ name: 'SettingsPage' });

type ThemePreference = 'light' | 'dark' | 'system';
type CurrencyPreference = 'USD' | 'EUR' | 'GBP' | 'CNY';
type LanguagePreference = 'en' | 'zh';
type FontSizePreference = 'small' | 'medium' | 'large';

const activeTab = ref<'security' | 'preferences'>('security');
const authStore = useAuthStore();

const preferences = reactive({
  theme: 'light' as ThemePreference,
  currency: 'USD' as CurrencyPreference,
  language: 'en' as LanguagePreference,
  fontSize: 'medium' as FontSizePreference,
  notifications: true,
});

const passwordForm = reactive({
  password: '',
  confirmPassword: '',
});

const passwordError = ref('');
const passwordSuccess = ref('');

const isSaving = ref(false);
const saveSuccess = ref(false);
const saveError = ref(false);
const saveMessage = ref('');

const currencyOptions: Array<{ value: CurrencyPreference; label: string }> = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'CNY', label: 'Chinese Yuan (¥)' },
];

const themeOptions: Array<{ value: ThemePreference; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const languageOptions: Array<{ value: LanguagePreference; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
];

const fontSizeOptions: Array<{ value: FontSizePreference; label: string }> = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

function applyPreferencesToDocument() {
  if (preferences.theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', preferences.theme);
  }

  document.documentElement.lang = preferences.language;

  const fontSizeMap: Record<FontSizePreference, string> = {
    small: '14px',
    medium: '16px',
    large: '18px',
  };
  document.documentElement.style.fontSize = fontSizeMap[preferences.fontSize];
}

async function savePreferences() {
  isSaving.value = true;
  saveSuccess.value = false;
  saveError.value = false;

  try {
    await new Promise((resolve) => setTimeout(resolve, 400));

    applyPreferencesToDocument();

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

async function changePassword() {
  passwordError.value = '';
  passwordSuccess.value = '';

  if (!passwordForm.password) {
    passwordError.value = 'Password is required.';
    return;
  }

  if (passwordForm.password.length < 8) {
    passwordError.value = 'Password must be at least 8 characters.';
    return;
  }

  if (passwordForm.password !== passwordForm.confirmPassword) {
    passwordError.value = 'Passwords do not match.';
    return;
  }

  try {
    await authStore.changePassword(passwordForm.password);
    passwordSuccess.value = 'Password updated successfully.';
    passwordForm.password = '';
    passwordForm.confirmPassword = '';
  } catch (err) {
    console.error('Failed to update password:', err);
    if (axios.isAxiosError(err)) {
      const backendError = (err.response?.data as { error?: unknown } | undefined)?.error;
      if (typeof backendError === 'string' && backendError.trim() !== '') {
        passwordError.value = backendError;
        return;
      }
    }

    passwordError.value =
      err instanceof Error && err.message.trim() !== ''
        ? err.message
        : 'Failed to update password.';
  }
}

onMounted(() => {
  const saved = localStorage.getItem('userPreferences');
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Record<string, unknown>;

      if (
        parsed['theme'] === 'light' ||
        parsed['theme'] === 'dark' ||
        parsed['theme'] === 'system'
      ) {
        preferences.theme = parsed['theme'];
      }

      if (
        parsed['currency'] === 'USD' ||
        parsed['currency'] === 'EUR' ||
        parsed['currency'] === 'GBP' ||
        parsed['currency'] === 'CNY'
      ) {
        preferences.currency = parsed['currency'];
      }

      if (parsed['language'] === 'en' || parsed['language'] === 'zh') {
        preferences.language = parsed['language'];
      }

      if (
        parsed['fontSize'] === 'small' ||
        parsed['fontSize'] === 'medium' ||
        parsed['fontSize'] === 'large'
      ) {
        preferences.fontSize = parsed['fontSize'];
      }

      if (typeof parsed['notifications'] === 'boolean') {
        preferences.notifications = parsed['notifications'];
      }
    } catch (err) {
      console.warn('Ignoring invalid userPreferences in localStorage', err);
    }
  }

  applyPreferencesToDocument();
});
</script>

<template>
  <div class="space-y-6">
    <div class="border-b border-neutral-200">
      <nav class="flex gap-8" aria-label="Settings navigation">
        <button
          :class="[
            'px-1 py-3 text-sm font-medium border-b-2 transition',
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-neutral-600 hover:text-neutral-900',
          ]"
          :aria-current="activeTab === 'security' ? 'page' : undefined"
          @click="activeTab = 'security'"
        >
          Security
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

    <section v-if="activeTab === 'security'" class="space-y-6">
      <div class="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-neutral-900 mb-4">Security</h2>

        <div class="space-y-4">
          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-neutral-800">Change Password</h3>

            <div>
              <label for="new-password" class="block text-sm font-medium text-neutral-700 mb-1">
                New Password
              </label>
              <input
                id="new-password"
                v-model="passwordForm.password"
                type="password"
                autocomplete="new-password"
                class="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white hover:border-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
              />
            </div>

            <div>
              <label for="confirm-password" class="block text-sm font-medium text-neutral-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                v-model="passwordForm.confirmPassword"
                type="password"
                autocomplete="new-password"
                class="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white hover:border-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
              />
            </div>

            <p v-if="passwordError" class="text-sm text-red-600">{{ passwordError }}</p>
            <p v-if="passwordSuccess" class="text-sm text-green-600">{{ passwordSuccess }}</p>

            <button
              type="button"
              class="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
              @click="changePassword"
            >
              Update Password
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

          <div>
            <label for="font-size" class="block text-sm font-medium text-neutral-700 mb-1">
              Font Size
            </label>
            <select
              id="font-size"
              v-model="preferences.fontSize"
              class="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white hover:border-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
            >
              <option v-for="option in fontSizeOptions" :key="option.value" :value="option.value">
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
              :aria-checked="preferences.notifications"
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
