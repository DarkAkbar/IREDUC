import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api, getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export function AnnouncementsPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    body: "",
    audience: "ALL" as "ALL" | "CLIENTS" | "PARTNERS",
  });

  const listQuery = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data } = await api.get<{
        data: Array<{
          id: string;
          title: string;
          audience: string;
          createdAt: string;
          createdBy: { fullName: string };
        }>;
      }>("/admin/announcements");
      return data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ recipients: number }>(
        "/admin/announcements",
        form
      );
      return data;
    },
    onSuccess: async (data) => {
      setMessage(`Annonce envoyée à ${data.recipients} utilisateur(s).`);
      setForm({ title: "", body: "", audience: "ALL" });
      await queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Annonces in-app"
        description="Notifications push in-app pour les utilisateurs mobiles."
      />
      {message ? <Alert tone="success">{message}</Alert> : null}
      {createMutation.error ? (
        <Alert tone="error">{getErrorMessage(createMutation.error)}</Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle annonce</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Titre"
              required
            />
            <Textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Message"
              rows={4}
              required
            />
            <Select
              value={form.audience}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  audience: e.target.value as typeof form.audience,
                }))
              }
            >
              <option value="ALL">Tous les utilisateurs</option>
              <option value="CLIENTS">Clients</option>
              <option value="PARTNERS">Partenaires</option>
            </Select>
            <Button type="submit" disabled={createMutation.isPending}>
              Publier
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {listQuery.data?.map((a) => (
            <p key={a.id}>
              <span className="font-bold">{a.title}</span> — {a.audience} —{" "}
              {formatDate(a.createdAt)} — {a.createdBy.fullName}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
