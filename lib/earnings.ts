/** 1000 izlenme başına kazanç (USD). İstenirse .env üzerinden değiştirilebilir. */
export const RATE_USD_PER_1000_VIEWS = 0.2;

export function calculateEarningsUsd(viewCount: number): number {
  return (viewCount / 1000) * RATE_USD_PER_1000_VIEWS;
}

export function formatUsd(amount: number): string {
  return amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " $";
}

export function formatViews(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "B";
  return String(n);
}
