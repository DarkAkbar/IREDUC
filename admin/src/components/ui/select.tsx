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
        "flex h-10 w-full rounded-md border border-ireduc-border bg-white px-3 py-2 text-sm outline-none focus:border-ireduc-navy focus:ring-2 focus:ring-ireduc-navy/20",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
