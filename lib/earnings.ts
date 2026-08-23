/** Earnings per 1000 views (USD). Can be changed via .env if desired. */
export const RATE_USD_PER_1000_VIEWS = 0.2;

/** One-time bonus for a user's very first approved upload. */
export const FIRST_UPLOAD_BONUS_USD = 3.0;
/** Bonus for every approved upload after the first one. */
export const REPEAT_UPLOAD_BONUS_USD = 0.1;

/**
 * Creator Program tiers. Status is based on a user's ALL-TIME totals, so it only ever
 * goes up, never down. "verified" is hand-granted by an admin (users.verifiedCreator);
 * the other tiers are computed automatically from upload/view counts (see calculateTier).
 */
export type Tier = "new" | "contributor" | "creator" | "verified";

export const TIER_MULTIPLIER: Record<Tier, number> = {
  new: 1,
  contributor: 1.1,
  creator: 1.25,
  verified: 1.5,
};

export const TIER_LABEL: Record<Tier, string> = {
  new: "New",
  contributor: "Contributor",
  creator: "Creator",
  verified: "Verified Content Creator",
};

export const TIER_BOOST_LABEL: Record<Tier, string> = {
  new: "base rate",
  contributor: "+10%",
  creator: "+25%",
  verified: "+50%",
};

export const CONTRIBUTOR_REQUIREMENT = { uploads: 3, views: 5_000 };
export const CREATOR_REQUIREMENT = { uploads: 10, views: 40_000 };

export function calculateTier({
  verifiedCreator,
  totalUploads,
  totalViews,
}: {
  verifiedCreator: boolean;
  totalUploads: number;
  totalViews: number;
}): Tier {
  if (verifiedCreator) return "verified";
  if (totalUploads >= CREATOR_REQUIREMENT.uploads && totalViews >= CREATOR_REQUIREMENT.views) return "creator";
  if (totalUploads >= CONTRIBUTOR_REQUIREMENT.uploads && totalViews >= CONTRIBUTOR_REQUIREMENT.views) return "contributor";
  return "new";
}

export function calculateEarningsUsd(viewCount: number, tier: Tier = "new"): number {
  return (viewCount / 1000) * RATE_USD_PER_1000_VIEWS * TIER_MULTIPLIER[tier];
}

export function formatUsd(amount: number): string {
  return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatViews(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "K";
  return String(n);
}

/** Monday 00:00 UTC of the week containing `date` — the anchor for the weekly leaderboard. */
export function currentWeekStart(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
  const diffToMonday = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  return d;
}
