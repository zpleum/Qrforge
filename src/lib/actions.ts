"use server";

import { and, count, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { qrCodes, users } from "@/db/schema";
import { rateLimit } from "./security";
import { qrInputSchema, slugSchema } from "./validators";
import { isUnsafe } from "./webrisk";

const MAX_QR_PER_USER = 100;
const nano = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 7);

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const [u] = await db.select({ status: users.status }).from(users).where(eq(users.id, session.user.id)).limit(1);
  if (u?.status === "suspended") throw new Error("Suspended");
  return session.user.id;
}

const isUniqueViolation = (e: unknown) => {
  const x = e as { code?: string; cause?: { code?: string } };
  return x?.code === "23505" || x?.cause?.code === "23505";
};

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveQr(input: unknown, id?: string): Promise<SaveResult> {
  const userId = await requireUser();
  if (!(await rateLimit(`save:${userId}`, 30, 60))) return { ok: false, error: "บันทึกถี่เกินไป รอสักครู่แล้วลองใหม่" };

  const parsed = qrInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const v = parsed.data;

  if (await isUnsafe(v.destination)) {
    return { ok: false, error: "ลิงก์ปลายทางถูกระบุว่าไม่ปลอดภัย (ฟิชชิงหรือมัลแวร์) จึงสร้าง QR ไม่ได้" };
  }

  const tags = v.tags ?? [];
  const folder = v.folder?.trim() || null;

  try {
    if (id) {
      if (!z.uuid().safeParse(id).success) return { ok: false, error: "ไม่พบ QR code นี้" };
      const [row] = await db
        .update(qrCodes)
        .set({
          name: v.name,
          destination: v.destination,
          design: v.design,
          active: v.active,
          tags,
          folder,
          updatedAt: new Date(),
        })
        .where(and(eq(qrCodes.id, id), eq(qrCodes.userId, userId)))
        .returning({ id: qrCodes.id });
      if (!row) return { ok: false, error: "ไม่พบ QR code นี้" };
      revalidatePath("/dashboard");
      return { ok: true, id: row.id };
    }

    const [{ n }] = await db.select({ n: count() }).from(qrCodes).where(eq(qrCodes.userId, userId));
    if (n >= MAX_QR_PER_USER) return { ok: false, error: `สร้างได้สูงสุด ${MAX_QR_PER_USER} QR code` };

    const [row] = await db
      .insert(qrCodes)
      .values({
        userId,
        name: v.name,
        slug: v.slug,
        destination: v.destination,
        design: v.design,
        active: v.active,
        tags,
        folder,
      })
      .returning({ id: qrCodes.id });
    revalidatePath("/dashboard");
    return { ok: true, id: row.id };
  } catch (e) {
    if (isUniqueViolation(e)) return { ok: false, error: "รหัสลิงก์สั้นนี้มีคนใช้แล้ว" };
    console.error("saveQr failed", e);
    return { ok: false, error: "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง" };
  }
}

export async function toggleQr(id: string): Promise<void> {
  const userId = await requireUser();
  if (!z.uuid().safeParse(id).success) return;
  const [qr] = await db.select({ active: qrCodes.active }).from(qrCodes).where(and(eq(qrCodes.id, id), eq(qrCodes.userId, userId)));
  if (!qr) return;
  await db.update(qrCodes).set({ active: !qr.active, updatedAt: new Date() }).where(and(eq(qrCodes.id, id), eq(qrCodes.userId, userId)));
  revalidatePath(`/dashboard/${id}`);
  revalidatePath("/dashboard");
}

export async function bulkSetActive(ids: string[], active: boolean): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUser();
  const clean = ids.filter((id) => z.uuid().safeParse(id).success).slice(0, 50);
  if (!clean.length) return { ok: false, error: "ไม่ได้เลือก QR" };
  await db
    .update(qrCodes)
    .set({ active, updatedAt: new Date() })
    .where(and(eq(qrCodes.userId, userId), inArray(qrCodes.id, clean)));
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function bulkDeleteQrs(ids: string[]): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUser();
  const clean = ids.filter((id) => z.uuid().safeParse(id).success).slice(0, 50);
  if (!clean.length) return { ok: false, error: "ไม่ได้เลือก QR" };
  await db.delete(qrCodes).where(and(eq(qrCodes.userId, userId), inArray(qrCodes.id, clean)));
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function duplicateQr(id: string): Promise<SaveResult> {
  const userId = await requireUser();
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "ไม่พบ QR code นี้" };
  const [src] = await db.select().from(qrCodes).where(and(eq(qrCodes.id, id), eq(qrCodes.userId, userId))).limit(1);
  if (!src) return { ok: false, error: "ไม่พบ QR code นี้" };

  const [{ n }] = await db.select({ n: count() }).from(qrCodes).where(eq(qrCodes.userId, userId));
  if (n >= MAX_QR_PER_USER) return { ok: false, error: `สร้างได้สูงสุด ${MAX_QR_PER_USER} QR code` };

  for (let i = 0; i < 8; i++) {
    const slug = nano();
    if (!slugSchema.safeParse(slug).success) continue;
    try {
      const [row] = await db
        .insert(qrCodes)
        .values({
          userId,
          name: `${src.name} (สำเนา)`,
          slug,
          destination: src.destination,
          design: src.design,
          tags: src.tags ?? [],
          folder: src.folder,
          active: src.active,
        })
        .returning({ id: qrCodes.id });
      revalidatePath("/dashboard");
      return { ok: true, id: row.id };
    } catch (e) {
      if (!isUniqueViolation(e)) {
        console.error("duplicateQr failed", e);
        return { ok: false, error: "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง" };
      }
    }
  }
  return { ok: false, error: "สร้างรหัสลิงก์สั้นไม่ได้ ลองใหม่" };
}

export async function deleteQr(id: string): Promise<void> {
  const userId = await requireUser();
  if (!z.uuid().safeParse(id).success) return;
  await db.delete(qrCodes).where(and(eq(qrCodes.id, id), eq(qrCodes.userId, userId)));
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${id}`);
}

export async function exportMyData(): Promise<{ ok: true; json: string } | { ok: false; error: string }> {
  const userId = await requireUser();
  const [me] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!me) return { ok: false, error: "ไม่พบบัญชี" };
  const qrs = await db
    .select({
      id: qrCodes.id,
      name: qrCodes.name,
      slug: qrCodes.slug,
      destination: qrCodes.destination,
      design: qrCodes.design,
      tags: qrCodes.tags,
      folder: qrCodes.folder,
      active: qrCodes.active,
      createdAt: qrCodes.createdAt,
      updatedAt: qrCodes.updatedAt,
    })
    .from(qrCodes)
    .where(eq(qrCodes.userId, userId));
  return {
    ok: true,
    json: JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        user: { id: me.id, email: me.email, name: me.name, createdAt: me.createdAt },
        qrCodes: qrs,
        note: "ไม่รวมแถวสแกนดิบ — ดาวน์โหลด CSV ต่อ QR ได้จากหน้าสถิติ",
      },
      null,
      2,
    ),
  };
}

export async function deleteAccount(): Promise<void> {
  const userId = await requireUser();
  await db.delete(users).where(eq(users.id, userId));
  await signOut({ redirectTo: "/" });
}
