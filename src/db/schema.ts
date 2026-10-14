import {
  bigserial, boolean, index, integer, jsonb, pgTable, text, timestamp, uuid,
} from "drizzle-orm/pg-core";
import type { QrDesign } from "@/lib/design";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Google "sub" (stable, never changes)
  email: text("email").notNull(),
  name: text("name"),
  image: text("image"),
  status: text("status").notNull().default("active"), // active | suspended
  role: text("role").notNull().default("user"), // user | admin
  notes: text("notes"), // admin-only notes
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const qrCodes = pgTable(
  "qr_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(), // what the QR actually encodes: /r/<slug>
    destination: text("destination").notNull(), // editable any time
    design: jsonb("design").$type<QrDesign>().notNull(),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    folder: text("folder"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("qr_codes_user_idx").on(t.userId)],
);

export const scans = pgTable(
  "scans",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    qrId: uuid("qr_id").notNull().references(() => qrCodes.id, { onDelete: "cascade" }),
    ts: timestamp("ts", { withTimezone: true }).defaultNow().notNull(),
    country: text("country"),
    region: text("region"),
    city: text("city"),
    device: text("device"),
    browser: text("browser"),
    os: text("os"),
    referrer: text("referrer"), // hostname only
    language: text("language"),
    visitorHash: text("visitor_hash"), // salted + daily-rotating, null when DNT/GPC is on
    isBot: boolean("is_bot").notNull().default(false),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
  },
  (t) => [index("scans_qr_ts_idx").on(t.qrId, t.ts)],
);

// Abuse reports from the public /report form. Kept by slug so they survive a QR being deleted.
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    reason: text("reason").notNull(), // phishing | malware | illegal | copyright | other
    details: text("details"),
    reporterHash: text("reporter_hash").notNull(), // salted hash, used only to count distinct reporters / rate limit
    status: text("status").notNull().default("open"), // open | actioned | dismissed
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("reports_slug_idx").on(t.slug)],
);

// Tiny fixed-window rate limiter that lives in Postgres, so no extra service is needed.
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});
