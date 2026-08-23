/**
 * Password hashing — uses the Web Crypto API (PBKDF2-SHA256).
 *
 * IMPORTANT SECURITY NOTE: Passwords are never stored as plain text, logged,
 * or returned via the API. They are only hashed/compared through the
 * functions in this file. No location, including the admin panel, can ever
 * display a user's actual password — see
 * app/api/admin/users/[id]/reset-password/route.ts (it only generates a
 * reset link, never shows the password).
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
  // Constant-time comparison to guard against timing attacks
  if (candidateHex.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < candidateHex.length; i++) {
    diff |= candidateHex.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return diff === 0;
}
