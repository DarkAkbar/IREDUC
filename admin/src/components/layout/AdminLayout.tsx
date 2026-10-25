import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FolderTree,
  Home,
  Inbox,
  LogOut,
  Menu,
  Moon,
  Search,
  Shield,
  Store,
  Sun,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { isSuperAdmin } from "@/lib/auth-storage";
import { cn } from "@/lib/utils";

type HealthInfo = {
  database: string;
  apiUrl: string;
  propertiesByStatus: Record<string, number>;
  propertiesTotal: number;
};

const navGroups = [
  {
    label: "Pilotage",
    items: [
      { to: "/", label: "Tableau de bord", icon: Home, roles: ["ADMIN", "SUPER_ADMIN"] },
      { to: "/requests", label: "Demandes", icon: Inbox, roles: ["ADMIN", "SUPER_ADMIN"] },
    ],
  },
  {
    label: "Modération",
    items: [
      { to: "/partners", label: "Partenaires", icon: Store, roles: ["ADMIN", "SUPER_ADMIN"] },
      { to: "/properties", label: "Annonces", icon: Building2, roles: ["ADMIN", "SUPER_ADMIN"] },
      { to: "/services", label: "Services", icon: Wrench, roles: ["ADMIN", "SUPER_ADMIN"] },
    ],
  },
  {
    label: "Comptes",
    items: [
      { to: "/users", label: "Utilisateurs", icon: Users, roles: ["ADMIN", "SUPER_ADMIN"] },
      { to: "/admins", label: "Administrateurs", icon: Shield, roles: ["SUPER_ADMIN"] },
    ],
  },
  {
    label: "Système",
    items: [
      { to: "/categories", label: "Catégories", icon: FolderTree, roles: ["SUPER_ADMIN"] },
      { to: "/audit", label: "Journal d'audit", icon: ClipboardList, roles: ["SUPER_ADMIN"] },
    ],
  },
];

const pageTitles: Record<string, string> = {
  "/": "Tableau de bord",
  "/partners": "Partenaires",
  "/properties": "Annonces",
  "/services": "Services",
  "/requests": "Demandes",
  "/users": "Utilisateurs",
  "/categories": "Catégories",
  "/audit": "Journal d'audit",
  "/admins": "Administrateurs",
};

function resolveTitle(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const base = Object.keys(pageTitles)
    .filter((k) => k !== "/")
    .find((k) => pathname.startsWith(k));
  return base ? pageTitles[base] : "Administration";
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const reduced = usePrefersReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const role = user?.systemRole ?? "";
  const initials = (user?.fullName ?? "A")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const apiBase = (import.meta.env.VITE_API_URL as string) ?? "";
  const healthQuery = useQuery({
    queryKey: ["health-info"],
    enabled: import.meta.env.DEV,
    queryFn: async () => {
      const origin = apiBase.replace(/\/api\/v1\/?$/, "");
      const response = await fetch(`${origin}/health/info`);
      if (!response.ok) throw new Error("health/info indisponible");
      return (await response.json()) as HealthInfo;
    },
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sidebarWidth = collapsed ? 88 : 272;

  return (
    <div className="min-h-full bg-[var(--bg-app)]">
      <aside
        style={{ width: sidebarWidth }}
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-[var(--bg-sidebar)] text-white transition-[width,transform] duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between px-4">
          <Link to="/" className="flex min-w-0 items-center gap-3" onClick={() => setMobileOpen(false)}>
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10 text-sm font-extrabold">
              IR
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-ireduc-primary" />
            </span>
            {!collapsed ? (
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-extrabold tracking-wide">
                  IREDUC
                </span>
                <span className="block truncate text-[11px] font-medium text-white/60">
                  Administration
                </span>
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-2">
          {navGroups.map((group) => {
            const items = group.items.filter((item) => item.roles.includes(role));
            if (items.length === 0) return null;
            return (
              <div key={group.label}>
                {!collapsed ? (
                  <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                    {group.label}
                  </p>
                ) : null}
                <div className="space-y-1">
                  {items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      title={collapsed ? item.label : undefined}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-colors",
                          isActive
                            ? "bg-[var(--bg-sidebar-active)] text-white shadow-[var(--shadow-glow)]"
                            : "text-white/70 hover:bg-[var(--bg-sidebar-hover)] hover:text-white"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive ? (
                            <motion.span
                              layoutId={reduced ? undefined : "nav-indicator"}
                              className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white"
                            />
                          ) : null}
                          <item.icon size={18} className="shrink-0" />
                          {!collapsed ? <span className="truncate">{item.label}</span> : null}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-3">
          <button
            type="button"
            className="mb-2 hidden w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/10 lg:flex"
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!collapsed ? "Réduire" : null}
          </button>
          {!collapsed ? (
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-[10px] font-medium text-white/50">Connecté</p>
              <p className="truncate text-sm font-bold">{user?.fullName}</p>
              <p className="truncate text-[11px] text-white/60">
                {isSuperAdmin(role) ? "Super administrateur" : "Administrateur"}
              </p>
            </div>
          ) : null}
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Fermer"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div
        className="flex min-h-full min-w-0 flex-col transition-[margin] duration-200"
        style={{ marginLeft: undefined }}
      >
        <div className={cn("flex min-h-full min-w-0 flex-col lg:transition-[margin]", collapsed ? "lg:ml-[88px]" : "lg:ml-[272px]")}>
          <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 px-4 backdrop-blur lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="rounded-xl p-2 text-[var(--text-primary)] hover:bg-ireduc-navy-soft lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Ouvrir le menu"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <p className="truncate text-xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-[22px]">
                  {resolveTitle(location.pathname)}
                </p>
                <p className="hidden text-xs font-medium text-[var(--text-muted)] sm:block">
                  Kinshasa · immobilier & habitat
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="hidden items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-2 text-xs font-semibold text-[var(--text-muted)] hover:border-ireduc-navy/30 md:flex"
              >
                <Search size={14} />
                Rechercher…
                <kbd className="rounded border border-[var(--border-subtle)] px-1.5 py-0.5 text-[10px]">
                  Ctrl+K
                </kbd>
              </button>
              <button
                type="button"
                className="rounded-xl p-2 text-[var(--text-primary)] hover:bg-ireduc-navy-soft md:hidden"
                onClick={() => setPaletteOpen(true)}
                aria-label="Recherche"
              >
                <Search size={18} />
              </button>
              <button
                type="button"
                className="relative rounded-xl p-2 text-[var(--text-primary)] hover:bg-ireduc-navy-soft"
                aria-label="Notifications"
              >
                <Bell size={18} />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-ireduc-primary" />
              </button>
              <button
                type="button"
                className="rounded-xl p-2 text-[var(--text-primary)] hover:bg-ireduc-navy-soft"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Thème clair" : "Thème sombre"}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-app)] py-1 pl-1 pr-2 sm:pr-3"
                  onClick={() => setProfileOpen((o) => !o)}
                  aria-expanded={profileOpen}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-extrabold text-white">
                    {initials}
                  </span>
                  <span className="hidden max-w-[120px] truncate text-xs font-bold text-[var(--text-primary)] sm:block">
                    {user?.fullName}
                  </span>
                </button>
                {profileOpen ? (
                  <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-xl">
                    <div className="border-b border-[var(--border-subtle)] px-3 py-2">
                      <p className="truncate text-sm font-bold">{user?.fullName}</p>
                      <p className="truncate text-[11px] text-[var(--text-muted)]">
                        {user?.phone || user?.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-semibold text-ireduc-primary hover:bg-ireduc-red-soft"
                      onClick={() => {
                        setProfileOpen(false);
                        void logout();
                      }}
                    >
                      <LogOut size={15} />
                      Se déconnecter
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>

          {import.meta.env.DEV ? (
            <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-[11px] text-[var(--text-muted)] lg:px-8">
              <span className="font-semibold text-ireduc-navy dark:text-white">DEV</span>
              {" · "}
              API : {apiBase || "—"}
              {" · "}
              Base : {healthQuery.data?.database ?? "…"}
            </footer>
          ) : null}
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
