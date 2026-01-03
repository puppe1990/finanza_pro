
export interface Transaction {
  id: string;
  date: string;
  type: string;
  description: string;
  amount: number;
  category: string;
}

export interface UploadRecord {
  id: string;
  filename: string;
  timestamp: string;
  transactionCount: number;
}

export interface FinancialStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
}

export enum ViewMode {
  DASHBOARD = 'dashboard',
  TRANSACTIONS = 'transactions',
  UPLOAD = 'upload',
  REPORTS = 'reports',
  HISTORY = 'history'
}

export interface CategoryBreakdown {
  name: string;
  value: number;
  color: string;
}
