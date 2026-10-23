import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Badge, statusTone } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
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
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "PENDING";
  const page = Number(params.get("page") ?? "1");
  const [q, setQ] = useState(params.get("q") ?? "");
  const label = kind === "properties" ? "annonces" : "services";
  const basePath = `/${kind}`;

  const { data, isLoading, error } = useQuery({
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
      <p className="text-sm text-ireduc-muted">Modération et mise à la une.</p>

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
            <option value="DRAFT">Brouillon</option>
            <option value="ARCHIVED">Archivé</option>
          </Select>
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
                  <th className="px-4 py-3 font-semibold">Titre</th>
                  <th className="px-4 py-3 font-semibold">Catégorie</th>
                  <th className="px-4 py-3 font-semibold">Prix</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold">Créé le</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((row) => (
                  <tr key={row.id} className="border-b border-ireduc-border/70 transition hover:bg-slate-50/70 last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        to={`${basePath}/${row.id}`}
                        className="font-medium text-ireduc-navy hover:underline"
                      >
                        {row.title}
                      </Link>
                      {row.isFeatured ? (
                        <Badge tone="info" className="ml-2">
                          À la une
                        </Badge>
                      ) : null}
                      <p className="text-xs text-slate-500">
                        {row.owner?.fullName ??
                          row.providerProfile?.displayName ??
                          "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {row.category?.name ?? "—"}
                      {row.commune ? (
                        <p className="text-xs text-slate-500">{row.commune.name}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {formatMoney(row.price, row.currency ?? "USD")}
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
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Aucun élément pour ce filtre.
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
