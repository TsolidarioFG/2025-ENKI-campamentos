import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import { getSummerCamps } from "../../services/summerCampService";
import { getWeeks } from "../../services/weekService";

export default function AdminWeeksPage() {
  const [summerCamps, setSummerCamps] = useState([]);
  const [selectedSummerCampId, setSelectedSummerCampId] = useState("");
  const [weeks, setWeeks] = useState([]);

  const [loadingCamps, setLoadingCamps] = useState(true);
  const [loadingWeeks, setLoadingWeeks] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCamps = async () => {
      try {
        setLoadingCamps(true);
        setError("");

        const camps = await getSummerCamps();
        setSummerCamps(camps);

        if (camps.length > 0) {
          setSelectedSummerCampId(String(camps[0].id));
        }
      } catch (error) {
        setError(error.message || "Error al cargar campamentos");
      } finally {
        setLoadingCamps(false);
      }
    };

    loadCamps();
  }, []);

  useEffect(() => {
    if (!selectedSummerCampId) {
      setWeeks([]);
      return;
    }

    const loadWeeks = async () => {
      try {
        setLoadingWeeks(true);
        setError("");

        const result = await getWeeks({
          summerCampId: selectedSummerCampId,
        });

        setWeeks(result);
      } catch (error) {
        setError(error.message || "Error al cargar semanas");
      } finally {
        setLoadingWeeks(false);
      }
    };

    loadWeeks();
  }, [selectedSummerCampId]);

  if (loadingCamps) return <p>Cargando campamentos...</p>;

  return (
    <section className="detail-section-stack">
      <div className="admin-page-heading">
        <button
          type="button"
          onClick={() => history.back()}
          className="back-button"
        >
          Atrás
        </button>

        <h1>Semanas</h1>
        <p>Selecciona el campamento del que quieres ver las semanas.</p>
      </div>

      {error && <p className="form-error">{error}</p>}

      <Card>
        <div className="form-grid">
          <Select
            id="weeks-camp-selector"
            label="Campamento"
            value={selectedSummerCampId}
            onChange={(event) => setSelectedSummerCampId(event.target.value)}
          >
            <option value="">Selecciona un campamento</option>
            {summerCamps.map((camp) => (
              <option key={camp.id} value={camp.id}>
                {camp.name} - {camp.year}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {loadingWeeks ? (
        <p>Cargando semanas...</p>
      ) : (
        <div className="admin-menu-grid">
          {weeks.map((week) => (
            <Card key={week.id}>
              <h2>Semana {week.number}</h2>

              <p>
                {new Date(week.startDate).toLocaleDateString()} -{" "}
                {new Date(week.endDate).toLocaleDateString()}
              </p>

              <p>Plazas sin discapacidad: {week.totalPlaces}</p>
              <p>Plazas disponibles sin discapacidad: {week.availablePlaces}</p>

              <p>Plazas con discapacidad: {week.totalDisabilityPlaces}</p>
              <p>
                Plazas disponibles con discapacidad:{" "}
                {week.availableDisabilityPlaces}
              </p>

              <Link to={`/administracion/semanas/${week.id}`}
              state={{ weekNumber: week.number }}>
                <Button type="button">Ver listado</Button>
              </Link>
            </Card>
          ))}

          {weeks.length === 0 && selectedSummerCampId && (
            <Card>
              <h2>Sin semanas</h2>
              <p>Este campamento no tiene semanas creadas.</p>
            </Card>
          )}

          {summerCamps.length === 0 && (
            <Card>
              <h2>Sin campamentos</h2>
              <p>Todavía no hay campamentos creados.</p>
            </Card>
          )}
        </div>
      )}
    </section>
  );
}