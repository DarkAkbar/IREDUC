import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Badge, statusTone } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { api, getErrorMessage } from "@/lib/api";
import { formatDate, statusLabel } from "@/lib/utils";

type ProviderRow = {
  id: string;
  displayName: string;
  type: string;
  reviewStatus: string;
  createdAt: string;
  user: { fullName: string; email: string; phone?: string | null };
};

type PageResult = {
  data: ProviderRow[];
  meta: { page: number; totalPages: number; total: number };
};

export function PartnersPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "PENDING";
  const page = Number(params.get("page") ?? "1");
  const [q, setQ] = useState(params.get("q") ?? "");

  const queryKey = useMemo(
    () => ["admin-providers", status, page, params.get("q") ?? ""],
    [status, page, params]
  );

  const { data, isLoading, error } = useQuery({
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
      <p className="text-sm text-ireduc-muted">
        Validation des dossiers partenaires.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row">
          <Select
            value={status}
            onChange={(e) => update({ status: e.target.value, page: "1" })}
            className="md:w-48"
          >
            <option value="PENDING">En attente</option>
            <option value="APPROVED">Approuvé</option>
            <option value="REJECTED">Rejeté</option>
          </Select>
          <form
            className="flex flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              update({ q, page: "1" });
            }}
          >
            <Input
              placeholder="Rechercher un partenaire…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
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
                  <th className="px-4 py-3 font-semibold">Partenaire</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold">Créé le</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((row) => (
                  <tr key={row.id} className="border-b border-ireduc-border/70 transition hover:bg-slate-50/70 last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        to={`/partners/${row.id}`}
                        className="font-medium text-ireduc-navy hover:underline"
                      >
                        {row.displayName}
                      </Link>
                      <p className="text-xs text-slate-500">{row.user.fullName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{row.user.email}</p>
                      <p className="text-xs text-slate-500">{row.user.phone ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">{row.type}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(row.reviewStatus)}>
                        {statusLabel(row.reviewStatus)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{formatDate(row.createdAt)}</td>
                  </tr>
                ))}
                {data.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Aucun partenaire pour ce filtre.
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
