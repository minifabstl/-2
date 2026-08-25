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
  // Key of the user's profile photo in Cloudflare R2 (see lib/storage.ts), null if not set.
  avatarKey: text("avatar_key"),
  // Hand-granted by an admin — the top Creator Program tier (see lib/earnings.ts calculateTier).
  verifiedCreator: integer("verified_creator", { mode: "boolean" }).notNull().default(false),
  // Total time the user has spent actively on the site, in seconds (see lib/gift.ts and
  // app/api/track-time/route.ts). Powers the "100 hours = $50 OnlyFans account" gift program.
  activeSeconds: integer("active_seconds").notNull().default(0),
  // Set the first time activeSeconds crosses the gift milestone threshold. Null until then.
  giftMilestoneReachedAt: integer("gift_milestone_reached_at", { mode: "timestamp" }),
  // Set by an admin once the gift has actually been sent to the user (see admin > Gift Milestones).
  giftSentAt: integer("gift_sent_at", { mode: "timestamp" }),
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
  category: text("category"), // deprecated, unused — kept so we don't need a DROP COLUMN migration
  // JSON-stringified array of up to 5 user-supplied SEO keyword tags, e.g. ["amateur","turkish","2026"].
  // Shown as clickable chips on post cards (each links to /search?q=tag) so the crawlable page text
  // carries the keywords the uploader chose, for discoverability on Google.
  tags: text("tags"),
  // Key of the media file stored in Cloudflare R2 (see lib/storage.ts)
  mediaKey: text("media_key").notNull(),
  thumbnailKey: text("thumbnail_key"),
  // pending: awaiting admin approval, not visible in the feed. live: approved, visible in the public feed.
  // flagged: reported by users but still live. removed: taken down/rejected by an admin.
  status: text("status", { enum: ["pending", "live", "flagged", "removed"] }).notNull().default("pending"),
  viewCount: integer("view_count").notNull().default(0),
  // Views within the CURRENT calendar week (Monday-anchored, UTC), for the Creator Program
  // leaderboard. Reset lazily the next time a view lands after the week has rolled over
  // (see app/api/posts/[id]/view/route.ts) — there is no scheduled/cron job in this project.
  weekViewCount: integer("week_view_count").notNull().default(0),
  weekStartAt: integer("week_start_at", { mode: "timestamp" }),
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
// Upload bonuses — a one-time cash bonus granted when a post is approved for
// the FIRST time (not on re-approval/restore). The first approved post of a
// user's account earns FIRST_UPLOAD_BONUS_USD, every approved post after
// that earns REPEAT_UPLOAD_BONUS_USD (see lib/earnings.ts). One row per post.
// ---------------------------------------------------------------------------
export const bonuses = sqliteTable("bonuses", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }).unique(),
  amountUsd: real("amount_usd").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ---------------------------------------------------------------------------
// Payouts — payout records derived from earnings of $0.20 per 1000 views,
// plus any upload bonuses (see `bonuses` above).
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

// ---------------------------------------------------------------------------
// Search logs — one row per search actually performed (from the header or
// sidebar search box, or a direct /search?q= visit). Used to compute a real,
// data-driven "Trending searches" top 5 — never a fabricated/static list.
// ---------------------------------------------------------------------------
export const searchLogs = sqliteTable("search_logs", {
  id: text("id").primaryKey(),
  query: text("query").notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ---------------------------------------------------------------------------
// Models — a curated directory of named people ("popular models/creators") that any logged-in
// user can add. A model is really just a named profile page over the existing tag system: its
// `name` is matched against post tags (see lib/posts.ts hasExactTag) to build "everything ever
// uploaded under this person's name", the same mechanism that already powers /search topic pages.
// This table just gives that name a browsable directory entry with a picture and a stable URL.
// ---------------------------------------------------------------------------
export const models = sqliteTable("models", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // matched case-insensitively against post tags, e.g. "Ronaldo"
  slug: text("slug").notNull().unique(), // url-safe, unique — e.g. "ronaldo" or "ronaldo-2"
  photoKey: text("photo_key").notNull(), // key of the model's photo in Cloudflare R2
  createdByUserId: text("created_by_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ---------------------------------------------------------------------------
// Login attempts — one row per FAILED login, and per registration, keyed by
// something the caller can't cheaply throw away (the username/email being
// attempted, or the request's IP). See lib/rateLimit.ts. This is a basic,
// self-contained brute-force/spam guard; it is not a substitute for an
// edge-level rate limit (a Cloudflare Rate Limiting rule in front of
// /api/auth/* is the right place to stop distributed/scripted abuse).
// ---------------------------------------------------------------------------
export const loginAttempts = sqliteTable("login_attempts", {
  id: text("id").primaryKey(),
  key: text("key").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
