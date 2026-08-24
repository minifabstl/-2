import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "LeakedFap terms of service — content upload rules, earnings system, and account responsibilities.",
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto p-10">
      <h1 className="font-display text-2xl font-bold mb-1">Terms of Service</h1>
      <p className="text-[12px] text-[var(--text-faint)] mb-8">Last updated: August 22, 2026</p>

      <div className="flex flex-col gap-6 text-[13.5px] leading-relaxed text-[var(--text)]">
        <Section title="1. Age requirement">
          You must be over 18 years old to use <span className="notranslate" translate="no">LeakedFap</span> and upload content. By uploading content, you represent that
          everyone appearing in it is over 18 years old and has consented to its being shared.
        </Section>
        <Section title="2. Content responsibility">
          You must own the rights to the videos/photos you upload, or have authorization to share them. Copyright
          infringement, non-consensual sharing (unauthorized &quot;leaked&quot; content), hate speech, or illegal content is
          strictly prohibited, and your account may be suspended if it is detected.
        </Section>
        <Section title="3. Review process">
          Every piece of content you upload is reviewed by our admin team before it appears in the public feed.
          Content that violates the rules is rejected and permanently deleted from cloud storage.
        </Section>
        <Section title="4. Earnings and payouts">
          Views on approved content convert into earnings ($0.20 per 1000 views). You can withdraw your earnings by
          requesting a payout to your wallet address. Payments are sent manually by an admin, and processing
          time may vary. If fake/automated view generation (bots, refresh abuse, etc.) is detected, the related
          earnings may be canceled and the account may be suspended.
        </Section>
        <Section title="5. Account suspension">
          We reserve the right to suspend accounts that violate the rules without prior notice.
        </Section>
        <Section title="6. Changes">
          We may update these terms from time to time. We will try to notify you of significant changes.
        </Section>
      </div>

      <div className="mt-9 text-[11.5px] text-[var(--text-faint)] leading-relaxed border-t border-[var(--border)] pt-5">
        This text is a general template; we recommend having it reviewed by a legal advisor to ensure full compliance
        with the legal requirements of the country(ies) where your platform operates.
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-display text-[15px] font-bold mb-1.5">{title}</div>
      <div className="text-[var(--text-muted)]">{children}</div>
    </div>
  );
}
