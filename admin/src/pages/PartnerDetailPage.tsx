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
import { docTypeLabel, resolveMediaUrl } from "@/lib/media";
import { formatDate, statusLabel } from "@/lib/utils";

type ProviderDetail = {
  id: string;
  displayName: string;
  type: string;
  bio?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  contactEmail?: string | null;
  website?: string | null;
  address?: string | null;
  reviewStatus: string;
  rejectionReason?: string | null;
  yearsOfExperience?: number | null;
  user: {
    fullName: string;
    email: string | null;
    phone?: string | null;
    whatsapp?: string | null;
  };
  documents: Array<{
    id: string;
    docType: string;
    fileUrl: string;
    reviewStatus: string;
  }>;
  properties: Array<{ id: string; title: string; status: string }>;
  services: Array<{ id: string; title: string; status: string }>;
  history: Array<{
    id: string;
    action: string;
    reason?: string | null;
    createdAt: string;
    admin: { fullName: string };
  }>;
};

export function PartnerDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [dialog, setDialog] = useState<"approve" | "reject" | "complement" | null>(
    null
  );
  const [message, setMessage] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-provider", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data: body } = await api.get<ProviderDetail>(`/admin/providers/${id}`);
      return body;
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: {
      kind: "approve" | "reject" | "complement";
      reason: string;
    }) => {
      if (payload.kind === "complement") {
        await api.patch(`/admin/providers/${id}/request-complement`, {
          reason: payload.reason,
        });
        return { nextPendingId: null as string | null };
      }
      const { data: body } = await api.patch<{ nextPendingId?: string | null }>(
        `/admin/providers/${id}/review`,
        {
          decision: payload.kind === "approve" ? "APPROVED" : "REJECTED",
          reason: payload.reason.trim() || undefined,
        }
      );
      return body;
    },
    onSuccess: async (body, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-providers"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-provider"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["health-info"] }),
      ]);
      const okMsg =
        variables.kind === "approve"
          ? "Partenaire approuvé."
          : variables.kind === "reject"
            ? "Partenaire rejeté."
            : "Demande de complément envoyée.";
      pushToast(okMsg, "success");
      setMessage(okMsg);
      if (variables.kind === "complement") return;
      if (body.nextPendingId) {
        navigate(`/partners/${body.nextPendingId}`);
      } else {
        navigate("/partners?status=PENDING");
      }
    },
  });

  if (isLoading) return <Spinner />;
  if (error) return <Alert tone="error">{getErrorMessage(error)}</Alert>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/partners" className="text-sm text-ireduc-navy hover:underline">
            ← Retour aux partenaires
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-ireduc-navy">
            {data.displayName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(data.reviewStatus)}>
              {statusLabel(data.reviewStatus)}
            </Badge>
            <span className="text-sm text-[var(--text-muted)]">{data.type}</span>
          </div>
        </div>
        {data.reviewStatus === "PENDING" ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="success"
              disabled={mutation.isPending}
              onClick={() => setDialog("approve")}
            >
              Approuver
            </Button>
            <Button
              variant="danger"
              disabled={mutation.isPending}
              onClick={() => setDialog("reject")}
            >
              Rejeter
            </Button>
            <Button
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => setDialog("complement")}
            >
              Demander un complément
            </Button>
          </div>
        ) : null}
      </div>

      {message ? <Alert tone="success">{message}</Alert> : null}
      {mutation.error ? (
        <Alert tone="error">{getErrorMessage(mutation.error)}</Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-[var(--text-muted)]">Compte :</span> {data.user.fullName}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">Téléphone :</span>{" "}
              {data.phone ?? data.user.phone ?? "—"}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">E-mail :</span>{" "}
              {data.user.email ?? "—"}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">WhatsApp :</span>{" "}
              {data.whatsapp ?? data.user.whatsapp ?? "—"}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">E-mail pro :</span>{" "}
              {data.contactEmail ?? "—"}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">Site :</span> {data.website ?? "—"}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">Adresse :</span> {data.address ?? "—"}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">Expérience :</span>{" "}
              {data.yearsOfExperience != null
                ? `${data.yearsOfExperience} an(s)`
                : "—"}
            </p>
            {data.bio ? <p className="pt-2 text-[var(--text-primary)]">{data.bio}</p> : null}
            {data.rejectionReason ? (
              <Alert tone="error">Motif de rejet : {data.rejectionReason}</Alert>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.documents.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Aucun document.</p>
            ) : (
              data.documents.map((doc) => {
                const href = resolveMediaUrl(doc.fileUrl);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-ireduc-border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {docTypeLabel[doc.docType] ?? doc.docType}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {statusLabel(doc.reviewStatus)}
                      </p>
                    </div>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ireduc-navy hover:underline"
                      >
                        Ouvrir
                      </a>
                    ) : null}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Annonces liées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.properties.length === 0 ? (
              <p className="text-[var(--text-muted)]">Aucune.</p>
            ) : (
              data.properties.map((p) => (
                <Link
                  key={p.id}
                  to={`/properties/${p.id}`}
                  className="block text-ireduc-navy hover:underline"
                >
                  {p.title} — {statusLabel(p.status)}
                </Link>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Services liés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.services.length === 0 ? (
              <p className="text-[var(--text-muted)]">Aucun.</p>
            ) : (
              data.services.map((s) => (
                <Link
                  key={s.id}
                  to={`/services/${s.id}`}
                  className="block text-ireduc-navy hover:underline"
                >
                  {s.title} — {statusLabel(s.status)}
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique de modération</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data.history.length === 0 ? (
            <p className="text-[var(--text-muted)]">Aucune action enregistrée.</p>
          ) : (
            data.history.map((h) => (
              <div key={h.id} className="rounded-md border border-ireduc-border px-3 py-2">
                <p className="font-medium">
                  {h.action} — {h.admin.fullName}
                </p>
                <p className="text-xs text-[var(--text-muted)]">{formatDate(h.createdAt)}</p>
                {h.reason ? <p className="mt-1 text-[var(--text-primary)]">{h.reason}</p> : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <DecisionDialog
        open={dialog === "approve"}
        title="Approuver ce partenaire ?"
        description="Le compte partenaire pourra publier des contenus."
        confirmLabel="Approuver"
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          try {
            await mutation.mutateAsync({ kind: "approve", reason });
          } catch (err) {
            throw new Error(getErrorMessage(err));
          }
        }}
      />
      <DecisionDialog
        open={dialog === "reject"}
        title="Rejeter ce partenaire ?"
        requireReason
        danger
        confirmLabel="Rejeter"
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          try {
            await mutation.mutateAsync({ kind: "reject", reason });
          } catch (err) {
            throw new Error(getErrorMessage(err));
          }
        }}
      />
      <DecisionDialog
        open={dialog === "complement"}
        title="Demander un complément"
        description="Le partenaire recevra une notification."
        requireReason
        confirmLabel="Envoyer"
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          try {
            await mutation.mutateAsync({ kind: "complement", reason });
          } catch (err) {
            throw new Error(getErrorMessage(err));
          }
        }}
      />
    </div>
  );
}
