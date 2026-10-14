import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { ExportDataButton } from "@/components/account/ExportDataButton";
import { DeleteForm } from "@/components/DeleteForm";
import { Badge } from "@/components/ui/Badge";
import { db } from "@/db";
import { users } from "@/db/schema";
import { deleteAccount } from "@/lib/actions";

export const metadata = { title: "บัญชี" };

export default async function Account() {
  const session = await auth();
  const [me] = await db.select().from(users).where(eq(users.id, session!.user.id)).limit(1);

  return (
    <div className="animate-page max-w-xl">
      <h1 className="text-3xl font-semibold tracking-tight">บัญชี</h1>
      <p className="mt-4">เข้าสู่ระบบด้วย Google: <strong>{session!.user.email}</strong></p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={me?.status === "suspended" ? "danger" : "success"}>
          {me?.status === "suspended" ? "ระงับ" : "ใช้งาน"}
        </Badge>
      </div>
      {me?.createdAt && (
        <p className="mt-2 text-sm opacity-70">สมัครเมื่อ {new Date(me.createdAt).toLocaleString("th-TH")}</p>
      )}

      <h2 className="mt-10 text-xl font-semibold">ส่งออกข้อมูล</h2>
      <p className="mt-2 text-sm opacity-80">ดาวน์โหลดเมตาดาต้า QR ของคุณ (ไม่รวมแถวสแกนดิบ — ใช้ CSV ต่อ QR ได้)</p>
      <div className="mt-4"><ExportDataButton /></div>

      <h2 className="mt-10 text-xl font-semibold">ลบบัญชีและข้อมูลทั้งหมด</h2>
      <p className="mt-2 opacity-80">จะลบ QR code ทุกอันและข้อมูลการสแกนทั้งหมดอย่างถาวร กู้คืนไม่ได้ และ QR ที่พิมพ์ไปแล้วจะใช้งานไม่ได้อีก</p>
      <div className="mt-4">
        <DeleteForm
          action={deleteAccount}
          redirectTo="/"
          label="ลบบัญชีของฉัน"
          title="ลบบัญชี?"
          message="ลบบัญชีและข้อมูลทั้งหมดอย่างถาวร? QR ที่พิมพ์ไปแล้วจะใช้ไม่ได้อีก"
        />
      </div>
    </div>
  );
}
