import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import { AdminsPage } from "@/pages/AdminsPage";
import { AuditPage } from "@/pages/AuditPage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ListingDetailPage } from "@/pages/ListingDetailPage";
import { ListingsPage } from "@/pages/ListingsPage";
import { LoginPage } from "@/pages/LoginPage";
import { PartnerDetailPage } from "@/pages/PartnerDetailPage";
import { PartnersPage } from "@/pages/PartnersPage";
import { UserDetailPage } from "@/pages/UserDetailPage";
import { UsersPage } from "@/pages/UsersPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="partners" element={<PartnersPage />} />
                <Route path="partners/:id" element={<PartnerDetailPage />} />
                <Route
                  path="properties"
                  element={<ListingsPage kind="properties" />}
                />
                <Route
                  path="properties/:id"
                  element={<ListingDetailPage kind="properties" />}
                />
                <Route
                  path="services"
                  element={<ListingsPage kind="services" />}
                />
                <Route
                  path="services/:id"
                  element={<ListingDetailPage kind="services" />}
                />
                <Route path="users" element={<UsersPage />} />
                <Route path="users/:id" element={<UserDetailPage />} />
                <Route element={<ProtectedRoute superAdminOnly />}>
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="audit" element={<AuditPage />} />
                  <Route path="admins" element={<AdminsPage />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
