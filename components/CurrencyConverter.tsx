import React, { useState, useEffect, useCallback } from 'react';
import Button from './Button';
import { CURRENCY_OPTIONS, hardcodedExchangeRates, DEFAULT_CURRENCY_CODE } from '../constants';
import { formatCurrency } from '../utils/currency';
import Spinner from './Spinner';

interface CurrencyConverterProps {
  onCancel: () => void;
  selectedCurrency: string; // Global selected currency to set defaults
}

const CurrencyConverter: React.FC<CurrencyConverterProps> = ({ onCancel, selectedCurrency }) => {
  const [fromAmount, setFromAmount] = useState<number | ''>('');
  const [fromCurrency, setFromCurrency] = useState<string>(selectedCurrency || DEFAULT_CURRENCY_CODE);
  const [toCurrency, setToCurrency] = useState<string>(
    CURRENCY_OPTIONS.find(c => c.code !== selectedCurrency)?.code || DEFAULT_CURRENCY_CODE
  );
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Set default currencies based on selectedCurrency, ensuring from and to are different
  useEffect(() => {
    setFromCurrency(selectedCurrency);
    if (toCurrency === selectedCurrency) {
      const otherCurrency = CURRENCY_OPTIONS.find(c => c.code !== selectedCurrency);
      setToCurrency(otherCurrency ? otherCurrency.code : DEFAULT_CURRENCY_CODE);
    }
  }, [selectedCurrency]);

  const handleConvert = useCallback(() => {
    setError(null);
    setConvertedAmount(null);
    if (fromAmount === '' || isNaN(Number(fromAmount)) || Number(fromAmount) <= 0) {
      setError('Please enter a positive amount to convert.');
      return;
    }
    if (fromCurrency === toCurrency) {
      setConvertedAmount(Number(fromAmount));
      return;
    }

    const amountValue = Number(fromAmount);

    const fromRate = hardcodedExchangeRates[fromCurrency];
    const toRate = hardcodedExchangeRates[toCurrency];

    if (fromRate === undefined || toRate === undefined) {
      setError(
        `Conversion rate not available for ${fromCurrency} or ${toCurrency}. Using hardcoded rates.`
      );
      return;
    }

    setIsLoading(true);
    // Simulate network delay for better UX (if this were a real API call)
    setTimeout(() => {
      try {
        // Assume all hardcoded rates are relative to a single base currency (e.g., USD)
        // Converted amount = (amount / fromCurrencyRate_to_Base) * toCurrencyRate_to_Base
        const converted = (amountValue / fromRate) * toRate;
        setConvertedAmount(converted);
      } catch (err) {
        setError('An unexpected error occurred during conversion.');
        console.error('Conversion error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 500); // Simulate API call
  }, [fromAmount, fromCurrency, toCurrency]);

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-lg mx-auto md:max-w-xl lg:max-w-2xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Currency Converter</h2>
      {error && (
        <div className="bg-danger/10 text-danger border border-danger p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label htmlFor="fromAmount" className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            id="fromAmount"
            value={fromAmount}
            onChange={(e) => {
              setFromAmount(e.target.value === '' ? '' : Number(e.target.value));
              setConvertedAmount(null);
              setError(null);
            }}
            min="0.01"
            step="0.01"
            placeholder="0.00"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
            required
          />
        </div>

        <div>
          <label htmlFor="fromCurrency" className="block text-sm font-medium text-gray-700">From Currency</label>
          <select
            id="fromCurrency"
            value={fromCurrency}
            onChange={(e) => {
              setFromCurrency(e.target.value);
              setConvertedAmount(null);
              setError(null);
            }}
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
          <label htmlFor="toCurrency" className="block text-sm font-medium text-gray-700">To Currency</label>
          <select
            id="toCurrency"
            value={toCurrency}
            onChange={(e) => {
              setToCurrency(e.target.value);
              setConvertedAmount(null);
              setError(null);
            }}
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

        <Button
          onClick={handleConvert}
          disabled={isLoading || fromAmount === '' || Number(fromAmount) <= 0}
          variant="primary"
          className="w-full mt-4"
        >
          {isLoading ? <Spinner /> : 'Convert'}
        </Button>

        {convertedAmount !== null && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md text-center">
            <p className="text-lg text-blue-800">
              {formatCurrency(Number(fromAmount), fromCurrency)} is approximately{' '}
              <span className="font-bold">{formatCurrency(convertedAmount, toCurrency)}</span>
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Note: Conversion rates are hardcoded and may not reflect real-time market rates.
            </p>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Close Converter
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;