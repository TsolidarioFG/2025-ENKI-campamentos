import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "../pages/public/HomePage";
import LoginPage from "../pages/admin/LoginPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}