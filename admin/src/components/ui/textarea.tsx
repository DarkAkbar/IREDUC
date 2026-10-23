import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full rounded-md border border-ireduc-border bg-white px-3 py-2 text-sm outline-none focus:border-ireduc-navy focus:ring-2 focus:ring-ireduc-navy/20",
        className
      )}
      {...props}
    />
  );
}
