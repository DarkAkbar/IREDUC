import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { api, getErrorMessage } from "@/lib/api";

type AdminStats = {
  users: { total: number };
  providers: { approved: number; pending: number; rejected: number };
  properties: { pending: number; byStatus: Record<string, number> };
  services: { pending: number; byStatus: Record<string, number> };
  requests: { byStatus: Record<string, number> };
  pendingQueue: {
    providers: number;
    properties: number;
    services: number;
    total: number;
  };
  series: {
    registrationsLast30Days: Array<{ date: string; count: number }>;
    requestsLast30Days: Array<{ date: string; count: number }>;
  };
};

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data: body } = await api.get<AdminStats>("/admin/stats");
      return body;
    },
  });

  if (isLoading) return <Spinner />;
  if (error) return <Alert tone="error">{getErrorMessage(error)}</Alert>;
  if (!data) return null;

  const chartData = data.series.registrationsLast30Days.map((row, index) => ({
    date: row.date.slice(5),
    inscriptions: row.count,
    demandes: data.series.requestsLast30Days[index]?.count ?? 0,
  }));

  const cards = [
    { label: "Utilisateurs", value: data.users.total },
    { label: "Partenaires approuvés", value: data.providers.approved },
    { label: "Partenaires en attente", value: data.providers.pending },
    {
      label: "Annonces en attente",
      value: data.properties.pending,
    },
    { label: "Services en attente", value: data.services.pending },
    {
      label: "Demandes ouvertes",
      value:
        (data.requests.byStatus.OPEN ?? 0) +
        (data.requests.byStatus.IN_PROGRESS ?? 0),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ireduc-navy">Tableau de bord</h1>
        <p className="text-sm text-slate-600">
          Vue d&apos;ensemble de la plateforme IREDUC.
        </p>
      </div>

      {data.pendingQueue.total > 0 ? (
        <Card className="border-ireduc-red/30 bg-red-50/60">
          <CardHeader>
            <CardTitle>En attente de validation ({data.pendingQueue.total})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 text-sm">
            <Link className="rounded-md bg-white px-3 py-2 shadow-sm hover:bg-slate-50" to="/partners?status=PENDING">
              Partenaires : {data.pendingQueue.providers}
            </Link>
            <Link className="rounded-md bg-white px-3 py-2 shadow-sm hover:bg-slate-50" to="/properties?status=PENDING">
              Annonces : {data.pendingQueue.properties}
            </Link>
            <Link className="rounded-md bg-white px-3 py-2 shadow-sm hover:bg-slate-50" to="/services?status=PENDING">
              Services : {data.pendingQueue.services}
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-5">
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-bold text-ireduc-navy">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inscriptions et demandes (30 jours)</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee8" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="inscriptions"
                name="Inscriptions"
                stroke="#0b1f3a"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="demandes"
                name="Demandes"
                stroke="#c8102e"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
