"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { qrCodes, reports, users } from "@/db/schema";
import { requireAdmin } from "./admin";
import { isAdminEmail } from "./admin-emails";
import { destinationSchema, slugSchema } from "./validators";
import { isUnsafe } from "./webrisk";

async function guard() {
  const session = await requireAdmin();
  if (!session) throw new Error("Forbidden");
  return session;
}

function revalidateAdmin(userId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/qrs");
  revalidatePath("/admin/reports");
  if (userId) revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/dashboard");
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
  const session = await guard();
  if (session.user?.id === userId) throw new Error("ระงับบัญชีตัวเองไม่ได้");
  const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  if (u && isAdminEmail(u.email)) throw new Error("ระงับบัญชีทีมงานไม่ได้");
  await db.update(users).set({ status: "suspended" }).where(eq(users.id, userId));
  // Pause all their QRs when suspending
  await db.update(qrCodes).set({ active: false, updatedAt: new Date() }).where(eq(qrCodes.userId, userId));
  revalidateAdmin(userId);
}

export async function unsuspendUser(userId: string): Promise<void> {
  await guard();
  await db.update(users).set({ status: "active" }).where(eq(users.id, userId));
  revalidateAdmin(userId);
}

export async function updateUserNotes(userId: string, notes: string): Promise<void> {
  await guard();
  await db.update(users).set({ notes: notes.slice(0, 2000) || null }).where(eq(users.id, userId));
  revalidatePath(`/admin/users/${userId}`);
}

export async function updateUserAsAdmin(
  userId: string,
  input: { name?: string | null },
): Promise<{ ok: true } | { ok: false; error: string }> {
  await guard();
  const name = input.name === undefined ? undefined : (input.name?.trim().slice(0, 120) || null);
  if (name !== undefined) {
    await db.update(users).set({ name }).where(eq(users.id, userId));
  }
  revalidateAdmin(userId);
  return { ok: true };
}

export async function deleteUserAsAdmin(userId: string): Promise<void> {
  const session = await guard();
  if (session.user?.id === userId) throw new Error("ลบบัญชีตัวเองไม่ได้");
  const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  if (u && isAdminEmail(u.email)) throw new Error("ลบบัญชีทีมงานไม่ได้");
  await db.delete(users).where(eq(users.id, userId));
  revalidateAdmin();
}

export async function bulkSuspendUsers(ids: string[]): Promise<{ ok: boolean; error?: string }> {
  const session = await guard();
  const clean = ids.filter((id) => id && id !== session.user?.id).slice(0, 50);
  if (!clean.length) return { ok: false, error: "ไม่ได้เลือกผู้ใช้" };
  const staff = await db.select({ id: users.id, email: users.email }).from(users).where(inArray(users.id, clean));
  const allowed = staff.filter((u) => !isAdminEmail(u.email)).map((u) => u.id);
  if (!allowed.length) return { ok: false, error: "ไม่สามารถระงับบัญชีทีมงานได้" };
  await db.update(users).set({ status: "suspended" }).where(inArray(users.id, allowed));
  await db.update(qrCodes).set({ active: false, updatedAt: new Date() }).where(inArray(qrCodes.userId, allowed));
  revalidateAdmin();
  return { ok: true };
}

export async function bulkUnsuspendUsers(ids: string[]): Promise<{ ok: boolean; error?: string }> {
  await guard();
  const clean = ids.filter(Boolean).slice(0, 50);
  if (!clean.length) return { ok: false, error: "ไม่ได้เลือกผู้ใช้" };
  await db.update(users).set({ status: "active" }).where(inArray(users.id, clean));
  revalidateAdmin();
  return { ok: true };
}

export async function adminToggleQr(id: string): Promise<void> {
  await guard();
  if (!z.uuid().safeParse(id).success) return;
  const [qr] = await db.select({ active: qrCodes.active, userId: qrCodes.userId }).from(qrCodes).where(eq(qrCodes.id, id)).limit(1);
  if (!qr) return;
  await db.update(qrCodes).set({ active: !qr.active, updatedAt: new Date() }).where(eq(qrCodes.id, id));
  revalidateAdmin(qr.userId);
  revalidatePath(`/dashboard/${id}`);
}

export async function adminSetQrActive(id: string, active: boolean): Promise<void> {
  await guard();
  if (!z.uuid().safeParse(id).success) return;
  const [qr] = await db.select({ userId: qrCodes.userId }).from(qrCodes).where(eq(qrCodes.id, id)).limit(1);
  await db.update(qrCodes).set({ active, updatedAt: new Date() }).where(eq(qrCodes.id, id));
  revalidateAdmin(qr?.userId);
}

export async function adminDeleteQr(id: string): Promise<{ ok: boolean; error?: string }> {
  await guard();
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "ไม่พบ QR" };
  const [qr] = await db.select({ userId: qrCodes.userId }).from(qrCodes).where(eq(qrCodes.id, id)).limit(1);
  if (!qr) return { ok: false, error: "ไม่พบ QR" };
  await db.delete(qrCodes).where(eq(qrCodes.id, id));
  revalidateAdmin(qr.userId);
  revalidatePath(`/dashboard/${id}`);
  return { ok: true };
}

export async function adminUpdateQr(
  id: string,
  input: { name?: string; destination?: string; active?: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
  await guard();
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "ไม่พบ QR" };
  const [qr] = await db.select().from(qrCodes).where(eq(qrCodes.id, id)).limit(1);
  if (!qr) return { ok: false, error: "ไม่พบ QR" };

  const patch: Partial<typeof qrCodes.$inferInsert> = { updatedAt: new Date() };
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name || name.length > 80) return { ok: false, error: "ชื่อไม่ถูกต้อง" };
    patch.name = name;
  }
  if (input.destination !== undefined) {
    const dest = destinationSchema.safeParse(input.destination);
    if (!dest.success) return { ok: false, error: dest.error.issues[0]?.message ?? "URL ไม่ถูกต้อง" };
    if (await isUnsafe(dest.data)) return { ok: false, error: "ลิงก์ไม่ปลอดภัย" };
    patch.destination = dest.data;
  }
  if (input.active !== undefined) patch.active = input.active;

  await db.update(qrCodes).set(patch).where(eq(qrCodes.id, id));
  revalidateAdmin(qr.userId);
  revalidatePath(`/dashboard/${id}`);
  return { ok: true };
}

export async function adminSetAllUserQrs(userId: string, active: boolean): Promise<void> {
  await guard();
  await db.update(qrCodes).set({ active, updatedAt: new Date() }).where(eq(qrCodes.userId, userId));
  revalidateAdmin(userId);
}

export async function adminBulkSetQrs(ids: string[], active: boolean): Promise<{ ok: boolean; error?: string }> {
  await guard();
  const clean = ids.filter((id) => z.uuid().safeParse(id).success).slice(0, 100);
  if (!clean.length) return { ok: false, error: "ไม่ได้เลือก QR" };
  await db.update(qrCodes).set({ active, updatedAt: new Date() }).where(inArray(qrCodes.id, clean));
  revalidateAdmin();
  return { ok: true };
}
