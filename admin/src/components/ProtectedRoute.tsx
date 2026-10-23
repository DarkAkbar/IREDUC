import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { isAdminRole, isSuperAdmin } from "@/lib/auth-storage";

export function ProtectedRoute({ superAdminOnly = false }: { superAdminOnly?: boolean }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user || !isAdminRole(user.systemRole)) {
    return <Navigate to="/login" replace />;
  }

  if (superAdminOnly && !isSuperAdmin(user.systemRole)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
