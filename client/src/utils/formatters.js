// ── Formatting helpers ──

/**
 * Format a number as Indian currency: ₹1,00,000
 */
export function formatCurrency(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date string as "15 Jan 2024"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Capitalize the first letter of each word
 */
export function titleCase(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

/**
 * Truncate text to a given length with ellipsis
 */
export function truncate(text, maxLength = 120) {
  if (!text) return '';
  return text.length <= maxLength ? text : text.slice(0, maxLength).trim() + '…';
}

/**
 * Map eligibility status to display config
 */
export const STATUS_CONFIG = {
  ELIGIBLE: {
    label: 'Eligible',
    badgeClass: 'badge-green',
    color: 'var(--green)',
  },
  POSSIBLY_ELIGIBLE: {
    label: 'Possibly Eligible',
    badgeClass: 'badge-orange',
    color: 'var(--orange)',
  },
  NOT_ELIGIBLE: {
    label: 'Not Eligible',
    badgeClass: 'badge-coral',
    color: 'var(--coral)',
  },
};

/**
 * Extract a readable error message from an Axios error
 */
export function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong. Please try again.'
  );
}
