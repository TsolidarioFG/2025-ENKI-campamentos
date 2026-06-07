import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "../pages/public/HomePage";
import InscriptionPage from "../pages/public/InscriptionPage";
import InscriptionConfirmationPage from "../pages/public/InscriptionConfirmationPage";
import ExtraFormPage from "../pages/public/ExtraFormPage";

import LoginPage from "../pages/admin/LoginPage";
import AdminLayout from "../components/layout/AdminLayout";
import AdminMenuPage from "../pages/admin/AdminMenuPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminInscriptionsPage from "../pages/admin/AdminInscriptionsPage";
import AdminInscriptionDetailPage from "../pages/admin/AdminInscriptionDetailPage";
import AdminWeeksPage from "../pages/admin/AdminWeeksPage";
import AdminWeekDetailPage from "../pages/admin/AdminWeekDetailPage";
import AdminSettingsPage from "../pages/admin/AdminSettingsPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminProfilePage from "../pages/admin/AdminProfilePage";
import AdminCampWeeksPage from "../pages/admin/AdminCampWeeksPage";
import ProtectedRoute from "./ProtectedRoute";
import AdminDiscountsPage from "../pages/admin/AdminDiscountsPage";
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public zone */}
        <Route path="/" element={<HomePage />} />
        <Route path="/inscripcion/:year" element={<InscriptionPage />} />
        <Route
          path="/inscripcion/:year/confirmacion"
          element={<InscriptionConfirmationPage />}
        />
        <Route path="/extraform/public/:token" element={<ExtraFormPage />} />

        {/* Admin login */}
        <Route path="/administracion/login" element={<LoginPage />} />

        {/* Admin zone */}
        <Route
          path="/administracion"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminMenuPage />} />
          <Route path="datos" element={<AdminDashboardPage />} />
          <Route path="listado" element={<AdminInscriptionsPage />} />
          <Route path="listado/:id" element={<AdminInscriptionDetailPage />} />
          <Route path="semanas" element={<AdminWeeksPage />} />
          <Route path="semanas/:weekId" element={<AdminWeekDetailPage />} />
          <Route path="ajustes" element={<AdminSettingsPage />} />
          <Route path="perfil" element={<AdminProfilePage />} />
          <Route path="descuentos" element={<AdminDiscountsPage />} />
<Route
  path="ajustes/campamentos/:campId/semanas"
  element={<AdminCampWeeksPage />}
/>
          <Route
            path="usuarios"
            element={
              <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}