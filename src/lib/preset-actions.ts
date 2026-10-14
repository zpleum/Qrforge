"use server";

import { and, desc, eq, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { designPresets, users } from "@/db/schema";
import { designSchema } from "./design";
import { colorSnapshot, type PresetItem, type PresetVisibility } from "./presets";
import { rateLimit } from "./security";

const MAX_PRESETS_PER_USER = 40;

async function requireActiveUser() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) throw new Error("Unauthorized");
  const [u] = await db.select({ status: users.status, email: users.email }).from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!u || u.status === "suspended") throw new Error("Suspended");
  return { userId: session.user.id, email: (u.email || session.user.email).toLowerCase() };
}

const visibilitySchema = z.enum(["private", "email", "public"]);
const saveSchema = z.object({
  name: z.string().trim().min(1, "ตั้งชื่อพรีเซ็ต").max(40),
  visibility: visibilitySchema,
  shareEmail: z.string().trim().email("อีเมลไม่ถูกต้อง").max(254).optional().nullable(),
  design: designSchema,
});

export async function listAvailablePresets(): Promise<PresetItem[]> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return [];
  const email = session.user.email.toLowerCase();
  const userId = session.user.id;

  const rows = await db
    .select()
    .from(designPresets)
    .where(
      or(
        and(eq(designPresets.visibility, "private"), eq(designPresets.userId, userId)),
        and(eq(designPresets.visibility, "email"), eq(designPresets.shareEmail, email)),
        eq(designPresets.visibility, "public"),
      ),
    )
    .orderBy(desc(designPresets.createdAt))
    .limit(200);

  return rows.map((r) => ({
    id: r.id,
    label: r.name,
    design: r.design,
    visibility: r.visibility as PresetVisibility,
    shareEmail: r.shareEmail,
    owned: r.userId === userId,
  }));
}

export type PresetSaveResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveDesignPreset(input: unknown): Promise<PresetSaveResult> {
  const { userId, email } = await requireActiveUser();
  if (!(await rateLimit(`preset:${userId}`, 20, 60))) return { ok: false, error: "บันทึกถี่เกินไป รอสักครู่" };

  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const v = parsed.data;

  let shareEmail: string | null = null;
  if (v.visibility === "email") {
    shareEmail = (v.shareEmail?.trim() || email).toLowerCase();
  }

  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(designPresets)
    .where(eq(designPresets.userId, userId));
  if (n >= MAX_PRESETS_PER_USER) return { ok: false, error: `สร้างพรีเซ็ตได้สูงสุด ${MAX_PRESETS_PER_USER} อัน` };

  const [row] = await db
    .insert(designPresets)
    .values({
      userId,
      name: v.name,
      design: colorSnapshot(v.design),
      visibility: v.visibility,
      shareEmail,
    })
    .returning({ id: designPresets.id });

  revalidatePath("/dashboard/new");
  revalidatePath("/dashboard");
  return { ok: true, id: row.id };
}

export async function deleteDesignPreset(id: string): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await requireActiveUser();
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "ไม่พบพรีเซ็ต" };
  const deleted = await db
    .delete(designPresets)
    .where(and(eq(designPresets.id, id), eq(designPresets.userId, userId)))
    .returning({ id: designPresets.id });
  if (!deleted.length) return { ok: false, error: "ลบไม่ได้ (ไม่ใช่เจ้าของหรือไม่พบ)" };
  revalidatePath("/dashboard/new");
  revalidatePath("/dashboard");
  return { ok: true };
}
