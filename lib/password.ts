/**
 * Şifre hash'leme — Web Crypto API (PBKDF2-SHA256) kullanır.
 *
 * ÖNEMLİ GÜVENLİK NOTU: Şifreler hiçbir zaman düz metin olarak saklanmaz,
 * loglanmaz veya API üzerinden geri döndürülmez. Sadece bu dosyadaki
 * fonksiyonlar üzerinden hash'lenir/karşılaştırılır. Yönetici paneli dahil
 * hiçbir yer, hiçbir kullanıcının gerçek şifresini gösteremez — bkz.
 * app/api/admin/users/[id]/reset-password/route.ts (sadece sıfırlama linki
 * üretir, şifreyi asla göstermez).
 */

const ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 256;

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function deriveBits(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    KEY_LENGTH_BITS
  );
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const derived = await deriveBits(password, saltBytes);
  return { hash: bufferToHex(derived), salt: bufferToHex(saltBytes.buffer as ArrayBuffer) };
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const saltBytes = hexToBuffer(salt);
  const derived = await deriveBits(password, saltBytes);
  const candidateHex = bufferToHex(derived);
  // Zamanlama saldırılarına karşı sabit-zamanlı karşılaştırma
  if (candidateHex.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < candidateHex.length; i++) {
    diff |= candidateHex.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return diff === 0;
}
