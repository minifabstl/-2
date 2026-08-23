import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Email sending. Reads the RESEND_API_KEY / EMAIL_FROM values from the
 * Cloudflare Worker environment via `getCloudflareContext().env` (this
 * project reads DB, R2, and all other Cloudflare bindings the same way —
 * `process.env` is not reliably populated in this environment).
 * If the API key isn't set (e.g. local development), it just logs to the console.
 */
async function sendEmail(to: string, subject: string, html: string) {
  const { env } = getCloudflareContext();
  const apiKey = env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[email:dev] "${subject}" to ${to}`);
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM ?? "no-reply@example.com",
      to,
      subject,
      html,
    }),
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await sendEmail(
    email,
    "Password Reset Request",
    `<p>Click <a href="${resetUrl}">this link</a> to reset your password. This link expires in 1 hour.</p>
     <p>If you didn't request this, you can ignore this email — your password won't change.</p>`
  );
}

/** Sent when an admin approves one of the user's uploads (if they have this notification enabled). */
export async function sendContentApprovedEmail(email: string, title: string) {
  await sendEmail(
    email,
    "Your upload was approved",
    `<p>Good news — your upload <strong>${escapeHtml(title)}</strong> has been approved and is now live in the public feed.</p>
     <p>You can manage your notification settings any time from Preferences in your profile menu.</p>`
  );
}

/** Sent when an admin rejects/removes one of the user's uploads (if they have this notification enabled). */
export async function sendContentRejectedEmail(email: string, title: string) {
  await sendEmail(
    email,
    "Your upload was not approved",
    `<p>Your upload <strong>${escapeHtml(title)}</strong> was not approved and has been removed.</p>
     <p>If you think this was a mistake, you can contact the admin team. Check our Terms of Service for what content is allowed.</p>
     <p>You can manage your notification settings any time from Preferences in your profile menu.</p>`
  );
}

/** Sent when someone comments on the user's post (if they have this notification enabled). */
export async function sendNewCommentEmail(email: string, title: string, commenterUsername: string) {
  await sendEmail(
    email,
    "New comment on your post",
    `<p><strong>@${escapeHtml(commenterUsername)}</strong> commented on your post <strong>${escapeHtml(title)}</strong>.</p>
     <p>You can manage your notification settings any time from Preferences in your profile menu.</p>`
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Sends a 6-digit code for the user-initiated "Forgot Password" flow. */
export async function sendPasswordResetCodeEmail(email: string, code: string) {
  await sendEmail(
    email,
    "Your Password Reset Code",
    `<p>Use the code below to reset your password:</p>
     <p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${code}</p>
     <p>This code expires in 15 minutes.</p>
     <p>If you didn't request this, you can ignore this email — your password won't change.</p>`
  );
}
