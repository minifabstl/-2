import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Frequently asked questions about LeakedFap — earnings system, content approval, payouts, and account management.",
};

const FAQS = [
  {
    q: "When does my uploaded content go live?",
    a: "Every video/photo you upload is reviewed by our admin team before it appears in the public feed. Once approved, it starts appearing in the feed and earning views. Approval is usually quick, but it can vary depending on content volume.",
  },
  {
    q: "How much can I earn?",
    a: "You earn $0.20 for every 1000 views. Your earnings appear in real time on the Earnings & Payout tab of your profile.",
  },
  {
    q: "How do I withdraw my earnings?",
    a: "Save your wallet address on your profile and create a request by clicking the \"Request Payout\" button. Your request is reviewed by an admin and sent to your wallet; once it's marked as \"paid,\" it will appear in your history.",
  },
  {
    q: "I forgot my password, what should I do?",
    a: "Click the \"Forgot Password\" link on the login page and enter your registered email. You can then enter the 6-digit code sent to your email and set a new password yourself.",
  },
  {
    q: "Can I remove my content myself?",
    a: "Content removal is currently handled by the admin team. If you want a piece of content removed, please contact the admin team.",
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FaqPage() {
  return (
    <div className="max-w-2xl mx-auto p-10">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />
      <h1 className="font-display text-2xl font-bold mb-1">Frequently Asked Questions</h1>
      <p className="text-[13px] text-[var(--text-muted)] mb-8">If you don&apos;t find what you&apos;re looking for here, feel free to contact the admin team.</p>

      <div className="flex flex-col gap-3">
        {FAQS.map((f) => (
          <details key={f.q} className="group border border-[var(--border)] rounded-2xl bg-[var(--surface)] px-5 py-4">
            <summary className="cursor-pointer list-none flex items-center justify-between gap-3 font-semibold text-[14px]">
              {f.q}
              <span className="text-[var(--text-faint)] transition-transform group-open:rotate-45 text-lg leading-none">+</span>
            </summary>
            <div className="text-[13px] text-[var(--text-muted)] leading-relaxed mt-2.5">{f.a}</div>
          </details>
        ))}
      </div>
    </div>
  );
}
