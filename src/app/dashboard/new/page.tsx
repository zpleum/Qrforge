import { customAlphabet } from "nanoid";
import { QrDesigner } from "@/components/QrDesigner";
import { defaultDesign } from "@/lib/design";

export const metadata = { title: "สร้าง QR code" };
// No look-alike characters (0/o, 1/l/i) so short links survive being read aloud or typed.
const makeSlug = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 7);

export default function NewQr() {
  return (
    <>
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">สร้าง QR code</h1>
      <QrDesigner
        mode="create"
        baseUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
        initial={{ name: "", destination: "", slug: makeSlug(), active: true, design: defaultDesign }}
      />
    </>
  );
}
