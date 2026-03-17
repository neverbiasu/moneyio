<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';

defineOptions({ name: 'RegisterPage' });

const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const form = reactive({ username: '', email: '', password: '', confirmPassword: '' });
const errors = reactive({ username: '', email: '', password: '', confirmPassword: '' });
const apiError = ref('');
const isLoading = ref(false);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(): boolean {
  errors.username = form.username.trim() ? '' : t('auth.usernameRequired');
  errors.email = !form.email.trim()
    ? t('auth.emailRequired')
    : !EMAIL_RE.test(form.email)
      ? t('auth.invalidEmail')
      : '';
  errors.password = form.password ? '' : t('auth.passwordRequired');
  errors.confirmPassword =
    form.confirmPassword !== form.password ? t('auth.passwordsNotMatch') : '';
  return !errors.username && !errors.email && !errors.password && !errors.confirmPassword;
}

async function handleSubmit() {
  if (!validate()) return;
  isLoading.value = true;
  apiError.value = '';
  try {
    await authStore.register(form.username, form.email, form.password);
    await router.push('/app/dashboard');
  } catch (err) {
    const e = err as {
      response?: { status?: number; data?: { message?: string; detail?: string; error?: string } };
    };
    apiError.value =
      e.response?.data?.error ??
      e.response?.data?.message ??
      e.response?.data?.detail ??
      (e.response?.status
        ? `${t('auth.registrationFailed')} (HTTP ${e.response.status})`
        : t('auth.registrationFailed'));
    await nextTick(() => document.getElementById('register-error')?.focus());
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div
    class="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center p-4 transition-colors duration-200"
  >
    <div class="w-full max-w-md">
      <div class="flex flex-col items-center mb-8">
        <div class="flex items-center gap-3 mb-2">
          <div
            class="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 text-white transform transition-transform duration-300 hover:scale-105"
          >
            <span class="material-symbols-outlined text-3xl">account_balance_wallet</span>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {{ t('common.moneyio') }}
          </h1>
        </div>
        <p class="text-subtext-light dark:text-subtext-dark text-center text-sm font-medium">
          {{ t('auth.tagline') }}
        </p>
      </div>

      <div
        class="bg-card-light dark:bg-card-dark rounded-2xl shadow-soft p-8 sm:p-10 border border-white/60 dark:border-border-dark backdrop-blur-sm"
      >
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('auth.createAccount') }}
          </h2>
          <div
            class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800"
          >
            <span class="material-symbols-outlined text-green-600 dark:text-green-400 text-[16px]"
              >verified_user</span
            >
            <span
              class="text-[10px] font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide"
              >{{ t('auth.secure') }}</span
            >
          </div>
        </div>

        <div
          v-if="apiError"
          id="register-error"
          role="alert"
          tabindex="-1"
          class="mb-5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400"
        >
          {{ apiError }}
        </div>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div>
            <label
              class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5"
              for="username"
              >{{ t('auth.username') }}</label
            >
            <div class="relative group">
              <div
                class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-200"
              >
                <span
                  class="material-symbols-outlined text-gray-400 group-focus-within:text-primary text-[22px]"
                  >person</span
                >
              </div>
              <input
                id="username"
                v-model="form.username"
                type="text"
                name="username"
                autocomplete="username"
                :required="true"
                placeholder="your_username"
                :aria-invalid="!!errors.username"
                class="block w-full pl-11 pr-3 py-3.5 border border-border-light dark:border-border-dark rounded-xl leading-5 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white dark:focus:bg-gray-800 sm:text-sm transition-all duration-200 ease-in-out"
              />
            </div>
            <p v-if="errors.username" class="mt-1 text-xs text-red-600 dark:text-red-400">
              {{ errors.username }}
            </p>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5"
              for="reg-email"
              >{{ t('auth.emailAddress') }}</label
            >
            <div class="relative group">
              <div
                class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-200"
              >
                <span
                  class="material-symbols-outlined text-gray-400 group-focus-within:text-primary text-[22px]"
                  >mail</span
                >
              </div>
              <input
                id="reg-email"
                v-model="form.email"
                type="email"
                name="email"
                autocomplete="email"
                :required="true"
                placeholder="you@example.com"
                :aria-invalid="!!errors.email"
                class="block w-full pl-11 pr-3 py-3.5 border border-border-light dark:border-border-dark rounded-xl leading-5 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white dark:focus:bg-gray-800 sm:text-sm transition-all duration-200 ease-in-out"
              />
            </div>
            <p v-if="errors.email" class="mt-1 text-xs text-red-600 dark:text-red-400">
              {{ errors.email }}
            </p>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5"
              for="reg-password"
              >{{ t('auth.password') }}</label
            >
            <div class="relative group">
              <div
                class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-200"
              >
                <span
                  class="material-symbols-outlined text-gray-400 group-focus-within:text-primary text-[22px]"
                  >lock</span
                >
              </div>
              <input
                id="reg-password"
                v-model="form.password"
                type="password"
                name="password"
                autocomplete="new-password"
                :required="true"
                placeholder="••••••••"
                :aria-invalid="!!errors.password"
                class="block w-full pl-11 pr-3 py-3.5 border border-border-light dark:border-border-dark rounded-xl leading-5 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white dark:focus:bg-gray-800 sm:text-sm transition-all duration-200 ease-in-out"
              />
            </div>
            <p v-if="errors.password" class="mt-1 text-xs text-red-600 dark:text-red-400">
              {{ errors.password }}
            </p>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5"
              for="confirm-password"
              >{{ t('auth.confirmPassword') }}</label
            >
            <div class="relative group">
              <div
                class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-200"
              >
                <span
                  class="material-symbols-outlined text-gray-400 group-focus-within:text-primary text-[22px]"
                  >lock_reset</span
                >
              </div>
              <input
                id="confirm-password"
                v-model="form.confirmPassword"
                type="password"
                name="confirmPassword"
                autocomplete="new-password"
                :required="true"
                placeholder="••••••••"
                :aria-invalid="!!errors.confirmPassword"
                class="block w-full pl-11 pr-3 py-3.5 border border-border-light dark:border-border-dark rounded-xl leading-5 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white dark:focus:bg-gray-800 sm:text-sm transition-all duration-200 ease-in-out"
              />
            </div>
            <p v-if="errors.confirmPassword" class="mt-1 text-xs text-red-600 dark:text-red-400">
              {{ errors.confirmPassword }}
            </p>
          </div>

          <div class="pt-2">
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-primary/20 text-sm font-bold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {{ isLoading ? t('auth.creatingAccount') : t('auth.createAccountAction') }}
            </button>
          </div>
        </form>

        <p class="mt-8 text-center text-sm text-subtext-light dark:text-subtext-dark">
          {{ t('auth.alreadyHaveAccount') }}
          <RouterLink
            :to="{ name: 'login' }"
            class="font-bold text-primary hover:text-primary-hover dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >{{ t('auth.signIn') }}</RouterLink
          >
        </p>
      </div>

      <footer class="mt-8 flex justify-center space-x-6 text-xs text-gray-500 dark:text-gray-400">
        <a
          href="#"
          class="flex items-center gap-1 hover:text-primary dark:hover:text-gray-200 transition-colors"
        >
          <span class="material-symbols-outlined text-[14px]">shield</span>
          <span>{{ t('auth.privacy') }}</span>
        </a>
        <span class="text-gray-300 dark:text-gray-700">•</span>
        <a
          href="#"
          class="flex items-center gap-1 hover:text-primary dark:hover:text-gray-200 transition-colors"
        >
          <span class="material-symbols-outlined text-[14px]">description</span>
          <span>{{ t('auth.terms') }}</span>
        </a>
      </footer>
    </div>
  </div>
</template>
