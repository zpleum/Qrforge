"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { qrCodes, users } from "@/db/schema";
import { rateLimit } from "./security";
import { qrInputSchema } from "./validators";
import { isUnsafe } from "./webrisk";

const MAX_QR_PER_USER = 100;

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
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

  try {
    if (id) {
      if (!z.uuid().safeParse(id).success) return { ok: false, error: "ไม่พบ QR code นี้" };
      // Slug is deliberately NOT updatable: the printed QR encodes it.
      const [row] = await db
        .update(qrCodes)
        .set({ name: v.name, destination: v.destination, design: v.design, active: v.active, updatedAt: new Date() })
        .where(and(eq(qrCodes.id, id), eq(qrCodes.userId, userId))) // ownership enforced in the query itself
        .returning({ id: qrCodes.id });
      if (!row) return { ok: false, error: "ไม่พบ QR code นี้" };
      revalidatePath("/dashboard");
      return { ok: true, id: row.id };
    }

    const [{ n }] = await db.select({ n: count() }).from(qrCodes).where(eq(qrCodes.userId, userId));
    if (n >= MAX_QR_PER_USER) return { ok: false, error: `สร้างได้สูงสุด ${MAX_QR_PER_USER} QR code` };

    const [row] = await db
      .insert(qrCodes)
      .values({ userId, name: v.name, slug: v.slug, destination: v.destination, design: v.design, active: v.active })
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

export async function deleteQr(id: string): Promise<void> {
  const userId = await requireUser();
  if (!z.uuid().safeParse(id).success) return;
  await db.delete(qrCodes).where(and(eq(qrCodes.id, id), eq(qrCodes.userId, userId))); // scans cascade
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${id}`);
}

/** PDPA / GDPR right to erasure: removes the user, every QR code and every scan (all cascade). */
export async function deleteAccount(): Promise<void> {
  const userId = await requireUser();
  await db.delete(users).where(eq(users.id, userId));
  await signOut({ redirectTo: "/" });
}
