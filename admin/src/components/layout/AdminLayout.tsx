import {
  Building2,
  ClipboardList,
  FolderTree,
  Home,
  LogOut,
  Menu,
  Shield,
  Store,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { isSuperAdmin } from "@/lib/auth-storage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Tableau de bord", icon: Home, roles: ["ADMIN", "SUPER_ADMIN"] },
  {
    to: "/partners",
    label: "Partenaires",
    icon: Store,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    to: "/properties",
    label: "Annonces",
    icon: Building2,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    to: "/services",
    label: "Services",
    icon: Wrench,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    to: "/users",
    label: "Utilisateurs",
    icon: Users,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    to: "/categories",
    label: "Catégories",
    icon: FolderTree,
    roles: ["SUPER_ADMIN"],
  },
  {
    to: "/audit",
    label: "Journal d'audit",
    icon: ClipboardList,
    roles: ["SUPER_ADMIN"],
  },
  {
    to: "/admins",
    label: "Administrateurs",
    icon: Shield,
    roles: ["SUPER_ADMIN"],
  },
];

const pageTitles: Record<string, string> = {
  "/": "Tableau de bord",
  "/partners": "Partenaires",
  "/properties": "Annonces",
  "/services": "Services",
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
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const role = user?.systemRole ?? "";
  const items = navItems.filter((item) => item.roles.includes(role));
  const initials = (user?.fullName ?? "A")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-full bg-ireduc-slate">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[260px] transform flex-col border-r border-ireduc-border bg-white transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-[72px] items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ireduc-navy text-sm font-bold tracking-tight text-white">
              IR
            </span>
            <span>
              <span className="block text-[15px] font-bold tracking-wide text-ireduc-navy">
                IREDUC
              </span>
              <span className="block text-xs font-medium text-ireduc-muted">
                Administration
              </span>
            </span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-1.5 text-ireduc-muted hover:bg-ireduc-navy-soft lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-ireduc-muted">
            Navigation
          </p>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-colors",
                  isActive
                    ? "bg-ireduc-navy text-white"
                    : "text-ireduc-muted hover:bg-ireduc-navy-soft hover:text-ireduc-navy"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={18}
                    className={
                      isActive
                        ? "text-white"
                        : "text-ireduc-muted group-hover:text-ireduc-navy"
                    }
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ireduc-border p-4">
          <div className="rounded-2xl bg-ireduc-navy p-4 text-white">
            <p className="text-xs font-medium text-white/70">Connecté en tant que</p>
            <p className="mt-1 truncate text-[15px] font-bold">{user?.fullName}</p>
            <p className="truncate text-xs text-white/70">
              {isSuperAdmin(role) ? "Super administrateur" : "Administrateur"}
            </p>
          </div>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/35 lg:hidden"
          aria-label="Fermer"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-4 border-b border-ireduc-border bg-white px-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-xl p-2 text-ireduc-navy hover:bg-ireduc-navy-soft lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-[22px] font-bold text-ireduc-navy">
                {resolveTitle(location.pathname)}
              </p>
              <p className="hidden text-xs font-medium text-ireduc-muted sm:block">
                Plateforme immobilière & habitat — Kinshasa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-ireduc-border bg-ireduc-slate px-2 py-1.5 sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ireduc-navy text-xs font-bold text-white">
                {initials}
              </span>
              <div className="pr-2">
                <p className="max-w-[140px] truncate text-xs font-bold text-ireduc-navy">
                  {user?.fullName}
                </p>
                <p className="text-[10px] font-medium text-ireduc-muted">
                  {isSuperAdmin(role) ? "SUPER_ADMIN" : "ADMIN"}
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => void logout()}>
              <LogOut size={15} />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
