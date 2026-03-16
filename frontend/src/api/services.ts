import api from '@/api/index';
import type {
  Account,
  Budget,
  Category,
  ChartData,
  ChartDataPoint,
  Summary,
  Transaction,
} from '@/api/types';

interface BackendAccount {
  id: number;
  name: string;
  account_type: string;
  balance: string;
}

interface BackendCategoryNode {
  id: number;
  name: string;
  category_type: 'IN' | 'OUT';
  tree_level: number;
  parent_id?: number | null;
  icon_id?: string | null;
  children?: BackendCategoryNode[];
}

interface BackendTransactionListItem {
  id: number;
  amount: string;
  trans_date: string;
  note: string;
  account: {
    id: number;
    name: string;
    account_type: string;
    balance: string;
  };
  category: {
    id: number;
    name: string;
    category_type: 'IN' | 'OUT';
  } | null;
}

interface BackendTransactionsResponse {
  current_page: number;
  page_size: number;
  total_count: number;
  results: BackendTransactionListItem[];
}

interface BackendTransactionDetail {
  id: number;
  amount: string;
  trans_date: string;
  note: string;
  account_id: number;
  category_id: number;
}

interface BackendSummaryResponse {
  period: string;
  income: string;
  expense: string;
  net_balance: string;
}

interface BackendBudget {
  id: number;
  name: string;
  description: string;
  amount_limit: string;
  actual_spending: string;
  budget_month: string;
  is_recurring: boolean;
  updated_at: string;
}

interface BackendBudgetCollectionResponse {
  results: BackendBudget[];
}

interface BackendBudgetMutationResponse {
  budget_id?: number;
  budget?: BackendBudget;
}

function mapCategoryType(value: 'IN' | 'OUT'): 'income' | 'expense' {
  return value === 'IN' ? 'income' : 'expense';
}

function mapAccountType(rawType: string): Account['type'] {
  const normalized = rawType.toLowerCase();
  if (normalized.includes('credit')) {
    return 'credit';
  }
  if (normalized.includes('saving')) {
    return 'savings';
  }
  return 'checking';
}

function toBackendAccountType(type: Account['type']): string {
  if (type === 'credit') {
    return 'Credit';
  }
  if (type === 'savings') {
    return 'Savings';
  }
  return 'Checking';
}

function mapAccount(item: BackendAccount): Account {
  return {
    id: item.id,
    userId: 0,
    name: item.name,
    type: mapAccountType(item.account_type),
    balance: Number(item.balance),
  };
}

function flattenCategoryTree(
  nodes: BackendCategoryNode[],
  parentId: number | null = null,
): Category[] {
  const flattened: Category[] = [];
  for (const node of nodes) {
    flattened.push({
      id: node.id,
      userId: 0,
      parentId,
      name: node.name,
      type: mapCategoryType(node.category_type),
      iconId: node.icon_id ?? 'category',
      level: node.tree_level,
    });

    if (node.children && node.children.length > 0) {
      flattened.push(...flattenCategoryTree(node.children, node.id));
    }
  }
  return flattened;
}

function mapTransaction(item: BackendTransactionListItem): Transaction {
  return {
    id: item.id,
    userId: 0,
    accountId: item.account.id,
    categoryId: item.category?.id ?? null,
    amount: Number(item.amount),
    transactionDate: item.trans_date,
    note: item.note,
    crtTime: item.trans_date,
    uptTime: item.trans_date,
  };
}

async function fetchAllTransactions(params?: {
  accountId?: number;
  categoryId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Transaction[]> {
  const all: Transaction[] = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const response = await api.get<BackendTransactionsResponse>('/transactions/', {
      params: {
        page,
        page_size: pageSize,
        account_id: params?.accountId,
        category_id: params?.categoryId,
        search: params?.search,
        start: params?.startDate,
        end: params?.endDate,
      },
    });

    const mapped = response.data.results.map(mapTransaction);
    all.push(...mapped);

    if (all.length >= response.data.total_count || mapped.length === 0) {
      break;
    }

    page += 1;
  }

  return all;
}

function mapBudget(item: BackendBudget): Budget {
  const description = item.description?.trim();

  return {
    id: item.id,
    userId: 0,
    name: item.name,
    ...(description ? { description } : {}),
    amountLimit: Number(item.amount_limit),
    actualSpending: Number(item.actual_spending),
    budgetMonth: item.budget_month,
    isRecurring: item.is_recurring,
    updatedAt: item.updated_at,
  };
}

function toBudgetPayload(data: Partial<Budget>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (data.name !== undefined) {
    payload['name'] = data.name;
  }

  if (data.description !== undefined) {
    payload['description'] = data.description ?? '';
  }

  if (data.amountLimit !== undefined) {
    payload['amount_limit'] = data.amountLimit;
  }

  if (data.actualSpending !== undefined) {
    payload['actual_spending'] = data.actualSpending;
  }

  if (data.budgetMonth !== undefined) {
    payload['budget_month'] = data.budgetMonth;
  }

  if (data.isRecurring !== undefined) {
    payload['is_recurring'] = data.isRecurring;
  }

  return payload;
}

export const apiService = {
  accounts: {
    async getAccounts(): Promise<Account[]> {
      const response = await api.get<{ results: BackendAccount[] }>('/accounts/');
      return response.data.results.map(mapAccount);
    },

    async getAccount(id: number): Promise<Account> {
      const response = await api.get<BackendAccount>(`/accounts/${id}/`);
      return mapAccount(response.data);
    },

    async createAccount(
      data: Omit<Account, 'id' | 'userId' | 'balance'> & { balance?: number },
    ): Promise<Account> {
      const payload = {
        name: data.name,
        account_type: toBackendAccountType(data.type),
        balance: data.balance ?? 0,
      };

      const created = await api.post<{ account_id: number }>('/accounts/', payload);
      return this.getAccount(created.data.account_id);
    },

    async updateAccount(id: number, data: Partial<Account>): Promise<Account> {
      const payload: Record<string, string | number> = {};
      if (data.name !== undefined) {
        payload['name'] = data.name;
      }
      if (data.type !== undefined) {
        payload['account_type'] = toBackendAccountType(data.type);
      }
      if (data.balance !== undefined) {
        payload['balance'] = data.balance;
      }

      await api.patch(`/accounts/${id}/`, payload);
      return this.getAccount(id);
    },

    async deleteAccount(id: number): Promise<{ message: string }> {
      await api.delete(`/accounts/${id}/`);
      return { message: 'Account deleted' };
    },
  },

  categories: {
    async getCategories(): Promise<Category[]> {
      const response = await api.get<{ results: BackendCategoryNode[] }>('/categories/');
      return flattenCategoryTree(response.data.results);
    },
  },

  transactions: {
    async getTransactions(filters?: {
      accountId?: number;
      categoryId?: number;
      search?: string;
      startDate?: string;
      endDate?: string;
    }): Promise<Transaction[]> {
      return fetchAllTransactions(filters);
    },

    async getTransaction(id: number): Promise<Transaction> {
      const response = await api.get<BackendTransactionDetail>(`/transactions/${id}/`);
      return {
        id: response.data.id,
        userId: 0,
        accountId: response.data.account_id,
        categoryId: response.data.category_id,
        amount: Number(response.data.amount),
        transactionDate: response.data.trans_date,
        note: response.data.note,
        crtTime: response.data.trans_date,
        uptTime: response.data.trans_date,
      };
    },

    async createTransaction(
      data: Omit<Transaction, 'id' | 'userId' | 'crtTime' | 'uptTime'>,
    ): Promise<Transaction> {
      if (data.categoryId === null) {
        throw new Error('Transfer transactions are not supported by backend API yet.');
      }

      const response = await api.post<{ transaction_id: number }>('/transactions/', {
        account_id: data.accountId,
        category_id: data.categoryId,
        amount: data.amount,
        trans_date: data.transactionDate,
        note: data.note ?? '',
      });

      return this.getTransaction(response.data.transaction_id);
    },

    async updateTransaction(id: number, data: Partial<Transaction>): Promise<Transaction> {
      const payload: Record<string, string | number> = {};
      if (data.accountId !== undefined) {
        payload['account_id'] = data.accountId;
      }
      if (data.categoryId !== undefined && data.categoryId !== null) {
        payload['category_id'] = data.categoryId;
      }
      if (data.amount !== undefined) {
        payload['amount'] = data.amount;
      }
      if (data.transactionDate !== undefined) {
        payload['trans_date'] = data.transactionDate;
      }
      if (data.note !== undefined) {
        payload['note'] = data.note ?? '';
      }

      await api.patch(`/transactions/${id}/`, payload);
      return this.getTransaction(id);
    },

    async deleteTransaction(id: number): Promise<{ message: string }> {
      await api.delete(`/transactions/${id}/`);
      return { message: 'Transaction deleted' };
    },
  },

  budgets: {
    async getBudgets(): Promise<Budget[]> {
      const response = await api.get<BackendBudgetCollectionResponse>('/budgets/');
      return response.data.results.map(mapBudget);
    },

    async createBudget(data: Omit<Budget, 'id' | 'userId' | 'updatedAt'>): Promise<Budget> {
      const response = await api.post<BackendBudgetMutationResponse>(
        '/budgets/',
        toBudgetPayload(data),
      );

      if (response.data.budget) {
        return mapBudget(response.data.budget);
      }

      if (!response.data.budget_id) {
        throw new Error('Invalid budget create response');
      }

      const detail = await api.get<BackendBudget>(`/budgets/${response.data.budget_id}/`);
      return mapBudget(detail.data);
    },

    async updateBudget(id: number, data: Partial<Budget>): Promise<Budget> {
      const response = await api.patch<BackendBudgetMutationResponse>(
        `/budgets/${id}/`,
        toBudgetPayload(data),
      );

      if (response.data.budget) {
        return mapBudget(response.data.budget);
      }

      const detail = await api.get<BackendBudget>(`/budgets/${id}/`);
      return mapBudget(detail.data);
    },

    async deleteBudget(id: number): Promise<{ message: string }> {
      await api.delete(`/budgets/${id}/`);
      return { message: 'Budget deleted' };
    },
  },

  dashboard: {
    async getSummary(): Promise<Summary> {
      const [accounts, summary] = await Promise.all([
        apiService.accounts.getAccounts(),
        api.get<BackendSummaryResponse>('/transactions/summary/'),
      ]);

      const monthlyIncome = Number(summary.data.income);
      const monthlyExpense = Number(summary.data.expense);
      const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
      const savingsRate =
        monthlyIncome > 0
          ? Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100)
          : 0;

      return {
        totalBalance,
        monthlyIncome,
        monthlyExpense,
        savingsRate,
      };
    },

    async getChartData(): Promise<ChartData> {
      const endDate = new Date();
      endDate.setHours(0, 0, 0, 0);
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 29);
      const startDateStr = startDate.toISOString().slice(0, 10);
      const endDateStr = endDate.toISOString().slice(0, 10);

      const [transactions, categories] = await Promise.all([
        apiService.transactions.getTransactions({
          startDate: startDateStr,
          endDate: endDateStr,
        }),
        apiService.categories.getCategories(),
      ]);

      const categoryTypeById = new Map<number, Category['type']>();
      for (const category of categories) {
        categoryTypeById.set(category.id, category.type);
      }

      const pointsMap = new Map<string, ChartDataPoint>();

      for (let i = 29; i >= 0; i -= 1) {
        const date = new Date(endDate);
        date.setDate(endDate.getDate() - i);
        const key = date.toISOString().slice(0, 10);
        pointsMap.set(key, { date: key, income: 0, expense: 0 });
      }

      for (const transaction of transactions) {
        const key = transaction.transactionDate.slice(0, 10);
        const point = pointsMap.get(key);
        if (!point) {
          continue;
        }

        const type = transaction.categoryId
          ? categoryTypeById.get(transaction.categoryId)
          : undefined;
        if (type === 'income') {
          point.income += transaction.amount;
        } else {
          point.expense += transaction.amount;
        }
      }

      return {
        data: Array.from(pointsMap.values()),
      };
    },
  },
};

export default apiService;
