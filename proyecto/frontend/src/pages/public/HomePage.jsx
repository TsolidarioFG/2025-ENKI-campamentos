import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { getSummerCamps } from "../../services/summerCampService";

const isCampFormAvailable = (camp) => {
  if (!camp?.isActive || !camp?.formEnabled) {
    return false;
  }

  const now = new Date();

  if (camp.inscriptionOpenDate && now < new Date(camp.inscriptionOpenDate)) {
    return false;
  }

  if (camp.inscriptionCloseDate && now > new Date(camp.inscriptionCloseDate)) {
    return false;
  }

  return true;
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
};

export default function HomePage() {
  const [summerCamps, setSummerCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSummerCamps = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getSummerCamps();
        setSummerCamps(result);
      } catch (error) {
        setError(error.message || "Error al cargar campamentos");
      } finally {
        setLoading(false);
      }
    };

    loadSummerCamps();
  }, []);

  const availableCamps = useMemo(() => {
    return summerCamps
      .filter(isCampFormAvailable)
      .sort((a, b) => Number(b.year) - Number(a.year));
  }, [summerCamps]);

  return (
    <main className="page">
      <section className="home-hero">
        <div>
          <h1>Campamentos ENKI</h1>
          <p>
            Plataforma de inscripción y gestión de campamentos.
          </p>
        </div>
      </section>

      <section className="home-section">
        <Card>
          <h2>Inscripciones abiertas</h2>

          {loading && <p>Cargando campamentos disponibles...</p>}

          {error && <p className="form-error">{error}</p>}

          {!loading && !error && availableCamps.length === 0 && (
            <p>
              Ahora mismo no hay ningún formulario de inscripción disponible.
            </p>
          )}

          {!loading && !error && availableCamps.length > 0 && (
            <div className="admin-menu-grid">
              {availableCamps.map((camp) => (
                <Card key={camp.id}>
                  <h2>
                    {camp.name} {camp.year}
                  </h2>

                  <p>
                    Lugar: <strong>{camp.place}</strong>
                  </p>

                  <p>
                    Fechas: {formatDate(camp.startDate)} -{" "}
                    {formatDate(camp.endDate)}
                  </p>

                  <p>
                    Inscripción abierta hasta:{" "}
                    {formatDate(camp.inscriptionCloseDate)}
                  </p>

                  <Link to={`/inscripcion/${camp.year}`}>
                    <Button type="button">
                      Inscribirse en {camp.year}
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2>Administración</h2>
          <p>
            Acceso reservado para usuarios autorizados.
          </p>

          <Link to="/administracion/login">
            <Button type="button" variant="secondary">
              Ir a administración
            </Button>
          </Link>
        </Card>
      </section>
    </main>
  );
}