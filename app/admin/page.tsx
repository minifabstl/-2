import { count, desc, sum } from "drizzle-orm";
import { getDb, users, posts, payouts } from "@/db";
import { formatUsd, calculateEarningsUsd } from "@/lib/earnings";

export default async function AdminOverviewPage() {
  const db = getDb();

  const [[userCount], [postCount], [viewsRow]] = await Promise.all([
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(posts),
    db.select({ n: sum(posts.viewCount) }).from(posts),
  ]);

  const totalViews = Number(viewsRow?.n ?? 0);
  const totalEarnedAllTime = calculateEarningsUsd(totalViews);

  const recentPosts = await db
    .select({ id: posts.id, title: posts.title, createdAt: posts.createdAt })
    .from(posts)
    .orderBy(desc(posts.createdAt))
    .limit(5);

  const pendingPayouts = await db.select({ amountUsd: payouts.amountUsd, status: payouts.status }).from(payouts);
  const pendingSumUsd = pendingPayouts.filter((p) => p.status === "pending").reduce((acc, p) => acc + p.amountUsd, 0);

  return (
    <div>
      <div className="mb-6">
        <div className="font-display text-xl font-bold">Genel Bakış</div>
        <div className="text-[12.5px] text-[var(--text-muted)] mt-0.5">Platformun anlık durumu</div>
      </div>

      <div className="grid grid-cols-4 gap-3.5 mb-7">
        <Stat label="Toplam Kullanıcı" value={String(userCount.n)} />
        <Stat label="Toplam İçerik" value={String(postCount.n)} />
        <Stat label="Toplam İzlenme" value={totalViews.toLocaleString("tr-TR")} />
        <Stat label="Ödenecek (bekleyen talepler)" value={formatUsd(pendingSumUsd)} tone="btc" />
      </div>

      <div className="text-[11.5px] text-[var(--text-faint)] mb-7 -mt-4">
        Şimdiye kadarki toplam izlenmeye göre kazanılan: {formatUsd(totalEarnedAllTime)}
      </div>

      <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-[18px]">
        <div className="font-display text-sm font-bold mb-3">Son Paylaşımlar</div>
        {recentPosts.length === 0 && <div className="text-sm text-[var(--text-muted)]">Henüz içerik yok.</div>}
        <div className="flex flex-col gap-1">
          {recentPosts.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b border-[var(--border-soft)] text-[13px]">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]" />
              <div className="flex-1">{p.title}</div>
              <div className="text-[11.5px] text-[var(--text-faint)]">{p.createdAt.toLocaleDateString("tr-TR")}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "btc" }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl p-4" style={{ background: tone === "btc" ? "var(--btc-soft)" : "var(--surface)" }}>
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className="font-display text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
