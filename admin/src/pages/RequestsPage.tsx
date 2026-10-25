import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ireduc-muted">
          Supervision des demandes (annulation administrative possible avec motif).
        </p>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row">
            <Select
              value={status}
              onChange={(e) => update({ status: e.target.value, page: "1" })}
              className="md:w-44"
            >
              <option value="">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="APPROVED">Approuvée</option>
              <option value="REJECTED">Rejetée</option>
              <option value="CANCELLED">Annulée</option>
              <option value="COMPLETED">Terminée</option>
            </Select>
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
            <button
              type="submit"
              className="rounded-md bg-ireduc-navy px-4 text-sm text-white"
            >
              Rechercher
            </button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? <Spinner /> : null}
      {error ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}

      {data ? (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-ireduc-border bg-slate-50/80 text-xs uppercase tracking-wide text-ireduc-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">N° IRD</th>
                  <th className="px-4 py-3 font-semibold">Demandeur</th>
                  <th className="px-4 py-3 font-semibold">Cible</th>
                  <th className="px-4 py-3 font-semibold">Propriétaire</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-ireduc-border/70 transition hover:bg-slate-50/70 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/requests/${row.id}`}
                        className="font-medium text-ireduc-navy hover:underline"
                      >
                        {row.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ireduc-navy">
                        {row.requester.fullName}
                      </p>
                      <p className="text-xs text-slate-500">{row.requester.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {row.target.title ?? "—"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {row.targetType === "PROPERTY" ? "Bien" : "Service"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{row.owner?.fullName ?? "—"}</p>
                      <p className="text-xs text-slate-500">
                        {row.owner?.phone ?? ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(row.status)}>
                        {statusLabel(row.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{formatDate(row.createdAt)}</td>
                  </tr>
                ))}
                {data.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Aucune demande pour ces filtres.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </CardContent>
          <div className="px-4 pb-4">
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={(p) => update({ page: String(p) })}
            />
          </div>
        </Card>
      ) : null}
    </div>
  );
}
