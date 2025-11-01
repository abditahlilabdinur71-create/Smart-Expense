import React, { useState, useEffect, useCallback } from 'react';
import { Transaction, TransactionType, CategoryOverride } from '../types';
import { DEFAULT_CATEGORIES, CURRENCY_OPTIONS } from '../constants';
import { categorizeTransaction } from '../services/geminiService';
import Button from './Button';
import Spinner from './Spinner';

interface TransactionFormProps {
  onSave: (transaction: Transaction, aiSuggestedCategory?: string, overrideConfirmed?: boolean) => void;
  onCancel: () => void;
  initialData?: Transaction; // For editing existing transactions
  userCategoryOverrides: CategoryOverride[];
  selectedCurrency: string; // Global selected currency (used as default)
}

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onSave, 
  onCancel, 
  initialData, 
  userCategoryOverrides,
  selectedCurrency, // Global selected currency (used as default)
}) => {
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState<number | ''>(initialData?.amount || '');
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(initialData?.category || 'Others');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [currencyCode, setCurrencyCode] = useState(initialData?.currencyCode || selectedCurrency); // New: Currency code for this transaction
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSuggestedCategory, setAiSuggestedCategory] = useState<string | undefined>(undefined);

  const [showCategoryFeedbackPrompt, setShowCategoryFeedbackPrompt] = useState(false);
  const [isCategoryOverrideConfirmed, setIsCategoryOverrideConfirmed] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setAmount(initialData.amount);
      setType(initialData.type);
      setDate(initialData.date);
      setCategory(initialData.category);
      setNotes(initialData.notes || '');
      setCurrencyCode(initialData.currencyCode); // Set currency code from initial data
      setAiSuggestedCategory(initialData.category); 
      setShowCategoryFeedbackPrompt(false);
      setIsCategoryOverrideConfirmed(false);
    } else {
      setDescription('');
      setAmount('');
      setType('expense');
      setDate(new Date().toISOString().split('T')[0]);
      setCategory('Others');
      setNotes('');
      setCurrencyCode(selectedCurrency); // Default to global selected currency for new transactions
      setAiSuggestedCategory(undefined);
      setShowCategoryFeedbackPrompt(false);
      setIsCategoryOverrideConfirmed(false);
    }
  }, [initialData, selectedCurrency]); // Add selectedCurrency to dependency array

  const handleDescriptionChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    setError(null);
    setIsCategoryOverrideConfirmed(false);

    if (!initialData && newDescription.trim().length > 3) {
      const override = userCategoryOverrides.find(
        (o) => o.description.toLowerCase() === newDescription.toLowerCase()
      );

      if (override) {
        setCategory(override.category);
        setAiSuggestedCategory(override.category);
      } else {
        setIsLoadingCategory(true);
        try {
          const aiCat = await categorizeTransaction(newDescription);
          setCategory(aiCat);
          setAiSuggestedCategory(aiCat);
        } catch (err) {
          console.error('Failed to get AI category:', err);
          setCategory('Others');
          setAiSuggestedCategory('Others');
        } finally {
          setIsLoadingCategory(false);
        }
      }
    } else if (!initialData && newDescription.trim().length <= 3) {
      setCategory('Others');
      setAiSuggestedCategory(undefined);
    }
  };

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    setIsCategoryOverrideConfirmed(false);
  }, []);

  useEffect(() => {
    if (!isCategoryOverrideConfirmed && aiSuggestedCategory && category !== aiSuggestedCategory && category !== 'Others') {
      setShowCategoryFeedbackPrompt(true);
    } else {
      setShowCategoryFeedbackPrompt(false);
    }
  }, [category, aiSuggestedCategory, isCategoryOverrideConfirmed]);

  const handleConfirmOverride = useCallback((confirm: boolean) => {
    setIsCategoryOverrideConfirmed(confirm);
    setShowCategoryFeedbackPrompt(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    if (amount === '' || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Amount must be a positive number.');
      return;
    }
    if (!date) {
      setError('Date is required.');
      return;
    }

    const transactionToSave: Transaction = {
      id: initialData?.id || Date.now().toString(),
      description: description.trim(),
      amount: Number(amount),
      type,
      date,
      category,
      notes: notes.trim() === '' ? undefined : notes.trim(),
      currencyCode, // Include currencyCode
    };
    
    const shouldRecordOverride = aiSuggestedCategory && category !== aiSuggestedCategory ? isCategoryOverrideConfirmed : undefined;

    onSave(transactionToSave, aiSuggestedCategory, shouldRecordOverride);
    
    if (!initialData) {
      setDescription('');
      setAmount('');
      setType('expense');
      setDate(new Date().toISOString().split('T')[0]);
      setCategory('Others');
      setNotes('');
      setCurrencyCode(selectedCurrency); // Reset currency to global default for new transaction
      setAiSuggestedCategory(undefined);
      setShowCategoryFeedbackPrompt(false);
      setIsCategoryOverrideConfirmed(false);
    }
    setError(null);
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-lg mx-auto md:max-w-xl lg:max-w-2xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">
        {initialData ? 'Edit Transaction' : 'Add New Transaction'}
      </h2>
      {error && (
        <div className="bg-danger/10 text-danger border border-danger p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="e.g., Coffee, Monthly Rent, Salary"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
            required
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => { setAmount(e.target.value === '' ? '' : Number(e.target.value)); setError(null); }}
            min="0.01"
            step="0.01"
            placeholder="0.00"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
            required
          />
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700">Currency</label>
          <select
            id="currency"
            value={currencyCode}
            onChange={(e) => setCurrencyCode(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
            required
          >
            {CURRENCY_OPTIONS.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.name} ({currency.symbol})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <div className="mt-1 flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="type"
                value="expense"
                checked={type === 'expense'}
                onChange={() => setType('expense')}
                className="form-radio text-danger focus:ring-danger"
              />
              <span className="ml-2 text-gray-800">Expense</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="type"
                value="income"
                checked={type === 'income'}
                onChange={() => setType('income')}
                className="form-radio text-success focus:ring-success"
              />
              <span className="ml-2 text-gray-800">Income</span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
            required
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
          <div className="flex items-center mt-1">
            <select
              id="category"
              value={category}
              onChange={handleCategoryChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
              disabled={isLoadingCategory}
            >
              {DEFAULT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {isLoadingCategory && (
              <div className="ml-2">
                <Spinner />
              </div>
            )}
          </div>
          {showCategoryFeedbackPrompt && (
            <div className="mt-2 p-2 text-sm bg-blue-50 border border-blue-200 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center animate-fade-in">
              <p className="text-blue-800 mb-2 sm:mb-0">
                AI suggested <span className="font-semibold text-blue-900">'{aiSuggestedCategory}'</span>. Remember your choice
                <span className="font-semibold text-blue-900"> '{category}' </span> for similar transactions?
              </p>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="primary" onClick={() => handleConfirmOverride(true)}>
                  Yes
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => handleConfirmOverride(false)}>
                  No
                </Button>
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add any extra details here..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
          ></textarea>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {initialData ? 'Update Transaction' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;