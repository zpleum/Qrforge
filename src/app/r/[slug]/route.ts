import { after, NextResponse, type NextRequest } from "next/server";
import { lookupSlug } from "@/lib/slugs";
import { recordScan } from "@/lib/track";

const page = (msg: string, status: number, slug?: string) =>
  new Response(
    `<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${msg}</title>` +
      `<body style="font:16px/1.6 system-ui,'Noto Sans Thai',sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#E9EEF5;color:#0B1220;text-align:center">` +
      `<div><p style="font-size:1.25rem">${msg}</p>` +
      (slug ? `<p style="font-size:.875rem"><a href="/report?slug=${slug}" style="color:#3A5BFF">รายงานลิงก์นี้</a></p>` : "") +
      `</div></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } },
  );

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[A-Za-z0-9_-]{3,40}$/.test(slug)) return page("ไม่พบ QR code นี้", 404);

  const qr = await lookupSlug(slug);
  if (!qr) return page("ไม่พบ QR code นี้", 404);
  if (!qr.active) return page("เจ้าของหยุดใช้งาน QR code นี้ชั่วคราว", 410, slug);

  after(() => recordScan(qr.id, req.headers));

  // 307 + no-store: never 301, or browsers cache the destination and the scan is never counted again.
  return NextResponse.redirect(qr.destination, {
    status: 307,
    headers: { "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
}
