import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Kullanıcılar
// ---------------------------------------------------------------------------
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // nanoid
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  // Şifre ASLA düz metin olarak tutulmaz. passwordHash = PBKDF2 türetilmiş hash,
  // passwordSalt = her kullanıcıya özel rastgele tuz. Görüntülenemez / geri döndürülemez.
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  status: text("status", { enum: ["active", "suspended"] }).notNull().default("active"),
  bitcoinAddress: text("bitcoin_address"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ---------------------------------------------------------------------------
// Oturumlar (cookie tabanlı session)
// ---------------------------------------------------------------------------
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), // session token (nanoid, cookie'de saklanır)
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ---------------------------------------------------------------------------
// Şifre sıfırlama talepleri — admin veya kullanıcı tetikleyebilir.
// Token tek kullanımlık ve süreli; şifrenin kendisi hiçbir yerde tutulmaz.
// ---------------------------------------------------------------------------
export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id").primaryKey(), // nanoid token
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ---------------------------------------------------------------------------
// Gönderiler (video / fotoğraf)
// ---------------------------------------------------------------------------
export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["video", "photo"] }).notNull(),
  title: text("title").notNull(),
  category: text("category"), // muzik | oyun | egitim | spor | teknoloji | komedi
  // Cloudflare R2'de saklanan medya dosyasının anahtarı (bkz. lib/storage.ts)
  mediaKey: text("media_key").notNull(),
  thumbnailKey: text("thumbnail_key"),
  // pending: admin onayı bekliyor, akışta görünmez. live: onaylandı, herkese açık akışta görünür.
  // flagged: kullanıcılar tarafından şikayet edilmiş ama hâlâ yayında. removed: admin tarafından kaldırılmış/reddedilmiş.
  status: text("status", { enum: ["pending", "live", "flagged", "removed"] }).notNull().default("pending"),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ---------------------------------------------------------------------------
// Beğeniler — sadece giriş yapmış kullanıcılar oluşturabilir (API katmanında kontrol edilir)
// ---------------------------------------------------------------------------
export const likes = sqliteTable("likes", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ---------------------------------------------------------------------------
// Yorumlar — sadece giriş yapmış kullanıcılar oluşturabilir
// ---------------------------------------------------------------------------
export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ---------------------------------------------------------------------------
// Ödemeler — 1000 izlenme başına 0.20$ kazanç hesabından doğan ödeme kayıtları.
// Bu MVP'de gerçek Bitcoin transferi YAPILMAZ; "paid" durumu admin tarafından
// manuel işaretlenir (bkz. README > Bitcoin ödemeleri).
// ---------------------------------------------------------------------------
export const payouts = sqliteTable("payouts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amountUsd: real("amount_usd").notNull(),
  bitcoinAddress: text("bitcoin_address").notNull(),
  status: text("status", { enum: ["pending", "paid"] }).notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  paidAt: integer("paid_at", { mode: "timestamp" }),
});
