export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  category: string;
  notes?: string; // Optional notes field
  currencyCode: string; // Add currencyCode
}

export interface Budget {
  category: string;
  amount: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
}

export interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  categoryBreakdown: CategoryBreakdown[];
}

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  frequency: RecurrenceFrequency;
  startDate: string; // YYYY-MM-DD
  nextOccurrenceDate: string; // YYYY-MM-DD - The next date this transaction should be generated
  notes?: string;
  currencyCode: string; // Add currencyCode
}

export interface CategoryOverride {
  description: string;
  category: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}