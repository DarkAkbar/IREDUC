import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { DecisionDialog } from "@/components/DecisionDialog";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { api, getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const TABS = [
  { key: "general", label: "Général" },
  { key: "mobile", label: "Application mobile" },
  { key: "validation", label: "Règles de validation" },
  { key: "security", label: "Sécurité" },
  { key: "home", label: "Accueil" },
  { key: "notifications", label: "Notifications" },
] as const;

type SettingKey = (typeof TABS)[number]["key"];

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [tab, setTab] = useState<SettingKey>("general");
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-setting", tab],
    queryFn: async () => {
      const { data: body } = await api.get<{ key: string; value: Record<string, unknown> }>(
        `/admin/settings/${tab}`
      );
      return body;
    },
  });

  const historyQuery = useQuery({
    queryKey: ["admin-setting-history", tab],
    queryFn: async () => {
      const { data: body } = await api.get<{
        data: Array<{
          id: string;
          action: string;
          reason?: string | null;
          createdAt: string;
          admin: { fullName: string };
        }>;
      }>(`/admin/settings/${tab}/history`, { params: { limit: 10 } });
      return body;
    },
  });

  useEffect(() => {
    if (data?.value) setDraft({ ...data.value });
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (reason: string) => {
      await api.patch(`/admin/settings/${tab}`, {
        value: draft,
        reason: reason || undefined,
      });
    },
    onSuccess: async () => {
      pushToast("Paramètre enregistré.");
      await queryClient.invalidateQueries({ queryKey: ["admin-setting", tab] });
      await queryClient.invalidateQueries({
        queryKey: ["admin-setting-history", tab],
      });
    },
  });

  function setField(path: string, value: unknown) {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const parts = path.split(".");
      let cursor: Record<string, unknown> = next;
      for (let i = 0; i < parts.length - 1; i += 1) {
        cursor = cursor[parts[i]] as Record<string, unknown>;
      }
      cursor[parts[parts.length - 1]] = value;
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Paramètres"
        description="Configuration de la plateforme (modification réservée au super administrateur)."
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? "rounded-full bg-brand-gradient px-3.5 py-1.5 text-xs font-bold text-white"
                : "rounded-full border border-[var(--border-subtle)] px-3.5 py-1.5 text-xs font-bold text-[var(--text-muted)]"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      {mutation.error ? (
        <Alert tone="error">{getErrorMessage(mutation.error)}</Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{TABS.find((t) => t.key === tab)?.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading || !draft ? (
              <p className="text-sm text-[var(--text-muted)]">Chargement…</p>
            ) : (
              <SettingsForm tab={tab} draft={draft} setField={setField} />
            )}
            <div className="flex justify-end pt-2">
              <Button
                type="button"
                disabled={!draft || mutation.isPending}
                onClick={() => setConfirmOpen(true)}
              >
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historique</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(historyQuery.data?.data ?? []).length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                Aucune modification enregistrée.
              </p>
            ) : (
              historyQuery.data?.data.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-[var(--border-subtle)] px-3 py-2"
                >
                  <p className="text-sm font-bold">{row.admin.fullName}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {formatDate(row.createdAt)}
                  </p>
                  {row.reason ? (
                    <p className="mt-1 line-clamp-3 text-xs text-[var(--text-primary)]">
                      {row.reason}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <DecisionDialog
        open={confirmOpen}
        title="Confirmer la modification ?"
        description="Cette action est journalisée dans l'audit."
        confirmLabel="Enregistrer"
        onClose={() => setConfirmOpen(false)}
        onConfirm={async (reason) => {
          try {
            await mutation.mutateAsync(reason);
          } catch (err) {
            throw new Error(getErrorMessage(err));
          }
        }}
      />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-bold text-[var(--text-primary)]">{label}</span>
      {children}
    </label>
  );
}

function SettingsForm({
  tab,
  draft,
  setField,
}: {
  tab: SettingKey;
  draft: Record<string, unknown>;
  setField: (path: string, value: unknown) => void;
}) {
  if (tab === "general") {
    return (
      <>
        <Field label="Nom de la plateforme">
          <Input
            value={String(draft.platformName ?? "")}
            onChange={(e) => setField("platformName", e.target.value)}
          />
        </Field>
        <Field label="Slogan">
          <Input
            value={String(draft.slogan ?? "")}
            onChange={(e) => setField("slogan", e.target.value)}
          />
        </Field>
        <Field label="URL du logo">
          <Input
            value={String(draft.logoUrl ?? "")}
            onChange={(e) => setField("logoUrl", e.target.value || null)}
          />
        </Field>
        <Field label="Devise par défaut">
          <Select
            value={String(draft.defaultCurrency ?? "USD")}
            onChange={(e) => setField("defaultCurrency", e.target.value)}
          >
            <option value="USD">USD</option>
            <option value="CDF">CDF</option>
          </Select>
        </Field>
        <Field label="Ville de lancement">
          <Input
            value={String(draft.launchCity ?? "")}
            onChange={(e) => setField("launchCity", e.target.value)}
          />
        </Field>
        <Field label="WhatsApp support">
          <Input
            value={String(draft.supportWhatsapp ?? "")}
            onChange={(e) => setField("supportWhatsapp", e.target.value)}
          />
        </Field>
        <Field label="E-mail de contact">
          <Input
            type="email"
            value={String(draft.contactEmail ?? "")}
            onChange={(e) => setField("contactEmail", e.target.value)}
          />
        </Field>
      </>
    );
  }

  if (tab === "mobile") {
    return (
      <>
        <Field label="Version minimale exigée">
          <Input
            value={String(draft.minAppVersion ?? "")}
            onChange={(e) => setField("minAppVersion", e.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={Boolean(draft.maintenanceMode)}
            onChange={(e) => setField("maintenanceMode", e.target.checked)}
          />
          Mode maintenance
        </label>
        <Field label="Message de maintenance">
          <Textarea
            value={String(draft.maintenanceMessage ?? "")}
            onChange={(e) => setField("maintenanceMessage", e.target.value)}
          />
        </Field>
        <Field label="Conditions d'utilisation (URL)">
          <Input
            value={String(draft.termsUrl ?? "")}
            onChange={(e) => setField("termsUrl", e.target.value)}
          />
        </Field>
        <Field label="Politique de confidentialité (URL)">
          <Input
            value={String(draft.privacyUrl ?? "")}
            onChange={(e) => setField("privacyUrl", e.target.value)}
          />
        </Field>
      </>
    );
  }

  if (tab === "security") {
    return (
      <>
        <Field label="Tentatives avant blocage">
          <Input
            type="number"
            value={String(draft.maxLoginAttempts ?? 5)}
            onChange={(e) => setField("maxLoginAttempts", Number(e.target.value))}
          />
        </Field>
        <Field label="Durée de session (jours)">
          <Input
            type="number"
            value={String(draft.sessionDurationDays ?? 30)}
            onChange={(e) =>
              setField("sessionDurationDays", Number(e.target.value))
            }
          />
        </Field>
        <Field label="Longueur minimale du mot de passe">
          <Input
            type="number"
            value={String(draft.minPasswordLength ?? 8)}
            onChange={(e) =>
              setField("minPasswordLength", Number(e.target.value))
            }
          />
        </Field>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={Boolean(draft.requireAccountVerification)}
            onChange={(e) =>
              setField("requireAccountVerification", e.target.checked)
            }
          />
          Exiger la vérification de compte
        </label>
      </>
    );
  }

  if (tab === "validation") {
    return (
      <>
        <Field label="Photos max">
          <Input
            type="number"
            value={String(draft.maxPhotos ?? 12)}
            onChange={(e) => setField("maxPhotos", Number(e.target.value))}
          />
        </Field>
        <Field label="Vidéos max">
          <Input
            type="number"
            value={String(draft.maxVideos ?? 2)}
            onChange={(e) => setField("maxVideos", Number(e.target.value))}
          />
        </Field>
        <Field label="Taille max média (Mo)">
          <Input
            type="number"
            value={String(draft.maxMediaSizeMb ?? 20)}
            onChange={(e) => setField("maxMediaSizeMb", Number(e.target.value))}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={Boolean(draft.moderationBeforePublish)}
            onChange={(e) =>
              setField("moderationBeforePublish", e.target.checked)
            }
          />
          Modération avant publication
        </label>
        <Field label="Pièces obligatoires (JSON)">
          <Textarea
            className="font-mono text-xs"
            value={JSON.stringify(draft.requiredDocuments ?? {}, null, 2)}
            onChange={(e) => {
              try {
                setField("requiredDocuments", JSON.parse(e.target.value));
              } catch {
                /* ignore while typing */
              }
            }}
          />
        </Field>
      </>
    );
  }

  if (tab === "home") {
    return (
      <>
        <Field label="Éléments par section">
          <Input
            type="number"
            value={String(draft.itemsPerSection ?? 8)}
            onChange={(e) => setField("itemsPerSection", Number(e.target.value))}
          />
        </Field>
        <Field label="Sections (JSON ordre / activation)">
          <Textarea
            className="min-h-40 font-mono text-xs"
            value={JSON.stringify(draft.sections ?? [], null, 2)}
            onChange={(e) => {
              try {
                setField("sections", JSON.parse(e.target.value));
              } catch {
                /* ignore */
              }
            }}
          />
        </Field>
        <Field label="IDs à la une (JSON)">
          <Textarea
            className="font-mono text-xs"
            value={JSON.stringify(draft.featuredIds ?? [], null, 2)}
            onChange={(e) => {
              try {
                setField("featuredIds", JSON.parse(e.target.value));
              } catch {
                /* ignore */
              }
            }}
          />
        </Field>
      </>
    );
  }

  const templates = (draft.templates ?? {}) as Record<string, string>;
  return (
    <>
      {(["welcome", "approval", "rejection"] as const).map((key) => (
        <Field key={key} label={`Modèle ${key}`}>
          <Textarea
            value={templates[key] ?? ""}
            onChange={(e) =>
              setField("templates", { ...templates, [key]: e.target.value })
            }
          />
        </Field>
      ))}
    </>
  );
}
