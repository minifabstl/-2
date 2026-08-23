import { desc, eq } from "drizzle-orm";
import { getDb, payouts, users } from "@/db";
import { formatUsd } from "@/lib/earnings";
import AdminPayoutsTable from "@/components/AdminPayoutsTable";

export default async function AdminPayoutsPage() {
  const db = getDb();

  const rows = await db
    .select({
      id: payouts.id,
      amountUsd: payouts.amountUsd,
      bitcoinAddress: payouts.bitcoinAddress,
      status: payouts.status,
      createdAt: payouts.createdAt,
      paidAt: payouts.paidAt,
      username: users.username,
    })
    .from(payouts)
    .innerJoin(users, eq(payouts.userId, users.id))
    .orderBy(desc(payouts.createdAt))
    .limit(200);

  const items = rows.map((r) => ({
    id: r.id,
    amountLabel: formatUsd(r.amountUsd),
    bitcoinAddress: r.bitcoinAddress,
    status: r.status as "pending" | "paid",
    username: r.username,
    createdAt: r.createdAt.toLocaleDateString("en-US"),
    paidAt: r.paidAt ? r.paidAt.toLocaleDateString("en-US") : null,
  }));

  const pendingTotal = rows.filter((r) => r.status === "pending").reduce((sum, r) => sum + r.amountUsd, 0);

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="font-display text-xl font-bold">Payouts</div>
          <div className="text-[12.5px] text-[var(--text-muted)] mt-0.5">
            Users&apos; Bitcoin payout requests — after sending the transfer from your own wallet, mark it as &quot;Paid&quot;
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-semibold text-[var(--text-faint)] tracking-wide">PENDING TOTAL</div>
          <div className="font-display text-lg font-bold text-[var(--accent-dark)]">{formatUsd(pendingTotal)}</div>
        </div>
      </div>
      <AdminPayoutsTable initialItems={items} />
    </div>
  );
}
