import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/noto-sans-thai";
import { Providers } from "@/components/Providers";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "QRForge", template: "%s · QRForge" },
  description: "QR code ที่แก้ลิงก์และดีไซน์ได้หลังพิมพ์ พร้อมสถิติการสแกนที่เคารพความเป็นส่วนตัว",
};

// Default light — only honor an explicit user choice of dark.
const themeBoot = `(function(){try{if(localStorage.getItem("qrforge-theme")==="dark")document.documentElement.classList.add("dark");}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="flex min-h-screen flex-col font-sans">
        <Providers>
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
