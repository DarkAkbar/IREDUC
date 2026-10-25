import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { DecisionDialog } from "@/components/DecisionDialog";
import { Alert } from "@/components/ui/alert";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
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
      <p className="text-sm text-ireduc-muted">
        Création de comptes admin et changement de rôle.
      </p>

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

      {isLoading ? <Spinner /> : null}
      {error ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}

      {data ? (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-ireduc-border bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Administrateur</th>
                  <th className="px-4 py-3 font-medium">Rôle</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Créé le</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((row) => (
                  <tr key={row.id} className="border-b border-ireduc-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.fullName}</p>
                      <p className="text-xs text-slate-500">{row.email}</p>
                    </td>
                    <td className="px-4 py-3">{statusLabel(row.systemRole)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(row.accountStatus)}>
                        {statusLabel(row.accountStatus)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{formatDate(row.createdAt)}</td>
                    <td className="px-4 py-3">
                      {row.systemRole === "SUPER_ADMIN" ? (
                        <span className="text-xs text-slate-500">—</span>
                      ) : row.systemRole === "ADMIN" ? (
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
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
          <div className="px-4 pb-4">
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={setPage}
            />
          </div>
        </Card>
      ) : null}

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
