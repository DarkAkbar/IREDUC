import { useQuery } from "@tanstack/react-query";
import { Eye, RefreshCw, Store } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { FilterChips } from "@/components/ui/FilterChips";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { api, getErrorMessage } from "@/lib/api";
import { formatDate, statusLabel } from "@/lib/utils";

type ProviderRow = {
  id: string;
  displayName: string;
  type: string;
  reviewStatus: string;
  createdAt: string;
  user: { fullName: string; email: string | null; phone?: string | null };
};

type PageResult = {
  data: ProviderRow[];
  meta: { page: number; totalPages: number; total: number };
};

export function PartnersPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "PENDING";
  const page = Number(params.get("page") ?? "1");
  const [q, setQ] = useState(params.get("q") ?? "");

  const queryKey = useMemo(
    () => ["admin-providers", status, page, params.get("q") ?? ""],
    [status, page, params]
  );

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data: body } = await api.get<PageResult>("/admin/providers", {
        params: {
          status,
          page,
          limit: 20,
          q: params.get("q") || undefined,
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
        title="Partenaires"
        description="Validation des dossiers partenaires."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : undefined} />
            Actualiser
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <FilterChips
            value={status}
            onChange={(value) => update({ status: value, page: "1" })}
            options={[
              { value: "PENDING", label: "En attente" },
              { value: "APPROVED", label: "Approuvés" },
              { value: "REJECTED", label: "Rejetés" },
            ]}
          />
          <form
            className="flex flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              update({ q, page: "1" });
            }}
          >
            <Input
              placeholder="Nom, numéro ou e-mail…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Button type="submit" variant="navy">
              Rechercher
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}

      <Card>
        {isLoading ? <TableSkeleton /> : null}
        {data ? (
          <>
            <DataTable
              rows={data.data}
              emptyTitle="Aucun partenaire"
              emptyDescription="Aucun dossier pour ce filtre."
              onRowClick={(row) => navigate(`/partners/${row.id}`)}
              columns={[
                {
                  key: "partner",
                  header: "Partenaire",
                  render: (row) => (
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-xs font-extrabold text-white">
                        {row.displayName.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">
                          {row.displayName}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {row.user.fullName}
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "contact",
                  header: "Contact",
                  render: (row) => (
                    <div>
                      <p className="font-semibold">{row.user.phone ?? "—"}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {row.user.email ?? "—"}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "type",
                  header: "Type",
                  render: (row) => row.type,
                },
                {
                  key: "status",
                  header: "Statut",
                  render: (row) => (
                    <StatusBadge tone={statusTone(row.reviewStatus)}>
                      {statusLabel(row.reviewStatus)}
                    </StatusBadge>
                  ),
                },
                {
                  key: "date",
                  header: "Créé le",
                  render: (row) => formatDate(row.createdAt),
                },
              ]}
              rowActions={(row) => (
                <Link
                  to={`/partners/${row.id}`}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-ireduc-navy hover:bg-ireduc-navy-soft"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Eye size={14} />
                  Voir
                </Link>
              )}
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
        {!isLoading && !data && !error ? (
          <div className="p-6 text-sm text-[var(--text-muted)]">
            <Store className="mx-auto mb-2" /> Chargement…
          </div>
        ) : null}
      </Card>
    </div>
  );
}
