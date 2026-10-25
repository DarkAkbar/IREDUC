import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AdminsPage } from "@/pages/AdminsPage";
import { AuditPage } from "@/pages/AuditPage";
import { AuthEventsPage } from "@/pages/AuthEventsPage";
import { MyProfilePage } from "@/pages/MyProfilePage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ListingDetailPage } from "@/pages/ListingDetailPage";
import { ListingsPage } from "@/pages/ListingsPage";
import { LoginPage } from "@/pages/LoginPage";
import { PartnerDetailPage } from "@/pages/PartnerDetailPage";
import { PartnersPage } from "@/pages/PartnersPage";
import { RequestDetailPage } from "@/pages/RequestDetailPage";
import { RequestsPage } from "@/pages/RequestsPage";
import { ReferentialsPage } from "@/pages/ReferentialsPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { AnnouncementsPage } from "@/pages/AnnouncementsPage";
import { HelpPage } from "@/pages/HelpPage";
import { SystemHealthPage } from "@/pages/SystemHealthPage";
import { InboxPage } from "@/pages/InboxPage";
import { SettingsPage } from "@/pages/SettingsPage";
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
      <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
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
                  <Route path="requests" element={<RequestsPage />} />
                  <Route path="requests/:id" element={<RequestDetailPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="users" element={<UsersPage />} />
                  <Route path="users/:id" element={<UserDetailPage />} />
                  <Route path="profile" element={<MyProfilePage />} />
                  <Route path="announcements" element={<AnnouncementsPage />} />
                  <Route path="inbox" element={<InboxPage />} />
                  <Route path="system" element={<SystemHealthPage />} />
                  <Route path="help" element={<HelpPage />} />
                  <Route element={<ProtectedRoute superAdminOnly />}>
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="referentials" element={<ReferentialsPage />} />
                    <Route path="categories" element={<CategoriesPage />} />
                    <Route path="audit" element={<AuditPage />} />
                    <Route path="auth-events" element={<AuthEventsPage />} />
                    <Route path="admins" element={<AdminsPage />} />
                  </Route>
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
