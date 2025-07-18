import { useSettings } from '@/context/SettingsContext';

export const useCurrency = () => {
  const { getSetting } = useSettings();
  
  // Get currency symbol from settings, fallback to USD
  const currencySymbol = getSetting('currency_symbol', '$');
  
  // Get currency code from settings, fallback to USD
  // We need to map common symbols to currency codes for formatCurrency function
  const getCurrencyCode = (): string => {
    const symbol = currencySymbol;
    
    // Map symbols to currency codes
    const symbolToCurrencyMap: Record<string, string> = {
      '$': 'USD',
      '€': 'EUR', 
      '£': 'GBP',
      '¥': 'JPY',
      '₹': 'INR',
      'ر.س': 'SAR',
      'د.إ': 'AED',
      'ريال': 'SAR',
      'درهم': 'AED',
    };
    
    // If it's already a currency code (3 letters), return it
    if (symbol && symbol.length === 3 && /^[A-Z]+$/.test(symbol)) {
      return symbol;
    }
    
    // Otherwise, map symbol to currency code
    return symbolToCurrencyMap[symbol || '$'] || 'USD';
  };
  
  const currencyCode = getCurrencyCode();
  
  return {
    currencySymbol,
    currencyCode,
  };
}; 