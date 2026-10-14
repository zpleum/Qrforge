export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-border px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-2 text-sm opacity-70">{children}</div>}
    </div>
  );
}
