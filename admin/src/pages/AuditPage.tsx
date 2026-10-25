import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { api, getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";

type AuditRow = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  reason?: string | null;
  createdAt: string;
  admin: { fullName: string; email: string };
};

type PageResult = {
  data: AuditRow[];
  meta: { page: number; totalPages: number };
};

export function AuditPage() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") ?? "1");
  const [action, setAction] = useState(params.get("action") ?? "");
  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "admin-audit",
      page,
      params.get("action") ?? "",
      params.get("from") ?? "",
      params.get("to") ?? "",
    ],
    queryFn: async () => {
      const { data: body } = await api.get<PageResult>("/admin/audit-log", {
        params: {
          page,
          limit: 30,
          action: params.get("action") || undefined,
          from: params.get("from") || undefined,
          to: params.get("to") || undefined,
        },
      });
      return body;
    },
  });

  function update(next: Record<string, string>) {
    const merged = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => {
      if (!v) merged.delete(k);
      else merged.set(k, v);
    });
    setParams(merged);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Journal d'audit"
        description="Historique des actions administrateur."
      />

      <Card>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              update({ action, from, to, page: "1" });
            }}
          >
            <Input
              placeholder="Action (ex. APPROVE)"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            />
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <Button type="submit" variant="navy">
              Filtrer
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}

      <Card>
        {isLoading ? <TableSkeleton rows={8} /> : null}
        {data ? (
          <>
            <DataTable
              rows={data.data}
              emptyTitle="Aucune entrée"
              emptyDescription="Aucun événement pour ces filtres."
              columns={[
                {
                  key: "date",
                  header: "Date",
                  render: (row) => (
                    <span className="whitespace-nowrap">
                      {formatDate(row.createdAt)}
                    </span>
                  ),
                },
                {
                  key: "admin",
                  header: "Admin",
                  render: (row) => (
                    <div>
                      <p className="font-semibold">{row.admin.fullName}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {row.admin.email}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "action",
                  header: "Action",
                  render: (row) => (
                    <span className="font-bold text-ireduc-navy">{row.action}</span>
                  ),
                },
                {
                  key: "target",
                  header: "Cible",
                  render: (row) => (
                    <div>
                      {row.targetType}
                      <p className="text-xs text-[var(--text-muted)]">
                        {row.targetId}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "reason",
                  header: "Motif",
                  render: (row) => row.reason ?? "—",
                },
              ]}
            />
            {data.data.length > 0 ? (
              <div className="px-4 pb-4">
                <Pagination
                  page={data.meta.page}
                  totalPages={data.meta.totalPages}
                  onPageChange={(p) => update({ page: String(p) })}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </Card>
    </div>
  );
}
