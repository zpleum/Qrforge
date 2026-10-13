import { z } from "zod";
import type { Options } from "qr-code-styling";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "สีไม่ถูกต้อง");

export const designSchema = z.object({
  size: z.number().int().min(200).max(1200),
  margin: z.number().int().min(0).max(60),
  ecLevel: z.enum(["L", "M", "Q", "H"]),
  dotsType: z.enum(["square", "dots", "rounded", "extra-rounded", "classy", "classy-rounded"]),
  dotsColor: hex,
  gradient: z.object({
    enabled: z.boolean(),
    color2: hex,
    type: z.enum(["linear", "radial"]),
    rotation: z.number().min(0).max(360),
  }),
  cornerSquareType: z.enum(["square", "dot", "extra-rounded"]),
  cornerSquareColor: hex,
  cornerDotType: z.enum(["square", "dot"]),
  cornerDotColor: hex,
  bgColor: hex,
  bgTransparent: z.boolean(),
  // Logo is stored as a small data URL (client downsizes to <=256px). Whitelisted MIME types only (no SVG => no script risk).
  logo: z
    .string()
    .max(400_000)
    .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, "โลโก้ไม่ถูกต้อง")
    .nullable(),
  logoSize: z.number().min(0.1).max(0.5),
  logoMargin: z.number().int().min(0).max(30),
  hideLogoDots: z.boolean(),
});

export type QrDesign = z.infer<typeof designSchema>;

export const defaultDesign: QrDesign = {
  size: 600,
  margin: 16,
  ecLevel: "Q",
  dotsType: "rounded",
  dotsColor: "#0B1220",
  gradient: { enabled: false, color2: "#3A5BFF", type: "linear", rotation: 45 },
  cornerSquareType: "extra-rounded",
  cornerSquareColor: "#0B1220",
  cornerDotType: "dot",
  cornerDotColor: "#3A5BFF",
  bgColor: "#FFFFFF",
  bgTransparent: false,
  logo: null,
  logoSize: 0.25,
  logoMargin: 6,
  hideLogoDots: true,
};

/** Map our stored design -> qr-code-styling options. `px` overrides size for thumbnails. */
export function toQrOptions(d: QrDesign, data: string, px?: number): Options {
  const size = px ?? d.size;
  return {
    width: size,
    height: size,
    type: "canvas",
    data,
    margin: px ? Math.round((d.margin * px) / d.size) : d.margin,
    image: d.logo ?? undefined,
    qrOptions: { errorCorrectionLevel: d.ecLevel },
    dotsOptions: {
      type: d.dotsType,
      color: d.dotsColor,
      gradient: d.gradient.enabled
        ? {
            type: d.gradient.type,
            rotation: (d.gradient.rotation * Math.PI) / 180,
            colorStops: [
              { offset: 0, color: d.dotsColor },
              { offset: 1, color: d.gradient.color2 },
            ],
          }
        : undefined,
    },
    cornersSquareOptions: { type: d.cornerSquareType, color: d.cornerSquareColor },
    cornersDotOptions: { type: d.cornerDotType, color: d.cornerDotColor },
    backgroundOptions: { color: d.bgTransparent ? "transparent" : d.bgColor },
    imageOptions: {
      hideBackgroundDots: d.hideLogoDots,
      imageSize: d.logoSize,
      margin: d.logoMargin,
      crossOrigin: "anonymous",
    },
  };
}

// ---- scannability helpers (WCAG relative luminance) ----
function luminance(hexColor: string) {
  const c = [1, 3, 5].map((i) => parseInt(hexColor.slice(i, i + 2), 16) / 255).map((v) =>
    v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrastRatio(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
export const isLighter = (a: string, b: string) => luminance(a) > luminance(b);
