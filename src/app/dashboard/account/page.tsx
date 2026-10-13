import { auth } from "@/auth";
import { DeleteForm } from "@/components/DeleteForm";
import { deleteAccount } from "@/lib/actions";

export const metadata = { title: "บัญชี" };

export default async function Account() {
  const session = await auth();
  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-semibold tracking-tight">บัญชี</h1>
      <p className="mt-4">เข้าสู่ระบบด้วย Google: <strong>{session!.user.email}</strong></p>

      <h2 className="mt-10 text-xl font-semibold">ลบบัญชีและข้อมูลทั้งหมด</h2>
      <p className="mt-2 opacity-80">จะลบ QR code ทุกอันและข้อมูลการสแกนทั้งหมดอย่างถาวร กู้คืนไม่ได้ และ QR ที่พิมพ์ไปแล้วจะใช้งานไม่ได้อีก</p>
      <div className="mt-4">
        <DeleteForm action={deleteAccount} label="ลบบัญชีของฉัน" message="ลบบัญชีและข้อมูลทั้งหมดอย่างถาวร? QR ที่พิมพ์ไปแล้วจะใช้ไม่ได้อีก" />
      </div>
    </div>
  );
}
