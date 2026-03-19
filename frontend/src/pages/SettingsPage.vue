<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { CheckIcon } from '@heroicons/vue/20/solid';
import axios from 'axios';
import * as authApi from '@/api/auth';
import {
  DEFAULT_USER_PREFERENCES,
  applyUserPreferencesToDocument,
  type CurrencyPreference,
  type FontSizePreference,
  type LanguagePreference,
  type ThemePreference,
  loadUserPreferences,
  saveUserPreferences,
} from '@/utils/userPreferences';
import { syncI18nLocale } from '@/i18n';

defineOptions({ name: 'SettingsPage' });

const { t, locale } = useI18n();
const router = useRouter();

const activeTab = ref<'profile' | 'security' | 'preferences'>('profile');
const authStore = useAuthStore();

const preferences = reactive({
  ...DEFAULT_USER_PREFERENCES,
});

const passwordForm = reactive({
  password: '',
  confirmPassword: '',
});

const passwordError = ref('');
const passwordSuccess = ref('');
const profileError = ref('');
const profileSuccess = ref('');
const accountActionError = ref('');
const accountActionSuccess = ref('');
const isExporting = ref(false);
const isDeletingAccount = ref(false);

const isSaving = ref(false);
const saveSuccess = ref(false);
const saveError = ref(false);
const saveMessage = ref('');

const profileForm = reactive({
  username: '',
  email: '',
  avatar: '/avatar.png',
});
const selectedAvatarFileName = ref(t('settings.noFileSelected'));

const currencyOptions: Array<{ value: CurrencyPreference; label: string }> = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'CNY', label: 'Chinese Yuan (¥)' },
];

const themeOptions: Array<{ value: ThemePreference; labelKey: string }> = [
  { value: 'light', labelKey: 'settings.light' },
  { value: 'dark', labelKey: 'settings.dark' },
  { value: 'system', labelKey: 'settings.system' },
];

const languageOptions: Array<{ value: LanguagePreference; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: 'Chinese' },
];

const fontSizeOptions: Array<{ value: FontSizePreference; label: string }> = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

function applyPreferencesToDocument() {
  applyUserPreferencesToDocument(preferences);
  locale.value = preferences.language;
  syncI18nLocale(preferences.language);
}

function isValidEmail(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(email);
}

function handleAvatarFileChange(event: Event): void {
  profileError.value = '';
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) {
    selectedAvatarFileName.value = t('settings.noFileSelected');
    target.value = '';
    return;
  }

  selectedAvatarFileName.value = file.name;

  if (!file.type.startsWith('image/')) {
    profileError.value = 'Please select an image file.';
    selectedAvatarFileName.value = t('settings.noFileSelected');
    target.value = '';
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    profileError.value = 'Image size must be less than 2MB.';
    selectedAvatarFileName.value = t('settings.noFileSelected');
    target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      profileForm.avatar = reader.result;
    }
    target.value = '';
  };
  reader.readAsDataURL(file);
}

function downloadJson(content: unknown, fileName: string) {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

async function handleExportData() {
  accountActionError.value = '';
  accountActionSuccess.value = '';
  isExporting.value = true;

  try {
    const payload = await authApi.exportData();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadJson(payload, `moneyio-export-${timestamp}.json`);
    accountActionSuccess.value = t('settings.exportSuccess');
  } catch (err) {
    console.error('Failed to export data:', err);
    if (axios.isAxiosError(err)) {
      const backendError = (err.response?.data as { error?: unknown } | undefined)?.error;
      if (typeof backendError === 'string' && backendError.trim() !== '') {
        accountActionError.value = backendError;
        return;
      }
    }

    accountActionError.value = t('settings.exportFailed');
  } finally {
    isExporting.value = false;
  }
}

async function handleDeleteAccount() {
  accountActionError.value = '';
  accountActionSuccess.value = '';

  const confirmed = window.confirm(t('settings.deleteAccountConfirm'));
  if (!confirmed) {
    return;
  }

  isDeletingAccount.value = true;
  try {
    await authApi.deleteAccount();
    authStore.clearLocalAuthState();
    window.localStorage.removeItem('userAvatarDataUrl');
    window.localStorage.removeItem('userPreferences');
    await router.push({ name: 'login' });
  } catch (err) {
    console.error('Failed to delete account:', err);
    if (axios.isAxiosError(err)) {
      const backendError = (err.response?.data as { error?: unknown } | undefined)?.error;
      if (typeof backendError === 'string' && backendError.trim() !== '') {
        accountActionError.value = backendError;
        return;
      }
    }

    accountActionError.value = t('settings.deleteAccountFailed');
  } finally {
    isDeletingAccount.value = false;
  }
}

function saveProfile(): void {
  profileError.value = '';
  profileSuccess.value = '';

  if (!isValidEmail(profileForm.email)) {
    profileError.value = t('settings.invalidEmail');
    return;
  }

  try {
    window.localStorage.setItem('userAvatarDataUrl', profileForm.avatar);

    if (authStore.user) {
      authStore.user = {
        ...authStore.user,
        email: profileForm.email,
      };
    }

    profileSuccess.value = `${t('settings.profileSaved')} ${t('settings.profileBackendNote')}`;
  } catch (err) {
    console.error('Failed to update profile:', err);
    profileError.value = t('settings.profileUpdateFailed');
  }
}

async function savePreferences() {
  isSaving.value = true;
  saveSuccess.value = false;
  saveError.value = false;

  try {
    await new Promise((resolve) => setTimeout(resolve, 400));

    applyPreferencesToDocument();

    saveUserPreferences(preferences);

    saveSuccess.value = true;
    saveMessage.value = t('settings.preferencesSaved');

    setTimeout(() => {
      saveSuccess.value = false;
    }, 3000);
  } catch (err) {
    console.error('Failed to save preferences:', err);
    saveSuccess.value = false;
    saveError.value = true;
    saveMessage.value = t('settings.preferencesFailed');

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
    passwordError.value = t('settings.passwordMinLength');
    return;
  }

  if (passwordForm.password !== passwordForm.confirmPassword) {
    passwordError.value = t('auth.passwordsNotMatch');
    return;
  }

  try {
    await authStore.changePassword(passwordForm.password);
    passwordSuccess.value = t('settings.passwordUpdated');
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
  Object.assign(preferences, loadUserPreferences());

  profileForm.username = authStore.user?.username ?? '';
  profileForm.email = authStore.user?.email ?? '';
  profileForm.avatar = window.localStorage.getItem('userAvatarDataUrl') ?? '/avatar.png';

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
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-neutral-600 hover:text-neutral-900',
          ]"
          :aria-current="activeTab === 'profile' ? 'page' : undefined"
          @click="activeTab = 'profile'"
        >
          {{ t('settings.profile') }}
        </button>
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
          {{ t('settings.security') }}
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
          {{ t('settings.preferences') }}
        </button>
      </nav>
    </div>

    <section v-if="activeTab === 'profile'" class="space-y-6">
      <div
        class="rounded-xl border border-neutral-200 bg-white p-6 shadow-[0_4px_0_0_rgba(148,163,184,0.42)]"
      >
        <h2 class="text-lg font-semibold text-neutral-900 mb-1">
          {{ t('settings.profileTitle') }}
        </h2>
        <p class="text-sm text-neutral-500 mb-5">{{ t('settings.profileDescription') }}</p>

        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <img
              :src="profileForm.avatar"
              alt="Profile avatar"
              class="size-20 rounded-full object-cover border border-gray-200"
            />
            <div class="flex-1">
              <label class="block text-sm font-medium text-neutral-700 mb-1" for="profile-avatar">
                {{ t('settings.avatar') }}
              </label>
              <div class="flex items-center gap-3">
                <input
                  id="profile-avatar"
                  type="file"
                  accept="image/*"
                  class="sr-only focus:not-sr-only"
                  @change="handleAvatarFileChange"
                />
                <label
                  for="profile-avatar"
                  class="duo-btn-secondary inline-flex cursor-pointer items-center px-3 py-2 text-sm font-medium"
                >
                  Choose image
                </label>
                <span class="truncate text-sm text-neutral-500">{{ selectedAvatarFileName }}</span>
              </div>
              <p class="mt-1 text-xs text-neutral-400">PNG, JPG, WEBP, GIF up to 2MB</p>
            </div>
          </div>

          <div>
            <label for="profile-username" class="block text-sm font-medium text-neutral-700 mb-1">
              {{ t('settings.username') }}
            </label>
            <input
              id="profile-username"
              v-model="profileForm.username"
              type="text"
              disabled
              class="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-100 text-neutral-500"
            />
          </div>

          <div>
            <label for="profile-email" class="block text-sm font-medium text-neutral-700 mb-1">
              {{ t('settings.email') }}
            </label>
            <input
              id="profile-email"
              v-model="profileForm.email"
              type="email"
              class="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white hover:border-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
            />
          </div>

          <p v-if="profileError" class="text-sm text-red-600">{{ profileError }}</p>
          <p v-if="profileSuccess" class="text-sm text-green-600">{{ profileSuccess }}</p>

          <div class="flex justify-end pt-2">
            <button
              type="button"
              class="duo-btn-primary px-4 py-2 text-sm font-medium"
              @click="saveProfile"
            >
              {{ t('settings.saveProfile') }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="activeTab === 'security'" class="space-y-6">
      <div
        class="rounded-xl border border-neutral-200 bg-white p-6 shadow-[0_4px_0_0_rgba(148,163,184,0.42)]"
      >
        <h2 class="text-lg font-semibold text-neutral-900 mb-4">
          {{ t('settings.securityTitle') }}
        </h2>

        <div class="space-y-4">
          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-neutral-800">
              {{ t('settings.changePassword') }}
            </h3>

            <div>
              <label for="new-password" class="block text-sm font-medium text-neutral-700 mb-1">
                {{ t('settings.newPassword') }}
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
                {{ t('settings.confirmPassword') }}
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
              class="duo-btn-primary px-4 py-2 text-sm font-medium"
              @click="changePassword"
            >
              {{ t('settings.updatePassword') }}
            </button>
          </div>
        </div>
      </div>

      <div
        class="rounded-xl border border-neutral-200 bg-white p-6 shadow-[0_4px_0_0_rgba(148,163,184,0.42)]"
      >
        <h2 class="text-lg font-semibold text-neutral-900 mb-4">
          {{ t('settings.accountActions') }}
        </h2>

        <div class="space-y-3">
          <p v-if="accountActionError" class="text-sm text-red-600">{{ accountActionError }}</p>
          <p v-if="accountActionSuccess" class="text-sm text-green-600">
            {{ accountActionSuccess }}
          </p>
          <button
            type="button"
            :disabled="isExporting || isDeletingAccount"
            class="duo-btn-secondary w-full px-4 py-2 text-sm font-medium text-left"
            @click="handleExportData"
          >
            {{ isExporting ? t('settings.exportingData') : t('settings.exportData') }}
          </button>
          <button
            type="button"
            :disabled="isExporting || isDeletingAccount"
            class="duo-btn-danger w-full px-4 py-2 text-sm font-medium text-left"
            @click="handleDeleteAccount"
          >
            {{ isDeletingAccount ? t('settings.deletingAccount') : t('settings.deleteAccount') }}
          </button>
        </div>
      </div>
    </section>

    <section v-if="activeTab === 'preferences'" class="space-y-6">
      <div
        class="rounded-xl border border-neutral-200 bg-white p-6 shadow-[0_4px_0_0_rgba(148,163,184,0.42)]"
      >
        <h2 class="text-lg font-semibold text-neutral-900 mb-4">
          {{ t('settings.preferencesTitle') }}
        </h2>

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
            <label class="block text-sm font-medium text-neutral-700 mb-3">{{
              t('settings.theme')
            }}</label>
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
                {{ t(option.labelKey) }}
              </button>
            </div>
          </div>

          <div>
            <label for="currency" class="block text-sm font-medium text-neutral-700 mb-1">
              {{ t('settings.currency') }}
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
              {{ t('settings.language') }}
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
              {{ t('settings.fontSize') }}
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
              {{ t('settings.emailNotifications') }}
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
              class="duo-btn-primary px-4 py-2 text-sm font-medium"
            >
              {{ isSaving ? t('settings.saving') : t('settings.savePreferences') }}
            </button>
          </div>
        </form>
      </div>
    </section>
  </div>
</template>
