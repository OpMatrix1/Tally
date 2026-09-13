export const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2
});

export const shortDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

export const monthLabel = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric'
});

export function formatDate(value: string) {
  return shortDate.format(new Date(`${value}T00:00:00`));
}

export function formatMonth(value: string) {
  return monthLabel.format(new Date(`${value}T00:00:00`));
}
