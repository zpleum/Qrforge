import { customAlphabet } from "nanoid";
import { auth } from "@/auth";
import { QrDesigner } from "@/components/QrDesigner";
import { defaultDesign } from "@/lib/design";
import { listAvailablePresets } from "@/lib/preset-actions";

export const metadata = { title: "สร้าง QR code" };
const makeSlug = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 7);

export default async function NewQr() {
  const session = await auth();
  const userPresets = await listAvailablePresets();
  return (
    <div className="animate-page">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">สร้าง QR code</h1>
      <QrDesigner
        mode="create"
        baseUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
        userEmail={session!.user.email!}
        userPresets={userPresets}
        initial={{ name: "", destination: "", slug: makeSlug(), active: true, design: defaultDesign }}
      />
    </div>
  );
}
