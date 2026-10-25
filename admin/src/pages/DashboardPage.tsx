import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  Building2,
  ClipboardList,
  Clock3,
  RefreshCw,
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardsSkeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
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
  moderation?: {
    avgValidationDelayHours: number | null;
    approvalRatePercent: number | null;
    topRatedPartners: Array<{
      displayName: string;
      averageRating: number | null;
      reviewsCount: number;
    }>;
  };
};

function firstName(fullName?: string) {
  return fullName?.trim().split(/\s+/)[0] ?? "Admin";
}

export function DashboardPage() {
  const { user } = useAuth();
  const reduced = usePrefersReducedMotion();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-stats", from, to],
    queryFn: async () => {
      const { data: body } = await api.get<AdminStats>("/admin/stats", {
        params: { from: from || undefined, to: to || undefined },
      });
      return body;
    },
  });

  if (isLoading) return <CardsSkeleton count={4} />;
  if (error) return <Alert tone="error">{getErrorMessage(error)}</Alert>;
  if (!data) return null;

  const chartData = data.series.registrationsLast30Days.map((row, index) => ({
    date: row.date.slice(5),
    inscriptions: row.count,
    demandes: data.series.requestsLast30Days[index]?.count ?? 0,
  }));

  const listingsPending = data.properties.pending + data.services.pending;
  const requestsTotal = Object.values(data.requests.byStatus).reduce(
    (a, b) => a + b,
    0
  );

  const queueItems = [
    {
      label: "Partenaires",
      count: data.providers.pending,
      to: "/partners?status=PENDING",
      tone: "pending" as const,
    },
    {
      label: "Annonces",
      count: data.properties.pending,
      to: "/properties?status=PENDING",
      tone: "info" as const,
    },
    {
      label: "Services",
      count: data.services.pending,
      to: "/services?status=PENDING",
      tone: "success" as const,
    },
  ];

  const oldestLabel =
    data.pendingQueue.total > 0
      ? "Élément le plus ancien en file : à traiter en priorité"
      : "File d'attente vide — bravo";

  return (
    <div className="space-y-6">
      <motion.section
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[1.25rem] bg-brand-gradient p-6 text-white shadow-[var(--shadow-glow)] sm:p-8"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white/75">
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Bonjour {firstName(user?.fullName)}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/80">
              Voici l'état de la plateforme IREDUC. {data.pendingQueue.total}{" "}
              élément(s) attendent une décision.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : undefined} />
            Actualiser
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Input
            type="date"
            className="max-w-[180px] border-white/30 bg-white/10 text-white"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="Date de début"
          />
          <Input
            type="date"
            className="max-w-[180px] border-white/30 bg-white/10 text-white"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-label="Date de fin"
          />
          {data.moderation ? (
            <p className="self-center text-xs text-white/80">
              Délai moyen validation :{" "}
              {data.moderation.avgValidationDelayHours ?? "—"} h · Taux approbation :{" "}
              {data.moderation.approvalRatePercent ?? "—"} %
            </p>
          ) : null}
        </div>
      </motion.section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Utilisateurs"
          value={data.users.total}
          icon={Users}
          trend={8}
          accent="navy"
        />
        <StatCard
          label="Partenaires"
          value={data.providers.approved}
          icon={Store}
          trend={5}
          accent="success"
        />
        <StatCard
          label="Annonces à valider"
          value={listingsPending}
          icon={Building2}
          trend={data.properties.pending > 0 ? -3 : 2}
          accent="warning"
        />
        <StatCard
          label="Demandes"
          value={requestsTotal}
          icon={ClipboardList}
          trend={12}
          accent="red"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="card-lift xl:col-span-2">
          <CardHeader>
            <CardTitle>Activité 30 jours</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradInsc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B2A8A" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0B2A8A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradDem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E30613" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#E30613" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="inscriptions"
                  name="Inscriptions"
                  stroke="#0B2A8A"
                  fill="url(#gradInsc)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="demandes"
                  name="Demandes"
                  stroke="#E30613"
                  fill="url(#gradDem)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-lift border-ireduc-primary/20 bg-gradient-to-br from-white to-ireduc-red-soft/40 dark:from-[var(--bg-surface)] dark:to-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 size={18} className="text-ireduc-primary" />
              À valider maintenant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-brand-gradient p-4 text-white">
              <p className="text-4xl font-extrabold">{data.pendingQueue.total}</p>
              <p className="mt-1 text-xs font-semibold text-white/80">{oldestLabel}</p>
            </div>
            <div className="space-y-2">
              {queueItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2.5 transition hover:border-ireduc-primary/40"
                >
                  <span className="text-sm font-bold text-[var(--text-primary)]">
                    {item.label}
                  </span>
                  <StatusBadge tone={statusTone(item.count > 0 ? "PENDING" : "APPROVED")}>
                    {item.count}
                  </StatusBadge>
                </Link>
              ))}
            </div>
            <Link
              to="/partners?status=PENDING"
              className="inline-flex items-center gap-1 text-sm font-bold text-ireduc-primary hover:underline"
            >
              Ouvrir la file
              <ArrowUpRight size={14} />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="card-lift">
          <CardHeader>
            <CardTitle>Répartition partenaires</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Approuvés", value: data.providers.approved, color: "bg-ireduc-success" },
              { label: "En attente", value: data.providers.pending, color: "bg-amber-500" },
              { label: "Rejetés", value: data.providers.rejected, color: "bg-ireduc-primary" },
            ].map((row) => {
              const total =
                data.providers.approved +
                  data.providers.pending +
                  data.providers.rejected || 1;
              const pct = Math.round((row.value / total) * 100);
              return (
                <div key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-semibold text-[var(--text-muted)]">{row.label}</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {row.value}{" "}
                      <span className="text-xs font-medium text-[var(--text-muted)]">
                        ({pct}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ireduc-skeleton dark:bg-white/10">
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

        <Card className="card-lift">
          <CardHeader>
            <CardTitle>Raccourcis</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {[
              { to: "/properties?status=PENDING", label: "Modérer annonces", icon: Building2 },
              { to: "/services?status=PENDING", label: "Modérer services", icon: Wrench },
              { to: "/partners?status=PENDING", label: "Modérer partenaires", icon: Store },
              { to: "/requests", label: "Superviser demandes", icon: ClipboardList },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] px-3 py-3 text-sm font-bold text-[var(--text-primary)] transition hover:border-ireduc-navy/30 hover:bg-ireduc-navy-soft/50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient-soft text-ireduc-navy dark:text-white">
                  <item.icon size={16} />
                </span>
                {item.label}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
