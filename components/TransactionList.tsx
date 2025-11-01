import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import Button from './Button';
import { formatCurrency } from '../utils/currency';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { CURRENCY_OPTIONS } from '../constants';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (idOrIds: string | string[]) => void; // Updated to accept string or string[]
  onEdit: (transaction: Transaction) => void;
  selectedCurrency: string; // Global selected currency (for default filter value)
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, onEdit, selectedCurrency }) => {
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('ALL'); // 'ALL' for no currency filter
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = filterType === 'all' ? true : t.type === filterType;
      const matchesCurrency = filterCurrency === 'ALL' ? true : t.currencyCode === filterCurrency;
      
      let matchesDate = true;
      const transactionDate = new Date(t.date).getTime();

      if (startDate) {
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        if (transactionDate < start) {
          matchesDate = false;
        }
      }
      if (endDate) {
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        if (transactionDate > end) {
          matchesDate = false;
        }
      }

      return matchesType && matchesDate && matchesCurrency;
    });
  }, [transactions, filterType, filterCurrency, startDate, endDate]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      // If dates are the same, sort by ID to maintain a consistent order
      if (dateA === dateB) {
        return a.id.localeCompare(b.id);
      }
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [filteredTransactions, sortOrder]);

  // Effect to manage selectedTransactionIds when filtered/sorted transactions change
  useEffect(() => {
    setSelectedTransactionIds(prev => {
      const newSet = new Set(Array.from(prev).filter(id =>
        sortedTransactions.some(t => t.id === id)
      ));
      return newSet;
    });
  }, [sortedTransactions]);

  const handleSelectTransaction = (id: string, isChecked: boolean) => {
    setSelectedTransactionIds(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAllTransactions = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedTransactionIds(new Set(sortedTransactions.map(t => t.id)));
    } else {
      setSelectedTransactionIds(new Set());
    }
  };

  const isAllSelected = sortedTransactions.length > 0 && selectedTransactionIds.size === sortedTransactions.length;
  const isIndeterminate = selectedTransactionIds.size > 0 && selectedTransactionIds.size < sortedTransactions.length;

  const getTransactionColorClass = (type: TransactionType) => {
    return type === 'income' ? 'text-success' : 'text-danger';
  };

  const handleBulkDelete = () => {
    if (selectedTransactionIds.size === 0) {
      alert('No transactions selected for deletion.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${selectedTransactionIds.size} selected transactions?`)) {
      onDelete(Array.from(selectedTransactionIds));
      setSelectedTransactionIds(new Set()); // Clear selection after deletion
    }
  };

  const exportToCsv = () => {
    const transactionsToExport = selectedTransactionIds.size > 0
      ? sortedTransactions.filter(t => selectedTransactionIds.has(t.id))
      : sortedTransactions;

    if (transactionsToExport.length === 0) {
      alert('No transactions to export.');
      return;
    }

    const headers = ['ID', 'Date', 'Description', 'Category', 'Type', 'Amount', 'Currency', 'Notes'];
    const csvRows = transactionsToExport.map(t => [
      t.id,
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.category.replace(/"/g, '""')}"`,
      t.type,
      t.type === 'expense' ? `-${t.amount.toFixed(2)}` : `${t.amount.toFixed(2)}`,
      t.currencyCode,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'transactions.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    setSelectedTransactionIds(new Set()); // Clear selection after export
  };

  const exportToPdf = () => {
    const transactionsToExport = selectedTransactionIds.size > 0
      ? sortedTransactions.filter(t => selectedTransactionIds.has(t.id))
      : sortedTransactions;

    if (transactionsToExport.length === 0) {
      alert('No transactions to export.');
      return;
    }

    const doc = new jsPDF();
    const headers = [['ID', 'Date', 'Description', 'Category', 'Type', 'Amount', 'Currency', 'Notes']];
    const data = transactionsToExport.map(t => [
      t.id,
      t.date,
      t.description,
      t.category,
      t.type,
      t.type === 'expense' ? `-${formatCurrency(t.amount, t.currencyCode)}` : formatCurrency(t.amount, t.currencyCode),
      t.currencyCode,
      t.notes || '',
    ]);

    (doc as any).autoTable({
      head: headers,
      body: data,
      startY: 20,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 12 }, // ID (shortened for better fit)
        1: { cellWidth: 18 }, // Date
        2: { cellWidth: 35 }, // Description (shortened)
        3: { cellWidth: 20 }, // Category (shortened)
        4: { cellWidth: 15 }, // Type
        5: { cellWidth: 25 }, // Amount
        6: { cellWidth: 15 }, // Currency
        7: { cellWidth: 'auto' }, // Notes
      }
    });

    doc.save('transactions.pdf');
    setSelectedTransactionIds(new Set()); // Clear selection after export
  };


  return (
    <div className="bg-white shadow-lg rounded-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Transaction History</h2>

      <div className="flex flex-wrap gap-3 mb-6 justify-center">
        <Button
          variant={filterType === 'all' ? 'primary' : 'secondary'}
          onClick={() => setFilterType('all')}
        >
          All Types
        </Button>
        <Button
          variant={filterType === 'income' ? 'primary' : 'secondary'}
          onClick={() => setFilterType('income')}
        >
          Income
        </Button>
        <Button
          variant={filterType === 'expense' ? 'primary' : 'secondary'}
          onClick={() => setFilterType('expense')}
        >
          Expenses
        </Button>
        <Button
          variant="secondary"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          Date ({sortOrder === 'asc' ? 'Oldest first' : 'Newest first'})
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 items-center justify-center">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
          />
        </div>
        <div>
          <label htmlFor="filterCurrency" className="block text-sm font-medium text-gray-700">Filter by Currency</label>
          <select
            id="filterCurrency"
            value={filterCurrency}
            onChange={(e) => setFilterCurrency(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
          >
            <option value="ALL">All Currencies</option>
            {CURRENCY_OPTIONS.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.name} ({currency.symbol})
              </option>
            ))}
          </select>
        </div>
        {(startDate || endDate || filterCurrency !== 'ALL' || selectedTransactionIds.size > 0) && (
          <Button variant="secondary" size="sm" onClick={() => { 
            setStartDate(''); 
            setEndDate(''); 
            setFilterCurrency('ALL'); 
            setSelectedTransactionIds(new Set()); // Also clear selection on clear filters
          }}>
            Clear Filters
          </Button>
        )}
        <Button
          variant="danger"
          onClick={handleBulkDelete}
          size="sm"
          disabled={selectedTransactionIds.size === 0}
        >
          Delete Selected ({selectedTransactionIds.size})
        </Button>
        <Button
          variant="secondary"
          onClick={exportToCsv}
          size="sm"
          disabled={selectedTransactionIds.size === 0 && sortedTransactions.length === 0}
        >
          Export {selectedTransactionIds.size > 0 ? 'Selected' : ''} to CSV
        </Button>
        <Button
          variant="secondary"
          onClick={exportToPdf}
          size="sm"
          disabled={selectedTransactionIds.size === 0 && sortedTransactions.length === 0}
        >
          Export {selectedTransactionIds.size > 0 ? 'Selected' : ''} to PDF
        </Button>
      </div>

      {sortedTransactions.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No transactions to display.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="p-4">
                  <input
                    type="checkbox"
                    className="rounded text-primary focus:ring-primary"
                    onChange={(e) => handleSelectAllTransactions(e.target.checked)}
                    checked={isAllSelected}
                    // @ts-ignore
                    indeterminate={isIndeterminate}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTransactions.map((transaction) => (
                <tr key={transaction.id} className={selectedTransactionIds.has(transaction.id) ? 'bg-blue-50' : ''}>
                  <td className="p-4">
                    <input
                      type="checkbox"
                      className="rounded text-primary focus:ring-primary"
                      checked={selectedTransactionIds.has(transaction.id)}
                      onChange={(e) => handleSelectTransaction(transaction.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.id.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.category}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${getTransactionColorClass(transaction.type)}`}>
                    {transaction.type === 'expense' ? '-' : ''}{formatCurrency(transaction.amount, transaction.currencyCode)}
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs">{transaction.notes || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onEdit(transaction)}
                      className="text-primary hover:text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full p-1 mr-1"
                      title="Edit transaction"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(transaction.id)}
                      className="text-danger hover:text-red-700 ml-1 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-full p-1"
                      title="Delete transaction"
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

export default TransactionList;