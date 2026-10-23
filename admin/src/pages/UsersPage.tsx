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
import { formatDate, statusLabel } from "@/lib/utils";

type UserRow = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  systemRole: string;
  accountStatus: string;
  createdAt: string;
};

type PageResult = {
  data: UserRow[];
  meta: { page: number; totalPages: number };
};

export function UsersPage() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") ?? "1");
  const role = params.get("role") ?? "";
  const status = params.get("status") ?? "";
  const [search, setSearch] = useState(params.get("search") ?? "");

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "admin-users",
      page,
      role,
      status,
      params.get("search") ?? "",
    ],
    queryFn: async () => {
      const { data: body } = await api.get<PageResult>("/admin/users", {
        params: {
          page,
          limit: 20,
          role: role || undefined,
          status: status || undefined,
          search: params.get("search") || undefined,
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
      <div>
        <h1 className="text-2xl font-bold text-ireduc-navy">Utilisateurs</h1>
        <p className="text-sm text-slate-600">
          Recherche, consultation et suspension des comptes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 lg:flex-row">
          <form
            className="flex flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              update({ search, page: "1" });
            }}
          >
            <Input
              placeholder="Nom, e-mail ou téléphone…"
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
          <Select
            value={role}
            onChange={(e) => update({ role: e.target.value, page: "1" })}
            className="lg:w-48"
          >
            <option value="">Tous les rôles</option>
            <option value="USER">Utilisateur</option>
            <option value="ADMIN">Administrateur</option>
            <option value="SUPER_ADMIN">Super administrateur</option>
          </Select>
          <Select
            value={status}
            onChange={(e) => update({ status: e.target.value, page: "1" })}
            className="lg:w-48"
          >
            <option value="">Tous les statuts</option>
            <option value="ACTIVE">Actif</option>
            <option value="SUSPENDED">Suspendu</option>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? <Spinner /> : null}
      {error ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}

      {data ? (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-ireduc-border bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Utilisateur</th>
                  <th className="px-4 py-3 font-medium">Rôle</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Inscrit le</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((row) => (
                  <tr key={row.id} className="border-b border-ireduc-border last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        to={`/users/${row.id}`}
                        className="font-medium text-ireduc-navy hover:underline"
                      >
                        {row.fullName}
                      </Link>
                      <p className="text-xs text-slate-500">{row.email}</p>
                    </td>
                    <td className="px-4 py-3">{statusLabel(row.systemRole)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(row.accountStatus)}>
                        {statusLabel(row.accountStatus)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{formatDate(row.createdAt)}</td>
                  </tr>
                ))}
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
