import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { FilterChips } from "@/components/ui/FilterChips";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/textarea";
import { api, getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";

type ReportRow = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: { fullName: string; phone: string };
};

type PageResult = {
  data: ReportRow[];
  meta: { page: number; totalPages: number; total: number };
};

const statusOptions = [
  { value: "", label: "Tous" },
  { value: "OPEN", label: "Ouverts" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "RESOLVED", label: "Résolus" },
  { value: "DISMISSED", label: "Classés sans suite" },
];

const targetLabels: Record<string, string> = {
  PROPERTY: "Annonce",
  SERVICE: "Service",
  USER: "Utilisateur",
  MESSAGE: "Message",
  REVIEW: "Avis",
};

export function ReportsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const queryKey = useMemo(() => ["admin-reports", status, page], [status, page]);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data: body } = await api.get<PageResult>("/admin/reports", {
        params: { status: status || undefined, page, limit: 20 },
      });
      return body;
    },
  });

  const detailQuery = useQuery({
    queryKey: ["admin-report", selectedId],
    enabled: Boolean(selectedId),
    queryFn: async () => {
      const { data: body } = await api.get(`/admin/reports/${selectedId}`);
      return body as ReportRow & { details?: string | null; adminNote?: string | null };
    },
  });

  const patchMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      status?: string;
      action?: string;
      adminNote?: string;
    }) => {
      await api.patch(`/admin/reports/${payload.id}`, {
        status: payload.status,
        action: payload.action,
        adminNote: payload.adminNote,
      });
    },
    onSuccess: async () => {
      setMessage("Signalement mis à jour.");
      await queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-reports-open-count"] });
      if (selectedId) {
        await queryClient.invalidateQueries({ queryKey: ["admin-report", selectedId] });
      }
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Signalements"
        description="Modération des contenus signalés par les utilisateurs."
      />

      {message ? <Alert tone="success">{message}</Alert> : null}
      {error || patchMutation.error ? (
        <Alert tone="error">
          {getErrorMessage(error ?? patchMutation.error)}
        </Alert>
      ) : null}

      <FilterChips options={statusOptions} value={status} onChange={setStatus} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-4">
            {isLoading ? (
              <TableSkeleton />
            ) : (
              <>
                <DataTable
                  rows={data?.data ?? []}
                  emptyTitle="Aucun signalement"
                  onRowClick={(row) => {
                    setSelectedId(row.id);
                    setAdminNote("");
                  }}
                  columns={[
                    {
                      key: "type",
                      header: "Cible",
                      render: (row) => targetLabels[row.targetType] ?? row.targetType,
                    },
                    {
                      key: "reason",
                      header: "Motif",
                      render: (row) => row.reason,
                    },
                    {
                      key: "status",
                      header: "Statut",
                      render: (row) => (
                        <StatusBadge tone={row.status === "OPEN" ? "pending" : "muted"}>
                          {row.status}
                        </StatusBadge>
                      ),
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

        <Card>
          <CardContent className="space-y-3 pt-4">
            {!selectedId ? (
              <p className="text-sm text-[var(--text-muted)]">
                Sélectionnez un signalement pour voir le détail et agir.
              </p>
            ) : detailQuery.isLoading ? (
              <TableSkeleton />
            ) : detailQuery.data ? (
              <>
                <p className="text-sm">
                  <span className="font-bold">Signaleur :</span>{" "}
                  {detailQuery.data.reporter.fullName} ({detailQuery.data.reporter.phone})
                </p>
                <p className="text-sm">
                  <span className="font-bold">Motif :</span> {detailQuery.data.reason}
                </p>
                {detailQuery.data.details ? (
                  <p className="text-sm text-[var(--text-muted)]">
                    {detailQuery.data.details}
                  </p>
                ) : null}
                <Textarea
                  placeholder="Note interne admin"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      patchMutation.mutate({
                        id: selectedId,
                        status: "IN_PROGRESS",
                        adminNote: adminNote || undefined,
                      })
                    }
                  >
                    Prendre en charge
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      patchMutation.mutate({
                        id: selectedId,
                        action: "hide_content",
                        adminNote: adminNote || undefined,
                      })
                    }
                  >
                    Masquer le contenu
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      patchMutation.mutate({
                        id: selectedId,
                        action: "suspend_user",
                        adminNote: adminNote || undefined,
                      })
                    }
                  >
                    Suspendre l&apos;utilisateur
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      patchMutation.mutate({
                        id: selectedId,
                        action: "dismiss",
                        adminNote: adminNote || undefined,
                      })
                    }
                  >
                    Classer sans suite
                  </Button>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
