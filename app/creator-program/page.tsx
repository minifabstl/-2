import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb, posts, users } from "@/db";
import { mediaUrl } from "@/lib/storage";
import {
  CONTRIBUTOR_REQUIREMENT,
  CREATOR_REQUIREMENT,
  RATE_USD_PER_1000_VIEWS,
  FIRST_UPLOAD_BONUS_USD,
  REPEAT_UPLOAD_BONUS_USD,
  TIER_BOOST_LABEL,
  TIER_LABEL,
  calculateEarningsUsd,
  calculateTier,
  formatUsd,
  formatViews,
  type Tier,
} from "@/lib/earnings";

export const metadata: Metadata = {
  title: "Creator Program",
  description: "Get paid in Bitcoin for every view your content gets. Learn about tiers, rates, and this week's top creators on LeakedFap.",
};

export default async function CreatorProgramPage() {
  const db = getDb();

  const [allUsers, allPosts] = await Promise.all([
    db.select({ id: users.id, username: users.username, avatarKey: users.avatarKey, verifiedCreator: users.verifiedCreator }).from(users),
    db
      .select({
        userId: posts.userId,
        viewCount: posts.viewCount,
        weekViewCount: posts.weekViewCount,
        status: posts.status,
      })
      .from(posts),
  ]);

  const agg = new Map<string, { uploads: number; totalViews: number; weekViews: number }>();
  for (const p of allPosts) {
    if (p.status !== "live" && p.status !== "flagged") continue; // only content currently visible in the feed counts
    const cur = agg.get(p.userId) ?? { uploads: 0, totalViews: 0, weekViews: 0 };
    cur.uploads += 1;
    cur.totalViews += p.viewCount;
    cur.weekViews += p.weekViewCount;
    agg.set(p.userId, cur);
  }

  const leaderboard = allUsers
    .map((u) => {
      const a = agg.get(u.id) ?? { uploads: 0, totalViews: 0, weekViews: 0 };
      const tier = calculateTier({ verifiedCreator: u.verifiedCreator, totalUploads: a.uploads, totalViews: a.totalViews });
      return {
        id: u.id,
        username: u.username,
        avatarUrl: u.avatarKey ? mediaUrl(u.avatarKey) : null,
        tier,
        weekViews: a.weekViews,
        weekEarnedLabel: formatUsd(calculateEarningsUsd(a.weekViews, tier)),
      };
    })
    .filter((u) => u.weekViews > 0)
    .sort((a, b) => b.weekViews - a.weekViews)
    .slice(0, 10);

  return (
    <div className="max-w-3xl mx-auto p-10">
      <div className="flex flex-col items-center text-center mb-10">
        <span
          className="px-3 py-1 rounded-full text-[11px] font-bold mb-4"
          style={{ background: "linear-gradient(90deg, #db1a6d, #a8125a)", color: "white" }}
        >
          Creator Program
        </span>
        <h1 className="font-display text-3xl font-bold mb-3">Post here. Get paid for every view.</h1>
        <p className="text-[14px] text-[var(--text-muted)] max-w-xl leading-relaxed mb-6">
          Every approved upload earns real money as it gets views — paid out straight to your Bitcoin wallet, any time you have at
          least $1 accrued. Upload more, get more views, and your rate goes up as you move through the creator tiers below.
        </p>
        <Link href="/upload" className="px-6 py-3 rounded-[10px] bg-[var(--accent)] text-white text-[14px] font-semibold">
          Upload now
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3.5 mb-12">
        <StepCard
          n={1}
          title="Upload"
          body="Share a video or photo. It takes a minute, and there's no limit on how much you can post."
        />
        <StepCard
          n={2}
          title="Get approved"
          body="Our team reviews every upload before it goes live in the public feed — usually quick."
        />
        <StepCard
          n={3}
          title="Earn per view"
          body={`Once live, you earn $${RATE_USD_PER_1000_VIEWS.toFixed(2)} per 1000 views, scaled up by your creator tier.`}
        />
      </div>

      <Section title="This week's top creators" subtitle="Ranked by views this week (Monday–Sunday, UTC). Resets every week.">
        {leaderboard.length === 0 ? (
          <div className="text-[13px] text-[var(--text-muted)] py-6 text-center">
            No views yet this week — be the first on the board.
          </div>
        ) : (
          <div className="flex flex-col">
            {leaderboard.map((u, i) => (
              <div key={u.id} className="flex items-center gap-3.5 py-2.5 border-b border-[var(--border-soft)] last:border-b-0">
                <div className="w-6 text-[13px] font-bold text-[var(--text-faint)] text-center">{i + 1}</div>
                <Avatar avatarUrl={u.avatarUrl} initials={u.username.slice(0, 2).toUpperCase()} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-[13.5px] truncate">@{u.username}</span>
                    <TierBadge tier={u.tier} />
                  </div>
                  <div className="text-[11.5px] text-[var(--text-faint)]">{formatViews(u.weekViews)} views this week</div>
                </div>
                <div className="font-semibold text-[13px] text-[var(--ok)]">{u.weekEarnedLabel}</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Creator tiers" subtitle="Your tier is based on your all-time uploads and views — it never drops.">
        <div className="flex flex-col gap-2.5">
          <TierRow
            label={TIER_LABEL.new}
            boost={TIER_BOOST_LABEL.new}
            requirement="Everyone starts here"
          />
          <TierRow
            label={TIER_LABEL.contributor}
            boost={TIER_BOOST_LABEL.contributor}
            requirement={`${CONTRIBUTOR_REQUIREMENT.uploads}+ approved uploads and ${formatViews(CONTRIBUTOR_REQUIREMENT.views)}+ total views`}
          />
          <TierRow
            label={TIER_LABEL.creator}
            boost={TIER_BOOST_LABEL.creator}
            requirement={`${CREATOR_REQUIREMENT.uploads}+ approved uploads and ${formatViews(CREATOR_REQUIREMENT.views)}+ total views`}
          />
          <TierRow
            label={TIER_LABEL.verified}
            boost={TIER_BOOST_LABEL.verified}
            requirement="Hand-picked by the admin team for consistently high-quality content"
          />
        </div>
      </Section>

      <Section title="How it works">
        <ul className="flex flex-col gap-2.5 text-[13px] text-[var(--text-muted)] leading-relaxed">
          <RuleItem>
            You earn <strong className="text-[var(--text)]">{formatUsd(RATE_USD_PER_1000_VIEWS)} per 1,000 views</strong>{" "}
            on every approved upload, multiplied by your creator tier&apos;s rate boost.
          </RuleItem>
          <RuleItem>
            Your very first approved upload earns an extra{" "}
            <strong className="text-[var(--text)]">{formatUsd(FIRST_UPLOAD_BONUS_USD)} bonus</strong>, and every approved upload
            after that earns a <strong className="text-[var(--text)]">{formatUsd(REPEAT_UPLOAD_BONUS_USD)} bonus</strong>.
          </RuleItem>
          <RuleItem>Views only count from real, unique viewers — you can&apos;t earn from watching your own content.</RuleItem>
          <RuleItem>
            Request a payout any time you have at least $1 accrued. Add your Bitcoin address on your profile, and an admin will
            send your payout from there.
          </RuleItem>
          <RuleItem>All uploads are reviewed before going live — content that violates our terms won&apos;t be approved.</RuleItem>
        </ul>
      </Section>
    </div>
  );
}

function StepCard({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-4 flex flex-col gap-2">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold text-white"
        style={{ background: "#db1a6d" }}
      >
        {n}
      </div>
      <div className="font-display text-[14px] font-bold">{title}</div>
      <div className="text-[12px] text-[var(--text-muted)] leading-relaxed">{body}</div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mb-9">
      <div className="mb-3.5">
        <div className="font-display text-[16px] font-bold">{title}</div>
        {subtitle && <div className="text-[12px] text-[var(--text-faint)] mt-0.5">{subtitle}</div>}
      </div>
      <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-[18px]">{children}</div>
    </div>
  );
}

function TierRow({ label, boost, requirement }: { label: string; boost: string; requirement: string }) {
  return (
    <div className="flex items-center gap-3.5 py-2 border-b border-[var(--border-soft)] last:border-b-0">
      <div className="w-48 font-semibold text-[13px]">{label}</div>
      <div
        className="px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0"
        style={{ background: "var(--accent-soft)", color: "var(--accent-dark)" }}
      >
        {boost}
      </div>
      <div className="flex-1 text-[12px] text-[var(--text-muted)]">{requirement}</div>
    </div>
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className="px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold shrink-0"
      style={{
        background: tier === "new" ? "var(--border-soft)" : "var(--accent-soft)",
        color: tier === "new" ? "var(--text-muted)" : "var(--accent-dark)",
      }}
    >
      {TIER_LABEL[tier]}
    </span>
  );
}

function RuleItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0 mt-1.5" />
      <span>{children}</span>
    </li>
  );
}

function Avatar({ avatarUrl, initials }: { avatarUrl: string | null; initials: string }) {
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className="w-9 h-9 rounded-full bg-[var(--accent-soft)] text-[var(--accent-dark)] text-[11px] font-bold flex items-center justify-center font-display shrink-0">
      {initials}
    </div>
  );
}
