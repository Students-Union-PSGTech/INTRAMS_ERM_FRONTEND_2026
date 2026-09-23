export const getEffectiveTeamSize = (value, fallback = 1) => {
  if (value === '' || value === null || value === undefined) return fallback;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
};

export const sanitizeTeamSizeInput = (rawValue, fallback = 1) => {
  if (rawValue === '' || rawValue === null || rawValue === undefined) return '';
  const parsed = Number.parseInt(String(rawValue), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, parsed);
};

export const calculateItemTotal = (item = {}) => {
  const quantity = Number(item.quantity) || 0;
  const unitPrice = Number(item.price_per_unit) || 0;
  return quantity * unitPrice;
};

export const calculateGrandTotal = (items = []) =>
  items.reduce((total, item) => total + calculateItemTotal(item) * 1.18, 0);
