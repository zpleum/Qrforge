import { defaultDesign, type QrDesign } from "./design";

export type PresetVisibility = "private" | "email" | "public";

export type PresetItem = {
  id: string;
  label: string;
  design: Partial<QrDesign>;
  builtin?: boolean;
  visibility?: PresetVisibility;
  shareEmail?: string | null;
  owned?: boolean;
};

/** Snapshot colors/styles only — logos stay on the QR, not in presets. */
export function colorSnapshot(d: QrDesign): Partial<QrDesign> {
  return {
    dotsType: d.dotsType,
    dotsColor: d.dotsColor,
    gradient: d.gradient,
    cornerSquareType: d.cornerSquareType,
    cornerSquareColor: d.cornerSquareColor,
    cornerDotType: d.cornerDotType,
    cornerDotColor: d.cornerDotColor,
    bgColor: d.bgColor,
    bgTransparent: d.bgTransparent,
    ecLevel: d.ecLevel,
    margin: d.margin,
  };
}

export const BUILTIN_PRESETS: PresetItem[] = [
  { id: "classic", label: "คลาสสิก", builtin: true, design: { ...defaultDesign } },
  {
    id: "ocean",
    label: "ทะเล",
    builtin: true,
    design: {
      dotsType: "rounded",
      dotsColor: "#0A4D68",
      cornerSquareColor: "#088395",
      cornerDotColor: "#05BFDB",
      gradient: { enabled: true, color2: "#05BFDB", type: "linear", rotation: 135 },
      bgColor: "#FFFFFF",
    },
  },
  {
    id: "ember",
    label: "ถ่านไฟ",
    builtin: true,
    design: {
      dotsType: "classy-rounded",
      dotsColor: "#3D0C11",
      cornerSquareColor: "#D7263D",
      cornerDotColor: "#F46036",
      gradient: { enabled: true, color2: "#F46036", type: "radial", rotation: 0 },
      bgColor: "#FFF8F0",
    },
  },
  {
    id: "forest",
    label: "ป่า",
    builtin: true,
    design: {
      dotsType: "extra-rounded",
      dotsColor: "#1B4332",
      cornerSquareColor: "#2D6A4F",
      cornerDotColor: "#40916C",
      gradient: { enabled: false, color2: "#40916C", type: "linear", rotation: 45 },
      bgColor: "#F8FFF8",
    },
  },
  {
    id: "mono",
    label: "ขาวดำ",
    builtin: true,
    design: {
      dotsType: "square",
      dotsColor: "#111111",
      cornerSquareType: "square",
      cornerSquareColor: "#111111",
      cornerDotType: "square",
      cornerDotColor: "#111111",
      gradient: { enabled: false, color2: "#666666", type: "linear", rotation: 0 },
      bgColor: "#FFFFFF",
    },
  },
];

/** @deprecated use BUILTIN_PRESETS */
export const DESIGN_PRESETS = BUILTIN_PRESETS;
