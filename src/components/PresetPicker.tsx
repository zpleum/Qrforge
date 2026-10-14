"use client";
import { BookmarkPlus, ChevronDown, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useMenu } from "@/components/ui/useMenu";
import type { QrDesign } from "@/lib/design";
import { deleteDesignPreset, saveDesignPreset } from "@/lib/preset-actions";
import { BUILTIN_PRESETS, type PresetItem, type PresetVisibility } from "@/lib/presets";
import { btnGhost, btnPrimary, inputCls } from "@/lib/ui";

const PAGE_SIZE = 6;

function Swatch({ design, size = 28 }: { design: Partial<QrDesign>; size?: number }) {
  const a = design.dotsColor ?? "#0B1220";
  const b = design.gradient?.enabled ? design.gradient.color2 : design.cornerDotColor ?? a;
  const bg = design.bgTransparent ? "transparent" : design.bgColor ?? "#fff";
  return (
    <span
      className="inline-block shrink-0 rounded-md border border-border shadow-sm"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${a} 0%, ${a} 42%, ${b} 42%, ${b} 100%), ${bg}`,
      }}
      aria-hidden
    />
  );
}

function scopeLabel(p: PresetItem) {
  if (p.builtin) return "ระบบ";
  if (p.visibility === "public") return "ทุกคน";
  if (p.visibility === "email") return p.shareEmail ? p.shareEmail : "ตามอีเมล";
  return "ของฉัน";
}

export function PresetPicker({
  design,
  userPresets,
  userEmail,
  onApply,
}: {
  design: QrDesign;
  userPresets: PresetItem[];
  userEmail: string;
  onApply: (partial: Partial<QrDesign>) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const menu = useMenu();
  const [page, setPage] = useState(0);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<PresetVisibility>("private");
  const [shareEmail, setShareEmail] = useState(userEmail);
  const [pending, start] = useTransition();

  const all = useMemo(() => [...BUILTIN_PRESETS, ...userPresets], [userPresets]);
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const slice = all.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    if (page > pages - 1) setPage(Math.max(0, pages - 1));
  }, [page, pages]);

  function apply(p: PresetItem) {
    onApply(p.design);
    menu.close();
    toast(`ใช้พรีเซ็ต "${p.label}"`, "info");
  }

  function save() {
    start(async () => {
      const res = await saveDesignPreset({
        name,
        visibility,
        shareEmail: visibility === "email" ? shareEmail : null,
        design,
      });
      if (!res.ok) {
        toast(res.error, "error");
        return;
      }
      toast("บันทึกพรีเซ็ตแล้ว", "success");
      setSaveOpen(false);
      setName("");
      setVisibility("private");
      setShareEmail(userEmail);
      router.refresh();
    });
  }

  function remove(id: string) {
    start(async () => {
      const res = await deleteDesignPreset(id);
      if (!res.ok) return toast(res.error ?? "ลบไม่ได้", "error");
      toast("ลบพรีเซ็ตแล้ว", "success");
      router.refresh();
    });
  }

  return (
    <div className={`sm:col-span-2 grid gap-3 ${menu.open ? "z-[200]" : ""}`} ref={menu.ref}>
      <div className="relative">
        <button
          type="button"
          className={`flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-panel px-3 py-2.5 text-left text-sm transition-colors hover:border-ink/35 ${menu.open ? "border-signal ring-2 ring-signal/25" : ""}`}
          aria-expanded={menu.open}
          onClick={menu.toggle}
        >
          <span className="flex min-w-0 items-center gap-3">
            <Swatch design={design} size={32} />
            <span>
              <span className="block font-medium">เลือกพรีเซ็ตสี</span>
              <span className="block text-xs opacity-55">{all.length} รายการ · หน้า {safePage + 1}/{pages}</span>
            </span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 opacity-55 transition-transform duration-200 ${menu.open ? "rotate-180" : ""}`} />
        </button>

        {menu.open && (
          <div className="animate-rise absolute left-0 right-0 z-[200] mt-1.5 overflow-hidden rounded-xl border border-border bg-panel shadow-[0_16px_48px_-16px_rgba(11,18,32,0.4)]">
            <ul className="max-h-72 overflow-auto py-1">
              {slice.map((p) => (
                <li key={p.id} className="flex items-stretch gap-0.5 px-1">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm transition-colors hover:bg-ink/[0.04]"
                    onClick={() => apply(p)}
                  >
                    <Swatch design={p.design} size={30} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{p.label}</span>
                      <span className="block truncate text-xs opacity-50">{scopeLabel(p)}</span>
                    </span>
                  </button>
                  {p.owned && !p.builtin && (
                    <button
                      type="button"
                      className="rounded-lg px-2.5 text-danger/70 transition-colors hover:bg-danger/5 hover:text-danger"
                      title="ลบพรีเซ็ต"
                      disabled={pending}
                      onClick={() => remove(p.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between gap-2 border-t border-border bg-ink/[0.02] px-2 py-1.5">
              <button
                type="button"
                className={`${btnGhost} !px-2 !py-1`}
                disabled={safePage <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                aria-label="หน้าก่อน"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs tabular-nums opacity-65">
                {safePage + 1} / {pages}
              </span>
              <button
                type="button"
                className={`${btnGhost} !px-2 !py-1`}
                disabled={safePage >= pages - 1}
                onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                aria-label="หน้าถัดไป"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {!saveOpen ? (
        <button type="button" className={`${btnGhost} w-fit gap-1.5`} onClick={() => setSaveOpen(true)}>
          <BookmarkPlus className="h-4 w-4" />
          บันทึกสีปัจจุบันเป็นพรีเซ็ต
        </button>
      ) : (
        <div className="animate-rise grid gap-3 rounded-xl border border-border bg-panel p-4 sm:grid-cols-2">
          <p className="sm:col-span-2 text-sm font-medium">บันทึกพรีเซ็ตใหม่</p>
          <label className="grid gap-1.5 text-sm sm:col-span-2">
            <span className="font-medium">ชื่อ</span>
            <input className={inputCls} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="เช่น แบรนด์ร้าน" />
          </label>
          <div className="sm:col-span-2">
            <Select
              label="ใครใช้ได้"
              value={visibility}
              onChange={setVisibility}
              options={[
                { value: "private", label: "ใช้เอง (เฉพาะฉัน)", hint: "เห็นเฉพาะบัญชีนี้" },
                { value: "email", label: "ใช้กับอีเมลที่ระบุ", hint: "แชร์ให้เมลอื่นได้" },
                { value: "public", label: "ให้ใช้ได้ทุกคน", hint: "ผู้ใช้ทุกคนในระบบเห็น" },
              ]}
            />
          </div>
          {visibility === "email" && (
            <label className="grid gap-1.5 text-sm sm:col-span-2">
              <span className="font-medium">อีเมลที่อนุญาต</span>
              <input
                className={inputCls}
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder={userEmail}
              />
              <button
                type="button"
                className="w-fit text-xs text-signal underline-offset-2 hover:underline"
                onClick={() => setShareEmail(userEmail)}
              >
                ใช้เมลของฉัน ({userEmail})
              </button>
            </label>
          )}
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button type="button" className={btnPrimary} disabled={pending || !name.trim()} onClick={save}>
              {pending ? "กำลังบันทึก…" : "บันทึกพรีเซ็ต"}
            </button>
            <button type="button" className={btnGhost} onClick={() => setSaveOpen(false)}>ยกเลิก</button>
          </div>
        </div>
      )}
    </div>
  );
}
