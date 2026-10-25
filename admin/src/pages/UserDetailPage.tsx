import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DecisionDialog } from "@/components/DecisionDialog";
import { Alert } from "@/components/ui/alert";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/spinner";
import { isSuperAdmin } from "@/lib/auth-storage";
import { api, getErrorMessage } from "@/lib/api";
import { formatDate, statusLabel } from "@/lib/utils";

type UserDetail = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  systemRole: string;
  accountStatus: string;
  emailVerified: boolean;
  createdAt: string;
  providerProfile?: { displayName: string; reviewStatus: string } | null;
  ownedProperties?: Array<{ id: string; title: string; status: string }>;
  requests?: Array<{ id: string; number: string; status: string }>;
  activity?: {
    propertiesCount: number;
    requestsCount: number;
    reportsAgainstUser: number;
    reportsFiledCount: number;
  };
  sessions?: Array<{
    id: string;
    deviceName: string | null;
    ipAddress: string | null;
    lastUsedAt: string | null;
    createdAt: string;
  }>;
};

export function UserDetailPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<"suspend" | "reactivate" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-user", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data: body } = await api.get<UserDetail>(`/admin/users/${id}`);
      return body;
    },
  });

  const superAdmin = isSuperAdmin();

  const forceLogoutMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/admin/users/${id}/force-logout`);
    },
    onSuccess: async () => {
      setMessage("Sessions révoquées.");
      await queryClient.invalidateQueries({ queryKey: ["admin-user", id] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const { data: body } = await api.post<{ temporaryPassword: string }>(
        `/admin/users/${id}/reset-password`
      );
      return body.temporaryPassword;
    },
    onSuccess: (temp) => {
      setMessage(`Mot de passe temporaire : ${temp}`);
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: { status: "ACTIVE" | "SUSPENDED"; reason: string }) => {
      await api.patch(`/admin/users/${id}/status`, {
        status: payload.status,
        reason: payload.reason || undefined,
      });
    },
    onSuccess: async (_d, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-user", id] });
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setMessage(
        variables.status === "SUSPENDED"
          ? "Compte suspendu."
          : "Compte réactivé."
      );
    },
  });

  if (isLoading) return <Spinner />;
  if (error) return <Alert tone="error">{getErrorMessage(error)}</Alert>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <Link to="/users" className="text-sm font-semibold text-ireduc-navy hover:underline">
        ← Retour aux utilisateurs
      </Link>
      <PageHeader
        title={data.fullName}
        actions={
          data.accountStatus === "ACTIVE" ? (
            <Button variant="danger" onClick={() => setDialog("suspend")}>
              Suspendre
            </Button>
          ) : (
            <Button variant="success" onClick={() => setDialog("reactivate")}>
              Réactiver
            </Button>
          )
        }
      />
      <div className="-mt-2 flex flex-wrap gap-2">
        <Badge tone={statusTone(data.accountStatus)}>
          {statusLabel(data.accountStatus)}
        </Badge>
        <Badge>{statusLabel(data.systemRole)}</Badge>
      </div>

      {message ? <Alert tone="success">{message}</Alert> : null}
      {mutation.error ? (
        <Alert tone="error">{getErrorMessage(mutation.error)}</Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Détails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-[var(--text-muted)]">E-mail :</span> {data.email}
            {data.emailVerified ? " (vérifié)" : " (non vérifié)"}
          </p>
          <p>
            <span className="text-[var(--text-muted)]">Téléphone :</span> {data.phone ?? "—"}
          </p>
          <p>
            <span className="text-[var(--text-muted)]">WhatsApp :</span> {data.whatsapp ?? "—"}
          </p>
          <p>
            <span className="text-[var(--text-muted)]">Inscrit le :</span>{" "}
            {formatDate(data.createdAt)}
          </p>
          {data.providerProfile ? (
            <p>
              <span className="text-[var(--text-muted)]">Profil partenaire :</span>{" "}
              {data.providerProfile.displayName} (
              {statusLabel(data.providerProfile.reviewStatus)})
            </p>
          ) : null}
        </CardContent>
      </Card>

      {data.activity ? (
        <Card>
          <CardHeader>
            <CardTitle>Activité</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
            <p>Annonces : {data.activity.propertiesCount}</p>
            <p>Demandes : {data.activity.requestsCount}</p>
            <p>Signalements reçus : {data.activity.reportsAgainstUser}</p>
            <p>Signalements émis : {data.activity.reportsFiledCount}</p>
          </CardContent>
        </Card>
      ) : null}

      {data.sessions ? (
        <Card>
          <CardHeader>
            <CardTitle>Sessions actives ({data.sessions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.sessions.length === 0 ? (
              <p className="text-[var(--text-muted)]">Aucune session active.</p>
            ) : (
              data.sessions.map((s) => (
                <p key={s.id}>
                  {s.deviceName ?? "Appareil inconnu"} — {s.ipAddress ?? "IP inconnue"} —{" "}
                  {formatDate(s.lastUsedAt ?? s.createdAt)}
                </p>
              ))
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={forceLogoutMutation.isPending}
              onClick={() => forceLogoutMutation.mutate()}
            >
              Forcer la déconnexion
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {superAdmin ? (
        <Button
          variant="outline"
          disabled={resetPasswordMutation.isPending}
          onClick={() => resetPasswordMutation.mutate()}
        >
          Réinitialiser le mot de passe
        </Button>
      ) : null}

      <DecisionDialog
        open={dialog === "suspend"}
        title="Suspendre ce compte ?"
        requireReason
        danger
        confirmLabel="Suspendre"
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          try {
            await mutation.mutateAsync({ status: "SUSPENDED", reason });
          } catch (err) {
            throw new Error(getErrorMessage(err));
          }
        }}
      />
      <DecisionDialog
        open={dialog === "reactivate"}
        title="Réactiver ce compte ?"
        confirmLabel="Réactiver"
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          try {
            await mutation.mutateAsync({ status: "ACTIVE", reason });
          } catch (err) {
            throw new Error(getErrorMessage(err));
          }
        }}
      />
    </div>
  );
}
