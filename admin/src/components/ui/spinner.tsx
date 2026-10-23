export function Spinner({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-[15px] text-ireduc-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-ireduc-navy border-t-transparent" />
      {label}
    </div>
  );
}
