import React from 'react';
import { RecurringTransaction, TransactionType } from '../types';
import Button from './Button';
import { formatCurrency } from '../utils/currency';

interface RecurringTransactionListProps {
  recurringTransactions: RecurringTransaction[];
  onEdit: (recurringTransaction: RecurringTransaction) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  selectedCurrency: string; // Global selected currency (not used for display here, but for consistency if needed elsewhere)
}

const RecurringTransactionList: React.FC<RecurringTransactionListProps> = ({ 
  recurringTransactions, 
  onEdit, 
  onDelete, 
  onAddNew,
  selectedCurrency, // Keep for prop consistency but not used for display directly
}) => {
  const getTransactionColorClass = (type: TransactionType) => {
    return type === 'income' ? 'text-success' : 'text-danger';
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Recurring Transactions</h2>

      <div className="flex justify-end mb-6">
        <Button variant="primary" onClick={onAddNew}>
          Add New Recurring
        </Button>
      </div>

      {recurringTransactions.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No recurring transactions set up yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Occurrence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recurringTransactions.map((rt) => (
                <tr key={rt.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rt.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rt.category}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${getTransactionColorClass(rt.type)}`}>
                    {rt.type === 'expense' ? '-' : ''}{formatCurrency(rt.amount, rt.currencyCode)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rt.currencyCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{rt.frequency}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rt.startDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rt.nextOccurrenceDate}</td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs">{rt.notes || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onEdit(rt)}
                      className="text-primary hover:text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full p-1 mr-1"
                      title="Edit recurring transaction"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(rt.id)}
                      className="text-danger hover:text-red-700 ml-1 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-full p-1"
                      title="Delete recurring transaction"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecurringTransactionList;