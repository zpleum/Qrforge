"use client";
import { useEffect, useRef } from "react";
import type QRCodeStyling from "qr-code-styling";
import { toQrOptions, type QrDesign } from "@/lib/design";

/** qr-code-styling touches `window`, so it is imported lazily on the client only. */
export function useQrStyling(design: QrDesign, data: string, px?: number) {
  const host = useRef<HTMLDivElement>(null);
  const qr = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { default: QR } = await import("qr-code-styling");
      if (cancelled || !host.current) return;
      const opts = toQrOptions(design, data, px);
      if (!qr.current) {
        qr.current = new QR(opts);
        host.current.replaceChildren();
        qr.current.append(host.current);
      } else {
        qr.current.update(opts);
      }
    })();
    return () => { cancelled = true; };
  }, [design, data, px]);

  return { host, qr };
}
