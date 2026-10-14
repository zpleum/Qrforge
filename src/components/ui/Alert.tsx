const styles = {
  info: "border-signal/30 bg-signal/5 text-ink",
  success: "border-success/30 bg-success/5 text-ink",
  warning: "border-amber/40 bg-amber/10 text-ink",
  error: "border-danger/30 bg-danger/5 text-danger",
} as const;

export function Alert({
  kind = "info",
  children,
  title,
}: {
  kind?: keyof typeof styles;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="alert" className={`rounded-md border px-4 py-3 text-sm ${styles[kind]}`}>
      {title && <p className="font-medium">{title}</p>}
      <div className={title ? "mt-1 opacity-90" : ""}>{children}</div>
    </div>
  );
}
