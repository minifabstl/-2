import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Email sending. Reads the RESEND_API_KEY / EMAIL_FROM values from the
 * Cloudflare Worker environment via `getCloudflareContext().env` (this
 * project reads DB, R2, and all other Cloudflare bindings the same way —
 * `process.env` is not reliably populated in this environment).
 * If the API key isn't set (e.g. local development), it just logs to the console.
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const { env } = getCloudflareContext();
  const apiKey = env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[email:dev] Password reset link for ${email}: ${resetUrl}`);
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
      to: email,
      subject: "Password Reset Request",
      html: `<p>Click <a href="${resetUrl}">this link</a> to reset your password. This link expires in 1 hour.</p>
             <p>If you didn't request this, you can ignore this email — your password won't change.</p>`,
    }),
  });
}

/**
 * Sends a 6-digit code for the user-initiated "Forgot Password" flow.
 * Same read logic: logs to the console if there's no API key, sends for real via Resend otherwise.
 */
export async function sendPasswordResetCodeEmail(email: string, code: string) {
  const { env } = getCloudflareContext();
  const apiKey = env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[email:dev] Password reset code for ${email}: ${code}`);
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
      to: email,
      subject: "Your Password Reset Code",
      html: `<p>Use the code below to reset your password:</p>
             <p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${code}</p>
             <p>This code expires in 15 minutes.</p>
             <p>If you didn't request this, you can ignore this email — your password won't change.</p>`,
    }),
  });
}
