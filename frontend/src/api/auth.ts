import api from '@/api/index';

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

interface LoginPayload {
  username: string;
  password: string;
}

interface CurrentUserResponse {
  id?: number;
  username?: string;
  email?: string;
  user?: null;
}

export async function login(payload: LoginPayload): Promise<void> {
  await api.post('/auth/login/', payload);
}

export async function register(payload: RegisterPayload): Promise<void> {
  await api.post('/auth/register/', payload);
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout/');
}

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  const response = await api.get<CurrentUserResponse>('/auth/me/');
  return response.data;
}
