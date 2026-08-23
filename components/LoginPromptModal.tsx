"use client";

import Link from "next/link";

export default function LoginPromptModal({
  open,
  onClose,
  title = "Sign up",
  description = "If you don't have an account, you can create one in 30 seconds, completely free.",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center" onClick={onClose}>
      <div className="w-[340px] bg-[var(--surface)] rounded-2xl p-[22px] flex flex-col gap-3.5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-[10px] bg-[var(--accent-soft)] flex items-center justify-center">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent-dark)" strokeWidth="2">
              <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" />
            </svg>
          </div>
          <button onClick={onClose} className="text-[var(--text-faint)] text-lg leading-none p-1">&#10005;</button>
        </div>
        <div>
          <div className="font-display text-[15px] font-bold mb-1">{title}</div>
          <div className="text-[13px] text-[var(--text-muted)] leading-relaxed">{description}</div>
        </div>
        <Link
          href="/login"
          className="text-center py-2.5 rounded-[10px] bg-[var(--accent)] text-white text-[13.5px] font-semibold"
        >
          Sign Up / Log In
        </Link>
      </div>
    </div>
  );
}
