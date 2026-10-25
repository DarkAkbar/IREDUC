import { useQuery } from "@tanstack/react-query";
import { Eye, RefreshCw } from "lucide-react";
import { useState } from "react";
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
import { formatDate, formatMoney, statusLabel } from "@/lib/utils";

type ListingRow = {
  id: string;
  title: string;
  status: string;
  price?: number | null;
  currency?: string | null;
  isFeatured?: boolean;
  createdAt: string;
  commune?: { name: string } | null;
  category?: { name: string } | null;
  owner?: { fullName: string } | null;
  providerProfile?: { displayName: string } | null;
};

type PageResult = {
  data: ListingRow[];
  meta: { page: number; totalPages: number };
};

export function ListingsPage({
  kind,
}: {
  kind: "properties" | "services";
}) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "PENDING";
  const page = Number(params.get("page") ?? "1");
  const [q, setQ] = useState(params.get("q") ?? "");
  const label = kind === "properties" ? "annonces" : "services";
  const title = kind === "properties" ? "Annonces" : "Services";
  const basePath = `/${kind}`;

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: [`admin-${kind}`, status, page, params.get("q") ?? ""],
    queryFn: async () => {
      const { data: body } = await api.get<PageResult>(`/admin/${kind}`, {
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
        title={title}
        description="Modération et mise à la une."
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
              { value: "DRAFT", label: "Brouillons" },
              { value: "ARCHIVED", label: "Archivés" },
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
              placeholder={`Rechercher dans les ${label}…`}
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
              emptyTitle={`Aucune ${kind === "properties" ? "annonce" : "prestation"}`}
              emptyDescription="Aucun élément pour ce filtre."
              onRowClick={(row) => navigate(`${basePath}/${row.id}`)}
              columns={[
                {
                  key: "title",
                  header: "Titre",
                  render: (row) => (
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-[var(--text-primary)]">
                          {row.title}
                        </p>
                        {row.isFeatured ? (
                          <StatusBadge tone="info">À la une</StatusBadge>
                        ) : null}
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        {row.owner?.fullName ??
                          row.providerProfile?.displayName ??
                          "—"}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "category",
                  header: "Catégorie",
                  render: (row) => (
                    <div>
                      {row.category?.name ?? "—"}
                      {row.commune ? (
                        <p className="text-xs text-[var(--text-muted)]">
                          {row.commune.name}
                        </p>
                      ) : null}
                    </div>
                  ),
                },
                {
                  key: "price",
                  header: "Prix",
                  render: (row) => formatMoney(row.price, row.currency ?? "USD"),
                },
                {
                  key: "status",
                  header: "Statut",
                  render: (row) => (
                    <StatusBadge tone={statusTone(row.status)}>
                      {statusLabel(row.status)}
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
                  to={`${basePath}/${row.id}`}
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
      </Card>
    </div>
  );
}
