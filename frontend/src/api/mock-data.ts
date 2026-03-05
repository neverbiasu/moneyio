/**
 * Mock data for development and testing
 * Remove this file before production deployment
 *
 * IMPORTANT: All content, names, notes, and comments MUST be in English.
 * This is a strict requirement for consistency and maintainability.
 */

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
  categoryId: number;
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

// Mock Users
export const mockUser: User = {
  id: 1,
  username: 'tomori',
  email: 'tomori@mygo.bandream',
  registrationDate: '2026-01-15T08:30:00Z',
};

export const mockUsers: User[] = [
  mockUser,
  {
    id: 2,
    username: 'bob',
    email: 'bob@example.com',
    registrationDate: '2026-01-20T10:45:00Z',
  },
];

// Mock Accounts
export const mockAccounts: Account[] = [
  {
    id: 1,
    userId: 1,
    name: 'Salary Card',
    type: 'savings',
    balance: 50000.0,
  },
  {
    id: 2,
    userId: 1,
    name: 'Daily Account',
    type: 'checking',
    balance: 8500.5,
  },
  {
    id: 3,
    userId: 1,
    name: 'Credit Card',
    type: 'credit',
    balance: 5000.0,
  },
];

// Mock Categories
export const mockCategories: Category[] = [
  // Expense categories
  {
    id: 1,
    userId: 1,
    parentId: null,
    name: 'Food & Dining',
    type: 'expense',
    iconId: 'utensils',
    level: 1,
  },
  {
    id: 2,
    userId: 1,
    parentId: 1,
    name: 'Breakfast',
    type: 'expense',
    iconId: 'breakfast',
    level: 2,
  },
  {
    id: 3,
    userId: 1,
    parentId: 1,
    name: 'Lunch',
    type: 'expense',
    iconId: 'lunch',
    level: 2,
  },
  {
    id: 4,
    userId: 1,
    parentId: null,
    name: 'Transportation',
    type: 'expense',
    iconId: 'local_taxi',
    level: 1,
  },
  {
    id: 5,
    userId: 1,
    parentId: null,
    name: 'Entertainment',
    type: 'expense',
    iconId: 'movie',
    level: 1,
  },
  // Income categories
  {
    id: 10,
    userId: 1,
    parentId: null,
    name: 'Salary',
    type: 'income',
    iconId: 'attach_money',
    level: 1,
  },
  {
    id: 11,
    userId: 1,
    parentId: null,
    name: 'Bonus',
    type: 'income',
    iconId: 'card_giftcard',
    level: 1,
  },
];

// Mock Transactions
export const mockTransactions: Transaction[] = [
  // --- Income ---
  {
    id: 1,
    userId: 1,
    accountId: 1,
    categoryId: 10,
    amount: 4250.0,
    transactionDate: '2026-02-01T09:00:00Z',
    note: 'Monthly salary',
    crtTime: '2026-02-01T09:10:00Z',
    uptTime: '2026-02-01T09:10:00Z',
  },
  {
    id: 2,
    userId: 1,
    accountId: 1,
    categoryId: 11,
    amount: 500.0,
    transactionDate: '2026-02-10T10:00:00Z',
    note: 'Project bonus',
    crtTime: '2026-02-10T10:05:00Z',
    uptTime: '2026-02-10T10:05:00Z',
  },
  // --- Expenses spread across the month ---
  {
    id: 3,
    userId: 1,
    accountId: 2,
    categoryId: 2,
    amount: 12.0,
    transactionDate: '2026-01-27T08:00:00Z',
    note: 'Breakfast',
    crtTime: '2026-01-27T08:05:00Z',
    uptTime: '2026-01-27T08:05:00Z',
  },
  {
    id: 4,
    userId: 1,
    accountId: 2,
    categoryId: 3,
    amount: 25.0,
    transactionDate: '2026-01-27T12:30:00Z',
    note: 'Lunch',
    crtTime: '2026-01-27T12:35:00Z',
    uptTime: '2026-01-27T12:35:00Z',
  },
  {
    id: 5,
    userId: 1,
    accountId: 2,
    categoryId: 4,
    amount: 18.0,
    transactionDate: '2026-01-28T08:30:00Z',
    note: 'Metro card top-up',
    crtTime: '2026-01-28T08:35:00Z',
    uptTime: '2026-01-28T08:35:00Z',
  },
  {
    id: 6,
    userId: 1,
    accountId: 2,
    categoryId: 3,
    amount: 30.0,
    transactionDate: '2026-01-29T12:00:00Z',
    note: 'Lunch with colleague',
    crtTime: '2026-01-29T12:05:00Z',
    uptTime: '2026-01-29T12:05:00Z',
  },
  {
    id: 7,
    userId: 1,
    accountId: 2,
    categoryId: 5,
    amount: 55.0,
    transactionDate: '2026-01-30T19:00:00Z',
    note: 'Concert ticket',
    crtTime: '2026-01-30T19:05:00Z',
    uptTime: '2026-01-30T19:05:00Z',
  },
  {
    id: 8,
    userId: 1,
    accountId: 2,
    categoryId: 2,
    amount: 14.0,
    transactionDate: '2026-02-02T08:00:00Z',
    note: 'Breakfast',
    crtTime: '2026-02-02T08:05:00Z',
    uptTime: '2026-02-02T08:05:00Z',
  },
  {
    id: 9,
    userId: 1,
    accountId: 2,
    categoryId: 3,
    amount: 28.0,
    transactionDate: '2026-02-03T12:30:00Z',
    note: 'Lunch',
    crtTime: '2026-02-03T12:35:00Z',
    uptTime: '2026-02-03T12:35:00Z',
  },
  {
    id: 10,
    userId: 1,
    accountId: 2,
    categoryId: 4,
    amount: 22.0,
    transactionDate: '2026-02-04T08:30:00Z',
    note: 'Taxi',
    crtTime: '2026-02-04T08:35:00Z',
    uptTime: '2026-02-04T08:35:00Z',
  },
  {
    id: 11,
    userId: 1,
    accountId: 2,
    categoryId: 5,
    amount: 80.0,
    transactionDate: '2026-02-05T20:00:00Z',
    note: 'Movie and dinner',
    crtTime: '2026-02-05T20:05:00Z',
    uptTime: '2026-02-05T20:05:00Z',
  },
  {
    id: 12,
    userId: 1,
    accountId: 2,
    categoryId: 3,
    amount: 35.0,
    transactionDate: '2026-02-07T12:00:00Z',
    note: 'Lunch',
    crtTime: '2026-02-07T12:05:00Z',
    uptTime: '2026-02-07T12:05:00Z',
  },
  {
    id: 13,
    userId: 1,
    accountId: 2,
    categoryId: 2,
    amount: 16.0,
    transactionDate: '2026-02-08T08:00:00Z',
    note: 'Breakfast',
    crtTime: '2026-02-08T08:05:00Z',
    uptTime: '2026-02-08T08:05:00Z',
  },
  {
    id: 14,
    userId: 1,
    accountId: 2,
    categoryId: 4,
    amount: 30.0,
    transactionDate: '2026-02-10T08:30:00Z',
    note: 'Metro monthly pass',
    crtTime: '2026-02-10T08:35:00Z',
    uptTime: '2026-02-10T08:35:00Z',
  },
  {
    id: 15,
    userId: 1,
    accountId: 2,
    categoryId: 5,
    amount: 60.0,
    transactionDate: '2026-02-12T19:30:00Z',
    note: 'Board game night',
    crtTime: '2026-02-12T19:35:00Z',
    uptTime: '2026-02-12T19:35:00Z',
  },
  {
    id: 16,
    userId: 1,
    accountId: 2,
    categoryId: 3,
    amount: 32.0,
    transactionDate: '2026-02-14T12:30:00Z',
    note: 'Lunch',
    crtTime: '2026-02-14T12:35:00Z',
    uptTime: '2026-02-14T12:35:00Z',
  },
  {
    id: 17,
    userId: 1,
    accountId: 2,
    categoryId: 2,
    amount: 20.0,
    transactionDate: '2026-02-15T08:00:00Z',
    note: 'Breakfast',
    crtTime: '2026-02-15T08:05:00Z',
    uptTime: '2026-02-15T08:05:00Z',
  },
  {
    id: 18,
    userId: 1,
    accountId: 2,
    categoryId: 4,
    amount: 25.0,
    transactionDate: '2026-02-17T08:30:00Z',
    note: 'Taxi ride',
    crtTime: '2026-02-17T08:35:00Z',
    uptTime: '2026-02-17T08:35:00Z',
  },
  {
    id: 19,
    userId: 1,
    accountId: 2,
    categoryId: 5,
    amount: 45.0,
    transactionDate: '2026-02-19T20:00:00Z',
    note: 'Cinema',
    crtTime: '2026-02-19T20:05:00Z',
    uptTime: '2026-02-19T20:05:00Z',
  },
  {
    id: 20,
    userId: 1,
    accountId: 2,
    categoryId: 3,
    amount: 40.0,
    transactionDate: '2026-02-21T12:00:00Z',
    note: 'Lunch',
    crtTime: '2026-02-21T12:05:00Z',
    uptTime: '2026-02-21T12:05:00Z',
  },
  {
    id: 21,
    userId: 1,
    accountId: 2,
    categoryId: 2,
    amount: 18.5,
    transactionDate: '2026-02-25T08:30:00Z',
    note: 'Breakfast',
    crtTime: '2026-02-25T08:31:00Z',
    uptTime: '2026-02-25T08:31:00Z',
  },
  {
    id: 22,
    userId: 1,
    accountId: 2,
    categoryId: 3,
    amount: 85.0,
    transactionDate: '2026-02-25T12:30:00Z',
    note: 'Lunch',
    crtTime: '2026-02-25T12:31:00Z',
    uptTime: '2026-02-25T12:31:00Z',
  },
  {
    id: 23,
    userId: 1,
    accountId: 2,
    categoryId: 4,
    amount: 25.0,
    transactionDate: '2026-02-25T18:00:00Z',
    note: 'Metro ride home',
    crtTime: '2026-02-25T18:05:00Z',
    uptTime: '2026-02-25T18:05:00Z',
  },
  {
    id: 24,
    userId: 1,
    accountId: 2,
    categoryId: 5,
    amount: 120.0,
    transactionDate: '2026-02-24T20:00:00Z',
    note: 'Movie ticket',
    crtTime: '2026-02-24T20:15:00Z',
    uptTime: '2026-02-24T20:15:00Z',
  },
];

// Mock Budgets
export const mockBudgets: Budget[] = [
  {
    id: 1,
    userId: 1,
    name: 'Food & Dining',
    amountLimit: 600.0,
    actualSpending: 380.0,
    budgetMonth: '2026-02',
    isRecurring: true,
    updatedAt: '2026-02-25T10:00:00Z',
  },
  {
    id: 2,
    userId: 1,
    name: 'Entertainment',
    amountLimit: 300.0,
    actualSpending: 220.0,
    budgetMonth: '2026-02',
    isRecurring: true,
    updatedAt: '2026-02-25T10:00:00Z',
  },
  {
    id: 3,
    userId: 1,
    name: 'Transportation',
    amountLimit: 200.0,
    actualSpending: 95.0,
    budgetMonth: '2026-02',
    isRecurring: true,
    updatedAt: '2026-02-25T10:00:00Z',
  },
  {
    id: 4,
    userId: 1,
    name: 'Shopping',
    amountLimit: 400.0,
    actualSpending: 310.0,
    budgetMonth: '2026-02',
    isRecurring: false,
    updatedAt: '2026-02-25T10:00:00Z',
  },
  {
    id: 5,
    userId: 1,
    name: 'Health',
    amountLimit: 150.0,
    actualSpending: 45.0,
    budgetMonth: '2026-02',
    isRecurring: true,
    updatedAt: '2026-02-25T10:00:00Z',
  },
];

// Mock auth token
export const mockToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6InRvbW9yaSIsImlhdCI6MTYxNjIzOTAyMn0.mock_token_signature_here';

export const mockAuthResponse: AuthResponse = {
  token: mockToken,
  user: mockUser,
};
