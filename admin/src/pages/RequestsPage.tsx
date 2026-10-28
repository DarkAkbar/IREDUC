import { useQuery } from "@tanstack/react-query";
import { Eye, RefreshCw } from "lucide-react";
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
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { api, getErrorMessage } from "@/lib/api";
import { formatDate, statusLabel } from "@/lib/utils";

type RequestRow = {
  id: string;
  number: string;
  targetType: string;
  status: string;
  createdAt: string;
  requester: { fullName: string; phone: string; email: string | null };
  owner: { fullName: string; phone: string; email: string | null } | null;
  target: { type: string; id: string | null; title: string | null };
};

type PageResult = {
  data: RequestRow[];
  meta: { page: number; totalPages: number; total: number };
};

export function RequestsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const type = params.get("type") ?? "";
  const page = Number(params.get("page") ?? "1");
  const dateFrom = params.get("dateFrom") ?? "";
  const dateTo = params.get("dateTo") ?? "";
  const [search, setSearch] = useState(params.get("search") ?? "");

  const queryKey = useMemo(
    () => [
      "admin-requests",
      status,
      type,
      page,
      dateFrom,
      dateTo,
      params.get("search") ?? "",
    ],
    [status, type, page, dateFrom, dateTo, params]
  );

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data: body } = await api.get<PageResult>("/admin/requests", {
        params: {
          status: status || undefined,
          type: type || undefined,
          page,
          limit: 20,
          search: params.get("search") || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
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
        title="Demandes"
        description="Supervision des demandes (annulation administrative possible avec motif)."
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
            value={status || "ALL"}
            onChange={(value) =>
              update({ status: value === "ALL" ? "" : value, page: "1" })
            }
            options={[
              { value: "ALL", label: "Toutes" },
              { value: "PENDING", label: "En attente" },
              { value: "APPROVED", label: "Approuvées" },
              { value: "REJECTED", label: "Rejetées" },
              { value: "CANCELLED", label: "Annulées" },
              { value: "COMPLETED", label: "Terminées" },
            ]}
          />
          <div className="flex flex-col gap-3 md:flex-row">
            <Select
              value={type}
              onChange={(e) => update({ type: e.target.value, page: "1" })}
              className="md:w-44"
            >
              <option value="">Tous les types</option>
              <option value="PROPERTY">Bien</option>
              <option value="SERVICE">Service</option>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => update({ dateFrom: e.target.value, page: "1" })}
              className="md:w-44"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => update({ dateTo: e.target.value, page: "1" })}
              className="md:w-44"
            />
          </div>
          <form
            className="flex flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              update({ search, page: "1" });
            }}
          >
            <Input
              placeholder="N° IRD, demandeur, téléphone, titre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              emptyTitle="Aucune demande"
              emptyDescription="Aucune demande pour ces filtres."
              onRowClick={(row) => navigate(`/requests/${row.id}`)}
              columns={[
                {
                  key: "number",
                  header: "N° IRD",
                  render: (row) => (
                    <span className="font-extrabold text-ireduc-navy">
                      {row.number}
                    </span>
                  ),
                },
                {
                  key: "requester",
                  header: "Demandeur",
                  render: (row) => (
                    <div>
                      <p className="font-bold">{row.requester.fullName}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {row.requester.phone}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "target",
                  header: "Cible",
                  render: (row) => (
                    <div>
                      <p className="font-semibold">
                        {row.target.title ?? "—"}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {row.targetType === "PROPERTY" ? "Bien" : "Service"}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "owner",
                  header: "Propriétaire",
                  render: (row) => (
                    <div>
                      <p>{row.owner?.fullName ?? "—"}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {row.owner?.phone ?? ""}
                      </p>
                    </div>
                  ),
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
                  header: "Date",
                  render: (row) => formatDate(row.createdAt),
                },
              ]}
              rowActions={(row) => (
                <Link
                  to={`/requests/${row.id}`}
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
