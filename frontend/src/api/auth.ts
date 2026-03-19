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

interface ChangePasswordPayload {
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

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await api.post('/auth/change-password/', payload);
}

export interface ExportDataResponse {
  exported_at: string;
  user: {
    id: number;
    username: string;
    email: string;
    registered_at: string;
  };
  accounts: Array<Record<string, unknown>>;
  categories: Array<Record<string, unknown>>;
  transactions: Array<Record<string, unknown>>;
  budgets: Array<Record<string, unknown>>;
}

export async function exportData(): Promise<ExportDataResponse> {
  const response = await api.get<ExportDataResponse>('/auth/export/');
  return response.data;
}

export async function deleteAccount(): Promise<void> {
  await api.post('/auth/delete-account/');
}
