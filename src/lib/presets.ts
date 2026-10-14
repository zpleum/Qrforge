import { defaultDesign, type QrDesign } from "./design";

export const DESIGN_PRESETS: { id: string; label: string; design: Partial<QrDesign> }[] = [
  { id: "classic", label: "คลาสสิก", design: { ...defaultDesign } },
  {
    id: "ocean",
    label: "ทะเล",
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
