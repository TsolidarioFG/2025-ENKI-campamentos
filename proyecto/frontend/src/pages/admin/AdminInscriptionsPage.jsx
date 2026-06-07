import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { getInscriptions } from "../../services/inscriptionService";
import { getSummerCamps } from "../../services/summerCampService";


const formatMoney = (value) => `${Number(value || 0).toFixed(2)} €`;

export default function AdminInscriptionsPage() {
  const [summerCamps, setSummerCamps] = useState([]);
  const [selectedSummerCampId, setSelectedSummerCampId] = useState("");

  const [inscriptions, setInscriptions] = useState([]);
  const [acceptedFilter, setAcceptedFilter] = useState("");
  const [waitlistFilter, setWaitlistFilter] = useState("");

  const [loadingCamps, setLoadingCamps] = useState(true);
  const [loadingInscriptions, setLoadingInscriptions] = useState(false);
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
      setInscriptions([]);
      return;
    }

    const loadInscriptions = async () => {
      try {
        setLoadingInscriptions(true);
        setError("");

        const result = await getInscriptions({
          summerCampId: selectedSummerCampId,
        });

        setInscriptions(result);
      } catch (error) {
        setError(error.message || "Error al cargar inscripciones");
      } finally {
        setLoadingInscriptions(false);
      }
    };

    loadInscriptions();
  }, [selectedSummerCampId]);

  const filtered = inscriptions.filter((item) => {
    const hasAccepted = item.signedUpWeeks?.some(
      (signedUp) =>
        signedUp.state === "ACCEPTED" || signedUp.state === "PENDING"
    );

    const hasWaitlist = item.signedUpWeeks?.some(
      (signedUp) => signedUp.state === "WAITLIST"
    );

    if (acceptedFilter === "yes" && !hasAccepted) return false;
    if (acceptedFilter === "no" && hasAccepted) return false;

    if (waitlistFilter === "yes" && !hasWaitlist) return false;
    if (waitlistFilter === "no" && hasWaitlist) return false;

    return true;
  });

  const exportCsv = () => {
    const selectedCamp = summerCamps.find(
      (camp) => String(camp.id) === String(selectedSummerCampId)
    );

    const header = [
      "Campamento",
      "Nombre menor",
      "Apellidos menor",
      "Nombre tutor",
      "Apellidos tutor",
      "Telefono",
      "Email",
      "Factura",
      "Cantidad pagada",
      "Cantidad a pagar",
      "Aceptado",
      "Lista de espera",
    ];

    const rows = filtered.map((item) => {
      const participant = item.participant;
      const guardian = participant?.guardian;

      const hasAccepted = item.signedUpWeeks?.some(
        (signedUp) =>
          signedUp.state === "ACCEPTED" || signedUp.state === "PENDING"
      );

      const hasWaitlist = item.signedUpWeeks?.some(
        (signedUp) => signedUp.state === "WAITLIST"
      );

      return [
        selectedCamp ? `${selectedCamp.name} - ${selectedCamp.year}` : "",
        participant?.name || "",
        participant?.surname || "",
        guardian?.name || "",
        guardian?.surname || "",
        guardian?.phone || "",
        guardian?.email || "",
        item.invoiceRequested ? "SI" : "NO",
        item.totalAmountPaid || 0,
        item.totalAmountPending || 0,
        hasAccepted ? "SI" : "NO",
        hasWaitlist ? "SI" : "NO",
      ];
    });

    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = selectedCamp
      ? `listado-inscripciones-${selectedCamp.year}.csv`
      : "listado-inscripciones.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

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

        <h1>Lista de inscritos</h1>
        <p>Consulta general de inscripciones recibidas por campamento.</p>
      </div>

      {error && <p className="form-error">{error}</p>}

      <Card>
        <div className="admin-filters">
          <div>
            <label>Campamento</label>
            <select
              value={selectedSummerCampId}
              onChange={(event) => setSelectedSummerCampId(event.target.value)}
            >
              <option value="">Selecciona un campamento</option>
              {summerCamps.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.name} - {camp.year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Aceptado</label>
            <select
              value={acceptedFilter}
              onChange={(event) => setAcceptedFilter(event.target.value)}
            >
              <option value="">Todos</option>
              <option value="yes">Sí</option>
              <option value="no">No</option>
            </select>
          </div>

          <div>
            <label>Lista de espera</label>
            <select
              value={waitlistFilter}
              onChange={(event) => setWaitlistFilter(event.target.value)}
            >
              <option value="">Todos</option>
              <option value="yes">Sí</option>
              <option value="no">No</option>
            </select>
          </div>

          <Button type="button" onClick={exportCsv}>
            Exportar tabla como Excel
          </Button>
        </div>
      </Card>

      <Card>
        {loadingInscriptions ? (
          <p>Cargando inscripciones...</p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre menor</th>
                  <th>Apellidos menor</th>
                  <th>Nombre tutor</th>
                  <th>Apellido tutor</th>
                  <th>TFNO</th>
                  <th>Email</th>
                  <th>Factura</th>
                  <th>Cantidad pagada</th>
                  <th>Cantidad a pagar</th>
                  <th>Aceptado</th>
                  <th>Lista de espera</th>
                  <th>Más info</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((item) => {
                  const participant = item.participant;
                  const guardian = participant?.guardian;

                  const hasAccepted = item.signedUpWeeks?.some(
                    (signedUp) =>
                      signedUp.state === "ACCEPTED" ||
                      signedUp.state === "PENDING"
                  );

                  const hasWaitlist = item.signedUpWeeks?.some(
                    (signedUp) => signedUp.state === "WAITLIST"
                  );

                  return (
                    <tr key={item.id}>
                      <td>{participant?.name}</td>
                      <td>{participant?.surname}</td>
                      <td>{guardian?.name}</td>
                      <td>{guardian?.surname}</td>
                      <td>{guardian?.phone}</td>
                      <td>{guardian?.email}</td>
                      <td>{item.invoiceRequested ? "SI" : "NO"}</td>
                      <td>{formatMoney(item.totalAmountPaid)}</td>
                      <td>{formatMoney(item.totalAmountPending)}</td>
                      <td>{hasAccepted ? "SI" : "NO"}</td>
                      <td>{hasWaitlist ? "SI" : "NO"}</td>
                      <td>
                        <Link to={`/administracion/listado/${item.id}`}>
                          <Button type="button">Info</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="12">
                      No hay inscripciones con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}