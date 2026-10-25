import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  pending:
    "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/30",
  success:
    "bg-emerald-50 text-ireduc-success ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30",
  danger:
    "bg-ireduc-red-soft text-ireduc-red ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30",
  info: "bg-ireduc-navy-soft text-ireduc-navy ring-ireduc-border dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-500/30",
  muted:
    "bg-ireduc-skeleton text-ireduc-muted ring-ireduc-border dark:bg-white/5 dark:text-[var(--text-muted)]",
};

export function StatusBadge({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): keyof typeof tones {
  if (["PENDING", "DRAFT"].includes(status)) return "pending";
  if (["APPROVED", "ACTIVE", "COMPLETED"].includes(status)) return "success";
  if (["REJECTED", "SUSPENDED", "ARCHIVED", "CANCELLED"].includes(status))
    return "danger";
  return "muted";
}
