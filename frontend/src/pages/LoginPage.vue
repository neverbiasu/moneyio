<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';

defineOptions({ name: 'LoginPage' });

const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const form = reactive({ username: '', password: '' });
const errors = reactive({ username: '', password: '' });
const apiError = ref('');
const isLoading = ref(false);

function validate(): boolean {
  errors.username = form.username.trim() ? '' : t('auth.usernameRequired');
  errors.password = form.password.trim() ? '' : t('auth.passwordRequired');
  return !errors.username && !errors.password;
}

async function handleSubmit() {
  if (!validate()) return;
  isLoading.value = true;
  apiError.value = '';
  try {
    await authStore.login(form.username, form.password);
    await router.push('/app/dashboard');
  } catch (err) {
    const e = err as {
      response?: { status?: number; data?: { message?: string; error?: string } };
    };
    apiError.value =
      e.response?.data?.error ??
      e.response?.data?.message ??
      (e.response?.status
        ? `${t('auth.loginFailed')} (HTTP ${e.response.status})`
        : t('auth.loginFailed'));
    await nextTick(() => document.getElementById('login-error')?.focus());
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
            class="w-12 h-12 flex items-center justify-center transform transition-transform duration-300 hover:scale-105"
          >
            <img src="/logo.svg" alt="MoneyIO Logo" class="h-11 w-11 object-contain" />
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
        class="bg-card-light dark:bg-card-dark rounded-3xl shadow-[0_6px_0_0_rgba(148,163,184,0.45)] p-8 sm:p-10 border border-border-light dark:border-border-dark backdrop-blur-sm"
      >
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('auth.welcomeBack') }}
          </h2>
          <div
            class="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 dark:border-blue-800 dark:bg-blue-900/20"
          >
            <span class="material-symbols-outlined text-green-600 dark:text-green-400 text-[16px]"
              >verified_user</span
            >
            <span
              class="text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300"
              >{{ t('auth.secure') }}</span
            >
          </div>
        </div>

        <div
          v-if="apiError"
          id="login-error"
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
              >{{ t('auth.usernameOrEmail') }}</label
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
                placeholder="tomori or tomori@mygo.bandream"
                :aria-invalid="!!errors.username"
                class="block w-full pl-11 pr-3 py-3.5 border border-border-light dark:border-border-dark rounded-xl leading-5 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white dark:focus:bg-gray-800 sm:text-sm transition-all duration-200 ease-in-out"
              />
            </div>
            <p v-if="errors.username" class="mt-1 text-xs text-red-600 dark:text-red-400">
              {{ errors.username }}
            </p>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label
                class="block text-sm font-medium text-text-light dark:text-text-dark"
                for="password"
                >{{ t('auth.password') }}</label
              >
              <a
                href="#"
                class="text-sm font-semibold text-primary hover:text-primary-hover dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >{{ t('auth.forgotPassword') }}</a
              >
            </div>
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
                id="password"
                v-model="form.password"
                type="password"
                name="password"
                autocomplete="current-password"
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

          <div class="pt-2">
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full flex justify-center rounded-2xl border border-primary/20 bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-[0_4px_0_0_rgba(30,64,175,0.75)] transition-all duration-200 ease-in-out hover:bg-primary-hover hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:translate-y-1 active:shadow-[0_1px_0_0_rgba(30,64,175,0.75)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ isLoading ? t('auth.signingIn') : t('auth.signIn') }}
            </button>
          </div>
        </form>

        <div class="mt-8">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span
                class="px-4 bg-card-light dark:bg-card-dark text-subtext-light dark:text-subtext-dark font-medium"
                >{{ t('auth.orContinueWith') }}</span
              >
            </div>
          </div>

          <div class="mt-6">
            <button
              type="button"
              class="group w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 hover:border-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all duration-200"
            >
              <svg
                class="h-5 w-5 mr-3 text-gray-800 dark:text-white transition-transform group-hover:scale-110"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span class="font-semibold">{{ t('auth.signInWithGithub') }}</span>
            </button>
          </div>
        </div>

        <p class="mt-8 text-center text-sm text-subtext-light dark:text-subtext-dark">
          {{ t('auth.noAccount') }}
          <RouterLink
            :to="{ name: 'register' }"
            class="font-bold text-primary hover:text-primary-hover dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >{{ t('auth.signUpFree') }}</RouterLink
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
