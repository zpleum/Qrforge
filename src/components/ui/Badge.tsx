export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "signal";
}) {
  const map = {
    neutral: "border-border bg-panel text-muted",
    success: "border-success/30 bg-success/10 text-success",
    warning: "border-amber/40 bg-amber/10 text-amber",
    danger: "border-danger/30 bg-danger/10 text-danger",
    signal: "border-signal/30 bg-signal/10 text-signal",
  };
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${map[tone]}`}>
      {children}
    </span>
  );
}
