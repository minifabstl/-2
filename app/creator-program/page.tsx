import type { Metadata } from "next";
import Link from "next/link";
import { getDb, posts, users } from "@/db";
import { mediaUrl } from "@/lib/storage";
import {
  CONTRIBUTOR_REQUIREMENT,
  CREATOR_REQUIREMENT,
  PAYOUT_COOLDOWN_DAYS,
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
  description: "Get paid straight to your wallet for every view your content gets. Learn about tiers, rates, and this week's top creators on LeakedFap.",
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
    <div id="top" className="min-w-0">
      {/* ---------------------------------------------------------------- Hero */}
      <div
        className="px-10 pt-14 pb-16"
        style={{ background: "radial-gradient(1100px 480px at 8% -15%, rgba(219,26,109,0.14), transparent 60%), var(--bg)" }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-[1fr_360px] gap-10 items-start">
          <div>
            <Pill>Professional Creator Program</Pill>
            <h1 className="font-display text-[40px] leading-[1.12] font-bold mt-4 mb-4 max-w-lg">
              Turn your uploads into real, ongoing earnings.
            </h1>
            <p className="text-[14px] text-[var(--text-muted)] leading-relaxed max-w-md mb-6">
              Join a creator program where the rules are clear, the rate is transparent, and every upload has a fair
              chance to earn from real views — no invite required.
            </p>
            <div className="flex gap-2.5 mb-8">
              <Link href="/upload" className="px-5 py-3 rounded-[10px] bg-[var(--accent)] text-white text-[13.5px] font-semibold">
                Join as a creator
              </Link>
              <a href="#rules" className="px-5 py-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-[13.5px] font-semibold">
                Review the rules
              </a>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <HeroStat title={`$${RATE_USD_PER_1000_VIEWS.toFixed(2)} / 1,000 views`} body="One simple, transparent rate for every creator." />
              <HeroStat title="Reviewed, not gamed" body="Every upload is checked before it can earn." />
              <HeroStat title={`Payouts every ${PAYOUT_COOLDOWN_DAYS} days`} body="Request your accrued earnings once you're eligible." />
            </div>
          </div>

          <ChecklistCard />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-10">
        {/* --------------------------------------------------------- Why join */}
        <div className="py-12">
          <div className="font-display text-2xl font-bold mb-2">Why creators join</div>
          <p className="text-[13.5px] text-[var(--text-muted)] leading-relaxed max-w-xl mb-6">
            Creators come here for a clear, fair, performance-based way to earn from content they&apos;re already making —
            and to grow their audience while they do it.
          </p>
          <div className="grid grid-cols-3 gap-3.5">
            <WhyCard
              tag="Earnings"
              title="Earn from real views"
              body={`Every 1,000 real views on your live content earns ${formatUsd(RATE_USD_PER_1000_VIEWS)} — plus a ${formatUsd(FIRST_UPLOAD_BONUS_USD)} bonus on your first upload.`}
            />
            <WhyCard
              tag="Growth"
              title="Build a real audience"
              body="Get exposure on a platform built around discovery, and grow your following through genuine engagement."
            />
            <WhyCard
              tag="Fair rate boosts"
              title="Earn more as you grow"
              body="Reach the Contributor, Creator, or Verified tier and your rate goes up — automatically, and it never drops."
            />
          </div>
        </div>

        {/* ---------------------------------------------------- Leaderboard */}
        <div className="pb-12">
          <div className="font-display text-2xl font-bold mb-1">This week&apos;s top creators</div>
          <p className="text-[12.5px] text-[var(--text-faint)] mb-4">Ranked by real views this week (Monday–Sunday, UTC) — resets every week.</p>
          <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-[18px]">
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
          </div>
        </div>

        {/* -------------------------------------------------- Creator tiers */}
        <div className="pb-12">
          <div className="font-display text-2xl font-bold mb-1">Creator tiers</div>
          <p className="text-[12.5px] text-[var(--text-faint)] mb-4">Your tier is based on your all-time uploads and views — it only ever goes up.</p>
          <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-[18px] flex flex-col gap-2.5">
            <TierRow label={TIER_LABEL.new} boost={TIER_BOOST_LABEL.new} requirement="Everyone starts here" />
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
        </div>

        {/* ------------------------------------------ Requirements + Payout */}
        <div id="rules" className="pb-12 grid grid-cols-[1fr_340px] gap-6 items-start scroll-mt-6">
          <div>
            <div className="font-display text-2xl font-bold mb-2">Creator requirements</div>
            <p className="text-[13.5px] text-[var(--text-muted)] leading-relaxed mb-5">
              To join the program, creators follow a few clear guidelines. This keeps the feed high quality and keeps
              the program fair and trustworthy for everyone.
            </p>
            <div className="flex flex-col gap-2.5">
              <ReqRow n="01" title="Content compliance" body="Only upload content you have the right to share, and that follows our Terms of Service." />
              <ReqRow n="02" title="Accurate title & category" body="Give your upload a clear title and the right category so it can be discovered and reviewed quickly." />
              <ReqRow n="03" title="Real, unique views only" body="Earnings are based on genuine viewer activity. Automated or self-generated views don't count, and abuse can lead to suspension." />
              <ReqRow n="04" title="Review before it's live" body="Every upload is checked by our team before it appears in the public feed and starts earning." />
            </div>
          </div>

          <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-[22px] flex flex-col gap-3">
            <div className="font-display text-[17px] font-bold mb-1">Payout rules</div>
            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed mb-1">
              Payment terms, kept simple and visible.
            </p>
            <PayoutRow label="Rate" value={`${formatUsd(RATE_USD_PER_1000_VIEWS)} / 1,000 views`} />
            <PayoutRow label="First upload bonus" value={formatUsd(FIRST_UPLOAD_BONUS_USD)} />
            <PayoutRow label="Every upload after" value={`+${formatUsd(REPEAT_UPLOAD_BONUS_USD)}`} />
            <PayoutRow label="Minimum payout" value="$1.00" />
            <PayoutRow label="Withdrawal frequency" value={`Once every ${PAYOUT_COOLDOWN_DAYS} days`} />
            <PayoutRow label="Review" value="Manual, by an admin" />
            <p className="text-[11.5px] text-[var(--text-faint)] leading-relaxed mt-1">
              Add your wallet address on your profile, then request a payout once every {PAYOUT_COOLDOWN_DAYS} days, as
              long as your accrued balance has reached the minimum. Requests are reviewed and sent manually, so
              processing time can vary.
            </p>
          </div>
        </div>

        {/* ------------------------------------------------- How to start */}
        <div className="pb-14">
          <div className="font-display text-2xl font-bold mb-1">How creators get started</div>
          <p className="text-[13.5px] text-[var(--text-muted)] leading-relaxed max-w-xl mb-5">
            There&apos;s no application — create an account and start uploading right away. Every upload goes through a
            quick review before it goes live and starts earning.
          </p>
          <div className="grid grid-cols-3 gap-3.5">
            <StepCard n={1} title="Create your account" body="Sign up and you can start uploading immediately — no application required." />
            <StepCard n={2} title="Upload content that follows the rules" body="Add a clear title, the right category, and content that follows our guidelines." />
            <StepCard n={3} title="Earn per view, request payouts" body="Track your views and earnings on your profile, and request a payout once you qualify." />
          </div>
        </div>

        {/* ------------------------------------------------------- Final CTA */}
        <div className="pb-14">
          <div
            className="rounded-3xl p-[26px] flex items-center justify-between gap-6"
            style={{ background: "linear-gradient(115deg, rgba(219,26,109,0.14), var(--surface) 55%)" }}
          >
            <div className="max-w-md">
              <Pill>Ready to start earning?</Pill>
              <div className="font-display text-[22px] font-bold leading-tight mt-3 mb-2">
                Join creators already earning on LeakedFap.
              </div>
              <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
                Clear rules, a transparent rate, and real payouts based on real views.
              </p>
            </div>
            <div className="flex gap-2.5 shrink-0">
              <Link href="/upload" className="px-5 py-3 rounded-[10px] bg-[var(--accent)] text-white text-[13.5px] font-semibold whitespace-nowrap">
                Create your account
              </Link>
              <a href="#top" className="px-5 py-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-[13.5px] font-semibold whitespace-nowrap">
                Back to top
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex px-3 py-1 rounded-full text-[11px] font-bold"
      style={{ background: "rgba(219,26,109,0.12)", color: "#db1a6d" }}
    >
      {children}
    </span>
  );
}

function HeroStat({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-3.5 flex flex-col gap-1">
      <div className="font-display text-[14px] font-bold leading-tight">{title}</div>
      <div className="text-[11px] text-[var(--text-muted)] leading-snug">{body}</div>
    </div>
  );
}

function ChecklistCard() {
  return (
    <div className="border border-[var(--border)] rounded-3xl bg-[var(--surface)] p-6 shadow-sm">
      <Pill>Creator requirements</Pill>
      <div className="font-display text-[17px] font-bold mt-3 mb-4">Creator review checklist</div>
      <div className="flex flex-col gap-2.5 mb-4">
        <ChecklistItem label="CONTENT QUALITY" body="Uploads should be clear and represent what they claim to be." />
        <ChecklistItem label="UPLOAD SETUP" body="Add an accurate title and the right category before submitting." />
        <ChecklistItem label="CONTENT COMPLIANCE" body="Only publish content you have the right to share, following our Terms." />
      </div>
      <div className="flex flex-col gap-2">
        <CheckLine>Clear rules keep the feed high quality.</CheckLine>
        <CheckLine>Every upload is reviewed before it goes live.</CheckLine>
        <CheckLine>Better content tends to earn more views — and more.</CheckLine>
      </div>
    </div>
  );
}

function ChecklistItem({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg)] px-3.5 py-3">
      <div className="text-[10px] font-bold tracking-wide text-[var(--text-faint)] mb-1">{label}</div>
      <div className="text-[12px] text-[var(--text)] leading-relaxed">{body}</div>
    </div>
  );
}

function CheckLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-[12px] text-[var(--text-muted)] leading-relaxed">
      <span
        className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5"
        style={{ background: "rgba(219,26,109,0.12)", color: "#db1a6d" }}
      >
        ✓
      </span>
      <span>{children}</span>
    </div>
  );
}

function WhyCard({ tag, title, body }: { tag: string; title: string; body: string }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-4 flex flex-col gap-2">
      <span
        className="self-start px-2 py-0.5 rounded-full text-[10px] font-bold"
        style={{ background: "rgba(219,26,109,0.12)", color: "#db1a6d" }}
      >
        {tag}
      </span>
      <div className="font-display text-[14.5px] font-bold leading-snug">{title}</div>
      <div className="text-[12px] text-[var(--text-muted)] leading-relaxed">{body}</div>
    </div>
  );
}

function ReqRow({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="flex gap-3.5 border border-[var(--border)] rounded-2xl bg-[var(--surface)] px-4 py-3.5">
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
        style={{ background: "rgba(219,26,109,0.12)", color: "#db1a6d" }}
      >
        {n}
      </span>
      <div>
        <div className="font-semibold text-[13.5px] mb-0.5">{title}</div>
        <div className="text-[12px] text-[var(--text-muted)] leading-relaxed">{body}</div>
      </div>
    </div>
  );
}

function PayoutRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border border-[var(--border)] rounded-[10px] px-3 py-2.5">
      <span className="text-[12.5px] text-[var(--text-muted)]">{label}</span>
      <span className="text-[12.5px] font-semibold">{value}</span>
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
