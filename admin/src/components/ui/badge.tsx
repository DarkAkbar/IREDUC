import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  success: "bg-emerald-100 text-emerald-900",
  danger: "bg-red-100 text-red-800",
  info: "bg-sky-100 text-sky-900",
  muted: "bg-slate-100 text-slate-700",
};

export function Badge({
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
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
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
  if (["APPROVED", "ACTIVE"].includes(status)) return "success";
  if (["REJECTED", "SUSPENDED", "ARCHIVED"].includes(status)) return "danger";
  return "muted";
}
