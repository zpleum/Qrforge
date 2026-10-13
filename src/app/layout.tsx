import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/noto-sans-thai";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "QRForge", template: "%s · QRForge" },
  description: "QR code ที่แก้ลิงก์และดีไซน์ได้หลังพิมพ์ พร้อมสถิติการสแกนที่เคารพความเป็นส่วนตัว",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
