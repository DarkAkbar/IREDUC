import { useQuery } from "@tanstack/react-query";
import { Activity, Database, HardDrive, Server } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardsSkeleton } from "@/components/ui/Skeleton";
import { api, getErrorMessage } from "@/lib/api";

type Health = {
  api: string;
  database: string;
  dbLatencyMs: number;
  uploadsDirBytes: number;
  version: string;
  nodeEnv: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function SystemHealthPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-system-health"],
    queryFn: async () => {
      const { data: body } = await api.get<Health>("/admin/system-health");
      return body;
    },
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="État du système"
        description="Santé de l'API, de la base et de l'espace de stockage."
      />
      {error ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      {isLoading ? <CardsSkeleton count={4} /> : null}
      {data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Server size={16} /> API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-extrabold text-ireduc-success">
                {data.api.toUpperCase()}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                v{data.version} · {data.nodeEnv}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database size={16} /> Base de données
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-extrabold text-ireduc-success">
                {data.database.toUpperCase()}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Latence {data.dbLatencyMs} ms
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HardDrive size={16} /> Stockage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-extrabold">
                {formatBytes(data.uploadsDirBytes)}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Dossier /uploads
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity size={16} /> Environnement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-extrabold uppercase">{data.nodeEnv}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Actualisé toutes les 30 s
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
