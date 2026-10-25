import { cn } from "@/lib/utils";

export type FilterChip = {
  value: string;
  label: string;
};

export function FilterChips({
  options,
  value,
  onChange,
  className,
}: {
  options: FilterChip[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value || "all"}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ireduc-navy",
              active
                ? "bg-brand-gradient text-white shadow-[var(--shadow-glow)]"
                : "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-ireduc-navy/40 hover:text-ireduc-navy"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
