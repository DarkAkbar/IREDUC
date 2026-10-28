import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-[15px] text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-ireduc-navy focus:ring-4 focus:ring-ireduc-navy/10",
        className
      )}
      {...props}
    />
  );
}
