"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { qrCodes, reports } from "@/db/schema";
import { requireAdmin } from "./admin";
import { slugSchema } from "./validators";

export async function resolveReports(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) throw new Error("Forbidden"); // re-checked here, never trust the page alone
  const slug = slugSchema.safeParse(formData.get("slug"));
  const action = formData.get("action");
  if (!slug.success || (action !== "pause" && action !== "dismiss")) return;

  if (action === "pause") {
    await db.update(qrCodes).set({ active: false, updatedAt: new Date() }).where(eq(qrCodes.slug, slug.data));
  }
  await db
    .update(reports)
    .set({ status: action === "pause" ? "actioned" : "dismissed" })
    .where(and(eq(reports.slug, slug.data), eq(reports.status, "open")));
  revalidatePath("/admin/reports");
}
