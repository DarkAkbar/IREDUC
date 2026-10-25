import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { DecisionDialog } from "@/components/DecisionDialog";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { api, getErrorMessage } from "@/lib/api";
import { formatDate, statusLabel } from "@/lib/utils";

type AdminRow = {
  id: string;
  fullName: string;
  email: string;
  systemRole: string;
  accountStatus: string;
  createdAt: string;
};

type PageResult = {
  data: AdminRow[];
  meta: { page: number; totalPages: number };
};

export function AdminsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    temporaryPassword: "",
  });
  const [roleTarget, setRoleTarget] = useState<{
    id: string;
    role: "ADMIN" | "USER";
    name: string;
  } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-admins", page],
    queryFn: async () => {
      const { data: body } = await api.get<PageResult>("/admin/admins", {
        params: { page, limit: 20 },
      });
      return body;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: body } = await api.post("/admin/admins", form);
      return body as AdminRow & { temporaryPassword: string; message: string };
    },
    onSuccess: async (body) => {
      setMessage(
        `${body.message} Mot de passe temporaire : ${body.temporaryPassword}`
      );
      setForm({ fullName: "", phone: "", email: "", temporaryPassword: "" });
      await queryClient.invalidateQueries({ queryKey: ["admin-admins"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (payload: { id: string; status: "ACTIVE" | "SUSPENDED" }) => {
      await api.patch(`/admin/admins/${payload.id}/status`, {
        status: payload.status,
      });
    },
    onSuccess: async () => {
      setMessage("Statut administrateur mis à jour.");
      await queryClient.invalidateQueries({ queryKey: ["admin-admins"] });
    },
  });

  const roleMutation = useMutation({
    mutationFn: async (payload: { id: string; role: "ADMIN" | "USER" }) => {
      await api.patch(`/admin/admins/${payload.id}/role`, { role: payload.role });
    },
    onSuccess: async () => {
      setMessage("Rôle mis à jour.");
      await queryClient.invalidateQueries({ queryKey: ["admin-admins"] });
    },
  });

  function onCreate(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Administrateurs"
        description="Création de comptes admin et changement de rôle."
      />

      {message ? <Alert tone="success">{message}</Alert> : null}
      {createMutation.error || roleMutation.error ? (
        <Alert tone="error">
          {getErrorMessage(createMutation.error ?? roleMutation.error)}
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Créer un administrateur</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2 lg:grid-cols-5" onSubmit={onCreate}>
            <Input
              placeholder="Nom complet"
              value={form.fullName}
              onChange={(e) =>
                setForm((f) => ({ ...f, fullName: e.target.value }))
              }
              required
            />
            <Input
              placeholder="Téléphone (+243…)"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              required
            />
            <Input
              type="email"
              placeholder="E-mail (facultatif)"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <Input
              type="password"
              placeholder="Mot de passe temporaire"
              value={form.temporaryPassword}
              onChange={(e) =>
                setForm((f) => ({ ...f, temporaryPassword: e.target.value }))
              }
              required
              minLength={8}
            />
            <Button type="submit" disabled={createMutation.isPending}>
              Créer
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}

      <Card>
        {isLoading ? <TableSkeleton /> : null}
        {data ? (
          <>
            <DataTable
              rows={data.data}
              emptyTitle="Aucun administrateur"
              emptyDescription="Aucun compte admin pour le moment."
              columns={[
                {
                  key: "admin",
                  header: "Administrateur",
                  render: (row) => (
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-xs font-extrabold text-white">
                        {row.fullName
                          .split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </span>
                      <div>
                        <p className="font-bold">{row.fullName}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {row.email}
                        </p>
                      </div>
                    </div>
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
                  header: "Créé le",
                  render: (row) => formatDate(row.createdAt),
                },
              ]}
              rowActions={(row) =>
                row.systemRole === "SUPER_ADMIN" ? (
                  <span className="text-xs text-[var(--text-muted)]">—</span>
                ) : row.systemRole === "ADMIN" ? (
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={row.accountStatus === "ACTIVE" ? "danger" : "success"}
                      onClick={() =>
                        statusMutation.mutate({
                          id: row.id,
                          status:
                            row.accountStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                        })
                      }
                    >
                      {row.accountStatus === "ACTIVE" ? "Désactiver" : "Réactiver"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setRoleTarget({
                          id: row.id,
                          role: "USER",
                          name: row.fullName,
                        })
                      }
                    >
                      Rétrograder en USER
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setRoleTarget({
                        id: row.id,
                        role: "ADMIN",
                        name: row.fullName,
                      })
                    }
                  >
                    Promouvoir ADMIN
                  </Button>
                )
              }
            />
            {data.data.length > 0 ? (
              <div className="px-4 pb-4">
                <Pagination
                  page={data.meta.page}
                  totalPages={data.meta.totalPages}
                  onPageChange={setPage}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </Card>

      <DecisionDialog
        open={Boolean(roleTarget)}
        title={
          roleTarget?.role === "USER"
            ? `Rétrograder ${roleTarget?.name} en utilisateur ?`
            : `Promouvoir ${roleTarget?.name} administrateur ?`
        }
        confirmLabel="Confirmer"
        danger={roleTarget?.role === "USER"}
        onClose={() => setRoleTarget(null)}
        onConfirm={async () => {
          if (!roleTarget) return;
          try {
            await roleMutation.mutateAsync(roleTarget);
          } catch (err) {
            throw new Error(getErrorMessage(err));
          }
        }}
      />
    </div>
  );
}
