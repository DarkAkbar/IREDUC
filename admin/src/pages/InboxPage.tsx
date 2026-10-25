import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { api, getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";

type InboxRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export function InboxPage() {
  const queryClient = useQueryClient();
  const { data, error } = useQuery({
    queryKey: ["admin-inbox"],
    queryFn: async () => {
      const { data: body } = await api.get<{ data: InboxRow[] }>("/admin/inbox");
      return body.data;
    },
  });

  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/admin/inbox/${id}/read`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-inbox"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-inbox-unread"] });
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Boîte admin" description="Alertes modération et signalements." />
      {error ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      <Card>
        <CardContent className="pt-4">
          <DataTable
            rows={data ?? []}
            emptyTitle="Boîte vide"
            columns={[
              { key: "type", header: "Type", render: (r) => r.type },
              { key: "title", header: "Titre", render: (r) => r.title },
              { key: "date", header: "Date", render: (r) => formatDate(r.createdAt) },
            ]}
            rowActions={(r) =>
              !r.readAt ? (
                <Button size="sm" variant="outline" onClick={() => readMutation.mutate(r.id)}>
                  Marquer lu
                </Button>
              ) : (
                <span className="text-xs text-[var(--text-muted)]">Lu</span>
              )
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
