import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { FilterChips } from "@/components/ui/FilterChips";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api, getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";

type AuthEventRow = {
  id: string;
  eventType: string;
  emailOrPhone: string | null;
  success: boolean;
  ipAddress: string | null;
  createdAt: string;
  user: { fullName: string } | null;
};

export function AuthEventsPage() {
  const [page, setPage] = useState(1);
  const [successFilter, setSuccessFilter] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-auth-events", page, successFilter],
    queryFn: async () => {
      const { data: body } = await api.get<{
        data: AuthEventRow[];
        meta: { page: number; totalPages: number };
      }>("/admin/auth-events", {
        params: {
          page,
          limit: 20,
          success: successFilter || undefined,
        },
      });
      return body;
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Journaux de sécurité"
        description="Connexions réussies et échecs d'authentification."
      />
      {error ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      <FilterChips
        options={[
          { value: "", label: "Tous" },
          { value: "true", label: "Succès" },
          { value: "false", label: "Échecs" },
        ]}
        value={successFilter}
        onChange={setSuccessFilter}
      />
      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <>
              <DataTable
                rows={data?.data ?? []}
                emptyTitle="Aucun événement"
                columns={[
                  {
                    key: "type",
                    header: "Type",
                    render: (row) => row.eventType,
                  },
                  {
                    key: "user",
                    header: "Utilisateur",
                    render: (row) =>
                      row.user?.fullName ?? row.emailOrPhone ?? "—",
                  },
                  {
                    key: "success",
                    header: "Résultat",
                    render: (row) => (
                      <StatusBadge tone={row.success ? "success" : "danger"}>
                        {row.success ? "Succès" : "Échec"}
                      </StatusBadge>
                    ),
                  },
                  {
                    key: "ip",
                    header: "IP",
                    render: (row) => row.ipAddress ?? "—",
                  },
                  {
                    key: "date",
                    header: "Date",
                    render: (row) => formatDate(row.createdAt),
                  },
                ]}
              />
              {data?.meta ? (
                <Pagination
                  page={data.meta.page}
                  totalPages={data.meta.totalPages}
                  onPageChange={setPage}
                />
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
