// Currency formatting utility

export const formatCurrency = (amount, currencyOrOptions = 'NGN', options = {}) => {
  const numericAmount = Number(amount);
  const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;

  if (safeAmount === 0 && (amount === null || amount === undefined || amount === '')) {
    return '₦0';
  }

  let currency = currencyOrOptions;
  let config = { ...options };

  if (typeof currencyOrOptions === 'object' && currencyOrOptions !== null) {
    config = { ...currencyOrOptions };
    currency = currencyOrOptions.currency || 'NGN';
    delete config.currency;
  }

  if (typeof currency !== 'string' || !currency) {
    currency = 'NGN';
  }

  const locale = config.locale || (currency === 'NGN' ? 'en-NG' : 'en-US');
  delete config.locale;

  const formatConfig = {
    style: 'currency',
    currency,
    ...config,
  };

  if (formatConfig.minimumFractionDigits === undefined) {
    formatConfig.minimumFractionDigits = Number.isInteger(safeAmount) ? 0 : 2;
  }

  if (formatConfig.maximumFractionDigits === undefined) {
    formatConfig.maximumFractionDigits = Number.isInteger(safeAmount) ? 0 : 2;
  }

  return new Intl.NumberFormat(locale, formatConfig).format(safeAmount);
};

export const parseCurrency = (currencyString) => {
  if (!currencyString) return 0;
  return parseFloat(currencyString.replace(/[^0-9.-]+/g, ''));
};

export default formatCurrency;
