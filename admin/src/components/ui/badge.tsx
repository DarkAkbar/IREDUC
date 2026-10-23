import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  success: "bg-emerald-50 text-ireduc-success ring-emerald-200",
  danger: "bg-ireduc-red-soft text-ireduc-red ring-red-200",
  info: "bg-ireduc-navy-soft text-ireduc-navy ring-ireduc-border",
  muted: "bg-ireduc-skeleton text-ireduc-muted ring-ireduc-border",
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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
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
