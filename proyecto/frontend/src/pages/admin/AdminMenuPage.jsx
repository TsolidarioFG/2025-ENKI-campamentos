import { Link } from "react-router-dom";

export default function AdminMenuPage() {
  return (
    <section className="admin-menu-page">
      <div className="admin-page-heading">
        <p className="eyebrow">Panel privado</p>
        <h1>Administración</h1>
        <p>Selecciona la sección que quieres gestionar.</p>
      </div>

      <div className="admin-menu-grid">
        <Link to="/administracion/datos" className="admin-menu-card">
          <span>01</span>
          <h2>Datos</h2>
          <p>Estadísticas generales, plazas ocupadas y gráficas.</p>
        </Link>

        <Link to="/administracion/semanas" className="admin-menu-card">
          <span>02</span>
          <h2>Semanas</h2>
          <p>Consulta inscritos por semana, plazas y listas de espera.</p>
        </Link>

        <Link to="/administracion/listado" className="admin-menu-card">
          <span>03</span>
          <h2>Listado</h2>
          <p>Lista de todos los niños y acceso a su información completa.</p>
        </Link>

        <Link to="/administracion/ajustes" className="admin-menu-card">
          <span>04</span>
          <h2>Ajustes</h2>
          <p>Descuentos, usuarios, campamento y configuración.</p>
        </Link>
      </div>
    </section>
  );
}