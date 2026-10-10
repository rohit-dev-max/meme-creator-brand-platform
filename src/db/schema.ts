import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  handle: text("handle").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarEmoji: text("avatar_emoji").notNull().default("🔥"),
  avatarColor: text("avatar_color").notNull().default("#a3e635"),
  bio: text("bio").notNull().default(""),
  role: text("role").notNull().default("memer"), // memer | brand | admin
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  followers: integer("followers").notNull().default(0),
  verified: boolean("verified").notNull().default(false),
  // auth
  email: text("email").unique(),
  passwordHash: text("password_hash"), // bcrypt — never plain text
  emailVerified: boolean("email_verified").notNull().default(false),
  verifyToken: text("verify_token"),
  resetToken: text("reset_token"),
  resetTokenExp: timestamp("reset_token_exp"),
  failedLogins: integer("failed_logins").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  lastLoginAt: timestamp("last_login_at"),
  // dob for 18+ gate on dark humor
  dob: text("dob"),
  // monetization
  isPro: boolean("is_pro").notNull().default(false),
  proExpiresAt: timestamp("pro_expires_at"),
  upiId: text("upi_id"),
  kycStatus: text("kyc_status").notNull().default("none"), // none | pending | verified
  // moderation
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memes = pgTable("memes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  topText: text("top_text").notNull().default(""),
  bottomText: text("bottom_text").notNull().default(""),
  tags: text("tags").notNull().default(""),
  upvotes: integer("upvotes").notNull().default(0),
  downvotes: integer("downvotes").notNull().default(0),
  score: integer("score").notNull().default(0),
  views: integer("views").notNull().default(0),
  commentsCount: integer("comments_count").notNull().default(0),
  template: text("template").notNull().default("custom"),
  // moderation / NSFW (strict — never user-toggleable)
  isNsfw: boolean("is_nsfw").notNull().default(false),
  moderationStatus: text("moderation_status").notNull().default("approved"), // pending | approved | rejected
  // boosts (promoted posts)
  boostedUntil: timestamp("boosted_until"),
  boostTier: text("boost_tier"), // 24h | 72h
  // motw
  motwWeek: text("motw_week"), // ISO week label e.g. 2026-W41
  motwRank: integer("motw_rank"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memeId: uuid("meme_id")
      .notNull()
      .references(() => memes.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    value: integer("value").notNull(), // 1 or -1
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("votes_meme_user_idx").on(t.memeId, t.userId)]
);

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  memeId: uuid("meme_id")
    .notNull()
    .references(() => memes.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  likes: integer("likes").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const challenges = pgTable("challenges", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  coverGradient: text("cover_gradient").notNull().default("from-lime-400 to-emerald-500"),
  prize: text("prize").notNull().default("$500"),
  prizePool: integer("prize_pool").notNull().default(500),
  startsAt: timestamp("starts_at").defaultNow().notNull(),
  endsAt: timestamp("ends_at").notNull(),
  status: text("status").notNull().default("live"), // live | upcoming | ended
  rules: text("rules").notNull().default(""),
  sponsorName: text("sponsor_name").notNull().default("MemeArena"),
  sponsorEmoji: text("sponsor_emoji").notNull().default("🏆"),
  entryCount: integer("entry_count").notNull().default(0),
  votesCount: integer("votes_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const challengeEntries = pgTable("challenge_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  challengeId: uuid("challenge_id")
    .notNull()
    .references(() => challenges.id, { onDelete: "cascade" }),
  memeId: uuid("meme_id")
    .notNull()
    .references(() => memes.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  votes: integer("votes").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  brandUserId: uuid("brand_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  brandName: text("brand_name").notNull(),
  brandLogoEmoji: text("brand_logo_emoji").notNull().default("🏢"),
  title: text("title").notNull(),
  brief: text("brief").notNull(),
  category: text("category").notNull().default("General"),
  budgetMin: integer("budget_min").notNull().default(100),
  budgetMax: integer("budget_max").notNull().default(1000),
  deadline: timestamp("deadline").notNull(),
  status: text("status").notNull().default("open"), // open | closed | filled
  applicants: integer("applicants").notNull().default(0),
  requirements: text("requirements").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  memerId: uuid("memer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  pitch: text("pitch").notNull(),
  portfolioUrl: text("portfolio_url").notNull().default(""),
  status: text("status").notNull().default("pending"), // pending | accepted | rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const follows = pgTable(
  "follows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: uuid("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("follows_pair_idx").on(t.followerId, t.followingId)]
);

export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  issueType: text("issue_type").notNull().default("general"),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"), // open | answered | closed
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blockedTerms = pgTable("blocked_terms", {
  id: uuid("id").defaultRandom().primaryKey(),
  term: text("term").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const moderationFlags = pgTable("moderation_flags", {
  id: uuid("id").defaultRandom().primaryKey(),
  memeId: uuid("meme_id").references(() => memes.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  reason: text("reason").notNull().default(""),
  auto: boolean("auto").notNull().default(false),
  status: text("status").notNull().default("open"), // open | resolved | dismissed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const weeklyWinners = pgTable("weekly_winners", {
  id: uuid("id").defaultRandom().primaryKey(),
  week: text("week").notNull().unique(), // e.g. 2026-W41
  memeId: uuid("meme_id").references(() => memes.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").notNull().default(0),
  hallOfFame: boolean("hall_of_fame").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // follow | reaction | comment | mention | new_post | motw | tip | payment | subscription | moderation
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  memeId: uuid("meme_id").references(() => memes.id, { onDelete: "cascade" }),
  commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  inApp: boolean("in_app").notNull().default(true),
  email: boolean("email").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("notif_pref_user_type_idx").on(t.userId, t.type)]);

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  kind: text("kind").notNull(), // tip | pro | boost | payout | refund
  amount: integer("amount").notNull(), // paise
  currency: text("currency").notNull().default("INR"),
  status: text("status").notNull().default("created"), // created | paid | failed | refunded
  gateway: text("gateway").notNull().default("razorpay"),
  gatewayOrderId: text("gateway_order_id"),
  gatewayPaymentId: text("gateway_payment_id"),
  gatewaySignature: text("gateway_signature"),
  idempotencyKey: text("idempotency_key").unique(),
  meta: jsonb("meta").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tips = pgTable("tips", {
  id: uuid("id").defaultRandom().primaryKey(),
  fromUserId: uuid("from_user_id").references(() => users.id, { onDelete: "set null" }),
  toUserId: uuid("to_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  memeId: uuid("meme_id").references(() => memes.id, { onDelete: "set null" }),
  amount: integer("amount").notNull(), // paise
  paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan").notNull(), // pro_monthly | pro_yearly
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("active"), // active | cancelled | expired
  gatewaySubId: text("gateway_sub_id"),
  startsAt: timestamp("starts_at").defaultNow().notNull(),
  endsAt: timestamp("ends_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payouts = pgTable("payouts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  method: text("method").notNull(), // upi | bank
  destination: text("destination").notNull().default(""),
  status: text("status").notNull().default("pending"), // pending | paid | failed
  gatewayPayoutId: text("gateway_payout_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const refunds = pgTable("refunds", {
  id: uuid("id").defaultRandom().primaryKey(),
  paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "set null" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull().default(""),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "set null" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("INR"),
  invoiceNo: text("invoice_no").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const searchHistory = pgTable("search_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blocks = pgTable("blocks", {
  id: uuid("id").defaultRandom().primaryKey(),
  blockerId: uuid("blocker_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  blockedId: uuid("blocked_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("blocks_pair_idx").on(t.blockerId, t.blockedId)]);

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  userAgent: text("user_agent").notNull().default(""),
  ip: text("ip").notNull().default(""),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Meme = typeof memes.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type WeeklyWinner = typeof weeklyWinners.$inferSelect;
