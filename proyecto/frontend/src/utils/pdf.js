import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatMoney = (value) => `${Number(value || 0).toFixed(2)} €`;

const formatBoolean = (value) => (value ? "Sí" : "No");

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
};

export const downloadInscriptionPdf = (inscription) => {
  const doc = new jsPDF();

  const participant = inscription?.participant || {};
  const guardian = participant?.guardian || inscription?.guardian || {};
  const address = participant?.address || inscription?.address || {};
  const signedUpWeeks = inscription?.signedUpWeeks || inscription?.weeks || [];
  const payments = inscription?.payments || [];

  doc.setFontSize(18);
  doc.text("Resumen de inscripción", 14, 18);

  doc.setFontSize(11);
  doc.text(`Fecha: ${formatDate(inscription?.inscriptionDate || new Date())}`, 14, 28);

  autoTable(doc, {
    startY: 36,
    head: [["Datos de la persona menor", ""]],
    body: [
      ["Nombre", `${participant.name || ""} ${participant.surname || ""}`.trim()],
      ["Fecha de nacimiento", formatDate(participant.birthdate)],
      ["Género", participant.gender || "-"],
      ["Tarjeta sanitaria", participant.healthCard || "-"],
      ["Discapacidad", formatBoolean(participant.hasDisability)],
      ["Repite campamento", formatBoolean(participant.repeatedBefore)],
      ["Hermanos", formatBoolean(participant.siblings)],
      ["Alumno/a del colegio", formatBoolean(participant.schoolRelated)],
    ],
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [["Tutor/a legal", ""]],
    body: [
      ["Nombre", `${guardian.name || ""} ${guardian.surname || ""}`.trim()],
      ["DNI/NIE", guardian.dni || "-"],
      ["Teléfono", guardian.phone || "-"],
      ["Teléfono 2", guardian.phone2 || "-"],
      ["Email", guardian.email || "-"],
      ["Email 2", guardian.email2 || "-"],
      ["Relación", guardian.relation || "-"],
    ],
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [["Dirección", ""]],
    body: [
      ["Calle", address.street || "-"],
      ["Ciudad", address.city || "-"],
      ["Provincia", address.province || "-"],
      ["Código postal", address.postalCode || "-"],
    ],
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [["Semana", "Estado", "Madrugadores", "Desayuno", "Comedor", "Precio"]],
    body:
      signedUpWeeks.length > 0
        ? signedUpWeeks.map((item) => [
            item.week?.number || item.number || item.weekId || "-",
            item.state || "-",
            formatBoolean(item.earlyRise),
            formatBoolean(item.breakfast),
            formatBoolean(item.lunch),
            formatMoney(item.priceApplied || item.price || 0),
          ])
        : [["-", "-", "-", "-", "-", "-"]],
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [["Resumen económico", ""]],
    body: [
      ["Modalidad de pago", inscription?.paymentMode || "-"],
      ["Total esperado", formatMoney(inscription?.totalAmountExpected)],
      ["Total pagado", formatMoney(inscription?.totalAmountPaid)],
      ["Total pendiente", formatMoney(inscription?.totalAmountPending)],
      ["Estado", inscription?.globalStatus || "-"],
    ],
  });

  if (payments.length > 0) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [["Tipo", "Estado", "Importe", "Fecha pago"]],
      body: payments.map((payment) => [
        payment.paymentType || "-",
        payment.status || "-",
        formatMoney(payment.amount),
        formatDate(payment.paidAt),
      ]),
    });
  }

  const filename = `inscripcion-${participant.name || "participante"}-${
    participant.surname || ""
  }.pdf`
    .replace(/\s+/g, "-")
    .toLowerCase();

  doc.save(filename);
};