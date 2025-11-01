import React, { useState } from 'react';
import { Budget } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';
import Button from './Button';
import { formatCurrency } from '../utils/currency';

interface BudgetManagerProps {
  budgets: Budget[];
  onSaveBudget: (budget: Budget) => void;
  onDeleteBudget: (category: string) => void;
  onCancel: () => void;
  selectedCurrency: string;
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ budgets, onSaveBudget, onDeleteBudget, onCancel, selectedCurrency }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [amount, setAmount] = useState<number | ''>('');
  const [editingBudget, setEditingBudget] = useState<string | null>(null); // Category being edited
  const [error, setError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || amount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    const newBudget: Budget = {
      category: selectedCategory,
      amount: Number(amount),
    };
    onSaveBudget(newBudget);
    // Reset form
    setSelectedCategory(DEFAULT_CATEGORIES[0]);
    setAmount('');
    setEditingBudget(null);
    setError(null);
  };

  const startEdit = (budget: Budget) => {
    setEditingBudget(budget.category);
    setSelectedCategory(budget.category);
    setAmount(budget.amount);
  };

  const availableCategories = DEFAULT_CATEGORIES.filter(
    cat => !budgets.some(b => b.category === cat) || cat === editingBudget
  );

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-lg mx-auto md:max-w-xl lg:max-w-2xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Manage Budgets</h2>
      {error && (
        <div className="bg-danger/10 text-danger border border-danger p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 mb-8">
        <h3 className="text-xl font-semibold text-gray-700">{editingBudget ? `Edit Budget for ${editingBudget}` : 'Add New Budget'}</h3>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setError(null); }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
            disabled={!!editingBudget} // Disable category selection when editing
          >
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Budget Amount ({selectedCurrency})</label>
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
        <div className="flex justify-end space-x-3">
          <Button type="submit" variant="primary">
            {editingBudget ? 'Update Budget' : 'Set Budget'}
          </Button>
          {editingBudget && (
            <Button type="button" variant="secondary" onClick={() => {
              setEditingBudget(null);
              setSelectedCategory(availableCategories[0] || DEFAULT_CATEGORIES[0]);
              setAmount('');
              setError(null);
            }}>
              Cancel Edit
            </Button>
          )}
        </div>
      </form>

      <h3 className="text-xl font-semibold text-gray-700 mb-4">Current Budgets</h3>
      {budgets.length === 0 ? (
        <p className="text-gray-500">No budgets set yet.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {budgets.map((budget) => (
            <li key={budget.category} className="py-3 flex items-center justify-between">
              <span className="font-medium text-gray-900">{budget.category}:</span>
              <div className="flex items-center space-x-3">
                <span className="text-gray-700">{formatCurrency(budget.amount, selectedCurrency)}</span>
                <Button variant="secondary" size="sm" onClick={() => startEdit(budget)}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => onDeleteBudget(budget.category)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-end mt-6">
        <Button variant="secondary" onClick={onCancel}>
          Close
        </Button>
      </div>
    </div>
  );
};

export default BudgetManager;