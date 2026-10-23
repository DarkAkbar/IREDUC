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
import { Link, NavLink, Outlet } from "react-router-dom";
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

export function AdminLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const role = user?.systemRole ?? "";

  const items = navItems.filter((item) => item.roles.includes(role));

  return (
    <div className="flex min-h-full bg-ireduc-slate">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-ireduc-navy text-white transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Link to="/" className="text-lg font-bold tracking-wide">
            IREDUC Admin
          </Link>
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="space-y-1 p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Fermer"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ireduc-border bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md p-2 text-ireduc-navy hover:bg-slate-100 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="text-sm font-medium text-ireduc-navy">
                {user?.fullName}
              </p>
              <p className="text-xs text-slate-500">
                {isSuperAdmin(role) ? "Super administrateur" : "Administrateur"}
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void logout()}>
            <LogOut size={16} />
            Déconnexion
          </Button>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
