import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className
      )}
    >
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-gradient-soft text-ireduc-navy dark:text-white">
        <Icon size={28} />
      </span>
      <p className="text-base font-extrabold text-[var(--text-primary)]">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-[var(--text-muted)]">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
