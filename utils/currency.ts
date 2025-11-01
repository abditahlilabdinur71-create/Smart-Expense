import { CURRENCY_OPTIONS } from '../constants';

export const formatCurrency = (amount: number, currencyCode: string): string => {
  return new Intl.NumberFormat(navigator.language, {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};

export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = CURRENCY_OPTIONS.find(c => c.code === currencyCode);
  if (currency) {
    return currency.symbol;
  }
  // Fallback if symbol is not found in options or if Intl.NumberFormat does not return it for all locales
  try {
    const formatter = new Intl.NumberFormat(navigator.language, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    // Extract symbol by formatting 0 and removing numbers/spaces
    return formatter.format(0).replace(/0|\s/g, '');
  } catch (e) {
    console.warn(`Could not get symbol for currency code: ${currencyCode}`);
    return currencyCode; // Fallback to code if symbol cannot be determined
  }
};