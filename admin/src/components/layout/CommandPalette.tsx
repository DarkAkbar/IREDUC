import { Building2, Home, Inbox, Search, Store, Users, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const routes = [
  { to: "/", label: "Tableau de bord", icon: Home, keywords: "accueil dashboard" },
  { to: "/partners", label: "Partenaires", icon: Store, keywords: "provider" },
  { to: "/properties", label: "Annonces", icon: Building2, keywords: "biens properties" },
  { to: "/services", label: "Services", icon: Wrench, keywords: "prestations" },
  { to: "/requests", label: "Demandes", icon: Inbox, keywords: "reservations" },
  { to: "/users", label: "Utilisateurs", icon: Users, keywords: "comptes" },
];

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return routes;
    return routes.filter(
      (r) =>
        r.label.toLowerCase().includes(needle) ||
        r.keywords.includes(needle)
    );
  }, [q]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/45 p-4 pt-[12vh]">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Fermer la recherche"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Recherche globale"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-4">
          <Search size={18} className="text-[var(--text-muted)]" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une page…"
            className="h-12 w-full bg-transparent text-sm font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && filtered[0]) {
                navigate(filtered[0].to);
                onClose();
              }
            }}
          />
          <kbd className="hidden rounded-md border border-[var(--border-subtle)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--text-muted)] sm:inline">
            ESC
          </kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto p-2">
          {filtered.map((item) => (
            <li key={item.to}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[var(--text-primary)] hover:bg-ireduc-navy-soft dark:hover:bg-white/5"
                )}
                onClick={() => {
                  navigate(item.to);
                  onClose();
                }}
              >
                <item.icon size={16} className="text-ireduc-primary" />
                {item.label}
              </button>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">
              Aucun résultat
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
