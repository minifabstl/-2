"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Bir şeyler ters gitti.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1800);
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-6">
        <div className="text-sm text-[var(--text-muted)]">Geçersiz sıfırlama bağlantısı.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-6">
      <form onSubmit={submit} className="w-[360px] flex flex-col gap-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-7">
        <div className="font-display text-[18px] font-bold">Yeni Şifre Belirle</div>
        {done ? (
          <div className="text-[13px] text-[var(--ok)]">Şifren güncellendi, giriş sayfasına yönlendiriliyorsun…</div>
        ) : (
          <>
            {error && <div className="text-[12.5px] text-[var(--danger)] bg-[var(--danger-soft)] rounded-[10px] px-3.5 py-2.5">{error}</div>}
            <input
              required
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Yeni şifre (en az 8 karakter)"
              className="border border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-sm outline-none"
            />
            <button disabled={loading} type="submit" className="py-2.5 rounded-[10px] bg-[var(--accent)] text-white text-sm font-semibold disabled:opacity-60">
              {loading ? "Bekleyin…" : "Şifreyi Güncelle"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
