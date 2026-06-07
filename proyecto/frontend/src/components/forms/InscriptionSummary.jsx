import Card from "../ui/Card";

export default function InscriptionSummary({ formData }) {
  return (
    <Card>
      <h2>Resumen de inscripción</h2>

      <div className="summary-grid">
        <div>
          <h3>Participante</h3>
          <p>
            {formData.participant.name || "Nombre no indicado"}{" "}
            {formData.participant.surname || ""}
          </p>
          <p>Fecha nacimiento: {formData.participant.birthdate || "-"}</p>
          <p>
            Discapacidad/apoyos:{" "}
            {formData.participant.hasDisability ? "Sí" : "No"}
          </p>
        </div>

        <div>
          <h3>Tutor legal</h3>
          <p>
            {formData.guardian.name || "Nombre no indicado"}{" "}
            {formData.guardian.surname || ""}
          </p>
          <p>Email: {formData.guardian.email || "-"}</p>
          <p>Teléfono: {formData.guardian.phone || "-"}</p>
        </div>

        <div>
          <h3>Dirección</h3>
          <p>{formData.address.street || "-"}</p>
          <p>
            {formData.address.city || "-"},{" "}
            {formData.address.province || "-"}
          </p>
          <p>CP: {formData.address.postalCode || "-"}</p>
        </div>

        <div>
          <h3>Semanas seleccionadas</h3>
          {formData.weeks.length === 0 ? (
            <p>No hay semanas seleccionadas.</p>
          ) : (
            <ul>
              {formData.weeks.map((week) => (
                <li key={`${week.summerCampId}-${week.number}`}>
                  Semana {week.number}
                  {week.breakfast ? " · desayuno" : ""}
                  {week.lunch ? " · comedor" : ""}
                  {week.earlyRise ? " · madrugadores" : ""}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3>Personas autorizadas</h3>
          {formData.authorizedPeople.length === 0 ? (
            <p>No hay personas autorizadas.</p>
          ) : (
            <ul>
              {formData.authorizedPeople.map((person, index) => (
                <li key={index}>
                  {person.name || "Nombre"} {person.surname || ""}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3>Pago y factura</h3>
          <p>
            Modalidad:{" "}
            {formData.inscription.paymentMode === "ONE_PAYMENT"
              ? "Pago único"
              : "Dos pagos"}
          </p>
          <p>
            Factura: {formData.inscription.invoiceRequested ? "Sí" : "No"}
          </p>
        </div>

        <div>
          <h3>Descuentos</h3>
          {formData.discounts.length === 0 ? (
            <p>No hay códigos añadidos.</p>
          ) : (
            <ul>
              {formData.discounts.map((code) => (
                <li key={code}>{code}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3>Autorizaciones</h3>
          <p>
            Protección de datos:{" "}
            {formData.inscription.dataTreatmentAccepted ? "Aceptada" : "Pendiente"}
          </p>
          <p>
            Salidas:{" "}
            {formData.inscription.outingsAccepted ? "Autorizadas" : "No autorizadas"}
          </p>
          <p>
            Imágenes:{" "}
            {formData.inscription.imagesAccepted ? "Autorizadas" : "No autorizadas"}
          </p>
        </div>
      </div>
    </Card>
  );
}