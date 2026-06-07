import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { getSignedUpsByWeek } from "../../services/signedUpService";
import { Link } from "react-router-dom";

export default function AdminWeekDetailPage() {
  const { weekId } = useParams();

  const [signedUps, setSignedUps] = useState([]);
  const [filters, setFilters] = useState({
    breakfast: "",
    lunch: "",
    earlyRise: "",
    hasDisability: "",
    accepted: "",
    waitlist: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSignedUps = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getSignedUpsByWeek(weekId);
      setSignedUps(result);
    } catch (error) {
      setError(error.message || "Error al cargar inscritos de la semana");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSignedUps();
  }, [weekId]);

  const filtered = signedUps.filter((item) => {
    const participant = item.inscription?.participant;

    if (filters.breakfast && String(item.breakfast) !== filters.breakfast) {
      return false;
    }

    if (filters.lunch && String(item.lunch) !== filters.lunch) {
      return false;
    }

    if (filters.earlyRise && String(item.earlyRise) !== filters.earlyRise) {
      return false;
    }

    if (
      filters.hasDisability &&
      String(participant?.hasDisability) !== filters.hasDisability
    ) {
      return false;
    }

    if (filters.accepted === "true" && item.state !== "ACCEPTED") {
      return false;
    }

    if (filters.waitlist === "true" && item.state !== "WAITLIST") {
      return false;
    }

    return true;
  });

  const updateFilter = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const exportCsv = () => {
    const header = [
      "Nombre menor",
      "Apellidos menor",
      "Nombre tutor",
      "Apellido tutor",
      "DNI",
      "TFNO",
      "Discapacidad",
      "Alergias",
      "Medicación",
      "Comedor",
      "Madrugadores",
      "Desayuno",
      "Imágenes",
      "Aceptado",
      "Lista de espera",
    ];

    const rows = filtered.map((item) => {
      const participant = item.inscription?.participant;
      const guardian = participant?.guardian;

      return [
        participant?.name || "",
        participant?.surname || "",
        guardian?.name || "",
        guardian?.surname || "",
        guardian?.dni || "",
        guardian?.phone || "",
        participant?.hasDisability ? "SI" : "NO",
        participant?.allergies?.map((a) => a.description).join(", ") || "",
        participant?.medications?.map((m) => m.description).join(", ") || "",
        item.lunch ? "SI" : "NO",
        item.earlyRise ? "SI" : "NO",
        item.breakfast ? "SI" : "NO",
        item.inscription?.imagesAccepted ? "SI" : "NO",
        item.state === "ACCEPTED" ? "SI" : "NO",
        item.state === "WAITLIST" ? "SI" : "NO",
      ];
    });

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `semana-${weekId}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  if (loading) return <p>Cargando semana...</p>;

  return (
    <section className="detail-section-stack">
      <div className="admin-page-heading">
        <button type="button" onClick={() => history.back()} className="back-button">
          Atrás
        </button>
        <h1>Semana {weekId}</h1>
        <p>Listado de personas inscritas en esta semana.</p>
      </div>

      {error && <p className="form-error">{error}</p>}

      <Card>
        <div className="admin-filters">
          <select
            value={filters.lunch}
            onChange={(event) => updateFilter("lunch", event.target.value)}
          >
            <option value="">Comedor</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>

          <select
            value={filters.breakfast}
            onChange={(event) => updateFilter("breakfast", event.target.value)}
          >
            <option value="">Desayuno</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>

          <select
            value={filters.earlyRise}
            onChange={(event) => updateFilter("earlyRise", event.target.value)}
          >
            <option value="">Madrugadores</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>

          <select
            value={filters.hasDisability}
            onChange={(event) => updateFilter("hasDisability", event.target.value)}
          >
            <option value="">Discapacidad</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>

          <select
            value={filters.accepted}
            onChange={(event) => updateFilter("accepted", event.target.value)}
          >
            <option value="">Aceptado</option>
            <option value="true">Sí</option>
          </select>

          <select
            value={filters.waitlist}
            onChange={(event) => updateFilter("waitlist", event.target.value)}
          >
            <option value="">Lista espera</option>
            <option value="true">Sí</option>
          </select>

          <Button type="button" onClick={exportCsv}>
            Exportar tabla como Excel
          </Button>
        </div>
      </Card>

      <Card>
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre menor</th>
                <th>Apellidos menor</th>
                <th>Nombre tutor</th>
                <th>Apellido tutor</th>
                <th>DNI</th>
                <th>TFNO</th>
                <th>Discapacidad</th>
                <th>Alergias</th>
                <th>Medicación</th>
                <th>Comedor</th>
                <th>Madrugadores</th>
                <th>Desayuno</th>
                <th>Imágenes</th>
                <th>Aceptado</th>
                <th>Lista espera</th>
                <th>Más info</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((item) => {
                const participant = item.inscription?.participant;
                const guardian = participant?.guardian;

                return (
                  <tr key={`${item.inscriptionId}-${item.weekId}`}>
                    <td>{participant?.name}</td>
                    <td>{participant?.surname}</td>
                    <td>{guardian?.name}</td>
                    <td>{guardian?.surname}</td>
                    <td>{guardian?.dni}</td>
                    <td>{guardian?.phone}</td>
                    <td>{participant?.hasDisability ? "SI" : "NO"}</td>
                    <td>
                      {participant?.allergies
                        ?.map((a) => a.description)
                        .join(", ") || "-"}
                    </td>
                    <td>
                      {participant?.medications
                        ?.map((m) => m.description)
                        .join(", ") || "-"}
                    </td>
                    <td>{item.lunch ? "SI" : "NO"}</td>
                    <td>{item.earlyRise ? "SI" : "NO"}</td>
                    <td>{item.breakfast ? "SI" : "NO"}</td>
                    <td>{item.inscription?.imagesAccepted ? "SI" : "NO"}</td>
                    <td>{item.state === "ACCEPTED" ? "SI" : "NO"}</td>
                    <td>{item.state === "WAITLIST" ? "SI" : "NO"}</td>
                    <td>
  <Link to={`/administracion/listado/${item.inscriptionId}`}>
    <Button type="button">Ver inscripción</Button>
  </Link>
</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}