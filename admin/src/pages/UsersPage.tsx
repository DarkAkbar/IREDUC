import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
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
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { api, getErrorMessage } from "@/lib/api";
import { formatDate, statusLabel } from "@/lib/utils";

type UserRow = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  systemRole: string;
  accountStatus: string;
  createdAt: string;
};

type PageResult = {
  data: UserRow[];
  meta: { page: number; totalPages: number };
};

export function UsersPage() {
  const navigate = useNavigate();
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
      <PageHeader
        title="Utilisateurs"
        description="Recherche, consultation et suspension des comptes."
      />

      <Card>
        <CardContent className="space-y-4">
          <FilterChips
            value={status || "ALL"}
            onChange={(value) =>
              update({ status: value === "ALL" ? "" : value, page: "1" })
            }
            options={[
              { value: "ALL", label: "Tous" },
              { value: "ACTIVE", label: "Actifs" },
              { value: "SUSPENDED", label: "Suspendus" },
            ]}
          />
          <div className="flex flex-col gap-3 lg:flex-row">
            <form
              className="flex flex-1 gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                update({ search, page: "1" });
              }}
            >
              <Input
                placeholder="Nom, numéro ou e-mail…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button type="submit" variant="navy">
                Rechercher
              </Button>
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
          </div>
        </CardContent>
      </Card>

      {error ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}

      <Card>
        {isLoading ? <TableSkeleton /> : null}
        {data ? (
          <>
            <DataTable
              rows={data.data}
              emptyTitle="Aucun utilisateur"
              emptyDescription="Aucun compte pour ces filtres."
              onRowClick={(row) => navigate(`/users/${row.id}`)}
              columns={[
                {
                  key: "user",
                  header: "Utilisateur",
                  render: (row) => (
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ireduc-navy text-xs font-extrabold text-white">
                        {row.fullName
                          .split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </span>
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">
                          {row.fullName}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {row.email ?? "—"}
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "phone",
                  header: "Téléphone",
                  render: (row) => (
                    <span className="font-semibold text-ireduc-navy">
                      {row.phone}
                    </span>
                  ),
                },
                {
                  key: "role",
                  header: "Rôle",
                  render: (row) => statusLabel(row.systemRole),
                },
                {
                  key: "status",
                  header: "Statut",
                  render: (row) => (
                    <StatusBadge tone={statusTone(row.accountStatus)}>
                      {statusLabel(row.accountStatus)}
                    </StatusBadge>
                  ),
                },
                {
                  key: "date",
                  header: "Inscrit le",
                  render: (row) => formatDate(row.createdAt),
                },
              ]}
              rowActions={(row) => (
                <Link
                  to={`/users/${row.id}`}
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
