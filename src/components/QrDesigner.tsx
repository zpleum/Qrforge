"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Dropzone } from "@/components/ui/Dropzone";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { contrastRatio, isLighter, type QrDesign } from "@/lib/design";
import { saveQr } from "@/lib/actions";
import { DESIGN_PRESETS } from "@/lib/presets";
import { btnGhost, btnPrimary, inputCls } from "@/lib/ui";
import { useQrStyling } from "./useQrStyling";

type Props = {
  mode: "create" | "edit";
  id?: string;
  baseUrl: string;
  initial: {
    name: string;
    destination: string;
    slug: string;
    active: boolean;
    design: QrDesign;
    tags?: string[];
    folder?: string | null;
  };
};

async function fileToLogo(file: File): Promise<string> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error("ใช้ไฟล์ PNG, JPG หรือ WebP");
  if (file.size > 5_000_000) throw new Error("ไฟล์ใหญ่เกินไป (สูงสุด 5 MB)");
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 256 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/png");
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-border pt-5">
      <legend className="pr-3 text-base font-semibold">{title}</legend>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <span className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="h-9 w-12 cursor-pointer rounded border border-border bg-panel p-0.5" />
        <code className="text-xs">{value}</code>
      </span>
    </Field>
  );
}
function Pick<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly (readonly [T, string])[]; onChange: (v: T) => void }) {
  return (
    <Field label={label}>
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </Field>
  );
}
const DOTS = [["square", "สี่เหลี่ยม"], ["dots", "วงกลม"], ["rounded", "มน"], ["extra-rounded", "มนมาก"], ["classy", "คลาสสิก"], ["classy-rounded", "คลาสสิกมน"]] as const;
const CORNER_SQ = [["square", "สี่เหลี่ยม"], ["dot", "วงกลม"], ["extra-rounded", "มนมาก"]] as const;
const CORNER_DOT = [["square", "สี่เหลี่ยม"], ["dot", "วงกลม"]] as const;
const GRAD = [["linear", "เส้นตรง"], ["radial", "วงกลม"]] as const;
const EC = [["L", "L · ต่ำ (กู้ได้ 7%)"], ["M", "M · กลาง (15%)"], ["Q", "Q · สูง (25%)"], ["H", "H · สูงสุด (30%)"]] as const;
function Range({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <Field label={`${label}: ${value}`}>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="accent-signal" />
    </Field>
  );
}

export function QrDesigner({ mode, id, baseUrl, initial }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [name, setName] = useState(initial.name);
  const [destination, setDestination] = useState(initial.destination);
  const [slug, setSlug] = useState(initial.slug);
  const [active, setActive] = useState(initial.active);
  const [tagsText, setTagsText] = useState((initial.tags ?? []).join(", "));
  const [folder, setFolder] = useState(initial.folder ?? "");
  const [d, setD] = useState<QrDesign>(initial.design);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof QrDesign>(k: K, v: QrDesign[K]) => setD((p) => ({ ...p, [k]: v }));
  const shortUrl = `${baseUrl}/r/${slug || "…"}`;
  const { host, qr } = useQrStyling(d, shortUrl);

  const warnings: string[] = [];
  if (!d.bgTransparent) {
    if (contrastRatio(d.dotsColor, d.bgColor) < 3) warnings.push("สีจุดกับพื้นหลังต่างกันน้อยเกินไป โทรศัพท์อาจสแกนไม่ติด");
    else if (isLighter(d.dotsColor, d.bgColor)) warnings.push("จุดสีอ่อนบนพื้นเข้ม (กลับสี) บางแอปสแกนไม่ได้");
  }
  if (d.logo && d.logoSize > 0.3 && d.ecLevel !== "H") warnings.push("โลโก้ใหญ่ ควรตั้ง Error correction เป็น H");
  if (d.logo && d.logoSize > 0.4) warnings.push("โลโก้ใหญ่เกินไปอาจบังจนสแกนไม่ได้ ควรไม่เกิน 40%");

  async function onLogo(file: File) {
    try {
      const logo = await fileToLogo(file);
      setD((p) => ({ ...p, logo, ecLevel: "H" }));
      setError(null);
      toast("ใส่โลโก้แล้ว", "success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "อ่านรูปนี้ไม่ได้");
    }
  }

  function applyPreset(id: string) {
    const p = DESIGN_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setD((prev) => ({ ...prev, ...p.design, logo: prev.logo, logoSize: prev.logoSize, logoMargin: prev.logoMargin, hideLogoDots: prev.hideLogoDots }));
    toast(`ใช้พรีเซ็ต «${p.label}»`, "info");
  }

  function submit() {
    setError(null);
    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8);
    start(async () => {
      const res = await saveQr(
        { name, destination, slug, design: d, active, tags, folder: folder.trim() || null },
        id,
      );
      if (!res.ok) {
        setError(res.error);
        toast(res.error, "error");
        return;
      }
      toast("บันทึกแล้ว", "success");
      router.push(`/dashboard/${res.id}`);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="grid gap-8">
        <Section title="ลิงก์">
          <Field label="ชื่อ (เห็นเฉพาะคุณ)">
            <input className={inputCls} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="เมนูใหม่ประจำฤดูหนาว" />
          </Field>
          <Field label="URL ปลายทาง">
            <input className={inputCls} type="url" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="https://example.com/menu?utm_source=qr" />
          </Field>
          <Field label={mode === "create" ? "รหัสลิงก์สั้น" : "รหัสลิงก์สั้น (แก้ไม่ได้ เพราะพิมพ์อยู่ใน QR แล้ว)"}>
            <input className={inputCls} value={slug} disabled={mode === "edit"} maxLength={40} onChange={(e) => setSlug(e.target.value)} />
          </Field>
          <Select
            label="สถานะ"
            value={active ? "on" : "off"}
            onChange={(v) => setActive(v === "on")}
            options={[
              { value: "on", label: "ใช้งานอยู่" },
              { value: "off", label: "หยุดชั่วคราว" },
            ]}
          />
          <Field label="โฟลเดอร์ (ไม่บังคับ)">
            <input className={inputCls} value={folder} maxLength={64} onChange={(e) => setFolder(e.target.value)} placeholder="เช่น ร้าน / อีเวนต์" />
          </Field>
          <Field label="แท็ก (คั่นด้วยจุลภาค)">
            <input className={inputCls} value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="เมนู, ออฟไลน์" />
          </Field>
        </Section>

        <Section title="พรีเซ็ตสี">
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            {DESIGN_PRESETS.map((p) => (
              <button key={p.id} type="button" className={btnGhost} onClick={() => applyPreset(p.id)}>{p.label}</button>
            ))}
          </div>
        </Section>

        <Section title="จุด">
          <Pick label="รูปแบบ" value={d.dotsType} options={DOTS} onChange={(v) => set("dotsType", v)} />
          <Color label="สี" value={d.dotsColor} onChange={(v) => set("dotsColor", v)} />
          <Select
            label="ไล่สี (Gradient)"
            value={d.gradient.enabled ? "on" : "off"}
            onChange={(v) => set("gradient", { ...d.gradient, enabled: v === "on" })}
            options={[
              { value: "off", label: "ปิด" },
              { value: "on", label: "เปิด" },
            ]}
          />
          {d.gradient.enabled && (
            <>
              <Color label="สีที่สอง" value={d.gradient.color2} onChange={(v) => set("gradient", { ...d.gradient, color2: v })} />
              <Pick label="ชนิดการไล่สี" value={d.gradient.type} options={GRAD} onChange={(v) => set("gradient", { ...d.gradient, type: v })} />
              <Range label="มุม (องศา)" value={d.gradient.rotation} min={0} max={360} step={15} onChange={(v) => set("gradient", { ...d.gradient, rotation: v })} />
            </>
          )}
        </Section>

        <Section title="มุมทั้งสาม">
          <Pick label="กรอบนอก: รูปแบบ" value={d.cornerSquareType} options={CORNER_SQ} onChange={(v) => set("cornerSquareType", v)} />
          <Color label="กรอบนอก: สี" value={d.cornerSquareColor} onChange={(v) => set("cornerSquareColor", v)} />
          <Pick label="จุดกลาง: รูปแบบ" value={d.cornerDotType} options={CORNER_DOT} onChange={(v) => set("cornerDotType", v)} />
          <Color label="จุดกลาง: สี" value={d.cornerDotColor} onChange={(v) => set("cornerDotColor", v)} />
        </Section>

        <Section title="พื้นหลัง">
          <Color label="สี" value={d.bgColor} onChange={(v) => set("bgColor", v)} />
          <Select
            label="พื้นหลังโปร่งใส (PNG / SVG / WebP)"
            value={d.bgTransparent ? "on" : "off"}
            onChange={(v) => set("bgTransparent", v === "on")}
            options={[
              { value: "off", label: "ไม่" },
              { value: "on", label: "ใช่" },
            ]}
          />
        </Section>

        <Section title="โลโก้">
          <div className="sm:col-span-2">
            <Dropzone onFile={onLogo} />
          </div>
          {d.logo && (
            <>
              <Range label="ขนาด (% ของ QR)" value={Math.round(d.logoSize * 100)} min={10} max={50} step={1} onChange={(v) => set("logoSize", v / 100)} />
              <Range label="ระยะขอบ" value={d.logoMargin} min={0} max={30} step={1} onChange={(v) => set("logoMargin", v)} />
              <Select
                label="เอาจุดหลังโลโก้ออก"
                value={d.hideLogoDots ? "on" : "off"}
                onChange={(v) => set("hideLogoDots", v === "on")}
                options={[
                  { value: "on", label: "ใช่" },
                  { value: "off", label: "ไม่" },
                ]}
              />
              <button type="button" className={`${btnGhost} self-end`} onClick={() => set("logo", null)}>ลบโลโก้</button>
            </>
          )}
        </Section>

        <Section title="การส่งออก">
          <Pick label="Error correction" value={d.ecLevel} options={EC} onChange={(v) => set("ecLevel", v)} />
          <Range label="ขนาดไฟล์ส่งออก (px)" value={d.size} min={200} max={1200} step={50} onChange={(v) => set("size", v)} />
          <Range label="ขอบเว้นว่าง (Quiet zone)" value={d.margin} min={0} max={60} step={2} onChange={(v) => set("margin", v)} />
        </Section>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div ref={host} className="w-full overflow-hidden rounded-md bg-panel [&_canvas]:h-auto [&_canvas]:w-full" />
        <p className="mt-3 break-all text-xs opacity-70">ข้อมูลใน QR: {shortUrl}</p>
        {warnings.length > 0 && (
          <div className="mt-3">
            <Alert kind="warning">
              <ul className="grid gap-1">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
            </Alert>
          </div>
        )}
        {error && <p role="alert" className="mt-3 text-sm font-medium text-danger">{error}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={btnPrimary} disabled={pending} onClick={submit}>
            {pending ? "กำลังบันทึก…" : mode === "create" ? "สร้าง QR code" : "บันทึกการแก้ไข"}
          </button>
          {mode === "edit" && (
            <>
              <button type="button" className={btnGhost} onClick={() => qr.current?.download({ name: slug, extension: "png" })}>PNG</button>
              <button type="button" className={btnGhost} onClick={() => qr.current?.download({ name: slug, extension: "svg" })}>SVG</button>
            </>
          )}
        </div>
        {mode === "create" && <p className="mt-3 text-xs opacity-70">ดาวน์โหลดได้หลังบันทึก เพื่อให้ไฟล์ตรงกับลิงก์ที่ใช้งานได้จริง</p>}
      </aside>
    </div>
  );
}
