import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Alert({
  children,
  tone = "info",
  className,
}: {
  children: ReactNode;
  tone?: "info" | "success" | "error";
  className?: string;
}) {
  const tones = {
    info: "border-ireduc-border bg-ireduc-navy-soft text-ireduc-navy",
    success: "border-emerald-200 bg-emerald-50 text-ireduc-success",
    error: "border-red-200 bg-ireduc-red-soft text-ireduc-red",
  };
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 text-[15px] font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </div>
  );
}
