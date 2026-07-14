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

  // Always use en-US locale for consistent comma separators on all platforms
  // (en-NG is unreliable on Android WebView and some mobile environments)
  const locale = config.locale || 'en-US';
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

  let formatted = new Intl.NumberFormat(locale, formatConfig).format(safeAmount);

  // Normalize NGN symbol: replace "NGN", "NGN\u00a0", or "NGN " prefix with ₦
  if (currency === 'NGN') {
    formatted = formatted.replace(/^NGN[\s\u00a0]*/i, '₦').replace(/[\s\u00a0]*NGN$/i, '₦');
  }

  return formatted;
};

export const parseCurrency = (currencyString) => {
  if (!currencyString) return 0;
  return parseFloat(currencyString.replace(/[^0-9.-]+/g, ''));
};

export default formatCurrency;
