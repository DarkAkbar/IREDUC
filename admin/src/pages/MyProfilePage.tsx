import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { api, getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export function MyProfilePage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const profileQuery = useQuery({
    queryKey: ["admin-me-profile"],
    queryFn: async () => {
      const { data } = await api.get<{
        fullName: string;
        email: string | null;
        phone: string;
        systemRole: string;
      }>("/admin/me/profile");
      return data;
    },
  });

  const sessionsQuery = useQuery({
    queryKey: ["admin-me-sessions"],
    queryFn: async () => {
      const { data } = await api.get<{
        data: Array<{ id: string; deviceName: string | null; ipAddress: string | null; lastUsedAt: string | null; createdAt: string }>;
      }>("/admin/me/sessions");
      return data.data;
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      await api.patch("/admin/me/profile/password", passwordForm);
    },
    onSuccess: async () => {
      setMessage("Mot de passe mis à jour.");
      setPasswordForm({ currentPassword: "", newPassword: "" });
      await queryClient.invalidateQueries({ queryKey: ["admin-me-sessions"] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await api.delete(`/admin/me/sessions/${sessionId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-me-sessions"] });
    },
  });

  function onPasswordSubmit(e: FormEvent) {
    e.preventDefault();
    passwordMutation.mutate();
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Mon profil" description="Compte administrateur et sécurité." />
      {message ? <Alert tone="success">{message}</Alert> : null}
      {(passwordMutation.error || revokeMutation.error) && (
        <Alert tone="error">
          {getErrorMessage(passwordMutation.error ?? revokeMutation.error)}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Identité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {profileQuery.isLoading ? (
            <TableSkeleton />
          ) : profileQuery.data ? (
            <>
              <p>{profileQuery.data.fullName}</p>
              <p>{profileQuery.data.email ?? "—"}</p>
              <p>{profileQuery.data.phone}</p>
              <p>Rôle : {profileQuery.data.systemRole}</p>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Changer le mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid max-w-md gap-3" onSubmit={onPasswordSubmit}>
            <Input
              type="password"
              placeholder="Mot de passe actuel"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))
              }
              required
            />
            <Input
              type="password"
              placeholder="Nouveau mot de passe"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))
              }
              required
            />
            <Button type="submit" disabled={passwordMutation.isPending}>
              Enregistrer
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessions actives</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {sessionsQuery.isLoading ? (
            <TableSkeleton />
          ) : (
            sessionsQuery.data?.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2">
                <span>
                  {s.deviceName ?? "Appareil"} — {formatDate(s.lastUsedAt ?? s.createdAt)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => revokeMutation.mutate(s.id)}
                >
                  Révoquer
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
