"use server";

import { and, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { qrCodes, reports } from "@/db/schema";
import { clientKey, rateLimit } from "./security";
import { slugSchema } from "./validators";

const schema = z.object({
  slug: slugSchema,
  reason: z.enum(["phishing", "malware", "illegal", "copyright", "other"]),
  details: z.string().trim().max(1000).optional(),
});

export async function submitReport(formData: FormData): Promise<void> {
  if (formData.get("website")) redirect("/report?sent=1"); // honeypot: bots fill hidden fields, humans never see it

  const parsed = schema.safeParse({
    slug: String(formData.get("slug") ?? "").trim(),
    reason: formData.get("reason"),
    details: String(formData.get("details") ?? "") || undefined,
  });
  if (!parsed.success) redirect("/report?error=invalid");
  const { slug, reason, details } = parsed.data;

  const who = await clientKey();
  if (!(await rateLimit(`report:${who}`, 5, 3600))) redirect("/report?error=rate");

  await db.insert(reports).values({ slug, reason, details: details ?? null, reporterHash: who });

  // Auto-pause when several DISTINCT reporters flag phishing/malware. A human admin reviews it afterwards.
  if (reason === "phishing" || reason === "malware") {
    const threshold = Number(process.env.REPORT_AUTOPAUSE_THRESHOLD ?? 3);
    const [{ n }] = await db
      .select({ n: sql<number>`count(distinct ${reports.reporterHash})::int` })
      .from(reports)
      .where(and(eq(reports.slug, slug), eq(reports.status, "open"), sql`${reports.reason} in ('phishing','malware')`));
    if (n >= threshold) await db.update(qrCodes).set({ active: false, updatedAt: new Date() }).where(eq(qrCodes.slug, slug));
  }
  redirect("/report?sent=1");
}
