import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return (
      <main className="page">
        <p>Cargando...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/administracion/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/administracion" replace />;
  }

  return children;
}