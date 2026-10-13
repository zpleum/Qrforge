"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { contrastRatio, isLighter, type QrDesign } from "@/lib/design";
import { saveQr } from "@/lib/actions";
import { btnGhost, btnPrimary, inputCls } from "@/lib/ui";
import { useQrStyling } from "./useQrStyling";

type Props = {
  mode: "create" | "edit";
  id?: string;
  baseUrl: string;
  initial: { name: string; destination: string; slug: string; active: boolean; design: QrDesign };
};

async function fileToLogo(file: File): Promise<string> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error("ใช้ไฟล์ PNG, JPG หรือ WebP");
  if (file.size > 5_000_000) throw new Error("ไฟล์ใหญ่เกินไป (สูงสุด 5 MB)");
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 256 / Math.max(bmp.width, bmp.height)); // keep the stored logo tiny
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
    <fieldset className="border-t border-ink/15 pt-5">
      <legend className="pr-3 text-base font-semibold">{title}</legend>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <span className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="h-9 w-12 cursor-pointer rounded border border-ink/20 bg-white p-0.5" />
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
  const [pending, start] = useTransition();
  const [name, setName] = useState(initial.name);
  const [destination, setDestination] = useState(initial.destination);
  const [slug, setSlug] = useState(initial.slug);
  const [active, setActive] = useState(initial.active);
  const [d, setD] = useState<QrDesign>(initial.design);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof QrDesign>(k: K, v: QrDesign[K]) => setD((p) => ({ ...p, [k]: v }));
  const shortUrl = `${baseUrl}/r/${slug || "…"}`;
  const { host, qr } = useQrStyling(d, shortUrl);

  // Scannability hints
  const warnings: string[] = [];
  if (!d.bgTransparent) {
    if (contrastRatio(d.dotsColor, d.bgColor) < 3) warnings.push("สีจุดกับพื้นหลังต่างกันน้อยเกินไป โทรศัพท์อาจสแกนไม่ติด");
    else if (isLighter(d.dotsColor, d.bgColor)) warnings.push("จุดสีอ่อนบนพื้นเข้ม (กลับสี) บางแอปสแกนไม่ได้");
  }
  if (d.logo && d.logoSize > 0.3 && d.ecLevel !== "H") warnings.push("โลโก้ใหญ่ ควรตั้ง Error correction เป็น H");
  if (d.logo && d.logoSize > 0.4) warnings.push("โลโก้ใหญ่เกินไปอาจบังจนสแกนไม่ได้ ควรไม่เกิน 40%");

  async function onLogo(file?: File) {
    if (!file) return;
    try {
      const logo = await fileToLogo(file);
      setD((p) => ({ ...p, logo, ecLevel: "H" })); // logo covers modules, so max error correction
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "อ่านรูปนี้ไม่ได้");
    }
  }

  function submit() {
    setError(null);
    start(async () => {
      const res = await saveQr({ name, destination, slug, design: d, active }, id);
      if (!res.ok) return setError(res.error);
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
            <input className={inputCls} type="url" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="https://example.com/menu" />
          </Field>
          <Field label={mode === "create" ? "รหัสลิงก์สั้น" : "รหัสลิงก์สั้น (แก้ไม่ได้ เพราะพิมพ์อยู่ใน QR แล้ว)"}>
            <input className={inputCls} value={slug} disabled={mode === "edit"} maxLength={40} onChange={(e) => setSlug(e.target.value)} />
          </Field>
          <Field label="สถานะ">
            <select className={inputCls} value={active ? "on" : "off"} onChange={(e) => setActive(e.target.value === "on")}>
              <option value="on">ใช้งานอยู่</option>
              <option value="off">หยุดชั่วคราว</option>
            </select>
          </Field>
        </Section>

        <Section title="จุด">
          <Pick label="รูปแบบ" value={d.dotsType} options={DOTS} onChange={(v) => set("dotsType", v)} />
          <Color label="สี" value={d.dotsColor} onChange={(v) => set("dotsColor", v)} />
          <Field label="ไล่สี (Gradient)">
            <select className={inputCls} value={d.gradient.enabled ? "on" : "off"} onChange={(e) => set("gradient", { ...d.gradient, enabled: e.target.value === "on" })}>
              <option value="off">ปิด</option>
              <option value="on">เปิด</option>
            </select>
          </Field>
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
          <Field label="พื้นหลังโปร่งใส (PNG / SVG / WebP)">
            <select className={inputCls} value={d.bgTransparent ? "on" : "off"} onChange={(e) => set("bgTransparent", e.target.value === "on")}>
              <option value="off">ไม่</option>
              <option value="on">ใช่</option>
            </select>
          </Field>
        </Section>

        <Section title="โลโก้">
          <Field label="รูปภาพ (PNG, JPG, WebP)">
            <input type="file" accept="image/png,image/jpeg,image/webp" className="text-sm" onChange={(e) => onLogo(e.target.files?.[0])} />
          </Field>
          {d.logo && (
            <>
              <Range label="ขนาด (% ของ QR)" value={Math.round(d.logoSize * 100)} min={10} max={50} step={1} onChange={(v) => set("logoSize", v / 100)} />
              <Range label="ระยะขอบ" value={d.logoMargin} min={0} max={30} step={1} onChange={(v) => set("logoMargin", v)} />
              <Field label="เอาจุดหลังโลโก้ออก">
                <select className={inputCls} value={d.hideLogoDots ? "on" : "off"} onChange={(e) => set("hideLogoDots", e.target.value === "on")}>
                  <option value="on">ใช่</option>
                  <option value="off">ไม่</option>
                </select>
              </Field>
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
        <div ref={host} className="w-full overflow-hidden rounded-md bg-white [&_canvas]:h-auto [&_canvas]:w-full" />
        <p className="mt-3 break-all text-xs opacity-70">ข้อมูลใน QR: {shortUrl}</p>
        {warnings.length > 0 && (
          <ul className="mt-3 grid gap-1 border-l-4 border-amber pl-3 text-sm">
            {warnings.map((w) => <li key={w}>{w}</li>)}
          </ul>
        )}
        {error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}
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
