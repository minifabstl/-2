"use client";

import { useState } from "react";

type Prefs = { notifyOnApproval: boolean; notifyOnRejection: boolean; notifyOnComment: boolean };

export default function PreferencesView({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = useState<Prefs>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function update(key: keyof Prefs, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    setSaved(false);
    await fetch("/api/profile/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="p-4 sm:p-9 pb-16 max-w-[720px]">
      <h1 className="font-display text-2xl font-bold mb-1">Preferences</h1>
      <p className="text-[13px] text-[var(--text-muted)] mb-7">Choose which emails you want to receive about your account.</p>

      <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] overflow-hidden">
        <div className="px-[18px] py-4 border-b border-[var(--border)] font-display text-sm font-bold">Email notifications</div>

        <PrefRow
          title="Upload approved"
          description="We'll email you when an admin approves one of your uploads and it goes live."
          checked={prefs.notifyOnApproval}
          onChange={(v) => update("notifyOnApproval", v)}
        />
        <PrefRow
          title="Upload rejected"
          description="We'll email you when an admin rejects one of your uploads."
          checked={prefs.notifyOnRejection}
          onChange={(v) => update("notifyOnRejection", v)}
        />
        <PrefRow
          title="New comments"
          description="We'll email you when someone comments on one of your posts."
          checked={prefs.notifyOnComment}
          onChange={(v) => update("notifyOnComment", v)}
          last
        />
      </div>

      <div className="h-5 mt-3 text-[12px] text-[var(--text-muted)]">
        {saving ? "Saving…" : saved ? "Saved." : ""}
      </div>
    </div>
  );
}

function PrefRow({
  title,
  description,
  checked,
  onChange,
  last,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 px-[18px] py-4 ${last ? "" : "border-b border-[var(--border-soft)]"}`}>
      <div className="flex-1">
        <div className="text-[13.5px] font-semibold">{title}</div>
        <div className="text-[12px] text-[var(--text-muted)] mt-0.5 leading-relaxed">{description}</div>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-10 h-6 rounded-full relative shrink-0 transition-colors"
      style={{ background: checked ? "var(--accent)" : "var(--border)" }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}
