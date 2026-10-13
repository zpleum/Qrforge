import { z } from "zod";
import { designSchema } from "./design";

const appHost = (() => {
  try { return process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname : null; }
  catch { return null; }
})();

export const destinationSchema = z
  .string()
  .trim()
  .max(2048, "URL ยาวเกินไป")
  .superRefine((value, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    let u: URL;
    try { u = new URL(value); } catch { return fail("กรอก URL ให้ครบ เช่น https://example.com"); }
    if (u.protocol !== "https:" && u.protocol !== "http:") return fail("รองรับเฉพาะลิงก์ http และ https");
    if (u.username || u.password) return fail("ไม่รองรับลิงก์ที่ฝังชื่อผู้ใช้/รหัสผ่าน");
    const h = u.hostname.toLowerCase();
    // Anti-abuse: no localhost / private names / raw IP literals as destinations.
    if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || /^[\d.]+$/.test(h) || h.includes("[")) {
      return fail("ใช้ชื่อโดเมนสาธารณะ ไม่รองรับ IP address หรือ localhost");
    }
    if (appHost && h === appHost) return fail("QR ห้ามชี้กลับมาที่เว็บนี้ (จะวนลูป)");
  });

export const slugSchema = z.string().regex(/^[A-Za-z0-9_-]{3,40}$/, "รหัสลิงก์สั้น: 3-40 ตัว ใช้ a-z, 0-9, - หรือ _");

export const qrInputSchema = z.object({
  name: z.string().trim().min(1, "ตั้งชื่อก่อน").max(80),
  destination: destinationSchema,
  slug: slugSchema,
  design: designSchema,
  active: z.boolean(),
});
export type QrInput = z.infer<typeof qrInputSchema>;
