import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { downloadInscriptionPdf } from "../../utils/pdf";
import { getAppSettings } from "../../services/settingsService"

const formatMoney = (value) => {
  return `${Number(value || 0).toFixed(2)} €`;
};

const getParticipantFullName = (participant) => {
  if (!participant) return "Participante";

  return [participant.name, participant.surname].filter(Boolean).join(" ");
};

const getWeekLabel = (signedUp) => {
  const week = signedUp.week;

  if (!week) {
    return `Semana ${signedUp.weekId}`;
  }

  return `Semana ${week.number}`;
};

export default function InscriptionConfirmationPage() {
  const location = useLocation();
  const { year } = useParams();

  const inscription = location.state?.inscription;

  if (!inscription) {
    return <Navigate to="/" replace />;
  }

  const participant = inscription.participant;
  const summerCamp = inscription.summerCamp;

  const campYear = summerCamp?.year || year;
  const campName = summerCamp?.name || "Campamento ENKI";

  const signedUpWeeks = inscription.signedUpWeeks || [];

  const reservedWeeks = signedUpWeeks.filter(
    (item) => item.state === "PENDING" || item.state === "ACCEPTED"
  );

  const waitlistWeeks = signedUpWeeks.filter(
    (item) => item.state === "WAITLIST"
  );

  const appliedDiscounts = inscription.appliedDiscounts || [];
  const hasDisability = participant?.hasDisability === true;
  const amountToPay = formatMoney(inscription.totalAmountPending);
  const [appSettings, setAppSettings] = useState({
    pendingReservationHours: 48,
  });
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await getAppSettings();

        setAppSettings({
          pendingReservationHours: result?.pendingReservationHours ?? 48,
        });
      } catch (error) {
        setAppSettings({
          pendingReservationHours: 48,
        });
      }
    };

    loadSettings();
  }, []);
  const paymentLimitText = `${appSettings.pendingReservationHours} horas`;
  return (
    <main className="page">
      <section className="confirmation-hero">
        <p className="eyebrow">Inscripción enviada</p>

        <h1>La inscripción se ha registrado correctamente</h1>

        <p>
          Hemos recibido la solicitud de inscripción para{" "}
          <strong>
            {campName} {campYear}
          </strong>
          . A continuación puedes ver el resumen con las semanas seleccionadas y
          el importe pendiente.
        </p>
      </section>

      <Card>
        <h2>Instrucciones para realizar el pago</h2>

        <p>
          Una vez confirmada la plaza, podrá realizar el pago siguiendo las
          instrucciones indicadas por ENKI.
        </p>

        <p>
          Recuerde que la reserva puede caducar si no se realiza el pago dentro
          del plazo establecido.
        </p>
      </Card>

      <Card>
        <h2>Resumen de la inscripción</h2>

        <div>
          <span className="summary-label">Número de inscripción</span>
          <strong>{inscription.id}</strong>
        </div>

        <div className="summary-grid">
          <div>
            <span className="summary-label">Campamento</span>
            <strong>
              {campName} {campYear}
            </strong>
          </div>

          <div>
            <span className="summary-label">Participante</span>
            <strong>{getParticipantFullName(participant)}</strong>
          </div>

          <div>
            <span className="summary-label">Estado</span>
            <strong>{inscription.globalStatus}</strong>
          </div>

          <div>
            <span className="summary-label">Modalidad de pago</span>
            <strong>
              {inscription.paymentMode === "TWO_PAYMENTS"
                ? "Dos pagos"
                : "Pago único"}
            </strong>
          </div>

          <div>
            <span className="summary-label">Total a pagar ahora</span>
            <strong>{formatMoney(inscription.totalAmountPending)}</strong>
          </div>
        </div>
      </Card>

      <Card>
        <h2>Semanas con plaza</h2>

        {reservedWeeks.length === 0 ? (
          <p>No hay semanas con plaza confirmada en este momento.</p>
        ) : (
          <div className="confirmation-list">
            {reservedWeeks.map((item) => (
              <div
                className="confirmation-list-item"
                key={`${item.inscriptionId}-${item.weekId}`}
              >
                <div>
                  <strong>{getWeekLabel(item)}</strong>
                  <p>
                    Estado:{" "}
                    {item.state === "ACCEPTED"
                      ? "Aceptada"
                      : "Pendiente de pago"}
                  </p>
                </div>

                <strong>{formatMoney(item.priceApplied)}</strong>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2>Lista de espera</h2>

        {waitlistWeeks.length === 0 ? (
          <p>No hay semanas en lista de espera.</p>
        ) : (
          <>
            <p className="helper-text">
              Estas semanas no se cobran ahora. Si más adelante pasan a tener
              plaza, se generará el pago correspondiente.
            </p>

            <div className="confirmation-list">
              {waitlistWeeks.map((item) => (
                <div
                  className="confirmation-list-item"
                  key={`${item.inscriptionId}-${item.weekId}`}
                >
                  <div>
                    <strong>{getWeekLabel(item)}</strong>
                    <p>Estado: lista de espera</p>
                  </div>

                  <strong>{formatMoney(item.priceApplied)}</strong>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card>
        <h2>Descuentos aplicados</h2>

        {appliedDiscounts.length === 0 ? (
          <p>No se han aplicado descuentos.</p>
        ) : (
          <ul className="discount-list">
            {appliedDiscounts.map((item) => {
              const discount = item.discount || item;

              return (
                <li key={discount.id}>
                  <strong>{discount.code}</strong>
                  {discount.percentage !== undefined && (
                    <span> - {discount.percentage}%</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
  <h2>Próximos pasos</h2>

  {hasDisability ? (
    <>
      <p>
        Un representante de ENKI se pondrá en contacto con usted para confirmar
        la aceptación de su solicitud.
      </p>

      <p>
        Una vez revisada y aceptada la solicitud, se indicará cómo realizar el
        pago y formalizar definitivamente la inscripción.
      </p>
    </>
  ) : (
    <>
      <p>
        Para completar la reserva debe abonar <strong>{amountToPay}</strong>{" "}
        antes de <strong>{paymentLimitText}</strong>.
      </p>

      <p>
        Instrucciones temporales de pago: realice el pago siguiendo las
        indicaciones facilitadas por ENKI. Este texto se sustituirá más adelante
        por los pasos definitivos de transferencia, Bizum u otro método
        habilitado.
      </p>
    </>
  )}

  <div className="confirmation-actions">
    <Button
      type="button"
      onClick={() => downloadInscriptionPdf(inscription)}
    >
      Descargar inscripción en PDF
    </Button>

    <Link to="/">
      <Button type="button" variant="secondary">
        Volver al inicio
      </Button>
    </Link>

    {campYear ? (
      <Link to={`/inscripcion/${campYear}`}>
        <Button type="button" variant="secondary">
          Hacer otra inscripción
        </Button>
      </Link>
    ) : (
      <Link to="/">
        <Button type="button" variant="secondary">
          Hacer otra inscripción
        </Button>
      </Link>
    )}
  </div>
</Card>
    </main>
  );
}