"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Kind = "success" | "error" | "warning" | "info";
type Toast = { id: number; kind: Kind; message: string };
type Ctx = { toast: (message: string, kind?: Kind) => void };

const ToastCtx = createContext<Ctx | null>(null);

const styles: Record<Kind, string> = {
  success: "border-success/40 text-success",
  error: "border-danger/40 text-danger",
  warning: "border-amber/50 text-amber",
  info: "border-signal/40 text-signal",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const toast = useCallback((message: string, kind: Kind = "info") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(100%-2rem,22rem)] flex-col gap-2">
        {items.map((t) => (
          <div key={t.id} role="status" className={`toast-in rounded-md border bg-panel px-4 py-3 text-sm shadow-lg ${styles[t.kind]}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
