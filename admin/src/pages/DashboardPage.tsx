import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  ClipboardList,
  Store,
  Users,
  Wrench,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { api, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

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

const kpiStyles = [
  {
    icon: Users,
    tint: "bg-ireduc-navy-soft text-ireduc-navy",
    ring: "from-ireduc-navy/10 to-transparent",
  },
  {
    icon: Store,
    tint: "bg-emerald-50 text-emerald-700",
    ring: "from-emerald-500/10 to-transparent",
  },
  {
    icon: Store,
    tint: "bg-amber-50 text-amber-700",
    ring: "from-amber-500/10 to-transparent",
  },
  {
    icon: Building2,
    tint: "bg-sky-50 text-sky-700",
    ring: "from-sky-500/10 to-transparent",
  },
  {
    icon: Wrench,
    tint: "bg-teal-50 text-teal-700",
    ring: "from-teal-500/10 to-transparent",
  },
  {
    icon: ClipboardList,
    tint: "bg-ireduc-red-soft text-ireduc-red",
    ring: "from-ireduc-red/10 to-transparent",
  },
];

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
    { label: "Utilisateurs", value: data.users.total, hint: "Comptes inscrits" },
    {
      label: "Partenaires approuvés",
      value: data.providers.approved,
      hint: "Profils validés",
    },
    {
      label: "Partenaires en attente",
      value: data.providers.pending,
      hint: "À modérer",
    },
    {
      label: "Annonces en attente",
      value: data.properties.pending,
      hint: "Publications",
    },
    {
      label: "Services en attente",
      value: data.services.pending,
      hint: "Prestations",
    },
    {
      label: "Demandes ouvertes",
      value:
        (data.requests.byStatus.OPEN ?? 0) +
        (data.requests.byStatus.IN_PROGRESS ?? 0),
      hint: "Ouvertes / en cours",
    },
  ];

  const queue = [
    {
      label: "Partenaires",
      count: data.pendingQueue.providers,
      to: "/partners?status=PENDING",
      icon: Store,
    },
    {
      label: "Annonces",
      count: data.pendingQueue.properties,
      to: "/properties?status=PENDING",
      icon: Building2,
    },
    {
      label: "Services",
      count: data.pendingQueue.services,
      to: "/services?status=PENDING",
      icon: Wrench,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-ireduc-muted">
            Bienvenue — synthèse d&apos;activité de la plateforme.
          </p>
        </div>
        {data.pendingQueue.total > 0 ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-ireduc-red-soft px-3 py-1 text-xs font-semibold text-ireduc-red">
            <span className="h-1.5 w-1.5 rounded-full bg-ireduc-red" />
            {data.pendingQueue.total} élément(s) à valider
          </span>
        ) : null}
      </div>

      {data.pendingQueue.total > 0 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {queue.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex items-center justify-between rounded-2xl border border-ireduc-red/15 bg-white p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ireduc-red-soft text-ireduc-red">
                  <item.icon size={20} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ireduc-navy">{item.label}</p>
                  <p className="text-xs text-ireduc-muted">En attente de validation</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold text-ireduc-red">{item.count}</span>
                <ArrowUpRight
                  size={16}
                  className="text-ireduc-muted transition group-hover:text-ireduc-navy"
                />
              </div>
            </Link>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, index) => {
          const style = kpiStyles[index]!;
          const Icon = style.icon;
          return (
            <Card
              key={card.label}
              className={cn(
                "relative overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
              )}
            >
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 bg-gradient-to-br",
                  style.ring
                )}
              />
              <CardContent className="relative pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ireduc-muted">{card.label}</p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-ireduc-navy">
                      {card.value}
                    </p>
                    <p className="mt-1 text-xs font-medium text-ireduc-muted">{card.hint}</p>
                  </div>
                  <span
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl",
                      style.tint
                    )}
                  >
                    <Icon size={20} />
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Inscriptions et demandes</CardTitle>
              <p className="mt-1 text-xs text-ireduc-muted">30 derniers jours</p>
            </div>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fillInscriptions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B2A8A" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#0B2A8A" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="fillDemandes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E30613" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#E30613" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#D7DEEE" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#6B7A99" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#6B7A99" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #D7DEEE",
                    boxShadow: "0 4px 16px rgba(11, 42, 138, 0.08)",
                    color: "#0B2A8A",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="inscriptions"
                  name="Inscriptions"
                  stroke="#0B2A8A"
                  fill="url(#fillInscriptions)"
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey="demandes"
                  name="Demandes"
                  stroke="#E30613"
                  fill="url(#fillDemandes)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Répartition partenaires</CardTitle>
              <p className="mt-1 text-xs text-ireduc-muted">Statuts de revue</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {[
              {
                label: "Approuvés",
                value: data.providers.approved,
                color: "bg-emerald-500",
              },
              {
                label: "En attente",
                value: data.providers.pending,
                color: "bg-amber-500",
              },
              {
                label: "Rejetés",
                value: data.providers.rejected,
                color: "bg-ireduc-red",
              },
            ].map((row) => {
              const total =
                data.providers.approved +
                data.providers.pending +
                data.providers.rejected || 1;
              const pct = Math.round((row.value / total) * 100);
              return (
                <div key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-semibold text-ireduc-muted">{row.label}</span>
                    <span className="font-bold text-ireduc-navy">
                      {row.value}{" "}
                      <span className="text-xs font-medium text-ireduc-muted">
                        ({pct}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn("h-full rounded-full", row.color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
