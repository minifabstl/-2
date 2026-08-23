import { count, desc, eq, sum } from "drizzle-orm";
import { getDb, users, posts, payouts, bonuses } from "@/db";
import { formatUsd, calculateEarningsUsd } from "@/lib/earnings";

export default async function AdminOverviewPage() {
  const db = getDb();

  const [[userCount], [postCount], [viewsRow], [pendingCount], [bonusRow]] = await Promise.all([
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(posts),
    db.select({ n: sum(posts.viewCount) }).from(posts),
    db.select({ n: count() }).from(posts).where(eq(posts.status, "pending")),
    db.select({ n: sum(bonuses.amountUsd) }).from(bonuses),
  ]);

  const totalViews = Number(viewsRow?.n ?? 0);
  const totalEarnedAllTime = calculateEarningsUsd(totalViews) + Number(bonusRow?.n ?? 0);

  const recentPosts = await db
    .select({ id: posts.id, title: posts.title, status: posts.status, createdAt: posts.createdAt })
    .from(posts)
    .orderBy(desc(posts.createdAt))
    .limit(5);

  const pendingPayouts = await db.select({ amountUsd: payouts.amountUsd, status: payouts.status }).from(payouts);
  const pendingSumUsd = pendingPayouts.filter((p) => p.status === "pending").reduce((acc, p) => acc + p.amountUsd, 0);

  return (
    <div>
      <div className="mb-6">
        <div className="font-display text-xl font-bold">Overview</div>
        <div className="text-[12.5px] text-[var(--text-muted)] mt-0.5">Live snapshot of the platform</div>
      </div>

      <div className="grid grid-cols-5 gap-3.5 mb-7">
        <Stat label="Total Users" value={String(userCount.n)} />
        <Stat label="Total Content" value={String(postCount.n)} />
        <Stat label="Pending Approval" value={String(pendingCount.n)} tone={pendingCount.n > 0 ? "warn" : undefined} />
        <Stat label="Total Views" value={totalViews.toLocaleString("en-US")} />
        <Stat label="Owed (pending requests)" value={formatUsd(pendingSumUsd)} tone="btc" />
      </div>

      {pendingCount.n > 0 && (
        <a
          href="/admin/content"
          className="flex items-center gap-2.5 mb-7 -mt-3.5 px-4 py-3 rounded-[10px] bg-[var(--warn-soft)] text-[12.5px] font-semibold"
          style={{ color: "var(--warn)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)]" />
          {pendingCount.n} new item{pendingCount.n === 1 ? "" : "s"} awaiting approval — click to review
        </a>
      )}

      <div className="text-[11.5px] text-[var(--text-faint)] mb-7 -mt-4">
        Earned so far based on total views: {formatUsd(totalEarnedAllTime)}
      </div>

      <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-[18px]">
        <div className="font-display text-sm font-bold mb-3">Recent Uploads</div>
        {recentPosts.length === 0 && <div className="text-sm text-[var(--text-muted)]">No content yet.</div>}
        <div className="flex flex-col gap-1">
          {recentPosts.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b border-[var(--border-soft)] text-[13px]">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: p.status === "pending" ? "var(--warn)" : p.status === "live" ? "var(--ok)" : "var(--danger)" }}
              />
              <div className="flex-1">{p.title}</div>
              {p.status === "pending" && (
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold" style={{ background: "var(--warn-soft)", color: "var(--warn)" }}>
                  Pending Approval
                </span>
              )}
              <div className="text-[11.5px] text-[var(--text-faint)]">{p.createdAt.toLocaleDateString("en-US")}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "btc" | "warn" }) {
  const bg = tone === "btc" ? "var(--btc-soft)" : tone === "warn" ? "var(--warn-soft)" : "var(--surface)";
  const color = tone === "warn" ? "var(--warn)" : undefined;
  return (
    <div className="border border-[var(--border)] rounded-2xl p-4" style={{ background: bg }}>
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className="font-display text-2xl font-bold mt-1" style={{ color }}>{value}</div>
    </div>
  );
}
