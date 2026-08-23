import { asc, isNotNull } from "drizzle-orm";
import { getDb, users } from "@/db";
import { GIFT_MILESTONE_HOURS, GIFT_REWARD_LABEL } from "@/lib/gift";
import AdminGiftsTable from "@/components/AdminGiftsTable";

export default async function AdminGiftsPage() {
  const db = getDb();

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      giftMilestoneReachedAt: users.giftMilestoneReachedAt,
      giftSentAt: users.giftSentAt,
    })
    .from(users)
    .where(isNotNull(users.giftMilestoneReachedAt))
    .orderBy(asc(users.giftMilestoneReachedAt));

  const items = rows.map((r) => ({
    id: r.id,
    username: r.username,
    email: r.email,
    reachedDate: r.giftMilestoneReachedAt ? r.giftMilestoneReachedAt.toLocaleDateString("en-US") : "—",
    sent: !!r.giftSentAt,
    sentDate: r.giftSentAt ? r.giftSentAt.toLocaleDateString("en-US") : null,
  }));

  return (
    <div>
      <div className="mb-6">
        <div className="font-display text-xl font-bold">Gift Milestones</div>
        <div className="text-[12.5px] text-[var(--text-muted)] mt-0.5">
          Users who reached {GIFT_MILESTONE_HOURS} hours of active time on the site, qualifying for a real, manually-funded {GIFT_REWARD_LABEL}.
        </div>
      </div>
      <AdminGiftsTable initialItems={items} />
    </div>
  );
}
