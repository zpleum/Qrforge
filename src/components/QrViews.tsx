"use client";
import type { QrDesign } from "@/lib/design";
import { btnGhost } from "@/lib/ui";
import { useQrStyling } from "./useQrStyling";

export function QrThumb({ design, data, px = 96 }: { design: QrDesign; data: string; px?: number }) {
  const { host } = useQrStyling(design, data, px);
  return <div ref={host} style={{ width: px, height: px }} className="shrink-0 overflow-hidden rounded-md bg-white [&_canvas]:block" />;
}

export function QrDownload({ design, data, name }: { design: QrDesign; data: string; name: string }) {
  const { host, qr } = useQrStyling(design, data);
  const dl = (extension: "png" | "svg" | "webp" | "jpeg") => qr.current?.download({ name, extension });
  return (
    <div>
      <div ref={host} className="w-full max-w-72 overflow-hidden rounded-md bg-white [&_canvas]:h-auto [&_canvas]:w-full" />
      <div className="mt-3 flex flex-wrap gap-2">
        {(["png", "svg", "webp", "jpeg"] as const).map((ext) => (
          <button key={ext} type="button" className={btnGhost} onClick={() => dl(ext)}>
            ดาวน์โหลด {ext.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

export function HeroQr({ design, data }: { design: QrDesign; data: string }) {
  const { host } = useQrStyling(design, data);
  return (
    <div className="relative mx-auto w-full max-w-sm p-6">
      <div ref={host} className="overflow-hidden rounded-lg bg-white [&_canvas]:h-auto [&_canvas]:w-full" />
      {/* viewfinder brackets */}
      <span className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-amber" />
      <span className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-amber" />
      <span className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-amber" />
      <span className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-amber" />
      <span className="sweep absolute left-0 right-0 h-0.5 bg-signal" aria-hidden />
    </div>
  );
}
