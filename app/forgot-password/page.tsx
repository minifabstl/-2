"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setInfo("If this email is registered, a 6-digit reset code has been sent. Check your inbox (and spam folder).");
    setStep("code");
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/reset-password-with-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1800);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-6">
      <form onSubmit={step === "email" ? requestCode : submitCode} className="w-[380px] flex flex-col gap-[18px] bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-7">
        <div>
          <div className="font-display text-[18px] font-bold">Forgot Password</div>
          <div className="text-[12.5px] text-[var(--text-muted)] mt-1">
            {step === "email" ? "Enter the email registered to your account and we'll send you a reset code." : "Enter the 6-digit code sent to your email and your new password."}
          </div>
        </div>

        {done ? (
          <div className="text-[13px] text-[var(--ok)]">Your password has been updated, redirecting you to the login page…</div>
        ) : (
          <>
            {error && <div className="text-[12.5px] text-[var(--danger)] bg-[var(--danger-soft)] rounded-[10px] px-3.5 py-2.5">{error}</div>}
            {info && !error && <div className="text-[12.5px] text-[var(--ok)] bg-[var(--ok-soft)] rounded-[10px] px-3.5 py-2.5">{info}</div>}

            {step === "email" ? (
              <>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="border border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-sm outline-none"
                />
                <button disabled={loading} type="submit" className="py-2.5 rounded-[10px] bg-[var(--accent)] text-white text-sm font-semibold disabled:opacity-60">
                  {loading ? "Sending…" : "Send Code"}
                </button>
              </>
            ) : (
              <>
                <input
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit code"
                  className="border border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-sm outline-none tracking-[6px] text-center font-semibold"
                />
                <input
                  required
                  type="password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (at least 8 characters)"
                  className="border border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-sm outline-none"
                />
                <button disabled={loading} type="submit" className="py-2.5 rounded-[10px] bg-[var(--accent)] text-white text-sm font-semibold disabled:opacity-60">
                  {loading ? "Please wait…" : "Update Password"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-[12px] text-[var(--text-muted)] font-semibold"
                >
                  Try a different email / resend code
                </button>
              </>
            )}
          </>
        )}

        {!done && (
          <Link href="/login" className="text-[12px] text-[var(--text-muted)] text-center font-semibold mt-1">
            Back to login
          </Link>
        )}
      </form>
    </div>
  );
}
