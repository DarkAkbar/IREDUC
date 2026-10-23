import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { api, getErrorMessage } from "@/lib/api";

type Category = {
  id: string;
  name: string;
  slug: string;
  kind: "REAL_ESTATE" | "SERVICE";
  sortOrder: number;
  isActive: boolean;
  icon?: string | null;
};

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    kind: "REAL_ESTATE" as "REAL_ESTATE" | "SERVICE",
    sortOrder: "0",
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data: body } = await api.get<{ data: Category[] }>("/admin/categories");
      return body.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post("/admin/categories", {
        name: form.name,
        kind: form.kind,
        sortOrder: Number(form.sortOrder) || 0,
      });
    },
    onSuccess: async () => {
      setForm({ name: "", kind: "REAL_ESTATE", sortOrder: "0" });
      setMessage("Catégorie créée.");
      await queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      sortOrder?: number;
      isActive?: boolean;
      name?: string;
    }) => {
      await api.patch(`/admin/categories/${payload.id}`, {
        sortOrder: payload.sortOrder,
        isActive: payload.isActive,
        name: payload.name,
      });
    },
    onSuccess: async () => {
      setMessage("Catégorie mise à jour.");
      await queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });

  function onCreate(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ireduc-muted">
        Création, ordre et activation (super administrateur).
      </p>

      {message ? <Alert tone="success">{message}</Alert> : null}
      {createMutation.error || updateMutation.error ? (
        <Alert tone="error">
          {getErrorMessage(createMutation.error ?? updateMutation.error)}
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-4" onSubmit={onCreate}>
            <Input
              placeholder="Nom"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Select
              value={form.kind}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  kind: e.target.value as "REAL_ESTATE" | "SERVICE",
                }))
              }
            >
              <option value="REAL_ESTATE">Immobilier</option>
              <option value="SERVICE">Service</option>
            </Select>
            <Input
              type="number"
              placeholder="Ordre"
              value={form.sortOrder}
              onChange={(e) =>
                setForm((f) => ({ ...f, sortOrder: e.target.value }))
              }
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
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Ordre</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((cat) => (
                  <tr key={cat.id} className="border-b border-ireduc-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{cat.name}</p>
                      <p className="text-xs text-slate-500">{cat.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      {cat.kind === "REAL_ESTATE" ? "Immobilier" : "Service"}
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        className="w-24"
                        defaultValue={cat.sortOrder}
                        onBlur={(e) => {
                          const value = Number(e.target.value);
                          if (value !== cat.sortOrder) {
                            updateMutation.mutate({
                              id: cat.id,
                              sortOrder: value,
                            });
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={cat.isActive ? "success" : "muted"}>
                        {cat.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateMutation.mutate({
                            id: cat.id,
                            isActive: !cat.isActive,
                          })
                        }
                      >
                        {cat.isActive ? "Désactiver" : "Activer"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
