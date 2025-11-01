import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, Budget, RecurringTransaction, CategoryOverride } from './types';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import SummaryDashboard from './components/SummaryDashboard';
import BudgetManager from './components/BudgetManager';
import Button from './components/Button';
import RecurringTransactionForm from './components/RecurringTransactionForm';
import RecurringTransactionList from './components/RecurringTransactionList';
import CurrencyConverter from './components/CurrencyConverter'; // Import new component
import { CURRENCY_OPTIONS, DEFAULT_CURRENCY_CODE } from './constants';

type AppView = 'dashboard' | 'addTransaction' | 'viewTransactions' | 'manageBudgets' | 'addRecurringTransaction' | 'viewRecurringTransactions' | 'currencyConverter';

const addDays = (date: Date, days: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

const addMonths = (date: Date, months: number): Date => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

const addYears = (date: Date, years: number): Date => {
  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() + years);
  return newDate;
};

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingRecurringTransaction, setEditingRecurringTransaction] = useState<RecurringTransaction | null>(null);
  const [userCategoryOverrides, setUserCategoryOverrides] = useState<CategoryOverride[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(DEFAULT_CURRENCY_CODE);
  const [currencySearchTerm, setCurrencySearchTerm] = useState<string>('');
  const [budgetAlertPercentage, setBudgetAlertPercentage] = useState<number>(75);

  useEffect(() => {
    const storedTransactions = localStorage.getItem('smartExpenseTransactions');
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    }
    const storedRecurringTransactions = localStorage.getItem('smartExpenseRecurringTransactions');
    if (storedRecurringTransactions) {
      setRecurringTransactions(JSON.parse(storedRecurringTransactions));
    }
    const storedBudgets = localStorage.getItem('smartExpenseBudgets');
    if (storedBudgets) {
      setBudgets(JSON.parse(storedBudgets));
    }
    const storedCategoryOverrides = localStorage.getItem('smartExpenseCategoryOverrides');
    if (storedCategoryOverrides) {
      setUserCategoryOverrides(JSON.parse(storedCategoryOverrides));
    }
    const storedCurrency = localStorage.getItem('smartExpenseSelectedCurrency');
    if (storedCurrency && CURRENCY_OPTIONS.some(c => c.code === storedCurrency)) {
      setSelectedCurrency(storedCurrency);
    }
    const storedBudgetAlertPercentage = localStorage.getItem('smartExpenseBudgetAlertPercentage');
    if (storedBudgetAlertPercentage) {
      setBudgetAlertPercentage(Number(storedBudgetAlertPercentage));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('smartExpenseTransactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('smartExpenseRecurringTransactions', JSON.stringify(recurringTransactions));
  }, [recurringTransactions]);

  useEffect(() => {
    localStorage.setItem('smartExpenseBudgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('smartExpenseCategoryOverrides', JSON.stringify(userCategoryOverrides));
  }, [userCategoryOverrides]);

  useEffect(() => {
    localStorage.setItem('smartExpenseSelectedCurrency', selectedCurrency);
  }, [selectedCurrency]);

  useEffect(() => {
    localStorage.setItem('smartExpenseBudgetAlertPercentage', budgetAlertPercentage.toString());
  }, [budgetAlertPercentage]);

  const processRecurringTransactions = useCallback((currentRecurringTransactions: RecurringTransaction[], currentTransactions: Transaction[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newTransactions: Transaction[] = [];
    let anyRecurringNextOccurrenceChanged = false;

    const updatedRecurringTxs = currentRecurringTransactions.map((rt) => {
      let currentNextOccurrence = new Date(rt.nextOccurrenceDate);
      currentNextOccurrence.setHours(0, 0, 0, 0);

      if (currentNextOccurrence.getTime() <= today.getTime()) {
        anyRecurringNextOccurrenceChanged = true;

        while (currentNextOccurrence.getTime() <= today.getTime()) {
          const newTxId = `${rt.id}-${currentNextOccurrence.toISOString().split('T')[0]}`;
          if (!currentTransactions.some(tx => tx.id === newTxId)) {
            newTransactions.push({
              id: newTxId,
              description: rt.description,
              amount: rt.amount,
              type: rt.type,
              date: currentNextOccurrence.toISOString().split('T')[0],
              category: rt.category,
              notes: rt.notes,
              currencyCode: rt.currencyCode, // Include currencyCode from recurring transaction
            });
          }

          let nextDate: Date;
          switch (rt.frequency) {
            case 'daily':
              nextDate = addDays(currentNextOccurrence, 1);
              break;
            case 'weekly':
              nextDate = addDays(currentNextOccurrence, 7);
              break;
            case 'monthly':
              nextDate = addMonths(currentNextOccurrence, 1);
              break;
            case 'yearly':
              nextDate = addYears(currentNextOccurrence, 1);
              break;
            default:
              nextDate = addDays(currentNextOccurrence, 1);
          }
          currentNextOccurrence = nextDate;
        }
      }
      return { ...rt, nextOccurrenceDate: currentNextOccurrence.toISOString().split('T')[0] };
    });

    return { newTransactions, updatedRecurringTxs, anyRecurringNextOccurrenceChanged };
  }, []); // Dependencies are not needed here as arguments are passed explicitly

  useEffect(() => {
    if (recurringTransactions.length > 0) {
      const { newTransactions, updatedRecurringTxs, anyRecurringNextOccurrenceChanged } = processRecurringTransactions(recurringTransactions, transactions);

      if (newTransactions.length > 0) {
        setTransactions((prevTxs) => {
          const uniqueNewTransactions = newTransactions.filter(
            (newTx) => !prevTxs.some((prevTx) => prevTx.id === newTx.id)
          );
          return [...prevTxs, ...uniqueNewTransactions].sort((a, b) => {
            const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
            if (dateComparison !== 0) return dateComparison;
            return a.id.localeCompare(b.id);
          });
        });
      }

      if (anyRecurringNextOccurrenceChanged) {
        setRecurringTransactions(updatedRecurringTxs);
      }
    }
  }, [recurringTransactions, transactions, processRecurringTransactions]); // Add processRecurringTransactions to dependency array

  const handleSaveTransaction = useCallback((transaction: Transaction, aiSuggestedCategory?: string, overrideConfirmed?: boolean) => {
    if (editingTransaction) {
      setTransactions((prevTxs) =>
        prevTxs.map((tx) => (tx.id === transaction.id ? transaction : tx))
      );
    } else {
      setTransactions((prevTxs) => [...prevTxs, transaction]);
    }

    if (overrideConfirmed && aiSuggestedCategory && transaction.category !== aiSuggestedCategory) {
      setUserCategoryOverrides((prevOverrides) => {
        const existingIndex = prevOverrides.findIndex(
          (o) => o.description.toLowerCase() === transaction.description.toLowerCase()
        );
        if (existingIndex !== -1) {
          const newOverrides = [...prevOverrides];
          newOverrides[existingIndex] = { description: transaction.description, category: transaction.category };
          return newOverrides;
        } else {
          return [...prevOverrides, { description: transaction.description, category: transaction.category }];
        }
      });
    }

    setEditingTransaction(null);
    setCurrentView('viewTransactions');
  }, [editingTransaction, setTransactions, setUserCategoryOverrides]);

  const handleDeleteTransaction = useCallback((idOrIds: string | string[]) => {
    setTransactions((prevTxs) => {
      const idsToDelete = Array.isArray(idOrIds) ? new Set(idOrIds) : new Set([idOrIds]);
      return prevTxs.filter((tx) => !idsToDelete.has(tx.id));
    });
  }, [setTransactions]);

  const handleEditTransaction = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
    setCurrentView('addTransaction');
  }, []);

  const handleSaveBudget = useCallback((budget: Budget) => {
    setBudgets((prevBudgets) => {
      const existingBudget = prevBudgets.find((b) => b.category === budget.category);
      if (existingBudget) {
        return prevBudgets.map((b) => (b.category === budget.category ? budget : b));
      } else {
        return [...prevBudgets, budget];
      }
    });
  }, [setBudgets]);

  const handleDeleteBudget = useCallback((category: string) => {
    setBudgets((prevBudgets) => prevBudgets.filter((b) => b.category !== category));
  }, [setBudgets]);

  const handleSaveRecurringTransaction = useCallback((rt: RecurringTransaction, aiSuggestedCategory?: string, overrideConfirmed?: boolean) => {
    if (editingRecurringTransaction) {
      setRecurringTransactions((prevRts) =>
        prevRts.map((prevRt) => (prevRt.id === rt.id ? rt : prevRt))
      );
    } else {
      setRecurringTransactions((prevRts) => [...prevRts, rt]);
    }

    if (overrideConfirmed && aiSuggestedCategory && rt.category !== aiSuggestedCategory) {
      setUserCategoryOverrides((prevOverrides) => {
        const existingIndex = prevOverrides.findIndex(
          (o) => o.description.toLowerCase() === rt.description.toLowerCase()
        );
        if (existingIndex !== -1) {
          const newOverrides = [...prevOverrides];
          newOverrides[existingIndex] = { description: rt.description, category: rt.category };
          return newOverrides;
        } else {
          return [...prevOverrides, { description: rt.description, category: rt.category }];
        }
      });
    }

    setEditingRecurringTransaction(null);
    setCurrentView('viewRecurringTransactions');
  }, [editingRecurringTransaction, setRecurringTransactions, setUserCategoryOverrides]);

  const handleDeleteRecurringTransaction = useCallback((id: string) => {
    setRecurringTransactions((prevRts) => prevRts.filter((rt) => rt.id !== id));
  }, [setRecurringTransactions]);

  const handleEditRecurringTransaction = useCallback((rt: RecurringTransaction) => {
    setEditingRecurringTransaction(rt);
    setCurrentView('addRecurringTransaction');
  }, []);

  const handleCancelForm = useCallback(() => {
    setEditingTransaction(null);
    setEditingRecurringTransaction(null);
    setCurrentView('dashboard');
  }, []);

  const currentCurrency = useMemo(() => {
    return CURRENCY_OPTIONS.find(c => c.code === selectedCurrency) || CURRENCY_OPTIONS[0];
  }, [selectedCurrency]);


  const filteredCurrencyOptions = useMemo(() => {
    const lowerCaseSearchTerm = currencySearchTerm.toLowerCase();
    if (!lowerCaseSearchTerm) { // If no search term, return all options
      return CURRENCY_OPTIONS;
    }
    return CURRENCY_OPTIONS.filter(currency =>
      currency.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      currency.code.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [currencySearchTerm]);

  useEffect(() => {
    if (currencySearchTerm && selectedCurrency && !filteredCurrencyOptions.some(c => c.code === selectedCurrency)) {
      if (filteredCurrencyOptions.length > 0) {
        setSelectedCurrency(filteredCurrencyOptions[0].code);
      } else { // This block handles filteredCurrencyOptions.length === 0
        setSelectedCurrency(DEFAULT_CURRENCY_CODE);
        setCurrencySearchTerm('');
      }
    } else if (!currencySearchTerm && selectedCurrency === '') {
      setSelectedCurrency(DEFAULT_CURRENCY_CODE);
    }
  }, [selectedCurrency, filteredCurrencyOptions, currencySearchTerm]);


  return (
    <div className="min-h-screen bg-background text-text">
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center">
          <h1 className="text-3xl font-bold mb-2 md:mb-0">Smart Expense</h1>
          <nav className="flex flex-wrap gap-2 md:gap-4 items-center">
            <Button variant="secondary" onClick={() => setCurrentView('dashboard')}>Dashboard</Button>
            <Button variant="secondary" onClick={() => setCurrentView('addTransaction')}>Add Transaction</Button>
            <Button variant="secondary" onClick={() => setCurrentView('viewTransactions')}>View Transactions</Button>
            <Button variant="secondary" onClick={() => setCurrentView('manageBudgets')}>Manage Budgets</Button>
            <Button variant="secondary" onClick={() => setCurrentView('viewRecurringTransactions')}>Recurring Transactions</Button>
            <Button variant="secondary" onClick={() => setCurrentView('currencyConverter')}>Currency Converter</Button> {/* New Button */}

            <div className="relative inline-block text-left">
              <input
                type="text"
                placeholder="Search currency..."
                value={currencySearchTerm}
                onChange={(e) => setCurrencySearchTerm(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900"
                aria-label="Search currency"
              />
              <select
                id="currency-select"
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md text-gray-900"
                aria-label="Select currency"
              >
                {filteredCurrencyOptions.length > 0 ? (
                  filteredCurrencyOptions.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.name} ({currency.symbol})
                    </option>
                  ))
                ) : (
                  <option value="">No matching currencies</option>
                )}
              </select>
            </div>
          </nav>
        </div>
      </header>

      <main className="p-4 md:p-6">
        {currentView === 'dashboard' && (
          <SummaryDashboard 
            transactions={transactions} 
            budgets={budgets} 
            selectedCurrency={selectedCurrency}
            budgetAlertPercentage={budgetAlertPercentage}
            onBudgetAlertPercentageChange={setBudgetAlertPercentage}
          />
        )}
        {currentView === 'addTransaction' && (
          <TransactionForm
            onSave={handleSaveTransaction}
            onCancel={handleCancelForm}
            initialData={editingTransaction}
            userCategoryOverrides={userCategoryOverrides}
            selectedCurrency={selectedCurrency}
          />
        )}
        {currentView === 'viewTransactions' && (
          <TransactionList
            transactions={transactions}
            onDelete={handleDeleteTransaction}
            onEdit={handleEditTransaction}
            selectedCurrency={selectedCurrency}
          />
        )}
        {currentView === 'manageBudgets' && (
          <BudgetManager
            budgets={budgets}
            onSaveBudget={handleSaveBudget}
            onDeleteBudget={handleDeleteBudget}
            onCancel={handleCancelForm}
            selectedCurrency={selectedCurrency}
          />
        )}
        {currentView === 'viewRecurringTransactions' && (
          <RecurringTransactionList
            recurringTransactions={recurringTransactions}
            onEdit={handleEditRecurringTransaction}
            onDelete={handleDeleteRecurringTransaction}
            onAddNew={() => setCurrentView('addRecurringTransaction')}
            selectedCurrency={selectedCurrency}
          />
        )}
        {currentView === 'addRecurringTransaction' && (
          <RecurringTransactionForm
            onSave={handleSaveRecurringTransaction}
            onCancel={handleCancelForm}
            initialData={editingRecurringTransaction}
            userCategoryOverrides={userCategoryOverrides}
            selectedCurrency={selectedCurrency}
          />
        )}
        {currentView === 'currencyConverter' && ( // New: Render CurrencyConverter
          <CurrencyConverter
            onCancel={handleCancelForm}
            selectedCurrency={selectedCurrency}
          />
        )}
      </main>
    </div>
  );
};

export default App;