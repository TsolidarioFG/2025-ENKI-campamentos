import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        ENKI Campamentos
      </Link>

      <div className="navbar-links">
        <Link to="/">Inicio</Link>
        <Link to="/admin/login">Administración</Link>
      </div>
    </nav>
  );
}