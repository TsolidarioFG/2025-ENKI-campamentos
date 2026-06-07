import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Card from "../../components/ui/Card";
import Select from "../../components/ui/Select";
import { getInscriptions } from "../../services/inscriptionService";
import { getSummerCamps } from "../../services/summerCampService";

const formatMoney = (value) => `${Number(value || 0).toFixed(2)} €`;

export default function AdminDashboardPage() {
  const [summerCamps, setSummerCamps] = useState([]);
  const [selectedSummerCampId, setSelectedSummerCampId] = useState("");

  const [inscriptions, setInscriptions] = useState([]);

  const [loadingCamps, setLoadingCamps] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

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

    const loadData = async () => {
      try {
        setLoadingData(true);
        setError("");

        const result = await getInscriptions({
          summerCampId: selectedSummerCampId,
        });

        setInscriptions(result);
      } catch (error) {
        setError(error.message || "Error al cargar datos");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [selectedSummerCampId]);

  const selectedCamp = summerCamps.find(
    (camp) => String(camp.id) === String(selectedSummerCampId)
  );

  const stats = useMemo(() => {
    const participants = inscriptions
      .map((item) => item.participant)
      .filter(Boolean);

    const disabilityYes = participants.filter(
      (item) => item.hasDisability
    ).length;

    const disabilityNo = participants.length - disabilityYes;

    const acceptedCount = inscriptions.filter((inscription) =>
      inscription.signedUpWeeks?.some(
        (signedUp) =>
          signedUp.state === "ACCEPTED" || signedUp.state === "PENDING"
      )
    ).length;

    const waitlistCount = inscriptions.filter((inscription) =>
      inscription.signedUpWeeks?.some(
        (signedUp) => signedUp.state === "WAITLIST"
      )
    ).length;

    const cancelledCount = inscriptions.filter((inscription) =>
      inscription.signedUpWeeks?.length > 0 &&
      inscription.signedUpWeeks.every(
        (signedUp) => signedUp.state === "CANCELLED"
      )
    ).length;

    const totalExpected = inscriptions.reduce(
      (sum, item) => sum + Number(item.totalAmountExpected || 0),
      0
    );

    const totalPaid = inscriptions.reduce(
      (sum, item) => sum + Number(item.totalAmountPaid || 0),
      0
    );

    const totalPending = inscriptions.reduce(
      (sum, item) => sum + Number(item.totalAmountPending || 0),
      0
    );

    const weekMap = new Map();

    inscriptions.forEach((inscription) => {
      inscription.signedUpWeeks?.forEach((signedUp) => {
        const week = signedUp.week;
        if (!week) return;

        const key = week.id;

        if (!weekMap.has(key)) {
          weekMap.set(key, {
            id: week.id,
            number: week.number,
            occupiedWithoutDisability: 0,
            occupiedWithDisability: 0,
            waitlist: 0,
            cancelled: 0,
            totalPlaces: Number(week.totalPlaces || 0) + Number(week.totalDisabilityPlaces || 0),
            freeWithoutDisability: Number(week.availablePlaces || 0),
            freeWithDisability: Number(week.availableDisabilityPlaces || 0),
          });
        }

        const row = weekMap.get(key);

        if (signedUp.state === "PENDING" || signedUp.state === "ACCEPTED") {
          if (inscription.participant?.hasDisability) {
            row.occupiedWithDisability += 1;
          } else {
            row.occupiedWithoutDisability += 1;
          }
        }

        if (signedUp.state === "WAITLIST") {
          row.waitlist += 1;
        }

        if (signedUp.state === "CANCELLED") {
          row.cancelled += 1;
        }
      });
    });

    const weeks = Array.from(weekMap.values()).sort(
      (a, b) => a.number - b.number
    );

    const disabilityChartData = [
      {
        name: "Sin discapacidad",
        value: disabilityNo,
      },
      {
        name: "Con discapacidad",
        value: disabilityYes,
      },
    ];

    const inscriptionStatusChartData = [
      {
        name: "Aceptadas/Pendientes",
        value: acceptedCount,
      },
      {
        name: "Lista espera",
        value: waitlistCount,
      },
      {
        name: "Canceladas",
        value: cancelledCount,
      },
    ];

    const weekOccupationChartData = weeks.map((week) => ({
      name: `Semana ${week.number}`,
      "Ocupadas sin discapacidad": week.occupiedWithoutDisability,
      "Ocupadas con discapacidad": week.occupiedWithDisability,
      "Lista de espera": week.waitlist,
      "Libres sin discapacidad": week.freeWithoutDisability,
      "Libres con discapacidad": week.freeWithDisability,
    }));

    return {
      totalParticipants: participants.length,
      disabilityYes,
      disabilityNo,
      acceptedCount,
      waitlistCount,
      cancelledCount,
      totalExpected,
      totalPaid,
      totalPending,
      weeks,
      disabilityChartData,
      inscriptionStatusChartData,
      weekOccupationChartData,
    };
  }, [inscriptions]);

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

        <h1>Datos</h1>
        <p>Información sobre plazas ocupadas/libres y estadísticas generales.</p>
      </div>

      {error && <p className="form-error">{error}</p>}

      <Card>
        <div className="form-grid">
          <Select
            id="dashboard-camp-selector"
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

        {selectedCamp && (
          <p className="helper-text">
            Mostrando datos de {selectedCamp.name} - {selectedCamp.year}.
          </p>
        )}
      </Card>

      {loadingData ? (
        <p>Cargando datos...</p>
      ) : (
        <>
          <div className="admin-data-grid">
            <Card>
              <h2>Inscritas</h2>

              <table className="mini-table">
                <tbody>
                  <tr>
                    <td>Sin discapacidad</td>
                    <td>{stats.disabilityNo}</td>
                  </tr>
                  <tr>
                    <td>Con discapacidad</td>
                    <td>{stats.disabilityYes}</td>
                  </tr>
                  <tr>
                    <td>Suma total</td>
                    <td>{stats.totalParticipants}</td>
                  </tr>
                </tbody>
              </table>
            </Card>

            <Card>
              <h2>Proporción discapacidad</h2>
              <div className="fake-chart">
                <strong>
                  {stats.totalParticipants
                    ? Math.round(
                        (stats.disabilityYes / stats.totalParticipants) * 100
                      )
                    : 0}
                  %
                </strong>
                <span>Con discapacidad</span>
              </div>
            </Card>

            <Card>
              <h2>Resumen económico</h2>

              <table className="mini-table">
                <tbody>
                  <tr>
                    <td>Total esperado</td>
                    <td>{formatMoney(stats.totalExpected)}</td>
                  </tr>
                  <tr>
                    <td>Total pagado</td>
                    <td>{formatMoney(stats.totalPaid)}</td>
                  </tr>
                  <tr>
                    <td>Total pendiente</td>
                    <td>{formatMoney(stats.totalPending)}</td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </div>

          <Card>
            <h2>Información sobre las plazas ocupadas/libres en cada semana</h2>

            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Semana</th>
                    <th>Ocupadas sin discapacidad</th>
                    <th>Ocupadas con discapacidad</th>
                    <th>Ocupadas totales</th>
                    <th>Plazas totales</th>
                    <th>Libres sin discapacidad</th>
                    <th>Libres con discapacidad</th>
                    <th>Lista de espera</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {stats.weeks.map((week) => {
                    const occupiedTotal =
                      week.occupiedWithoutDisability +
                      week.occupiedWithDisability;

                    const status =
                      week.freeWithoutDisability <= 0 &&
                      week.freeWithDisability <= 0
                        ? "Completa"
                        : "Incompleta";

                    return (
                      <tr key={week.id}>
                        <td>Semana {week.number}</td>
                        <td>{week.occupiedWithoutDisability}</td>
                        <td>{week.occupiedWithDisability}</td>
                        <td>{occupiedTotal}</td>
                        <td>{week.totalPlaces}</td>
                        <td>{week.freeWithoutDisability}</td>
                        <td>{week.freeWithDisability}</td>
                        <td>{week.waitlist}</td>
                        <td>{status}</td>
                      </tr>
                    );
                  })}

                  {stats.weeks.length === 0 && (
                    <tr>
                      <td colSpan="9">No hay datos de semanas disponibles.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="admin-chart-row">
            <Card>
              <h2>Discapacidad</h2>

              <div className="chart-box">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={stats.disabilityChartData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={85}
                      label
                    />
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h2>Estado de inscripciones</h2>

              <div className="chart-box">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stats.inscriptionStatusChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h2>Ocupación por semana</h2>

              <div className="chart-box">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stats.weekOccupationChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Ocupadas sin discapacidad" />
                    <Bar dataKey="Ocupadas con discapacidad" />
                    <Bar dataKey="Lista de espera" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card>
            <h2>Plazas libres por semana</h2>

            <div className="chart-box chart-box-large">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={stats.weekOccupationChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Libres sin discapacidad" />
                  <Bar dataKey="Libres con discapacidad" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </section>
  );
}