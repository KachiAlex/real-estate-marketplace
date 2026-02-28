const formatterCache = new Map();

const getFormatter = ({ locale = 'en-NG', currency = 'NGN', minimumFractionDigits = 0, maximumFractionDigits = 0 }) => {
  const key = `${locale}|${currency}|${minimumFractionDigits}|${maximumFractionDigits}`;
  if (!formatterCache.has(key)) {
    formatterCache.set(key, new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits
    }));
  }
  return formatterCache.get(key);
};

export const formatCurrency = (amount, options = {}) => {
  const value = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  const formatter = getFormatter(options);
  const formatted = formatter.format(value);
  return formatted.replace(/\s/g, '\u00A0');
};

export default formatCurrency;
