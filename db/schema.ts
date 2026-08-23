import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // nanoid
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  // Passwords are NEVER stored as plain text. passwordHash = PBKDF2-derived hash,
  // passwordSalt = a random salt unique to each user. Cannot be displayed / retrieved.
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  status: text("status", { enum: ["active", "suspended"] }).notNull().default("active"),
  bitcoinAddress: text("bitcoin_address"),
  // Notification preferences (all default to on) — see lib/email.ts for the emails they gate.
  notifyOnApproval: integer("notify_on_approval", { mode: "boolean" }).notNull().default(true),
  notifyOnRejection: integer("notify_on_rejection", { mode: "boolean" }).notNull().default(true),
  notifyOnComment: integer("notify_on_comment", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ---------------------------------------------------------------------------
// Sessions (cookie-based session)
// ---------------------------------------------------------------------------
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), // session token (nanoid, stored in the cookie)
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ---------------------------------------------------------------------------
// Password reset requests — can be triggered by an admin or by the user.
// The token is single-use and time-limited; the password itself is never stored anywhere.
// ---------------------------------------------------------------------------
export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id").primaryKey(), // nanoid token
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ---------------------------------------------------------------------------
// Password reset codes — triggered by the USER THEMSELVES via the "Forgot
// Password" flow. Unlike the admin's link-based `passwordResetTokens` flow
// above, here a 6-digit code is sent to the user's email, and the user enters
// that code to set their own new password.
// ---------------------------------------------------------------------------
export const passwordResetCodes = sqliteTable("password_reset_codes", {
  id: text("id").primaryKey(), // nanoid
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull(), // 6-digit numeric code
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ---------------------------------------------------------------------------
// Posts (video / photo)
// ---------------------------------------------------------------------------
export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["video", "photo"] }).notNull(),
  title: text("title").notNull(),
  category: text("category"), // muzik | oyun | egitim | spor | teknoloji | komedi (category slugs, do not translate)
  // Key of the media file stored in Cloudflare R2 (see lib/storage.ts)
  mediaKey: text("media_key").notNull(),
  thumbnailKey: text("thumbnail_key"),
  // pending: awaiting admin approval, not visible in the feed. live: approved, visible in the public feed.
  // flagged: reported by users but still live. removed: taken down/rejected by an admin.
  status: text("status", { enum: ["pending", "live", "flagged", "removed"] }).notNull().default("pending"),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ---------------------------------------------------------------------------
// Likes — can only be created by logged-in users (enforced at the API layer)
// ---------------------------------------------------------------------------
export const likes = sqliteTable("likes", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ---------------------------------------------------------------------------
// Comments — can only be created by logged-in users
// ---------------------------------------------------------------------------
export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ---------------------------------------------------------------------------
// Payouts — payout records derived from earnings of $0.20 per 1000 views.
// In this MVP no real Bitcoin transfer is made; the "paid" status is marked
// manually by an admin (see README > Bitcoin payouts).
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
