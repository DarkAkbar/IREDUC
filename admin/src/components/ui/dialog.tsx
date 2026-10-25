import type { ReactNode } from "react";
import { Button } from "./button";

export function Dialog({
  open,
  title,
  description,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-[1.25rem] border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-card-hover)]">
        <div className="border-b border-[var(--border-subtle)] px-5 py-4">
          <h2 className="text-lg font-extrabold text-[var(--text-primary)]">{title}</h2>
          {description ? (
            <p className="mt-1 text-[15px] text-[var(--text-muted)]">{description}</p>
          ) : null}
        </div>
        <div className="px-5 py-4">{children}</div>
        <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] px-5 py-4">
          {footer ?? (
            <Button type="button" variant="outline" onClick={onClose}>
              Fermer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
