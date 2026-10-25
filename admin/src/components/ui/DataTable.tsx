import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  emptyTitle = "Aucun résultat",
  emptyDescription,
  onRowClick,
  rowActions,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="sticky top-0 z-10 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur">
          <tr className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            {columns.map((col) => (
              <th key={col.key} className={cn("px-4 py-3", col.className)}>
                {col.header}
              </th>
            ))}
            {rowActions ? <th className="px-4 py-3 text-right">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                "group border-b border-[var(--border-subtle)]/70 transition-colors last:border-0 hover:bg-ireduc-navy-soft/60 dark:hover:bg-white/5",
                onRowClick && "cursor-pointer"
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn("px-4 py-3", col.className)}>
                  {col.render(row)}
                </td>
              ))}
              {rowActions ? (
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    {rowActions(row)}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
