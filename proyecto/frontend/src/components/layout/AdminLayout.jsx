import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/administracion/login", { replace: true });
  };

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Link to="/administracion" className="admin-brand">
          ENKI Admin
        </Link>

        <nav className="admin-nav">
          <NavLink
            to="/administracion"
            end
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            Panel privado
          </NavLink>

          <NavLink
            to="/administracion/datos"
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            Datos
          </NavLink>

          <NavLink
            to="/administracion/semanas"
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            Semanas
          </NavLink>

          <NavLink
            to="/administracion/listado"
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            Listado
          </NavLink>

          <NavLink
            to="/administracion/ajustes"
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            Ajustes
          </NavLink>
        </nav>

        <div className="admin-user">
          
          <button
  type="button"
  className="admin-profile-button"
  onClick={() => navigate("/administracion/perfil")}
>
  {user?.username || user?.email || "Mi perfil"}
</button>

          <button type="button" onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}