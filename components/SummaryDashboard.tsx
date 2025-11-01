import React, { useEffect, useState, useCallback } from 'react';
import { Transaction, Budget, SummaryData, CategoryBreakdown } from '../types';
import ChartDisplay from './ChartDisplay';
import { getSpendingInsights } from '../services/geminiService';
import Spinner from './Spinner';
import { formatCurrency } from '../utils/currency';
import Button from './Button';

interface SummaryDashboardProps {
  transactions: Transaction[];
  budgets: Budget[];
  selectedCurrency: string;
  budgetAlertPercentage: number;
  onBudgetAlertPercentageChange: (percentage: number) => void;
}

const calculateSummary = (txs: Transaction[], currencyCode: string): SummaryData => {
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryMap = new Map<string, number>();

  // Only consider transactions matching the specified currencyCode for summary
  const relevantTxs = txs.filter(tx => tx.currencyCode === currencyCode);

  relevantTxs.forEach(tx => {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
    }
    const currentAmount = categoryMap.get(tx.category) || 0;
    categoryMap.set(tx.category, currentAmount + tx.amount);
  });

  const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, amount]) => ({
    category,
    amount,
  }));

  return {
    totalIncome,
    totalExpense,
    netSavings: totalIncome - totalExpense,
    categoryBreakdown,
  };
};

const getPeriodTransactions = (transactions: Transaction[], period: 'daily' | 'weekly' | 'monthly'): Transaction[] => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start of week
  startOfWeek.setHours(0, 0, 0, 0); // Normalize to start of day
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0); // Normalize to start of day

  return transactions.filter(tx => {
    const txDate = new Date(tx.date);
    txDate.setHours(0, 0, 0, 0); // Normalize transaction date to start of day

    if (period === 'daily') {
      return tx.date === today;
    } else if (period === 'weekly') {
      return txDate.getTime() >= startOfWeek.getTime();
    } else if (period === 'monthly') {
      return txDate.getTime() >= startOfMonth.getTime();
    }
    return false;
  });
};


const SummaryDashboard: React.FC<SummaryDashboardProps> = ({ 
  transactions, 
  budgets, 
  selectedCurrency,
  budgetAlertPercentage,
  onBudgetAlertPercentageChange,
}) => {
  const [currentPeriod, setCurrentPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [insights, setInsights] = useState<string>('Click "Get AI Insights" to analyze your spending.');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Filter transactions for the period, and then by the selectedCurrency for the summary
  const transactionsForPeriod = getPeriodTransactions(transactions, currentPeriod);
  const summary = calculateSummary(transactionsForPeriod, selectedCurrency);

  const fetchInsights = useCallback(async () => {
    setIsLoadingInsights(true);
    setInsights(''); // Clear previous insights
    try {
      const aiInsights = await getSpendingInsights(summary, budgets, selectedCurrency);
      setInsights(aiInsights);
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
      setInsights('Failed to load insights. Please try again.');
    } finally {
      setIsLoadingInsights(false);
    }
  }, [summary, budgets, selectedCurrency]);

  const getBudgetAlerts = (currentSummary: SummaryData, currentBudgets: Budget[], currencyCode: string) => {
    const alerts: { category: string; spent: number; budget: number; percentage: number; }[] = [];
    currentBudgets.forEach(budget => {
      // Ensure budget applies to the current selected currency
      // Note: The `currentSummary` passed to `getBudgetAlerts` is already currency-filtered
      const spent = currentSummary.categoryBreakdown
        .filter(cb => cb.category === budget.category)
        .reduce((sum, cb) => sum + cb.amount, 0);
      const percentage = (spent / budget.amount) * 100;
      if (budget.amount > 0 && percentage >= budgetAlertPercentage) {
        alerts.push({ category: budget.category, spent, budget: budget.amount, percentage });
      }
    });
    return alerts;
  };

  const budgetAlerts = getBudgetAlerts(summary, budgets, selectedCurrency);

  const expensesBreakdown = summary.categoryBreakdown.filter(cb => {
    // Only show categories with actual expenses for the current period and selected currency
    const totalSpentInCategory = transactionsForPeriod
      .filter(tx => tx.category === cb.category && tx.type === 'expense' && tx.currencyCode === selectedCurrency)
      .reduce((sum, tx) => sum + tx.amount, 0);
    return totalSpentInCategory > 0;
  }).map(cb => ({ ...cb, amount: transactionsForPeriod
    .filter(tx => tx.category === cb.category && tx.type === 'expense' && tx.currencyCode === selectedCurrency)
    .reduce((sum, tx) => sum + tx.amount, 0)
  })).filter(cb => cb.amount > 0);


  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
      <div className="lg:col-span-2 bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-primary">Financial Overview</h2>
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            variant={currentPeriod === 'daily' ? 'primary' : 'secondary'}
            onClick={() => setCurrentPeriod('daily')}
          >
            Daily
          </Button>
          <Button
            variant={currentPeriod === 'weekly' ? 'primary' : 'secondary'}
            onClick={() => setCurrentPeriod('weekly')}
          >
            Weekly
          </Button>
          <Button
            variant={currentPeriod === 'monthly' ? 'primary' : 'secondary'}
            onClick={() => setCurrentPeriod('monthly')}
          >
            Monthly
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600">Total Income (in {selectedCurrency})</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(summary.totalIncome, selectedCurrency)}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600">Total Expenses (in {selectedCurrency})</p>
            <p className="text-2xl font-bold text-danger">{formatCurrency(summary.totalExpense, selectedCurrency)}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600">Net Savings (in {selectedCurrency})</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(summary.netSavings, selectedCurrency)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <ChartDisplay data={expensesBreakdown} type="pie" title={`Expense Categories (in ${selectedCurrency})`} selectedCurrency={selectedCurrency} />
          <ChartDisplay data={summary.categoryBreakdown} type="bar" title={`Spending vs. Income (in ${selectedCurrency})`} selectedCurrency={selectedCurrency} />
        </div>

        {budgetAlerts.length > 0 && (
          <div className="bg-warning/10 text-warning border border-warning p-4 rounded-lg mb-6">
            <h3 className="font-bold text-lg mb-2">Budget Alerts!</h3>
            <ul className="list-disc pl-5">
              {budgetAlerts.map((alert, index) => (
                <li key={index} className="text-sm mb-1">
                  You've spent <span className="font-semibold">{alert.percentage.toFixed(0)}%</span> of your <span className="font-semibold">{alert.category}</span> budget ({formatCurrency(alert.budget, selectedCurrency)}).
                  Current spend: {formatCurrency(alert.spent, selectedCurrency)}.
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-sm">
          <label htmlFor="budgetAlertPercentage" className="block text-sm font-medium text-gray-700 mb-2">
            Notify me when budget spent reaches: <span className="font-semibold">{budgetAlertPercentage}%</span>
          </label>
          <input
            type="range"
            id="budgetAlertPercentage"
            min="10"
            max="100"
            step="5"
            value={budgetAlertPercentage}
            onChange={(e) => onBudgetAlertPercentageChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-sm dark:bg-gray-700"
          />
        </div>
      </div>

      <div className="lg:col-span-1 bg-white shadow-lg rounded-lg p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-primary">AI Spending Insights</h2>
        <Button
          onClick={fetchInsights}
          disabled={isLoadingInsights}
          className="mb-4 px-4 py-2 rounded-lg font-semibold bg-accent text-gray-800 hover:bg-yellow-400 transition duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
        >
          {isLoadingInsights ? 'Generating Insights...' : 'Get AI Insights'}
        </Button>
        <div className="flex-grow bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-y-auto min-h-[150px]">
          {isLoadingInsights ? (
            <Spinner />
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">
              {insights}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryDashboard;