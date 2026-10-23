import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-xl border border-ireduc-border bg-white px-3 py-2 text-[15px] text-ireduc-navy outline-none transition focus:border-ireduc-navy focus:ring-4 focus:ring-ireduc-navy/10",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
