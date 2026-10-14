"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { qrCodes, reports, users } from "@/db/schema";
import { requireAdmin } from "./admin";
import { slugSchema } from "./validators";

async function guard() {
  const session = await requireAdmin();
  if (!session) throw new Error("Forbidden");
  return session;
}

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/qrs");
  revalidatePath("/admin/reports");
}

export async function resolveReports(formData: FormData): Promise<void> {
  await guard();
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
  revalidateAdmin();
}

export async function suspendUser(userId: string): Promise<void> {
  await guard();
  await db.update(users).set({ status: "suspended" }).where(eq(users.id, userId));
  revalidateAdmin();
  revalidatePath(`/admin/users/${userId}`);
}

export async function unsuspendUser(userId: string): Promise<void> {
  await guard();
  await db.update(users).set({ status: "active" }).where(eq(users.id, userId));
  revalidateAdmin();
  revalidatePath(`/admin/users/${userId}`);
}

export async function setUserRole(userId: string, role: "user" | "admin"): Promise<void> {
  await guard();
  if (role !== "user" && role !== "admin") return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
  revalidateAdmin();
  revalidatePath(`/admin/users/${userId}`);
}

export async function updateUserNotes(userId: string, notes: string): Promise<void> {
  await guard();
  await db.update(users).set({ notes: notes.slice(0, 2000) || null }).where(eq(users.id, userId));
  revalidatePath(`/admin/users/${userId}`);
}

export async function deleteUserAsAdmin(userId: string): Promise<void> {
  const session = await guard();
  if (session.user?.id === userId) throw new Error("Cannot delete yourself");
  await db.delete(users).where(eq(users.id, userId));
  revalidateAdmin();
}

export async function adminToggleQr(id: string): Promise<void> {
  await guard();
  if (!z.uuid().safeParse(id).success) return;
  const [qr] = await db.select({ active: qrCodes.active }).from(qrCodes).where(eq(qrCodes.id, id)).limit(1);
  if (!qr) return;
  await db.update(qrCodes).set({ active: !qr.active, updatedAt: new Date() }).where(eq(qrCodes.id, id));
  revalidateAdmin();
  revalidatePath(`/dashboard/${id}`);
}

export async function adminSetQrActive(id: string, active: boolean): Promise<void> {
  await guard();
  if (!z.uuid().safeParse(id).success) return;
  await db.update(qrCodes).set({ active, updatedAt: new Date() }).where(eq(qrCodes.id, id));
  revalidateAdmin();
}
