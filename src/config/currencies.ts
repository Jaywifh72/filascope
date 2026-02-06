import { CurrencyCode, CurrencyConfig } from '@/types/regional';

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimalPlaces: 2,
    symbolPosition: 'before',
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    decimalPlaces: 2,
    symbolPosition: 'before',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimalPlaces: 2,
    symbolPosition: 'before',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimalPlaces: 2,
    symbolPosition: 'before',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    decimalPlaces: 2,
    symbolPosition: 'before',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    decimalPlaces: 0,
    symbolPosition: 'before',
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    decimalPlaces: 2,
    symbolPosition: 'before',
  },
  CHF: {
    code: 'CHF',
    symbol: 'Fr',
    name: 'Swiss Franc',
    decimalPlaces: 2,
    symbolPosition: 'before',
  },
  SEK: {
    code: 'SEK',
    symbol: 'kr',
    name: 'Swedish Krona',
    decimalPlaces: 2,
    symbolPosition: 'after',
  },
  KRW: {
    code: 'KRW',
    symbol: '₩',
    name: 'South Korean Won',
    decimalPlaces: 0,
    symbolPosition: 'before',
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    decimalPlaces: 2,
    symbolPosition: 'before',
  },
  PLN: {
    code: 'PLN',
    symbol: 'zł',
    name: 'Polish Zloty',
    decimalPlaces: 2,
    symbolPosition: 'after',
  },
  MXN: {
    code: 'MXN',
    symbol: 'MX$',
    name: 'Mexican Peso',
    decimalPlaces: 2,
    symbolPosition: 'before',
  },
  CZK: {
    code: 'CZK',
    symbol: 'Kč',
    name: 'Czech Koruna',
    decimalPlaces: 2,
    symbolPosition: 'after',
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Brazilian Real',
    decimalPlaces: 2,
    symbolPosition: 'before',
  },
  NZD: {
    code: 'NZD',
    symbol: 'NZ$',
    name: 'New Zealand Dollar',
    decimalPlaces: 2,
    symbolPosition: 'before',
  },
};

export const CURRENCY_LIST = Object.values(CURRENCIES);

export function formatPrice(
  amount: number,
  currencyCode: CurrencyCode,
  options?: { showApproximate?: boolean; compact?: boolean }
): string {
  const config = CURRENCIES[currencyCode];
  if (!config) return `${amount}`;

  const rounded = Number(amount.toFixed(config.decimalPlaces));
  
  let formatted: string;
  if (options?.compact && rounded >= 1000) {
    formatted = (rounded / 1000).toFixed(1) + 'k';
  } else {
    formatted = rounded.toLocaleString('en-US', {
      minimumFractionDigits: config.decimalPlaces,
      maximumFractionDigits: config.decimalPlaces,
    });
  }

  const prefix = options?.showApproximate ? '~' : '';
  
  if (config.symbolPosition === 'before') {
    return `${prefix}${config.symbol}${formatted}`;
  } else {
    return `${prefix}${formatted} ${config.symbol}`;
  }
}

export function getCurrencyByCode(code: string): CurrencyConfig | undefined {
  return CURRENCIES[code as CurrencyCode];
}
