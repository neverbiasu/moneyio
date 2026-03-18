import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as authApi from '@/api/auth';

interface AuthState {
  user: {
    id: number;
    username: string;
    email: string;
  } | null;
}

const SESSION_HINT_KEY = 'moneyio.auth.hasSession';

function readSessionHint(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return localStorage.getItem(SESSION_HINT_KEY) === '1';
}

function writeSessionHint(value: boolean) {
  if (typeof window === 'undefined') {
    return;
  }
  if (value) {
    localStorage.setItem(SESSION_HINT_KEY, '1');
    return;
  }
  localStorage.removeItem(SESSION_HINT_KEY);
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthState['user']>(null);
  const isLoaded = ref(false);
  const hasSessionHint = ref(readSessionHint());

  const isAuthenticated = computed(() => !!user.value);

  async function fetchCurrentUser() {
    const response = await authApi.getCurrentUser();
    if (response.user === null || !response.id || !response.username || !response.email) {
      user.value = null;
      hasSessionHint.value = false;
      writeSessionHint(false);
      return;
    }
    user.value = {
      id: response.id,
      username: response.username,
      email: response.email,
    };
    hasSessionHint.value = true;
    writeSessionHint(true);
  }

  async function ensureAuthLoaded() {
    if (isLoaded.value) {
      return;
    }
    try {
      await fetchCurrentUser();
    } finally {
      isLoaded.value = true;
    }
  }

  async function login(username: string, password: string) {
    await authApi.login({ username, password });
    await fetchCurrentUser();
  }

  async function register(username: string, email: string, password: string) {
    await authApi.register({ username, email, password });
    await authApi.login({ username, password });
    await fetchCurrentUser();
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      user.value = null;
      hasSessionHint.value = false;
      writeSessionHint(false);
      isLoaded.value = true;
    }
  }

  async function changePassword(password: string) {
    await authApi.changePassword({ password });
  }

  function clearLocalAuthState() {
    user.value = null;
    hasSessionHint.value = false;
    writeSessionHint(false);
    isLoaded.value = true;
  }

  return {
    user,
    isAuthenticated,
    isLoaded,
    hasSessionHint,
    ensureAuthLoaded,
    fetchCurrentUser,
    clearLocalAuthState,
    login,
    register,
    logout,
    changePassword,
  };
});
