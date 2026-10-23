import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DecisionDialog } from "@/components/DecisionDialog";
import { Alert } from "@/components/ui/alert";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { api, getErrorMessage } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/media";
import { formatDate, formatMoney, statusLabel } from "@/lib/utils";

type ListingDetail = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  price?: number | null;
  currency?: string | null;
  isFeatured?: boolean;
  rejectionReason?: string | null;
  createdAt: string;
  commune?: { name: string } | null;
  neighborhood?: { name: string } | null;
  category?: { name: string } | null;
  owner?: {
    fullName: string;
    email?: string;
    phone?: string | null;
  } | null;
  providerProfile?: {
    displayName: string;
    contactEmail?: string | null;
    phone?: string | null;
  } | null;
  media?: Array<{ id: string; url: string; type?: string }>;
  coverageCommunes?: Array<{ name: string }>;
};

export function ListingDetailPage({
  kind,
}: {
  kind: "properties" | "services";
}) {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<"approve" | "reject" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const label = kind === "properties" ? "annonce" : "service";
  const listPath = `/${kind}`;

  const { data, isLoading, error } = useQuery({
    queryKey: [`admin-${kind}-detail`, id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data: body } = await api.get<ListingDetail>(`/admin/${kind}/${id}`);
      return body;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (payload: { decision: "APPROVED" | "REJECTED"; reason: string }) => {
      const { data: body } = await api.patch<{ nextPendingId?: string | null }>(
        `/admin/${kind}/${id}/review`,
        {
          decision: payload.decision,
          reason: payload.reason || undefined,
        }
      );
      return body;
    },
    onSuccess: async (body) => {
      await queryClient.invalidateQueries({ queryKey: [`admin-${kind}`] });
      setMessage(
        body.nextPendingId
          ? "Décision enregistrée. Ouverture de l'élément suivant…"
          : "Décision enregistrée."
      );
      if (body.nextPendingId) {
        navigate(`${listPath}/${body.nextPendingId}`);
      } else {
        navigate(`${listPath}?status=PENDING`);
      }
    },
  });

  const featureMutation = useMutation({
    mutationFn: async (isFeatured: boolean) => {
      const { data: body } = await api.patch(`/admin/${kind}/${id}/feature`, {
        isFeatured,
      });
      return body as ListingDetail;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [`admin-${kind}-detail`, id] });
      setMessage("Mise à la une mise à jour.");
    },
  });

  if (isLoading) return <Spinner />;
  if (error) return <Alert tone="error">{getErrorMessage(error)}</Alert>;
  if (!data) return null;

  const media = data.media ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to={listPath} className="text-sm text-ireduc-navy hover:underline">
            ← Retour à la liste
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-ireduc-navy">{data.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={statusTone(data.status)}>{statusLabel(data.status)}</Badge>
            {data.isFeatured ? <Badge tone="info">À la une</Badge> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.status === "PENDING" ? (
            <>
              <Button variant="success" onClick={() => setDialog("approve")}>
                Approuver
              </Button>
              <Button variant="danger" onClick={() => setDialog("reject")}>
                Rejeter
              </Button>
            </>
          ) : null}
          <Button
            variant="outline"
            disabled={featureMutation.isPending}
            onClick={() => featureMutation.mutate(!data.isFeatured)}
          >
            {data.isFeatured ? "Retirer de la une" : "Mettre à la une"}
          </Button>
        </div>
      </div>

      {message ? <Alert tone="success">{message}</Alert> : null}
      {reviewMutation.error || featureMutation.error ? (
        <Alert tone="error">
          {getErrorMessage(reviewMutation.error ?? featureMutation.error)}
        </Alert>
      ) : null}

      {media.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((item) => {
            const src = resolveMediaUrl(item.url);
            return src ? (
              <a key={item.id} href={src} target="_blank" rel="noreferrer">
                <img
                  src={src}
                  alt=""
                  className="h-48 w-full rounded-lg object-cover"
                />
              </a>
            ) : null;
          })}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-slate-500">Prix :</span>{" "}
              {formatMoney(data.price, data.currency ?? "USD")}
            </p>
            <p>
              <span className="text-slate-500">Catégorie :</span>{" "}
              {data.category?.name ?? "—"}
            </p>
            {kind === "properties" ? (
              <p>
                <span className="text-slate-500">Localisation :</span>{" "}
                {[data.commune?.name, data.neighborhood?.name]
                  .filter(Boolean)
                  .join(" / ") || "—"}
              </p>
            ) : (
              <p>
                <span className="text-slate-500">Couverture :</span>{" "}
                {data.coverageCommunes?.map((c) => c.name).join(", ") || "—"}
              </p>
            )}
            <p>
              <span className="text-slate-500">Créé le :</span>{" "}
              {formatDate(data.createdAt)}
            </p>
            {data.rejectionReason ? (
              <Alert tone="error">Motif de rejet : {data.rejectionReason}</Alert>
            ) : null}
            {data.description ? (
              <p className="whitespace-pre-wrap pt-2 text-slate-700">
                {data.description}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.owner ? (
              <>
                <p>{data.owner.fullName}</p>
                <p>{data.owner.email ?? "—"}</p>
                <p>{data.owner.phone ?? "—"}</p>
              </>
            ) : null}
            {data.providerProfile ? (
              <>
                <p>{data.providerProfile.displayName}</p>
                <p>{data.providerProfile.contactEmail ?? "—"}</p>
                <p>{data.providerProfile.phone ?? "—"}</p>
              </>
            ) : null}
            {!data.owner && !data.providerProfile ? (
              <p className="text-slate-500">Aucun contact.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <DecisionDialog
        open={dialog === "approve"}
        title={`Approuver cette ${label} ?`}
        confirmLabel="Approuver"
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          try {
            await reviewMutation.mutateAsync({ decision: "APPROVED", reason });
          } catch (err) {
            throw new Error(getErrorMessage(err));
          }
        }}
      />
      <DecisionDialog
        open={dialog === "reject"}
        title={`Rejeter cette ${label} ?`}
        requireReason
        danger
        confirmLabel="Rejeter"
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          try {
            await reviewMutation.mutateAsync({ decision: "REJECTED", reason });
          } catch (err) {
            throw new Error(getErrorMessage(err));
          }
        }}
      />
    </div>
  );
}
