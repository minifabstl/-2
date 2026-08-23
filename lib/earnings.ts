/** Earnings per 1000 views (USD). Can be changed via .env if desired. */
export const RATE_USD_PER_1000_VIEWS = 0.2;

/** One-time bonus for a user's very first approved upload. */
export const FIRST_UPLOAD_BONUS_USD = 3.0;
/** Bonus for every approved upload after the first one. */
export const REPEAT_UPLOAD_BONUS_USD = 0.1;

export function calculateEarningsUsd(viewCount: number): number {
  return (viewCount / 1000) * RATE_USD_PER_1000_VIEWS;
}

export function formatUsd(amount: number): string {
  return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatViews(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "K";
  return String(n);
}
