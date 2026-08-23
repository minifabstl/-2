/**
 * The site-time gift program: spend enough active time on the site and get a real,
 * manually-funded $50 OnlyFans account as a thank-you gift.
 *
 * IMPORTANT: this is fulfilled by hand by an admin (see app/admin/gifts), the same way
 * Bitcoin/wallet payouts are — there is no automated OnlyFans integration. Do not promise
 * anything here that isn't something an admin can and will actually deliver.
 */
export const GIFT_MILESTONE_HOURS = 100;
export const GIFT_MILESTONE_SECONDS = GIFT_MILESTONE_HOURS * 3600;
export const GIFT_REWARD_LABEL = "$50 OnlyFans account";

/** Client heartbeat sends this many seconds per tick (see components/TimeTracker.tsx). */
export const TRACK_TICK_SECONDS = 30;
/** Server-side sanity clamp — never trust more than this many seconds from one heartbeat call. */
export const TRACK_MAX_SECONDS_PER_CALL = 120;

export function formatHoursOnSite(activeSeconds: number): string {
  const hours = activeSeconds / 3600;
  return hours >= 10 ? Math.round(hours).toString() : hours.toFixed(1);
}
