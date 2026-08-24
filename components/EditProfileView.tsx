"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function EditProfileView({ user }: { user: { username: string; email: string; avatarUrl: string | null } }) {
  const router = useRouter();

  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [avatarMsg, setAvatarMsg] = useState("");
  const [savingAvatar, setSavingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [infoMsg, setInfoMsg] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function uploadAvatar(file: File) {
    setAvatarMsg("");
    if (!file.type.startsWith("image/")) {
      setAvatarMsg("Only image files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarMsg("The image must be 5MB or smaller.");
      return;
    }
    setSavingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
    const data = await res.json();
    setSavingAvatar(false);
    if (res.ok) {
      setAvatarUrl(`${data.avatarKey ? "/api/media/" + data.avatarKey : ""}?t=${Date.now()}`);
      router.refresh();
    } else {
      setAvatarMsg(data.error);
    }
  }

  async function deleteAvatar() {
    setSavingAvatar(true);
    setAvatarMsg("");
    const res = await fetch("/api/profile/avatar", { method: "DELETE" });
    setSavingAvatar(false);
    if (res.ok) {
      setAvatarUrl(null);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setAvatarMsg(data.error ?? "Something went wrong.");
    }
  }

  async function saveInfo() {
    setSavingInfo(true);
    setInfoMsg("");
    const res = await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email }),
    });
    const data = await res.json();
    setSavingInfo(false);
    setInfoMsg(res.ok ? "Saved." : data.error);
    if (res.ok) router.refresh();
  }

  async function savePassword() {
    setPasswordMsg("");
    if (newPassword !== confirmPassword) {
      setPasswordMsg("The new password and confirmation don't match.");
      return;
    }
    setSavingPassword(true);
    const res = await fetch("/api/profile/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    const data = await res.json();
    setSavingPassword(false);
    setPasswordMsg(res.ok ? "Password changed." : data.error);
    if (res.ok) {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    setDeleteMsg("");
    const res = await fetch("/api/profile/delete-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePassword }),
    });
    const data = await res.json();
    setDeleting(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setDeleteMsg(data.error);
    }
  }

  return (
    <div className="p-4 sm:p-9 pb-16 max-w-[720px] flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold mb-1">Edit Profile</h1>
        <p className="text-[13px] text-[var(--text-muted)]">Manage your account details and security.</p>
      </div>

      <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-[18px]">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Profile photo" className="w-20 h-20 rounded-full object-cover border border-[var(--border)] shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-2xl font-bold font-display shrink-0">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={savingAvatar}
                className="px-3.5 py-2 rounded-[9px] border border-[var(--border)] text-[12.5px] font-semibold disabled:opacity-60"
              >
                {savingAvatar ? "Uploading…" : "Add photo"}
              </button>
              {avatarUrl && (
                <button onClick={deleteAvatar} disabled={savingAvatar} className="px-3.5 py-2 rounded-[9px] border border-[var(--danger)] text-[var(--danger)] text-[12.5px] font-semibold disabled:opacity-60">
                  Delete photo
                </button>
              )}
            </div>
            <div className="text-[11px] text-[var(--text-faint)] leading-relaxed">At least 500x500px recommended. Only image files are allowed, up to 5MB.</div>
            {avatarMsg && <div className="text-[11.5px] text-[var(--danger)]">{avatarMsg}</div>}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadAvatar(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-[18px]">
        <div className="flex items-center justify-between mb-4">
          <div className="font-display text-sm font-bold">Personal information</div>
          <button onClick={saveInfo} disabled={savingInfo} className="px-3.5 py-2 rounded-[9px] border border-[var(--border)] text-[12.5px] font-semibold disabled:opacity-60">
            {savingInfo ? "Saving…" : "Save"}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Username" value={username} onChange={setUsername} placeholder="Username" />
          <Field label="Email" value={email} onChange={setEmail} placeholder="Email" type="email" />
        </div>
        {infoMsg && <div className="text-[12px] text-[var(--text-muted)] mt-2.5">{infoMsg}</div>}
      </div>

      <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-[18px]">
        <div className="flex items-center justify-between mb-4">
          <div className="font-display text-sm font-bold">Change password</div>
          <button onClick={savePassword} disabled={savingPassword} className="px-3.5 py-2 rounded-[9px] border border-[var(--border)] text-[12.5px] font-semibold disabled:opacity-60">
            {savingPassword ? "Saving…" : "Save"}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Old password" value={oldPassword} onChange={setOldPassword} placeholder="Old password" type="password" />
          <div />
          <Field label="New password" value={newPassword} onChange={setNewPassword} placeholder="New password" type="password" hint="Minimum 8 characters" />
          <Field label="Repeat new password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Password" type="password" />
        </div>
        {passwordMsg && <div className="text-[12px] text-[var(--text-muted)] mt-2.5">{passwordMsg}</div>}
      </div>

      <div className="border border-[var(--danger)] rounded-2xl bg-[var(--surface)] p-[18px]">
        {!confirmingDelete ? (
          <div className="flex items-center justify-between">
            <div className="text-[13px] text-[var(--danger)]">Once you delete your account, there is no going back.</div>
            <button onClick={() => setConfirmingDelete(true)} className="px-3.5 py-2 rounded-[9px] border border-[var(--danger)] text-[var(--danger)] text-[12.5px] font-semibold shrink-0 ml-4">
              Delete Account
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-[13px] text-[var(--danger)]">
              This permanently deletes your account, uploads, comments, and payout history. Enter your password to confirm.
            </div>
            <div className="flex gap-2.5">
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your password"
                className="flex-1 border border-[var(--border)] rounded-[10px] px-3 py-2.5 text-[13px] outline-none"
              />
              <button onClick={deleteAccount} disabled={deleting || !deletePassword} className="px-4 py-2.5 rounded-[10px] bg-[var(--danger)] text-white text-[12.5px] font-semibold disabled:opacity-60">
                {deleting ? "Deleting…" : "Confirm Delete"}
              </button>
              <button onClick={() => { setConfirmingDelete(false); setDeletePassword(""); setDeleteMsg(""); }} className="px-4 py-2.5 rounded-[10px] border border-[var(--border)] text-[12.5px] font-semibold">
                Cancel
              </button>
            </div>
            {deleteMsg && <div className="text-[12px] text-[var(--danger)]">{deleteMsg}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="text-[11.5px] text-[var(--text-muted)] mb-1.5">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-[var(--border)] rounded-[10px] px-3 py-2.5 text-[13px] outline-none"
      />
      {hint && <div className="text-[10.5px] text-[var(--text-faint)] mt-1">{hint}</div>}
    </div>
  );
}
