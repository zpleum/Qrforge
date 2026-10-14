import { createHash } from "node:crypto";
import { isbot } from "isbot";
import { UAParser } from "ua-parser-js";
import { db } from "@/db";
import { scans } from "@/db/schema";
import { parseUtm } from "./utm";

const dec = (v: string | null) => {
  if (!v) return null;
  try { return decodeURIComponent(v).slice(0, 80); } catch { return v.slice(0, 80); }
};

/**
 * Records one scan. Runs inside next/server `after()` so the visitor is redirected first.
 * Never stores IP or raw user-agent. Respects DNT / GPC. Bots flagged via is_bot.
 */
export async function recordScan(qrId: string, h: Headers, destination?: string) {
  try {
    const ua = h.get("user-agent") ?? "";
    const optedOut = h.get("sec-gpc") === "1" || h.get("dnt") === "1";
    const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    const day = new Date().toISOString().slice(0, 10);
    const salt = process.env.ANALYTICS_SALT ?? process.env.AUTH_SECRET ?? "";
    const visitorHash =
      optedOut || !ip ? null : createHash("sha256").update(`${salt}|${day}|${ip}|${ua}`).digest("hex").slice(0, 32);

    const r = UAParser(ua);
    let referrer: string | null = null;
    try { const ref = h.get("referer"); if (ref) referrer = new URL(ref).hostname.slice(0, 120); } catch {}

    const utm = destination ? parseUtm(destination) : { utmSource: null, utmMedium: null, utmCampaign: null };

    await db.insert(scans).values({
      qrId,
      country: h.get("x-vercel-ip-country"),
      region: dec(h.get("x-vercel-ip-country-region")),
      city: dec(h.get("x-vercel-ip-city")),
      device: ua ? (r.device.type ?? "desktop") : "unknown",
      browser: r.browser.name ?? null,
      os: r.os.name ?? null,
      referrer,
      language: h.get("accept-language")?.split(",")[0]?.split(";")[0]?.trim().slice(0, 10) || null,
      visitorHash,
      isBot: isbot(ua),
      ...utm,
    });
  } catch (err) {
    console.error("recordScan failed", err);
  }
}
