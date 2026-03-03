import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { mockAPI } from '@/api/mock';

interface AuthState {
  token: string | null;
  user: {
    id: number;
    username: string;
    email: string;
    registrationDate: string;
  } | null;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  );
  const user = ref<AuthState['user']>(null);

  const isAuthenticated = computed(() => !!token.value);

  async function login(username: string, password: string) {
    const res = await mockAPI.auth.login(username, password);
    const { token: newToken, user: newUser } = res;
    token.value = newToken;
    user.value = newUser;
    localStorage.setItem('token', newToken);
  }

  async function register(username: string, email: string, password: string) {
    const res = await mockAPI.auth.register(username, email, password);
    const { token: newToken, user: newUser } = res;
    token.value = newToken;
    user.value = newUser;
    localStorage.setItem('token', newToken);
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
  }

  return { token, user, isAuthenticated, login, register, logout };
});
