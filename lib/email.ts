/**
 * E-posta gönderim stub'ı. Gerçek üretimde burayı Resend, Postmark, SendGrid
 * gibi bir sağlayıcıyla değiştir (Cloudflare Workers ile uyumlu, fetch tabanlı
 * bir API kullanan sağlayıcılar en kolayı). Şimdilik sadece konsola yazar.
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[email:dev] ${email} adresine şifre sıfırlama bağlantısı: ${resetUrl}`);
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "no-reply@example.com",
      to: email,
      subject: "Şifre Sıfırlama Talebi",
      html: `<p>Şifreni sıfırlamak için <a href="${resetUrl}">bu bağlantıya</a> tıkla. Bu bağlantı 1 saat içinde geçersiz olur.</p>
             <p>Bu talebi sen yapmadıysan bu e-postayı yok sayabilirsin — şifren değişmez.</p>`,
    }),
  });
}

/**
 * Kullanıcının kendi başlattığı "Şifremi Unuttum" akışı için 6 haneli kod gönderir.
 * Aynı stub mantığı: API key yoksa konsola yazar, varsa Resend ile gerçekten gönderir.
 */
export async function sendPasswordResetCodeEmail(email: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[email:dev] ${email} adresine şifre sıfırlama kodu: ${code}`);
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "no-reply@example.com",
      to: email,
      subject: "Şifre Sıfırlama Kodun",
      html: `<p>Şifreni sıfırlamak için aşağıdaki kodu kullan:</p>
             <p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${code}</p>
             <p>Bu kod 15 dakika içinde geçersiz olur.</p>
             <p>Bu talebi sen yapmadıysan bu e-postayı yok sayabilirsin — şifren değişmez.</p>`,
    }),
  });
}
