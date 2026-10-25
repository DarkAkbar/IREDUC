import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DecisionDialog } from "@/components/DecisionDialog";
import { Alert } from "@/components/ui/alert";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { api, getErrorMessage } from "@/lib/api";
import { formatDate, statusLabel } from "@/lib/utils";

type RequestDetail = {
  id: string;
  number: string;
  status: string;
  targetType: string;
  fullName: string;
  phone: string;
  email?: string | null;
  message?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  requester: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
  };
  owner: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
  } | null;
  property?: { id: string; title: string; status: string } | null;
  service?: { id: string; title: string; status: string } | null;
  statusHistory: Array<{
    status: string;
    at: string;
    source: string;
    label: string;
    reason?: string | null;
    admin?: { fullName: string } | null;
  }>;
};

export function RequestDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-request", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data: body } = await api.get<RequestDetail>(`/admin/requests/${id}`);
      return body;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (reason: string) => {
      const { data: body } = await api.patch(`/admin/requests/${id}/cancel`, {
        reason,
      });
      return body;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-request", id] }),
        queryClient.invalidateQueries({ queryKey: ["admin-stats"] }),
      ]);
      pushToast("Demande annulée par l'administration.", "success");
      navigate("/requests");
    },
  });

  if (isLoading) return <Spinner />;
  if (error) return <Alert tone="error">{getErrorMessage(error)}</Alert>;
  if (!data) return null;

  const canCancel =
    data.status !== "CANCELLED" && data.status !== "COMPLETED";
  const targetTitle = data.property?.title ?? data.service?.title ?? "—";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/requests" className="text-sm text-ireduc-navy hover:underline">
            ← Retour aux demandes
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-ireduc-navy">
            {data.number}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={statusTone(data.status)}>{statusLabel(data.status)}</Badge>
            <Badge tone="info">
              {data.targetType === "PROPERTY" ? "Bien" : "Service"}
            </Badge>
          </div>
        </div>
        {canCancel ? (
          <Button
            variant="danger"
            disabled={cancelMutation.isPending}
            onClick={() => setDialogOpen(true)}
          >
            Annuler (abus)
          </Button>
        ) : null}
      </div>

      {cancelMutation.error ? (
        <Alert tone="error">{getErrorMessage(cancelMutation.error)}</Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Demandeur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{data.requester.fullName}</p>
            <p>{data.requester.phone}</p>
            <p>{data.requester.email ?? "—"}</p>
            {data.message ? (
              <p className="pt-2 text-slate-700">{data.message}</p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cible & propriétaire</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-slate-500">Cible :</span> {targetTitle}
            </p>
            <p>
              <span className="text-slate-500">Propriétaire :</span>{" "}
              {data.owner?.fullName ?? "—"}
            </p>
            <p>{data.owner?.phone ?? ""}</p>
            <p>
              <span className="text-slate-500">Créée le :</span>{" "}
              {formatDate(data.createdAt)}
            </p>
            {data.rejectionReason ? (
              <Alert tone="error">Motif : {data.rejectionReason}</Alert>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des statuts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data.statusHistory.map((h, index) => (
            <div
              key={`${h.at}-${index}`}
              className="rounded-md border border-ireduc-border px-3 py-2"
            >
              <p className="font-medium">
                {h.label}
                {h.admin ? ` — ${h.admin.fullName}` : ""}
              </p>
              <p className="text-xs text-slate-500">{formatDate(h.at)}</p>
              {h.reason ? <p className="mt-1 text-slate-700">{h.reason}</p> : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Alert tone="info">
        L'annulation administrative ne remplace pas la décision du propriétaire :
        elle sert uniquement à traiter les demandes abusives.
      </Alert>

      <DecisionDialog
        open={dialogOpen}
        title="Annuler cette demande ?"
        description="Le demandeur et le propriétaire seront notifiés. Motif obligatoire."
        requireReason
        danger
        confirmLabel="Annuler la demande"
        onClose={() => setDialogOpen(false)}
        onConfirm={async (reason) => {
          try {
            await cancelMutation.mutateAsync(reason);
          } catch (err) {
            throw new Error(getErrorMessage(err));
          }
        }}
      />
    </div>
  );
}
