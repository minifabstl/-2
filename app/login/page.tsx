"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bitcoinAddress, setBitcoinAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch(isSignup ? "/api/auth/register" : "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isSignup ? { username, email, password, bitcoinAddress } : { identifier, password }
      ),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Bir şeyler ters gitti.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <div className="hidden md:flex w-[640px] min-h-screen flex-col justify-between p-12 text-white" style={{ background: "linear-gradient(160deg, oklch(0.64 0.19 25), oklch(0.5 0.17 20))" }}>
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
              <path d="M8.2 6.2h2.7v12.1h6.3v2.4H8.2V6.2z" fill="white" />
              <path d="M17.4 6.2h6.1v2.35h-3.4v3.1h3.05v2.3h-3.05v3.9h-2.7V6.2z" fill="white" fillOpacity="0.92" />
            </svg>
          </span>
          <span className="font-display text-[17px] font-bold">LeakedFap</span>
        </div>
        <div className="flex flex-col gap-[18px]">
          <div className="font-display text-[34px] font-bold leading-[1.25] max-w-[440px]">Paylaştıkça kazan.</div>
          <div className="text-[15px] text-white/85 leading-relaxed max-w-[420px]">
            Fotoğraf ve videolarını paylaş, her 1000 izlenme için 0,20$ kazan — kazancını doğrudan Bitcoin cüzdanına gönderelim.
          </div>
          <div className="flex gap-7 mt-2">
            <div>
              <div className="font-display text-[22px] font-bold">0,20$</div>
              <div className="text-xs text-white/75">/ 1000 izlenme</div>
            </div>
            <div>
              <div className="font-display text-[22px] font-bold">₿</div>
              <div className="text-xs text-white/75">Bitcoin ile ödeme</div>
            </div>
          </div>
        </div>
        <div className="text-xs text-white/60">
          Üye olmadan da tüm içerikleri görebilirsin — beğenmek ve yorum yapmak için hesap gerekir.
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-[380px] flex flex-col gap-[22px]">
          <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1">
            <button
              type="button"
              onClick={() => setIsSignup(false)}
              className={`flex-1 py-2.5 rounded-[9px] text-[13.5px] font-semibold ${!isSignup ? "bg-white text-[var(--text)] shadow-sm" : "text-[var(--text-muted)]"}`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => setIsSignup(true)}
              className={`flex-1 py-2.5 rounded-[9px] text-[13.5px] font-semibold ${isSignup ? "bg-white text-[var(--text)] shadow-sm" : "text-[var(--text-muted)]"}`}
            >
              Kayıt Ol
            </button>
          </div>

          {error && (
            <div className="text-[12.5px] text-[var(--danger)] bg-[var(--danger-soft)] rounded-[10px] px-3.5 py-2.5">{error}</div>
          )}

          {isSignup && (
            <Field label="Kullanıcı adı">
              <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="kullaniciadi" className="input" />
            </Field>
          )}

          {isSignup ? (
            <Field label="E-posta">
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@eposta.com" className="input" />
            </Field>
          ) : (
            <Field label="Kullanıcı adı veya e-posta">
              <input required value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="kullaniciadi ya da e-posta" className="input" />
            </Field>
          )}

          <Field label="Şifre">
            <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input" />
          </Field>

          {isSignup && (
            <Field label="Bitcoin cüzdan adresi" hint="kazançların için, sonra da eklenebilir">
              <input value={bitcoinAddress} onChange={(e) => setBitcoinAddress(e.target.value)} placeholder="bc1q…" className="input" />
            </Field>
          )}

          <button disabled={loading} type="submit" className="py-3 rounded-[10px] bg-[var(--accent)] text-white text-sm font-semibold disabled:opacity-60">
            {loading ? "Bekleyin…" : isSignup ? "Hesap Oluştur" : "Giriş Yap"}
          </button>

          <div className="text-xs text-[var(--text-faint)] text-center leading-relaxed">
            Devam ederek <Link href="#" className="text-[var(--accent)]">Kullanım Şartları</Link> ve{" "}
            <Link href="#" className="text-[var(--accent)]">Gizlilik Politikası</Link>&apos;nı kabul etmiş olursun.
          </div>
        </form>
      </div>

      <style>{`.input { border: 1px solid var(--border); border-radius: 10px; padding: 11px 13px; font-size: 13.5px; outline: none; } .input:focus { border-color: var(--accent); }`}</style>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12.5px] font-semibold text-[var(--text-muted)]">
        {label} {hint && <span className="text-[var(--text-faint)] font-normal">({hint})</span>}
      </label>
      {children}
    </div>
  );
}
