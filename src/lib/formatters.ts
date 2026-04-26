export function formatCurrency(amount: number, currency: string): string {
  const symbol =
    currency === 'EUR' ? '€' :
    currency === 'GBP' ? '£' :
    currency === 'USD' ? '$' :
    currency + '\u00a0';
  if (Math.abs(amount) >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(2)}m`;
  return `${symbol}${(amount / 1_000).toFixed(0)}k`;
}
