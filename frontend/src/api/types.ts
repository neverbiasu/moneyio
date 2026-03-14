export interface User {
  id: number;
  username: string;
  email: string;
  registrationDate: string;
}

export interface Account {
  id: number;
  userId: number;
  name: string;
  type: 'savings' | 'checking' | 'credit';
  balance: number;
}

export interface Category {
  id: number;
  userId: number;
  parentId: number | null;
  name: string;
  type: 'expense' | 'income';
  iconId: string;
  level: number;
}

export interface Transaction {
  id: number;
  userId: number;
  accountId: number;
  categoryId: number | null;
  amount: number;
  transactionDate: string;
  note: string | null;
  crtTime: string;
  uptTime: string;
}

export interface Budget {
  id: number;
  userId: number;
  name: string;
  description?: string;
  amountLimit: number;
  actualSpending: number;
  budgetMonth: string;
  isRecurring: boolean;
  updatedAt: string;
}

export interface Summary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  savingsRate: number;
}

export interface ChartDataPoint {
  date: string;
  income: number;
  expense: number;
}

export interface ChartData {
  data: ChartDataPoint[];
}

export interface AuthResponse {
  token: string;
  user: User;
}
