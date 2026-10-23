import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { api, getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";

type AuditRow = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  reason?: string | null;
  createdAt: string;
  admin: { fullName: string; email: string };
};

type PageResult = {
  data: AuditRow[];
  meta: { page: number; totalPages: number };
};

export function AuditPage() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") ?? "1");
  const [action, setAction] = useState(params.get("action") ?? "");
  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "admin-audit",
      page,
      params.get("action") ?? "",
      params.get("from") ?? "",
      params.get("to") ?? "",
    ],
    queryFn: async () => {
      const { data: body } = await api.get<PageResult>("/admin/audit-log", {
        params: {
          page,
          limit: 30,
          action: params.get("action") || undefined,
          from: params.get("from") || undefined,
          to: params.get("to") || undefined,
        },
      });
      return body;
    },
  });

  function update(next: Record<string, string>) {
    const merged = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => {
      if (!v) merged.delete(k);
      else merged.set(k, v);
    });
    setParams(merged);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-ireduc-navy">Journal d&apos;audit</h1>
        <p className="text-sm text-slate-600">
          Historique des actions administrateur.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              update({ action, from, to, page: "1" });
            }}
          >
            <Input
              placeholder="Action (ex. APPROVE)"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            />
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <button
              type="submit"
              className="rounded-md bg-ireduc-navy px-4 text-sm text-white"
            >
              Filtrer
            </button>
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
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Admin</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Cible</th>
                  <th className="px-4 py-3 font-medium">Motif</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((row) => (
                  <tr key={row.id} className="border-b border-ireduc-border last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p>{row.admin.fullName}</p>
                      <p className="text-xs text-slate-500">{row.admin.email}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">{row.action}</td>
                    <td className="px-4 py-3">
                      {row.targetType}
                      <p className="text-xs text-slate-500">{row.targetId}</p>
                    </td>
                    <td className="px-4 py-3">{row.reason ?? "—"}</td>
                  </tr>
                ))}
                {data.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Aucune entrée.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </CardContent>
          <div className="px-4 pb-4">
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={(p) => update({ page: String(p) })}
            />
          </div>
        </Card>
      ) : null}
    </div>
  );
}
