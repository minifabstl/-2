import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "LeakedFap privacy policy — what data we collect, how we use it, and how we store it.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto p-10">
      <h1 className="font-display text-2xl font-bold mb-1">Privacy Policy</h1>
      <p className="text-[12px] text-[var(--text-faint)] mb-8">Last updated: August 22, 2026</p>

      <div className="flex flex-col gap-6 text-[13.5px] leading-relaxed text-[var(--text)]">
        <Section title="1. Data we collect">
          When you create an account, we store your username, email address, and (if you provide one) your payout
          wallet address. Your password is never stored as plain text — it is only stored in an irreversibly hashed
          form. The videos/photos you upload, their title and category information, the likes/comments you receive,
          and the view counts of your content are also kept in our system.
        </Section>
        <Section title="2. How we use your data">
          We use your data to run your account, convert views into earnings, process payout requests, and keep the
          platform safe (detecting rule violations, suspending accounts). We do not sell your data to third parties.
        </Section>
        <Section title="3. Cookies">
          We use essential (required) cookies to keep your session active. We also use a technical cookie to prevent
          the same browser from abusing the view counter by repeatedly watching the same content within a short
          period of time. We do not use third-party cookies for advertising or tracking purposes.
        </Section>
        <Section title="4. Media storage">
          The videos and photos you upload are stored on Cloudflare R2. When you remove your content (or when an
          admin rejects/removes it), the file is permanently deleted from storage.
        </Section>
        <Section title="5. Deleting your data">
          If you want your account closed and your data deleted, contact us. Except for records we are legally
          required to retain (e.g. payment history), your data will be deleted within a reasonable period of time.
        </Section>
        <Section title="6. Contact">
          You can direct any privacy-related questions to the admin team associated with your account.
        </Section>
      </div>

      <div className="mt-9 text-[11.5px] text-[var(--text-faint)] leading-relaxed border-t border-[var(--border)] pt-5">
        This text is a general template; we recommend having it reviewed by a legal advisor to ensure full compliance
        with applicable regulations (such as GDPR and the laws of your country).
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
