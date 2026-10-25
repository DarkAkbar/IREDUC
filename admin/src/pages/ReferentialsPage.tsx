import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useMemo, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { FilterChips } from "@/components/ui/FilterChips";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api, getErrorMessage } from "@/lib/api";

type Commune = {
  id: string;
  name: string;
  isActive: boolean;
  _count: { neighborhoods: number; properties: number };
};

type Neighborhood = {
  id: string;
  name: string;
  isActive: boolean;
  _count: { properties: number };
};

type RejectionReason = {
  id: string;
  label: string;
  code: string | null;
  sortOrder: number;
  isActive: boolean;
};

type Tab = "communes" | "rejection-reasons";

export function ReferentialsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("communes");
  const [message, setMessage] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedCommuneId, setSelectedCommuneId] = useState<string | null>(null);
  const [communeName, setCommuneName] = useState("");
  const [neighborhoodName, setNeighborhoodName] = useState("");
  const [reasonForm, setReasonForm] = useState({
    label: "",
    code: "",
    sortOrder: "0",
  });

  const inactiveQuery = showInactive ? "?includeInactive=true" : "";

  const communesQuery = useQuery({
    queryKey: ["admin-communes", showInactive],
    queryFn: async () => {
      const { data } = await api.get<{ data: Commune[] }>(
        `/admin/communes${inactiveQuery}`
      );
      return data.data;
    },
  });

  const neighborhoodsQuery = useQuery({
    queryKey: ["admin-neighborhoods", selectedCommuneId, showInactive],
    enabled: Boolean(selectedCommuneId),
    queryFn: async () => {
      const { data } = await api.get<{
        commune: { id: string; name: string };
        neighborhoods: Neighborhood[];
      }>(`/admin/communes/${selectedCommuneId}/neighborhoods${inactiveQuery}`);
      return data;
    },
  });

  const reasonsQuery = useQuery({
    queryKey: ["admin-rejection-reasons", showInactive],
    enabled: tab === "rejection-reasons",
    queryFn: async () => {
      const { data } = await api.get<{ data: RejectionReason[] }>(
        `/admin/rejection-reasons${inactiveQuery}`
      );
      return data.data;
    },
  });

  const createCommuneMutation = useMutation({
    mutationFn: async () => {
      await api.post("/admin/communes", { name: communeName });
    },
    onSuccess: async () => {
      setCommuneName("");
      setMessage("Commune créée.");
      await queryClient.invalidateQueries({ queryKey: ["admin-communes"] });
    },
  });

  const updateCommuneMutation = useMutation({
    mutationFn: async (payload: { id: string; name?: string; isActive?: boolean }) => {
      await api.patch(`/admin/communes/${payload.id}`, {
        name: payload.name,
        isActive: payload.isActive,
      });
    },
    onSuccess: async () => {
      setMessage("Commune mise à jour.");
      await queryClient.invalidateQueries({ queryKey: ["admin-communes"] });
    },
  });

  const createNeighborhoodMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCommuneId) return;
      await api.post(`/admin/communes/${selectedCommuneId}/neighborhoods`, {
        name: neighborhoodName,
      });
    },
    onSuccess: async () => {
      setNeighborhoodName("");
      setMessage("Quartier créé.");
      await queryClient.invalidateQueries({ queryKey: ["admin-communes"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-neighborhoods"] });
    },
  });

  const updateNeighborhoodMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      name?: string;
      isActive?: boolean;
    }) => {
      await api.patch(`/admin/neighborhoods/${payload.id}`, {
        name: payload.name,
        isActive: payload.isActive,
      });
    },
    onSuccess: async () => {
      setMessage("Quartier mis à jour.");
      await queryClient.invalidateQueries({ queryKey: ["admin-neighborhoods"] });
    },
  });

  const createReasonMutation = useMutation({
    mutationFn: async () => {
      await api.post("/admin/rejection-reasons", {
        label: reasonForm.label,
        code: reasonForm.code.trim() || null,
        sortOrder: Number(reasonForm.sortOrder) || 0,
      });
    },
    onSuccess: async () => {
      setReasonForm({ label: "", code: "", sortOrder: "0" });
      setMessage("Motif créé.");
      await queryClient.invalidateQueries({ queryKey: ["admin-rejection-reasons"] });
    },
  });

  const updateReasonMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      label?: string;
      sortOrder?: number;
      isActive?: boolean;
    }) => {
      await api.patch(`/admin/rejection-reasons/${payload.id}`, payload);
    },
    onSuccess: async () => {
      setMessage("Motif mis à jour.");
      await queryClient.invalidateQueries({ queryKey: ["admin-rejection-reasons"] });
    },
  });

  const tabChips = useMemo(
    () => [
      { value: "communes", label: "Communes et quartiers" },
      { value: "rejection-reasons", label: "Motifs de rejet" },
    ],
    []
  );

  const mutationError =
    createCommuneMutation.error ??
    updateCommuneMutation.error ??
    createNeighborhoodMutation.error ??
    updateNeighborhoodMutation.error ??
    createReasonMutation.error ??
    updateReasonMutation.error;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Référentiels"
        description="Communes, quartiers et motifs de rejet. Les catégories sont gérées séparément."
        actions={
          <Link
            to="/categories"
            className="inline-flex h-11 items-center rounded-xl border-[1.5px] border-ireduc-navy px-4 text-[15px] font-bold text-ireduc-navy"
          >
            Catégories
          </Link>
        }
      />

      <FilterChips
        options={tabChips}
        value={tab}
        onChange={(value) => setTab(value as Tab)}
      />

      <FilterChips
        options={[
          { value: "active", label: "Actifs seulement" },
          { value: "all", label: "Inclure inactifs" },
        ]}
        value={showInactive ? "all" : "active"}
        onChange={(value) => setShowInactive(value === "all")}
      />

      {message ? <Alert tone="success">{message}</Alert> : null}
      {mutationError ? (
        <Alert tone="error">{getErrorMessage(mutationError)}</Alert>
      ) : null}

      {tab === "communes" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Communes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="flex gap-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createCommuneMutation.mutate();
                }}
              >
                <Input
                  placeholder="Nom de la commune"
                  value={communeName}
                  onChange={(e) => setCommuneName(e.target.value)}
                  required
                />
                <Button type="submit" disabled={createCommuneMutation.isPending}>
                  Ajouter
                </Button>
              </form>
              {communesQuery.isLoading ? (
                <TableSkeleton />
              ) : (
                <DataTable
                  rows={communesQuery.data ?? []}
                  emptyTitle="Aucune commune"
                  columns={[
                    {
                      key: "name",
                      header: "Nom",
                      render: (row) => row.name,
                    },
                    {
                      key: "counts",
                      header: "Quartiers / annonces",
                      render: (row) =>
                        `${row._count.neighborhoods} / ${row._count.properties}`,
                    },
                    {
                      key: "status",
                      header: "Statut",
                      render: (row) => (
                        <StatusBadge tone={row.isActive ? "success" : "muted"}>
                          {row.isActive ? "Actif" : "Inactif"}
                        </StatusBadge>
                      ),
                    },
                  ]}
                  rowActions={(row) => (
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        variant={selectedCommuneId === row.id ? "default" : "outline"}
                        onClick={() => setSelectedCommuneId(row.id)}
                      >
                        Quartiers
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateCommuneMutation.mutate({
                            id: row.id,
                            isActive: !row.isActive,
                          })
                        }
                      >
                        {row.isActive ? "Désactiver" : "Activer"}
                      </Button>
                    </div>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Quartiers
                {neighborhoodsQuery.data?.commune
                  ? ` — ${neighborhoodsQuery.data.commune.name}`
                  : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedCommuneId ? (
                <p className="text-sm text-muted-foreground">
                  Sélectionnez une commune pour gérer ses quartiers.
                </p>
              ) : (
                <>
                  <form
                    className="flex gap-2"
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault();
                      createNeighborhoodMutation.mutate();
                    }}
                  >
                    <Input
                      placeholder="Nom du quartier"
                      value={neighborhoodName}
                      onChange={(e) => setNeighborhoodName(e.target.value)}
                      required
                    />
                    <Button
                      type="submit"
                      disabled={createNeighborhoodMutation.isPending}
                    >
                      Ajouter
                    </Button>
                  </form>
                  {neighborhoodsQuery.isLoading ? (
                    <TableSkeleton />
                  ) : (
                    <DataTable
                      rows={neighborhoodsQuery.data?.neighborhoods ?? []}
                      emptyTitle="Aucun quartier"
                      columns={[
                        {
                          key: "name",
                          header: "Nom",
                          render: (row) => row.name,
                        },
                        {
                          key: "properties",
                          header: "Annonces",
                          render: (row) => row._count.properties,
                        },
                        {
                          key: "status",
                          header: "Statut",
                          render: (row) => (
                            <StatusBadge tone={row.isActive ? "success" : "muted"}>
                              {row.isActive ? "Actif" : "Inactif"}
                            </StatusBadge>
                          ),
                        },
                      ]}
                      rowActions={(row) => (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateNeighborhoodMutation.mutate({
                              id: row.id,
                              isActive: !row.isActive,
                            })
                          }
                        >
                          {row.isActive ? "Désactiver" : "Activer"}
                        </Button>
                      )}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Motifs de rejet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="grid gap-2 md:grid-cols-4"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                createReasonMutation.mutate();
              }}
            >
              <Input
                placeholder="Libellé"
                value={reasonForm.label}
                onChange={(e) =>
                  setReasonForm((f) => ({ ...f, label: e.target.value }))
                }
                required
              />
              <Input
                placeholder="Code (optionnel)"
                value={reasonForm.code}
                onChange={(e) =>
                  setReasonForm((f) => ({ ...f, code: e.target.value }))
                }
              />
              <Input
                type="number"
                placeholder="Ordre"
                value={reasonForm.sortOrder}
                onChange={(e) =>
                  setReasonForm((f) => ({ ...f, sortOrder: e.target.value }))
                }
              />
              <Button type="submit" disabled={createReasonMutation.isPending}>
                Ajouter
              </Button>
            </form>
            {reasonsQuery.isLoading ? (
              <TableSkeleton />
            ) : (
              <DataTable
                rows={reasonsQuery.data ?? []}
                emptyTitle="Aucun motif"
                columns={[
                  {
                    key: "label",
                    header: "Libellé",
                    render: (row) => row.label,
                  },
                  {
                    key: "code",
                    header: "Code",
                    render: (row) => row.code ?? "—",
                  },
                  {
                    key: "sortOrder",
                    header: "Ordre",
                    render: (row) => row.sortOrder,
                  },
                  {
                    key: "status",
                    header: "Statut",
                    render: (row) => (
                      <StatusBadge tone={row.isActive ? "success" : "muted"}>
                        {row.isActive ? "Actif" : "Inactif"}
                      </StatusBadge>
                    ),
                  },
                ]}
                rowActions={(row) => (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateReasonMutation.mutate({
                        id: row.id,
                        isActive: !row.isActive,
                      })
                    }
                  >
                    {row.isActive ? "Désactiver" : "Activer"}
                  </Button>
                )}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
