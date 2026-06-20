import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import {
  getInscriptionById,
  updateInscriptionDetails,
} from "../../services/inscriptionService";
import { createExtraFormToken } from "../../services/extraFormTokenService";
import {
  createExtraPayment,
  registerPayment,
} from "../../services/paymentService";
import { updateSignedUpStatus } from "../../services/SignedUpService";
import { useAuth } from "../../context/AuthContext";

const formatMoney = (value) => `${Number(value || 0).toFixed(2)} €`;

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
};

const formatBoolean = (value) => {
  if (value === true) return "SI";
  if (value === false) return "NO";
  return "-";
};

const formatValue = (value) => {
  return value !== undefined && value !== null && value !== "" ? value : "-";
};

const booleanSelectValue = (value) => (value ? "true" : "false");

const nullableBooleanSelectValue = (value) => {
  if (value === true) return "true";
  if (value === false) return "false";
  return "";
};

const selectValueToNullableBoolean = (value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
};

const DetailItem = ({ label, children }) => (
  <div>
    <span className="summary-label">{label}</span>
    {children}
  </div>
);

const buildEditFormFromInscription = (item) => ({
  inscription: {
    paymentMode: item.paymentMode || "ONE_PAYMENT",
    invoiceRequested: item.invoiceRequested || false,
    invoiceIssued: item.invoiceIssued || false,
    invoiceName: item.invoiceName || "",
    invoiceDni: item.invoiceDni || "",
    dataTreatmentAccepted: item.dataTreatmentAccepted || false,
    outingsAccepted: item.outingsAccepted || false,
    imagesAccepted: item.imagesAccepted || false,
    notes: item.notes || "",
  },

  participant: {
    name: item.participant?.name || "",
    surname: item.participant?.surname || "",
    birthdate: item.participant?.birthdate
      ? item.participant.birthdate.slice(0, 10)
      : "",
    gender: item.participant?.gender || "",
    healthCard: item.participant?.healthCard || "",
    repeatedBefore: item.participant?.repeatedBefore || false,
    siblings: item.participant?.siblings || false,
    schoolRelated: item.participant?.schoolRelated || false,
    schoolObservations: item.participant?.schoolObservations || "",
    hasDisability: item.participant?.hasDisability || false,
    notes: item.participant?.notes || "",
  },

  guardian: {
    name: item.participant?.guardian?.name || "",
    surname: item.participant?.guardian?.surname || "",
    dni: item.participant?.guardian?.dni || "",
    phone: item.participant?.guardian?.phone || "",
    phone2: item.participant?.guardian?.phone2 || "",
    email: item.participant?.guardian?.email || "",
    email2: item.participant?.guardian?.email2 || "",
    relation: item.participant?.guardian?.relation || "",
  },

  address: {
    street: item.participant?.address?.street || "",
    city: item.participant?.address?.city || "",
    province: item.participant?.address?.province || "",
    postalCode: item.participant?.address?.postalCode || "",
  },

  allergies:
    item.participant?.allergies?.map((allergy) => ({
      description: allergy.description || "",
    })) || [],

  medications:
    item.participant?.medications?.map((medication) => ({
      description: medication.description || "",
    })) || [],

  authorizedPeople:
    item.participant?.authorizedPeople?.map((person) => ({
      name: person.name || "",
      surname: person.surname || "",
      dni: person.dni || "",
      phone: person.phone || "",
      relation: person.relation || "",
    })) || [],

  extraForm: {
    calledBefore: item.participant?.extraForm?.calledBefore ?? null,
    routines: item.participant?.extraForm?.routines || "",
    emotionalRegulation:
      item.participant?.extraForm?.emotionalRegulation || "",
    schoolingType: item.participant?.extraForm?.schoolingType || "",
    schoolingTypeOther:
      item.participant?.extraForm?.schoolingTypeOther || "",
    supportType: item.participant?.extraForm?.supportType || "",
    hygiene: item.participant?.extraForm?.hygiene || "",
    bladderControl: item.participant?.extraForm?.bladderControl || "",
    bowelControl: item.participant?.extraForm?.bowelControl || "",
    eatingSupport: item.participant?.extraForm?.eatingSupport || "",
    feedingAdaptation:
      item.participant?.extraForm?.feedingAdaptation || "",
    chokingEpisodes:
      item.participant?.extraForm?.chokingEpisodes ?? null,
    extraInfo: item.participant?.extraForm?.extraInfo || "",
  },

  disability: {
    functionalDiversity:
      item.participant?.extraForm?.disability?.functionalDiversity || "",
    disabilityDegree:
      item.participant?.extraForm?.disability?.disabilityDegree || "",
    dependencyDegree:
      item.participant?.extraForm?.disability?.dependencyDegree || "",
    wheelchair:
      item.participant?.extraForm?.disability?.wheelchair ?? null,
    mobilityAid:
      item.participant?.extraForm?.disability?.mobilityAid || "",
    walking: item.participant?.extraForm?.disability?.walking || "",
    running: item.participant?.extraForm?.disability?.running || "",
    climbing: item.participant?.extraForm?.disability?.climbing || "",
    crawling: item.participant?.extraForm?.disability?.crawling || "",
    jumping: item.participant?.extraForm?.disability?.jumping || "",
    stairs: item.participant?.extraForm?.disability?.stairs || "",
    outdoorMobility:
      item.participant?.extraForm?.disability?.outdoorMobility || "",
  },

  sports:
    item.participant?.extraForm?.sports?.length > 0
      ? item.participant.extraForm.sports.map((sport) => ({
          doesSport: sport.doesSport ?? null,
          favoriteSports: sport.favoriteSports || "",
          swimmingLevel: sport.swimmingLevel || "",
          socialPlay: sport.socialPlay || "",
          playFixation: sport.playFixation || "",
        }))
      : [
          {
            doesSport: null,
            favoriteSports: "",
            swimmingLevel: "",
            socialPlay: "",
            playFixation: "",
          },
        ],

  fears:
    item.participant?.extraForm?.fears?.length > 0
      ? item.participant.extraForm.fears.map((fear) => ({
          fears: fear.fears || "",
          copingMechanisms: fear.copingMechanisms || "",
        }))
      : [
          {
            fears: "",
            copingMechanisms: "",
          },
        ],

  communication:
    item.participant?.extraForm?.communication?.length > 0
      ? item.participant.extraForm.communication.map((communication) => ({
          oralLanguage: communication.oralLanguage || "",
          imitation: communication.imitation || "",
          writing: communication.writing || "",
          comprehension: communication.comprehension || "",
          comprehensionOther: communication.comprehensionOther || "",
          reading: communication.reading || "",
          readingOther: communication.readingOther || "",
          alternativeCommunication:
            communication.alternativeCommunication || "",
          alternativeCommunicationOther:
            communication.alternativeCommunicationOther || "",
        }))
      : [
          {
            oralLanguage: "",
            imitation: "",
            writing: "",
            comprehension: "",
            comprehensionOther: "",
            reading: "",
            readingOther: "",
            alternativeCommunication: "",
            alternativeCommunicationOther: "",
          },
        ],

  foodSensitivities:
    item.participant?.extraForm?.foodSensitivities?.map((item) => ({
      type: item.type,
      otherText: item.otherText || "",
    })) || [],
});

const emptyRegisterPaymentForm = {
  method: "BANK_TRANSFER",
  paidAt: "",
  notes: "",
};

const emptyExtraPaymentForm = {
  purpose: "OTHER",
  amount: "",
  paymentMode: "ONE_PAYMENT",
  concept: "",
  dueDate: "",
  notes: "",
  receiptRequested: false,
  isMandatory: true,
};

const getPaymentStatusLabel = (status) => {
  const labels = {
    PENDING: "Pendiente",
    PAID: "Pagado",
    OVERDUE: "Vencido",
    CANCELLED: "Cancelado",
  };

  return labels[status] || status;
};

const getPaymentTypeLabel = (type) => {
  const labels = {
    FULL: "Pago completo",
    FIRST_INSTALLMENT: "Primer plazo",
    SECOND_INSTALLMENT: "Segundo plazo",
    EXTRA: "Extra",
  };

  return labels[type] || type;
};

const getSignedUpStateLabel = (state) => {
  const labels = {
    PENDING: "Pendiente",
    ACCEPTED: "Aceptada",
    WAITLIST: "Lista de espera",
    CANCELLED: "Cancelada",
  };

  return labels[state] || state;
};

const mobilityOptions = [
  ["INDEPENDENT", "Independiente"],
  ["NEEDS_SUPERVISION", "Necesita supervisión"],
  ["NEEDS_PHYSICAL_SUPPORT_OR_AID", "Necesita apoyo físico o ayuda técnica"],
];

const foodSensitivityOptions = [
  ["SOLIDS", "Sólidos"],
  ["PUREES", "Purés"],
  ["SOUPS", "Sopas"],
  ["WATER_JUICES", "Agua o zumos"],
  ["YOGURTS", "Yogures"],
  ["FRUIT", "Fruta"],
  ["NONE", "Ninguna"],
  ["OTHER", "Otra"],
];

export default function AdminInscriptionDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const canEdit = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

  const [inscription, setInscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [savingDetails, setSavingDetails] = useState(false);

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [registerPaymentForm, setRegisterPaymentForm] = useState(
    emptyRegisterPaymentForm
  );
  const [registeringPayment, setRegisteringPayment] = useState(false);

  const [selectedWeekForExtra, setSelectedWeekForExtra] = useState(null);
  const [extraPaymentForm, setExtraPaymentForm] = useState(
    emptyExtraPaymentForm
  );
  const [creatingExtraPayment, setCreatingExtraPayment] = useState(false);

  const [updatingSignedUpKey, setUpdatingSignedUpKey] = useState("");

  const loadInscription = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getInscriptionById(id);

      setInscription(result);
      setEditForm(buildEditFormFromInscription(result));
    } catch (error) {
      setError(error.message || "Error al cargar inscripción");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInscription();
  }, [id]);

  const isEditing = editing && canEdit && editForm;

  const updateEditForm = (section, field, value) => {
    setEditForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  };

  const updateEditArrayItem = (section, index, field, value) => {
    setEditForm((current) => ({
      ...current,
      [section]: current[section].map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }));
  };

  const addEditArrayItem = (section, emptyItem) => {
    setEditForm((current) => ({
      ...current,
      [section]: [...current[section], emptyItem],
    }));
  };

  const removeEditArrayItem = (section, index) => {
    setEditForm((current) => ({
      ...current,
      [section]: current[section].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const toggleEditFoodSensitivity = (type) => {
    setEditForm((current) => {
      const exists = current.foodSensitivities.some((item) => item.type === type);

      if (exists) {
        return {
          ...current,
          foodSensitivities: current.foodSensitivities.filter(
            (item) => item.type !== type
          ),
        };
      }

      if (type === "NONE") {
        return {
          ...current,
          foodSensitivities: [
            {
              type: "NONE",
              otherText: "",
            },
          ],
        };
      }

      return {
        ...current,
        foodSensitivities: [
          ...current.foodSensitivities.filter((item) => item.type !== "NONE"),
          {
            type,
            otherText: "",
          },
        ],
      };
    });
  };

  const updateEditFoodSensitivityOther = (value) => {
    setEditForm((current) => ({
      ...current,
      foodSensitivities: current.foodSensitivities.map((item) =>
        item.type === "OTHER"
          ? {
              ...item,
              otherText: value,
            }
          : item
      ),
    }));
  };

  const handleSaveDetails = async () => {
    try {
      setSavingDetails(true);
      setError("");
      setSuccess("");

      const result = await updateInscriptionDetails(inscription.id, editForm);

      setInscription(result.inscription);
      setEditForm(buildEditFormFromInscription(result.inscription));
      setEditing(false);
      setSuccess("Datos actualizados correctamente");
    } catch (error) {
      setError(error.message || "Error al guardar los cambios");
    } finally {
      setSavingDetails(false);
    }
  };

  const copyExtraFormLink = async () => {
    try {
      const participantId = inscription?.participant?.id;

      if (!participantId) return;

      const result = await createExtraFormToken(participantId);

      const url = `${window.location.origin}/extraform/public/${result.token}`;

      await navigator.clipboard.writeText(url);

      setCopyMessage("Enlace seguro del ExtraForm copiado");
      setSuccess("");
      setError("");
    } catch (error) {
      setCopyMessage(error.message || "Error al generar enlace del ExtraForm");
    }
  };

  const openRegisterPaymentForm = (payment) => {
    setSelectedPayment(payment);
    setRegisterPaymentForm(emptyRegisterPaymentForm);
    setSelectedWeekForExtra(null);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateRegisterPaymentForm = (field, value) => {
    setRegisterPaymentForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleRegisterPayment = async (event) => {
    event.preventDefault();

    if (!selectedPayment) {
      setError("Selecciona un pago antes de registrarlo");
      return;
    }

    try {
      setRegisteringPayment(true);
      setError("");
      setSuccess("");

      await registerPayment(selectedPayment.id, {
        method: registerPaymentForm.method,
        paidAt: registerPaymentForm.paidAt || null,
        notes: registerPaymentForm.notes || null,
      });

      setSuccess("Pago registrado correctamente");
      setSelectedPayment(null);
      setRegisterPaymentForm(emptyRegisterPaymentForm);

      await loadInscription();
    } catch (error) {
      setError(error.message || "Error al registrar el pago");
    } finally {
      setRegisteringPayment(false);
    }
  };

  const openExtraPaymentForm = (signedUpWeek) => {
    setSelectedWeekForExtra(signedUpWeek);
    setExtraPaymentForm(emptyExtraPaymentForm);
    setSelectedPayment(null);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateExtraPaymentForm = (field, value) => {
    setExtraPaymentForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateExtraPayment = async (event) => {
    event.preventDefault();

    if (!selectedWeekForExtra) {
      setError("Selecciona una semana antes de crear el pago extra");
      return;
    }

    if (!extraPaymentForm.amount || Number(extraPaymentForm.amount) <= 0) {
      setError("El importe del pago extra debe ser mayor que 0");
      return;
    }

    try {
      setCreatingExtraPayment(true);
      setError("");
      setSuccess("");

      await createExtraPayment({
        inscriptionId: Number(inscription.id),
        weekId: Number(selectedWeekForExtra.weekId),
        purpose: extraPaymentForm.purpose,
        amount: Number(extraPaymentForm.amount),
        paymentMode: extraPaymentForm.paymentMode,
        concept: extraPaymentForm.concept || null,
        dueDate: extraPaymentForm.dueDate || null,
        notes: extraPaymentForm.notes || null,
        receiptRequested: extraPaymentForm.receiptRequested,
        isMandatory: extraPaymentForm.isMandatory,
      });

      setSuccess("Pago extra creado correctamente");
      setSelectedWeekForExtra(null);
      setExtraPaymentForm(emptyExtraPaymentForm);

      await loadInscription();
    } catch (error) {
      setError(error.message || "Error al crear el pago extra");
    } finally {
      setCreatingExtraPayment(false);
    }
  };

  const handleChangeSignedUpStatus = async ({
    signedUpWeek,
    newState,
    paymentModeForNewReservation,
  }) => {
    const key = `${signedUpWeek.inscriptionId}-${signedUpWeek.weekId}-${newState}`;

    try {
      setUpdatingSignedUpKey(key);
      setError("");
      setSuccess("");

      await updateSignedUpStatus({
        inscriptionId: signedUpWeek.inscriptionId,
        weekId: signedUpWeek.weekId,
        newState,
        paymentModeForNewReservation,
      });

      setSuccess("Estado de la reserva actualizado correctamente");
      await loadInscription();
    } catch (error) {
      setError(error.message || "Error al actualizar la reserva semanal");
    } finally {
      setUpdatingSignedUpKey("");
    }
  };

  if (loading) return <p>Cargando inscripción...</p>;
  if (error && !inscription) return <p className="form-error">{error}</p>;
  if (!inscription) return <p>No se encontró la inscripción.</p>;

  const participant = inscription.participant;
  const extraForm = participant?.extraForm;
  const disability = extraForm?.disability;
  const communication = extraForm?.communication?.[0];
  const sport = extraForm?.sports?.[0];
  const fear = extraForm?.fears?.[0];
  const foodSensitivities = extraForm?.foodSensitivities || [];
  const guardian = participant?.guardian;
  const address = participant?.address;
  const allergies = participant?.allergies || [];
  const medications = participant?.medications || [];
  const authorizedPeople = participant?.authorizedPeople || [];
  const payments = inscription.payments || [];
  const signedUpWeeks = inscription.signedUpWeeks || [];

  const hasExtraFormContent = Boolean(
  extraForm &&
    (extraForm.routines ||
      extraForm.emotionalRegulation ||
      extraForm.schoolingType ||
      extraForm.supportType ||
      extraForm.hygiene ||
      extraForm.extraInfo ||
      (extraForm.communication?.length ?? 0) > 0 ||
      (extraForm.sports?.length ?? 0) > 0 ||
      (extraForm.fears?.length ?? 0) > 0 ||
      (extraForm.foodSensitivities?.length ?? 0) > 0)
);

const shouldShowExtraForm = isEditing || hasExtraFormContent;

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

        <h1>
          {participant?.name} {participant?.surname}
        </h1>

        <p>Detalle completo de la inscripción.</p>
      </div>

      {canEdit && (
        <div className="form-actions">
          {!editing ? (
            <Button type="button" onClick={() => setEditing(true)}>
              Editar datos
            </Button>
          ) : (
            <>
              <Button
                type="button"
                disabled={savingDetails}
                onClick={handleSaveDetails}
              >
                {savingDetails ? "Guardando..." : "Guardar cambios"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditing(false);
                  setEditForm(buildEditFormFromInscription(inscription));
                }}
              >
                Cancelar
              </Button>
            </>
          )}
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}

      {selectedPayment && (
        <Card>
          <h2>Registrar pago</h2>

          <p>
            Pago seleccionado: <strong>#{selectedPayment.id}</strong> —{" "}
            <strong>{formatMoney(selectedPayment.amount)}</strong> —{" "}
            {getPaymentTypeLabel(selectedPayment.paymentType)}
          </p>

          <form onSubmit={handleRegisterPayment} className="form-grid">
            <Select
              id="detail-payment-method"
              label="Método de pago"
              required
              value={registerPaymentForm.method}
              onChange={(event) =>
                updateRegisterPaymentForm("method", event.target.value)
              }
            >
              <option value="BANK_TRANSFER">Transferencia bancaria</option>
              <option value="CASH">Efectivo</option>
              <option value="CARD">Tarjeta</option>
              <option value="BIZUM">Bizum</option>
              <option value="OTHER">Otro</option>
            </Select>

            <Input
              id="detail-payment-paid-at"
              label="Fecha de pago"
              type="date"
              value={registerPaymentForm.paidAt}
              onChange={(event) =>
                updateRegisterPaymentForm("paidAt", event.target.value)
              }
            />

            <Textarea
              id="detail-payment-notes"
              label="Notas"
              value={registerPaymentForm.notes}
              onChange={(event) =>
                updateRegisterPaymentForm("notes", event.target.value)
              }
            />

            <div className="form-actions field-full">
              <Button type="submit" disabled={registeringPayment}>
                {registeringPayment ? "Registrando..." : "Registrar como pagado"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedPayment(null)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {selectedWeekForExtra && (
        <Card>
          <h2>Crear pago extra</h2>

          <p>
            Semana seleccionada:{" "}
            <strong>Semana {selectedWeekForExtra.week?.number}</strong>
          </p>

          <form onSubmit={handleCreateExtraPayment} className="form-grid">
            <Select
              id="detail-extra-purpose"
              label="Concepto interno"
              required
              value={extraPaymentForm.purpose}
              onChange={(event) =>
                updateExtraPaymentForm("purpose", event.target.value)
              }
            >
              <option value="BREAKFAST">Desayuno</option>
              <option value="LUNCH">Comedor</option>
              <option value="EARLY_RISE">Madrugadores</option>
              <option value="OTHER">Otro</option>
            </Select>

            <Input
              id="detail-extra-amount"
              label="Importe bruto"
              type="number"
              step="0.01"
              min="0"
              required
              value={extraPaymentForm.amount}
              onChange={(event) =>
                updateExtraPaymentForm("amount", event.target.value)
              }
            />

            <Select
              id="detail-extra-payment-mode"
              label="Modalidad"
              required
              value={extraPaymentForm.paymentMode}
              onChange={(event) =>
                updateExtraPaymentForm("paymentMode", event.target.value)
              }
            >
              <option value="ONE_PAYMENT">Pago único</option>
              <option value="TWO_PAYMENTS">Dos pagos</option>
            </Select>

            <Input
              id="detail-extra-due-date"
              label="Fecha límite"
              type="date"
              value={extraPaymentForm.dueDate}
              onChange={(event) =>
                updateExtraPaymentForm("dueDate", event.target.value)
              }
            />

            <Input
              id="detail-extra-concept"
              label="Concepto visible"
              value={extraPaymentForm.concept}
              onChange={(event) =>
                updateExtraPaymentForm("concept", event.target.value)
              }
            />

            <Textarea
              id="detail-extra-notes"
              label="Notas"
              value={extraPaymentForm.notes}
              onChange={(event) =>
                updateExtraPaymentForm("notes", event.target.value)
              }
            />

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={extraPaymentForm.receiptRequested}
                onChange={(event) =>
                  updateExtraPaymentForm(
                    "receiptRequested",
                    event.target.checked
                  )
                }
              />
              Solicita recibo
            </label>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={extraPaymentForm.isMandatory}
                onChange={(event) =>
                  updateExtraPaymentForm("isMandatory", event.target.checked)
                }
              />
              Pago obligatorio
            </label>

            <div className="form-actions field-full">
              <Button type="submit" disabled={creatingExtraPayment}>
                {creatingExtraPayment ? "Creando..." : "Crear pago extra"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedWeekForExtra(null)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <h2>Resumen económico</h2>

        <div className="detail-grid">
          <DetailItem label="Modalidad de pago">
            <strong>{inscription.paymentMode}</strong>
          </DetailItem>
          <DetailItem label="Total esperado">
            <strong>{formatMoney(inscription.totalAmountExpected)}</strong>
          </DetailItem>
          <DetailItem label="Total pagado">
            <strong>{formatMoney(inscription.totalAmountPaid)}</strong>
          </DetailItem>
          <DetailItem label="Total pendiente">
            <strong>{formatMoney(inscription.totalAmountPending)}</strong>
          </DetailItem>
          <DetailItem label="Estado global">
            <strong>{inscription.globalStatus}</strong>
          </DetailItem>
        </div>
      </Card>

      <Card>
        <h2>Pagos</h2>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo</th>
                <th>Importe</th>
                <th>Estado</th>
                <th>Método</th>
                <th>Concepto</th>
                <th>Fecha límite</th>
                <th>Fecha pago</th>
                <th>Observaciones</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.id}</td>
                  <td>{getPaymentTypeLabel(payment.paymentType)}</td>
                  <td>{formatMoney(payment.amount)}</td>
                  <td>{getPaymentStatusLabel(payment.status)}</td>
                  <td>{payment.method || "-"}</td>
                  <td>{payment.concept || "-"}</td>
                  <td>{formatDate(payment.dueDate)}</td>
                  <td>{formatDate(payment.paidAt)}</td>
                  <td>{payment.notes || "-"}</td>
                  <td>
                    <div className="table-actions">
                      {payment.status !== "PAID" &&
                        payment.status !== "CANCELLED" && (
                          <Button
                            type="button"
                            onClick={() => openRegisterPaymentForm(payment)}
                          >
                            Registrar pago
                          </Button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}

              {payments.length === 0 && (
                <tr>
                  <td colSpan="10">No hay pagos asociados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2>Datos de inscripción</h2>

        <div className="detail-grid">
          <DetailItem label="Campamento">
            <strong>
              {inscription.summerCamp
                ? `${inscription.summerCamp.name} ${inscription.summerCamp.year}`
                : "-"}
            </strong>
          </DetailItem>

          <DetailItem label="Fecha inscripción">
            <strong>{formatDate(inscription.inscriptionDate)}</strong>
          </DetailItem>

          <DetailItem label="Estado global">
            <strong>{inscription.globalStatus}</strong>
          </DetailItem>

          <DetailItem label="Modalidad de pago">
            {isEditing ? (
              <Select
                id="edit-payment-mode"
                value={editForm.inscription.paymentMode}
                onChange={(event) =>
                  updateEditForm(
                    "inscription",
                    "paymentMode",
                    event.target.value
                  )
                }
              >
                <option value="ONE_PAYMENT">Pago único</option>
                <option value="TWO_PAYMENTS">Dos pagos</option>
              </Select>
            ) : (
              <strong>{inscription.paymentMode}</strong>
            )}
          </DetailItem>

          <DetailItem label="Solicita factura">
            {isEditing ? (
              <Select
                id="edit-invoice-requested"
                value={booleanSelectValue(editForm.inscription.invoiceRequested)}
                onChange={(event) =>
                  updateEditForm(
                    "inscription",
                    "invoiceRequested",
                    event.target.value === "true"
                  )
                }
              >
                <option value="true">SI</option>
                <option value="false">NO</option>
              </Select>
            ) : (
              <strong>{formatBoolean(inscription.invoiceRequested)}</strong>
            )}
          </DetailItem>

          {(isEditing || inscription.invoiceRequested) && (
            <>
              <DetailItem label="Nombre factura">
                {isEditing ? (
                  <Input
                    id="edit-invoice-name"
                    value={editForm.inscription.invoiceName}
                    onChange={(event) =>
                      updateEditForm(
                        "inscription",
                        "invoiceName",
                        event.target.value
                      )
                    }
                  />
                ) : (
                  <strong>{formatValue(inscription.invoiceName)}</strong>
                )}
              </DetailItem>

              <DetailItem label="DNI/NIE factura">
                {isEditing ? (
                  <Input
                    id="edit-invoice-dni"
                    value={editForm.inscription.invoiceDni}
                    onChange={(event) =>
                      updateEditForm(
                        "inscription",
                        "invoiceDni",
                        event.target.value
                      )
                    }
                  />
                ) : (
                  <strong>{formatValue(inscription.invoiceDni)}</strong>
                )}
              </DetailItem>
            </>
          )}

          <DetailItem label="Acepta tratamiento de datos">
            {isEditing ? (
              <Select
                id="edit-data-treatment"
                value={booleanSelectValue(
                  editForm.inscription.dataTreatmentAccepted
                )}
                onChange={(event) =>
                  updateEditForm(
                    "inscription",
                    "dataTreatmentAccepted",
                    event.target.value === "true"
                  )
                }
              >
                <option value="true">SI</option>
                <option value="false">NO</option>
              </Select>
            ) : (
              <strong>
                {formatBoolean(inscription.dataTreatmentAccepted)}
              </strong>
            )}
          </DetailItem>

          <DetailItem label="Acepta salidas">
            {isEditing ? (
              <Select
                id="edit-outings"
                value={booleanSelectValue(editForm.inscription.outingsAccepted)}
                onChange={(event) =>
                  updateEditForm(
                    "inscription",
                    "outingsAccepted",
                    event.target.value === "true"
                  )
                }
              >
                <option value="true">SI</option>
                <option value="false">NO</option>
              </Select>
            ) : (
              <strong>{formatBoolean(inscription.outingsAccepted)}</strong>
            )}
          </DetailItem>

          <DetailItem label="Acepta imágenes">
            {isEditing ? (
              <Select
                id="edit-images"
                value={booleanSelectValue(editForm.inscription.imagesAccepted)}
                onChange={(event) =>
                  updateEditForm(
                    "inscription",
                    "imagesAccepted",
                    event.target.value === "true"
                  )
                }
              >
                <option value="true">SI</option>
                <option value="false">NO</option>
              </Select>
            ) : (
              <strong>{formatBoolean(inscription.imagesAccepted)}</strong>
            )}
          </DetailItem>
        </div>
      </Card>

      <Card>
        <h2>Datos del participante</h2>

        <div className="detail-grid">
          <DetailItem label="Nombre">
            {isEditing ? (
              <Input
                id="edit-participant-name"
                value={editForm.participant.name}
                onChange={(event) =>
                  updateEditForm("participant", "name", event.target.value)
                }
              />
            ) : (
              <strong>{participant?.name || "-"}</strong>
            )}
          </DetailItem>

          <DetailItem label="Apellidos">
            {isEditing ? (
              <Input
                id="edit-participant-surname"
                value={editForm.participant.surname}
                onChange={(event) =>
                  updateEditForm("participant", "surname", event.target.value)
                }
              />
            ) : (
              <strong>{participant?.surname || "-"}</strong>
            )}
          </DetailItem>

          <DetailItem label="Fecha nacimiento">
            {isEditing ? (
              <Input
                id="edit-participant-birthdate"
                type="date"
                value={editForm.participant.birthdate}
                onChange={(event) =>
                  updateEditForm(
                    "participant",
                    "birthdate",
                    event.target.value
                  )
                }
              />
            ) : (
              <strong>{formatDate(participant?.birthdate)}</strong>
            )}
          </DetailItem>

          <DetailItem label="Género">
            {isEditing ? (
              <Input
                id="edit-participant-gender"
                value={editForm.participant.gender}
                onChange={(event) =>
                  updateEditForm("participant", "gender", event.target.value)
                }
              />
            ) : (
              <strong>{formatValue(participant?.gender)}</strong>
            )}
          </DetailItem>

          <DetailItem label="Nº tarjeta sanitaria">
            {isEditing ? (
              <Input
                id="edit-health-card"
                value={editForm.participant.healthCard}
                onChange={(event) =>
                  updateEditForm(
                    "participant",
                    "healthCard",
                    event.target.value
                  )
                }
              />
            ) : (
              <strong>{formatValue(participant?.healthCard)}</strong>
            )}
          </DetailItem>

          <DetailItem label="Hermanos">
            {isEditing ? (
              <Select
                id="edit-siblings"
                value={booleanSelectValue(editForm.participant.siblings)}
                onChange={(event) =>
                  updateEditForm(
                    "participant",
                    "siblings",
                    event.target.value === "true"
                  )
                }
              >
                <option value="true">SI</option>
                <option value="false">NO</option>
              </Select>
            ) : (
              <strong>{formatBoolean(participant?.siblings)}</strong>
            )}
          </DetailItem>

          <DetailItem label="Repite campamento">
            {isEditing ? (
              <Select
                id="edit-repeated-before"
                value={booleanSelectValue(
                  editForm.participant.repeatedBefore
                )}
                onChange={(event) =>
                  updateEditForm(
                    "participant",
                    "repeatedBefore",
                    event.target.value === "true"
                  )
                }
              >
                <option value="true">SI</option>
                <option value="false">NO</option>
              </Select>
            ) : (
              <strong>{formatBoolean(participant?.repeatedBefore)}</strong>
            )}
          </DetailItem>

          <DetailItem label="Alumno/a del cole">
            {isEditing ? (
              <Select
                id="edit-school-related"
                value={booleanSelectValue(
                  editForm.participant.schoolRelated
                )}
                onChange={(event) =>
                  updateEditForm(
                    "participant",
                    "schoolRelated",
                    event.target.value === "true"
                  )
                }
              >
                <option value="true">SI</option>
                <option value="false">NO</option>
              </Select>
            ) : (
              <strong>{formatBoolean(participant?.schoolRelated)}</strong>
            )}
          </DetailItem>

          <DetailItem label="Tiene discapacidad">
            {isEditing ? (
              <Select
                id="edit-has-disability"
                value={booleanSelectValue(
                  editForm.participant.hasDisability
                )}
                onChange={(event) =>
                  updateEditForm(
                    "participant",
                    "hasDisability",
                    event.target.value === "true"
                  )
                }
              >
                <option value="true">SI</option>
                <option value="false">NO</option>
              </Select>
            ) : (
              <strong>{formatBoolean(participant?.hasDisability)}</strong>
            )}
          </DetailItem>
        </div>
      </Card>

      <Card>
        <h2>Tutor/a y contacto</h2>

        <div className="detail-grid">
          <DetailItem label="Nombre tutor/a">
            {isEditing ? (
              <Input
                id="edit-guardian-name"
                value={editForm.guardian.name}
                onChange={(event) =>
                  updateEditForm("guardian", "name", event.target.value)
                }
              />
            ) : (
              <strong>{guardian?.name || "-"}</strong>
            )}
          </DetailItem>

          <DetailItem label="Apellidos tutor/a">
            {isEditing ? (
              <Input
                id="edit-guardian-surname"
                value={editForm.guardian.surname}
                onChange={(event) =>
                  updateEditForm("guardian", "surname", event.target.value)
                }
              />
            ) : (
              <strong>{guardian?.surname || "-"}</strong>
            )}
          </DetailItem>

          <DetailItem label="DNI/NIE tutor/a">
            {isEditing ? (
              <Input
                id="edit-guardian-dni"
                value={editForm.guardian.dni}
                onChange={(event) =>
                  updateEditForm("guardian", "dni", event.target.value)
                }
              />
            ) : (
              <strong>{formatValue(guardian?.dni)}</strong>
            )}
          </DetailItem>

          <DetailItem label="Relación">
            {isEditing ? (
              <Input
                id="edit-guardian-relation"
                value={editForm.guardian.relation}
                onChange={(event) =>
                  updateEditForm("guardian", "relation", event.target.value)
                }
              />
            ) : (
              <strong>{formatValue(guardian?.relation)}</strong>
            )}
          </DetailItem>

          <DetailItem label="Teléfono">
            {isEditing ? (
              <Input
                id="edit-guardian-phone"
                value={editForm.guardian.phone}
                onChange={(event) =>
                  updateEditForm("guardian", "phone", event.target.value)
                }
              />
            ) : (
              <strong>{formatValue(guardian?.phone)}</strong>
            )}
          </DetailItem>

          <DetailItem label="Teléfono 2">
            {isEditing ? (
              <Input
                id="edit-guardian-phone2"
                value={editForm.guardian.phone2}
                onChange={(event) =>
                  updateEditForm("guardian", "phone2", event.target.value)
                }
              />
            ) : (
              <strong>{formatValue(guardian?.phone2)}</strong>
            )}
          </DetailItem>

          <DetailItem label="Email">
            {isEditing ? (
              <Input
                id="edit-guardian-email"
                value={editForm.guardian.email}
                onChange={(event) =>
                  updateEditForm("guardian", "email", event.target.value)
                }
              />
            ) : (
              <strong>{formatValue(guardian?.email)}</strong>
            )}
          </DetailItem>

          <DetailItem label="Email 2">
            {isEditing ? (
              <Input
                id="edit-guardian-email2"
                value={editForm.guardian.email2}
                onChange={(event) =>
                  updateEditForm("guardian", "email2", event.target.value)
                }
              />
            ) : (
              <strong>{formatValue(guardian?.email2)}</strong>
            )}
          </DetailItem>
        </div>
      </Card>

      <Card>
        <h2>Dirección</h2>

        <div className="detail-grid">
          <DetailItem label="Dirección">
            {isEditing ? (
              <Input
                id="edit-address-street"
                value={editForm.address.street}
                onChange={(event) =>
                  updateEditForm("address", "street", event.target.value)
                }
              />
            ) : (
              <strong>{formatValue(address?.street)}</strong>
            )}
          </DetailItem>

          <DetailItem label="Ciudad">
            {isEditing ? (
              <Input
                id="edit-address-city"
                value={editForm.address.city}
                onChange={(event) =>
                  updateEditForm("address", "city", event.target.value)
                }
              />
            ) : (
              <strong>{formatValue(address?.city)}</strong>
            )}
          </DetailItem>

          <DetailItem label="Provincia">
            {isEditing ? (
              <Input
                id="edit-address-province"
                value={editForm.address.province}
                onChange={(event) =>
                  updateEditForm("address", "province", event.target.value)
                }
              />
            ) : (
              <strong>{formatValue(address?.province)}</strong>
            )}
          </DetailItem>

          <DetailItem label="Código postal">
            {isEditing ? (
              <Input
                id="edit-address-postal-code"
                value={editForm.address.postalCode}
                onChange={(event) =>
                  updateEditForm("address", "postalCode", event.target.value)
                }
              />
            ) : (
              <strong>{formatValue(address?.postalCode)}</strong>
            )}
          </DetailItem>
        </div>
      </Card>

      {shouldShowExtraForm && (
        <>
          <Card>
            <h2>Formulario extra: información general</h2>

            <div className="detail-grid">
              <DetailItem label="¿Hemos hablado antes con la familia?">
                {isEditing ? (
                  <Select
                    id="edit-extra-called-before"
                    value={nullableBooleanSelectValue(
                      editForm.extraForm.calledBefore
                    )}
                    onChange={(event) =>
                      updateEditForm(
                        "extraForm",
                        "calledBefore",
                        selectValueToNullableBoolean(event.target.value)
                      )
                    }
                  >
                    <option value="">Sin indicar</option>
                    <option value="true">SI</option>
                    <option value="false">NO</option>
                  </Select>
                ) : (
                  <strong>{formatBoolean(extraForm?.calledBefore)}</strong>
                )}
              </DetailItem>

              <DetailItem label="Rutinas importantes">
                {isEditing ? (
                  <Textarea
                    id="edit-extra-routines"
                    value={editForm.extraForm.routines}
                    onChange={(event) =>
                      updateEditForm("extraForm", "routines", event.target.value)
                    }
                  />
                ) : (
                  <strong>{formatValue(extraForm?.routines)}</strong>
                )}
              </DetailItem>

              <DetailItem label="Regulación emocional">
                {isEditing ? (
                  <Textarea
                    id="edit-extra-emotional-regulation"
                    value={editForm.extraForm.emotionalRegulation}
                    onChange={(event) =>
                      updateEditForm(
                        "extraForm",
                        "emotionalRegulation",
                        event.target.value
                      )
                    }
                  />
                ) : (
                  <strong>{formatValue(extraForm?.emotionalRegulation)}</strong>
                )}
              </DetailItem>

              <DetailItem label="Tipo de escolarización">
                {isEditing ? (
                  <Select
                    id="edit-extra-schooling-type"
                    value={editForm.extraForm.schoolingType}
                    onChange={(event) =>
                      updateEditForm(
                        "extraForm",
                        "schoolingType",
                        event.target.value
                      )
                    }
                  >
                    <option value="">Sin indicar</option>
                    <option value="ORDINARY">Ordinaria</option>
                    <option value="SPECIAL">Especial</option>
                    <option value="OTHER">Otra</option>
                  </Select>
                ) : (
                  <strong>{formatValue(extraForm?.schoolingType)}</strong>
                )}
              </DetailItem>

              {(isEditing || extraForm?.schoolingType === "OTHER") && (
                <DetailItem label="Otra escolarización">
                  {isEditing ? (
                    <Input
                      id="edit-extra-schooling-type-other"
                      value={editForm.extraForm.schoolingTypeOther}
                      onChange={(event) =>
                        updateEditForm(
                          "extraForm",
                          "schoolingTypeOther",
                          event.target.value
                        )
                      }
                    />
                  ) : (
                    <strong>{formatValue(extraForm?.schoolingTypeOther)}</strong>
                  )}
                </DetailItem>
              )}

              <DetailItem label="Tipo de apoyo">
                {isEditing ? (
                  <Select
                    id="edit-extra-support-type"
                    value={editForm.extraForm.supportType}
                    onChange={(event) =>
                      updateEditForm(
                        "extraForm",
                        "supportType",
                        event.target.value
                      )
                    }
                  >
                    <option value="">Sin indicar</option>
                    <option value="NONE">Sin apoyo</option>
                    <option value="INTERMITTENT">Intermitente</option>
                    <option value="LIMITED_EXTENSIVE">Limitado/extenso</option>
                    <option value="GENERALIZED_CONSTANT">
                      Generalizado/constante
                    </option>
                  </Select>
                ) : (
                  <strong>{formatValue(extraForm?.supportType)}</strong>
                )}
              </DetailItem>
            </div>
          </Card>

          <Card>
            <h2>Formulario extra: autonomía y alimentación</h2>

            <div className="detail-grid">
              <DetailItem label="Higiene">
                {isEditing ? (
                  <Select
                    id="edit-extra-hygiene"
                    value={editForm.extraForm.hygiene}
                    onChange={(event) =>
                      updateEditForm("extraForm", "hygiene", event.target.value)
                    }
                  >
                    <option value="">Sin indicar</option>
                    <option value="INDEPENDENT">Independiente</option>
                    <option value="NEEDS_SUPERVISION">Necesita supervisión</option>
                    <option value="NEEDS_PHYSICAL_SUPPORT">
                      Necesita apoyo físico
                    </option>
                  </Select>
                ) : (
                  <strong>{formatValue(extraForm?.hygiene)}</strong>
                )}
              </DetailItem>

              {["bladderControl", "bowelControl"].map((field) => (
                <DetailItem
                  key={field}
                  label={
                    field === "bladderControl"
                      ? "Control vejiga"
                      : "Control intestino"
                  }
                >
                  {isEditing ? (
                    <Select
                      id={`edit-extra-${field}`}
                      value={editForm.extraForm[field]}
                      onChange={(event) =>
                        updateEditForm("extraForm", field, event.target.value)
                      }
                    >
                      <option value="">Sin indicar</option>
                      <option value="GOES_ALONE">Va solo/a</option>
                      <option value="ASKS_OR_WARNS">Lo pide o avisa</option>
                      <option value="MUST_BE_ASKED">Hay que preguntarle</option>
                      <option value="USES_DIAPER">Usa pañal</option>
                    </Select>
                  ) : (
                    <strong>{formatValue(extraForm?.[field])}</strong>
                  )}
                </DetailItem>
              ))}

              <DetailItem label="Apoyo comida">
                {isEditing ? (
                  <Select
                    id="edit-extra-eating-support"
                    value={editForm.extraForm.eatingSupport}
                    onChange={(event) =>
                      updateEditForm(
                        "extraForm",
                        "eatingSupport",
                        event.target.value
                      )
                    }
                  >
                    <option value="">Sin indicar</option>
                    <option value="INDEPENDENT">Independiente</option>
                    <option value="NEEDS_SUPERVISION">Necesita supervisión</option>
                    <option value="NEEDS_INTERMITTENT_SUPPORT">
                      Necesita apoyo intermitente
                    </option>
                    <option value="NEEDS_CONTINUOUS_SUPPORT">
                      Necesita apoyo continuo
                    </option>
                  </Select>
                ) : (
                  <strong>{formatValue(extraForm?.eatingSupport)}</strong>
                )}
              </DetailItem>

              <DetailItem label="Adaptaciones alimentación">
                {isEditing ? (
                  <Textarea
                    id="edit-extra-feeding-adaptation"
                    value={editForm.extraForm.feedingAdaptation}
                    onChange={(event) =>
                      updateEditForm(
                        "extraForm",
                        "feedingAdaptation",
                        event.target.value
                      )
                    }
                  />
                ) : (
                  <strong>{formatValue(extraForm?.feedingAdaptation)}</strong>
                )}
              </DetailItem>

              <DetailItem label="Atragantamientos">
                {isEditing ? (
                  <Select
                    id="edit-extra-choking-episodes"
                    value={nullableBooleanSelectValue(
                      editForm.extraForm.chokingEpisodes
                    )}
                    onChange={(event) =>
                      updateEditForm(
                        "extraForm",
                        "chokingEpisodes",
                        selectValueToNullableBoolean(event.target.value)
                      )
                    }
                  >
                    <option value="">Sin indicar</option>
                    <option value="true">SI</option>
                    <option value="false">NO</option>
                  </Select>
                ) : (
                  <strong>{formatBoolean(extraForm?.chokingEpisodes)}</strong>
                )}
              </DetailItem>
            </div>
          </Card>

          <Card>
            <h2>Formulario extra: discapacidad y movilidad</h2>

            <div className="detail-grid">
              <DetailItem label="Diversidad funcional">
                {isEditing ? (
                  <Input
                    id="edit-disability-functional-diversity"
                    value={editForm.disability.functionalDiversity}
                    onChange={(event) =>
                      updateEditForm(
                        "disability",
                        "functionalDiversity",
                        event.target.value
                      )
                    }
                  />
                ) : (
                  <strong>{formatValue(disability?.functionalDiversity)}</strong>
                )}
              </DetailItem>

              <DetailItem label="Grado discapacidad">
                {isEditing ? (
                  <Input
                    id="edit-disability-degree"
                    value={editForm.disability.disabilityDegree}
                    onChange={(event) =>
                      updateEditForm(
                        "disability",
                        "disabilityDegree",
                        event.target.value
                      )
                    }
                  />
                ) : (
                  <strong>{formatValue(disability?.disabilityDegree)}</strong>
                )}
              </DetailItem>

              <DetailItem label="Grado dependencia">
                {isEditing ? (
                  <Input
                    id="edit-dependency-degree"
                    value={editForm.disability.dependencyDegree}
                    onChange={(event) =>
                      updateEditForm(
                        "disability",
                        "dependencyDegree",
                        event.target.value
                      )
                    }
                  />
                ) : (
                  <strong>{formatValue(disability?.dependencyDegree)}</strong>
                )}
              </DetailItem>

              <DetailItem label="Silla de ruedas">
                {isEditing ? (
                  <Select
                    id="edit-disability-wheelchair"
                    value={nullableBooleanSelectValue(editForm.disability.wheelchair)}
                    onChange={(event) =>
                      updateEditForm(
                        "disability",
                        "wheelchair",
                        selectValueToNullableBoolean(event.target.value)
                      )
                    }
                  >
                    <option value="">Sin indicar</option>
                    <option value="true">SI</option>
                    <option value="false">NO</option>
                  </Select>
                ) : (
                  <strong>{formatBoolean(disability?.wheelchair)}</strong>
                )}
              </DetailItem>

              <DetailItem label="Ayuda movilidad">
                {isEditing ? (
                  <Input
                    id="edit-disability-mobility-aid"
                    value={editForm.disability.mobilityAid}
                    onChange={(event) =>
                      updateEditForm(
                        "disability",
                        "mobilityAid",
                        event.target.value
                      )
                    }
                  />
                ) : (
                  <strong>{formatValue(disability?.mobilityAid)}</strong>
                )}
              </DetailItem>

              {[
                ["walking", "Caminar"],
                ["running", "Correr"],
                ["climbing", "Subir obstáculos"],
                ["crawling", "Gatear"],
                ["jumping", "Saltar"],
                ["stairs", "Escaleras"],
                ["outdoorMobility", "Movilidad exterior"],
              ].map(([field, label]) => (
                <DetailItem key={field} label={label}>
                  {isEditing ? (
                    <Select
                      id={`edit-disability-${field}`}
                      value={editForm.disability[field]}
                      onChange={(event) =>
                        updateEditForm("disability", field, event.target.value)
                      }
                    >
                      <option value="">Sin indicar</option>
                      {mobilityOptions.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <strong>{formatValue(disability?.[field])}</strong>
                  )}
                </DetailItem>
              ))}
            </div>
          </Card>

          <Card>
            <h2>Formulario extra: comunicación</h2>

            <div className="detail-grid">
              <DetailItem label="Lenguaje oral">
                {isEditing ? (
                  <Select
                    id="edit-communication-oral-language"
                    value={editForm.communication[0]?.oralLanguage || ""}
                    onChange={(event) =>
                      updateEditArrayItem(
                        "communication",
                        0,
                        "oralLanguage",
                        event.target.value
                      )
                    }
                  >
                    <option value="">Sin indicar</option>
                    <option value="SOUNDS">Sonidos</option>
                    <option value="SOME_WORDS">Algunas palabras</option>
                    <option value="PHRASES">Frases</option>
                    <option value="FLUENT">Fluido</option>
                    <option value="DOES_NOT_SPEAK">No habla</option>
                  </Select>
                ) : (
                  <strong>{formatValue(communication?.oralLanguage)}</strong>
                )}
              </DetailItem>

              <DetailItem label="Imitación">
                {isEditing ? (
                  <Select
                    id="edit-communication-imitation"
                    value={editForm.communication[0]?.imitation || ""}
                    onChange={(event) =>
                      updateEditArrayItem(
                        "communication",
                        0,
                        "imitation",
                        event.target.value
                      )
                    }
                  >
                    <option value="">Sin indicar</option>
                    <option value="IMITATES_GESTURES">Imita gestos</option>
                    <option value="IMITATES_COMPLEX_ACTIONS">
                      Imita acciones complejas
                    </option>
                    <option value="IMITATES_SOUNDS">Imita sonidos</option>
                    <option value="IMITATES_WORDS">Imita palabras</option>
                    <option value="DOES_NOT_IMITATE">No imita</option>
                  </Select>
                ) : (
                  <strong>{formatValue(communication?.imitation)}</strong>
                )}
              </DetailItem>

              <DetailItem label="Escritura">
                {isEditing ? (
                  <Select
                    id="edit-communication-writing"
                    value={editForm.communication[0]?.writing || ""}
                    onChange={(event) =>
                      updateEditArrayItem(
                        "communication",
                        0,
                        "writing",
                        event.target.value
                      )
                    }
                  >
                    <option value="">Sin indicar</option>
                    <option value="LETTERS">Letras</option>
                    <option value="NUMBERS">Números</option>
                    <option value="WORDS">Palabras</option>
                    <option value="SENTENCES">Frases</option>
                    <option value="TEXTS">Textos</option>
                  </Select>
                ) : (
                  <strong>{formatValue(communication?.writing)}</strong>
                )}
              </DetailItem>

              <DetailItem label="Comprensión">
                {isEditing ? (
                  <Select
                    id="edit-communication-comprehension"
                    value={editForm.communication[0]?.comprehension || ""}
                    onChange={(event) =>
                      updateEditArrayItem(
                        "communication",
                        0,
                        "comprehension",
                        event.target.value
                      )
                    }
                  >
                    <option value="">Sin indicar</option>
                    <option value="UNDERSTANDS_NO_ONLY">
                      Entiende solo el no
                    </option>
                    <option value="UNDERSTANDS_SIMPLE_COMMANDS">
                      Entiende órdenes simples
                    </option>
                    <option value="UNDERSTANDS_COMPLEX_COMMANDS">
                      Entiende órdenes complejas
                    </option>
                    <option value="NO_COMPREHENSION">No comprende</option>
                    <option value="OTHER">Otra</option>
                  </Select>
                ) : (
                  <strong>{formatValue(communication?.comprehension)}</strong>
                )}
              </DetailItem>

              {(isEditing || communication?.comprehension === "OTHER") && (
                <DetailItem label="Otra comprensión">
                  {isEditing ? (
                    <Input
                      id="edit-communication-comprehension-other"
                      value={editForm.communication[0]?.comprehensionOther || ""}
                      onChange={(event) =>
                        updateEditArrayItem(
                          "communication",
                          0,
                          "comprehensionOther",
                          event.target.value
                        )
                      }
                    />
                  ) : (
                    <strong>{formatValue(communication?.comprehensionOther)}</strong>
                  )}
                </DetailItem>
              )}

              <DetailItem label="Lectura">
                {isEditing ? (
                  <Select
                    id="edit-communication-reading"
                    value={editForm.communication[0]?.reading || ""}
                    onChange={(event) =>
                      updateEditArrayItem(
                        "communication",
                        0,
                        "reading",
                        event.target.value
                      )
                    }
                  >
                    <option value="">Sin indicar</option>
                    <option value="LETTERS">Letras</option>
                    <option value="NUMBERS">Números</option>
                    <option value="WORDS">Palabras</option>
                    <option value="SENTENCES">Frases</option>
                    <option value="TEXTS">Textos</option>
                    <option value="DOES_NOT_READ">No lee</option>
                    <option value="OTHER">Otra</option>
                  </Select>
                ) : (
                  <strong>{formatValue(communication?.reading)}</strong>
                )}
              </DetailItem>

              {(isEditing || communication?.reading === "OTHER") && (
                <DetailItem label="Otra lectura">
                  {isEditing ? (
                    <Input
                      id="edit-communication-reading-other"
                      value={editForm.communication[0]?.readingOther || ""}
                      onChange={(event) =>
                        updateEditArrayItem(
                          "communication",
                          0,
                          "readingOther",
                          event.target.value
                        )
                      }
                    />
                  ) : (
                    <strong>{formatValue(communication?.readingOther)}</strong>
                  )}
                </DetailItem>
              )}

              <DetailItem label="Comunicación alternativa">
                {isEditing ? (
                  <Select
                    id="edit-communication-alternative"
                    value={
                      editForm.communication[0]?.alternativeCommunication || ""
                    }
                    onChange={(event) =>
                      updateEditArrayItem(
                        "communication",
                        0,
                        "alternativeCommunication",
                        event.target.value
                      )
                    }
                  >
                    <option value="">Sin indicar</option>
                    <option value="NONE">Ninguna</option>
                    <option value="SIGN_LANGUAGE">Lengua de signos</option>
                    <option value="PECS">PECS</option>
                    <option value="COMMUNICATOR">Comunicador</option>
                    <option value="BRAILLE">Braille</option>
                    <option value="OTHER">Otra</option>
                  </Select>
                ) : (
                  <strong>
                    {formatValue(communication?.alternativeCommunication)}
                  </strong>
                )}
              </DetailItem>

              {(isEditing ||
                communication?.alternativeCommunication === "OTHER") && (
                <DetailItem label="Otra comunicación alternativa">
                  {isEditing ? (
                    <Textarea
                      id="edit-communication-alternative-other"
                      value={
                        editForm.communication[0]
                          ?.alternativeCommunicationOther || ""
                      }
                      onChange={(event) =>
                        updateEditArrayItem(
                          "communication",
                          0,
                          "alternativeCommunicationOther",
                          event.target.value
                        )
                      }
                    />
                  ) : (
                    <strong>
                      {formatValue(
                        communication?.alternativeCommunicationOther
                      )}
                    </strong>
                  )}
                </DetailItem>
              )}
            </div>
          </Card>

          <Card>
            <h2>Formulario extra: deporte, juego y miedos</h2>

            <div className="detail-grid">
              <DetailItem label="Practica deporte">
                {isEditing ? (
                  <Select
                    id="edit-sport-does-sport"
                    value={nullableBooleanSelectValue(
                      editForm.sports[0]?.doesSport
                    )}
                    onChange={(event) =>
                      updateEditArrayItem(
                        "sports",
                        0,
                        "doesSport",
                        selectValueToNullableBoolean(event.target.value)
                      )
                    }
                  >
                    <option value="">Sin indicar</option>
                    <option value="true">SI</option>
                    <option value="false">NO</option>
                  </Select>
                ) : (
                  <strong>{formatBoolean(sport?.doesSport)}</strong>
                )}
              </DetailItem>

              <DetailItem label="Deportes favoritos">
                {isEditing ? (
                  <Textarea
                    id="edit-sport-favorite-sports"
                    value={editForm.sports[0]?.favoriteSports || ""}
                    onChange={(event) =>
                      updateEditArrayItem(
                        "sports",
                        0,
                        "favoriteSports",
                        event.target.value
                      )
                    }
                  />
                ) : (
                  <strong>{formatValue(sport?.favoriteSports)}</strong>
                )}
              </DetailItem>

              <DetailItem label="Nivel natación">
                {isEditing ? (
                  <Select
                    id="edit-sport-swimming-level"
                    value={editForm.sports[0]?.swimmingLevel || ""}
                    onChange={(event) =>
                      updateEditArrayItem(
                        "sports",
                        0,
                        "swimmingLevel",
                        event.target.value
                      )
                    }
                  >
                    <option value="">Sin indicar</option>
                    <option value="YES">Sí sabe nadar</option>
                    <option value="NO">No sabe nadar</option>
                    <option value="WITH_TECHNICAL_AIDS">
                      Con ayudas técnicas
                    </option>
                    <option value="WITH_SUPPORT">Con apoyo</option>
                  </Select>
                ) : (
                  <strong>{formatValue(sport?.swimmingLevel)}</strong>
                )}
              </DetailItem>

              <DetailItem label="Juego social">
                {isEditing ? (
                  <Select
                    id="edit-sport-social-play"
                    value={editForm.sports[0]?.socialPlay || ""}
                    onChange={(event) =>
                      updateEditArrayItem(
                        "sports",
                        0,
                        "socialPlay",
                        event.target.value
                      )
                    }
                  >
                    <option value="">Sin indicar</option>
                    <option value="NO_INTEREST_IN_GROUP_PLAY">
                      No muestra interés por juego en grupo
                    </option>
                    <option value="SMALL_GROUPS">Grupos pequeños</option>
                    <option value="LARGE_GROUPS">Grupos grandes</option>
                  </Select>
                ) : (
                  <strong>{formatValue(sport?.socialPlay)}</strong>
                )}
              </DetailItem>

              <DetailItem label="Duración/fijación juego">
                {isEditing ? (
                  <Select
                    id="edit-sport-play-fixation"
                    value={editForm.sports[0]?.playFixation || ""}
                    onChange={(event) =>
                      updateEditArrayItem(
                        "sports",
                        0,
                        "playFixation",
                        event.target.value
                      )
                    }
                  >
                    <option value="">Sin indicar</option>
                    <option value="SHORT_TIME">Poco tiempo</option>
                    <option value="LONG_TIME">Mucho tiempo</option>
                  </Select>
                ) : (
                  <strong>{formatValue(sport?.playFixation)}</strong>
                )}
              </DetailItem>

              <DetailItem label="Miedos">
                {isEditing ? (
                  <Textarea
                    id="edit-fears"
                    value={editForm.fears[0]?.fears || ""}
                    onChange={(event) =>
                      updateEditArrayItem(
                        "fears",
                        0,
                        "fears",
                        event.target.value
                      )
                    }
                  />
                ) : (
                  <strong>{formatValue(fear?.fears)}</strong>
                )}
              </DetailItem>

              <DetailItem label="Mecanismos de afrontamiento">
                {isEditing ? (
                  <Textarea
                    id="edit-coping-mechanisms"
                    value={editForm.fears[0]?.copingMechanisms || ""}
                    onChange={(event) =>
                      updateEditArrayItem(
                        "fears",
                        0,
                        "copingMechanisms",
                        event.target.value
                      )
                    }
                  />
                ) : (
                  <strong>{formatValue(fear?.copingMechanisms)}</strong>
                )}
              </DetailItem>
            </div>
          </Card>

          <Card>
            <h2>Formulario extra: sensibilidades alimentarias</h2>

            {isEditing ? (
              <>
                <div className="checkbox-group">
                  {foodSensitivityOptions.map(([value, label]) => (
                    <label className="checkbox-field" key={value}>
                      <input
                        type="checkbox"
                        checked={editForm.foodSensitivities.some(
                          (item) => item.type === value
                        )}
                        onChange={() => toggleEditFoodSensitivity(value)}
                      />
                      {label}
                    </label>
                  ))}
                </div>

                {editForm.foodSensitivities.some(
                  (item) => item.type === "OTHER"
                ) && (
                  <Input
                    id="edit-food-sensitivity-other"
                    label="Otra sensibilidad alimentaria"
                    value={
                      editForm.foodSensitivities.find(
                        (item) => item.type === "OTHER"
                      )?.otherText || ""
                    }
                    onChange={(event) =>
                      updateEditFoodSensitivityOther(event.target.value)
                    }
                  />
                )}
              </>
            ) : foodSensitivities.length === 0 ? (
              <p>No constan sensibilidades alimentarias.</p>
            ) : (
              <ul>
                {foodSensitivities.map((item) => (
                  <li key={item.id || item.type}>
                    {item.type}
                    {item.otherText ? ` - ${item.otherText}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2>Formulario extra: otra información</h2>

            <div className="detail-grid">
              <DetailItem label="Información adicional">
                {isEditing ? (
                  <Textarea
                    id="edit-extra-info"
                    value={editForm.extraForm.extraInfo}
                    onChange={(event) =>
                      updateEditForm("extraForm", "extraInfo", event.target.value)
                    }
                  />
                ) : (
                  <strong>{formatValue(extraForm?.extraInfo)}</strong>
                )}
              </DetailItem>
            </div>
          </Card>
        </>
      )}

      <Card>
        <h2>Semanas</h2>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Semana</th>
                <th>ID semana</th>
                <th>Estado</th>
                <th>Madrugadores</th>
                <th>Desayuno</th>
                <th>Comedor</th>
                <th>Coste</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {signedUpWeeks.map((item) => {
                const waitlistToPendingKey = `${item.inscriptionId}-${item.weekId}-PENDING`;
                const pendingToAcceptedKey = `${item.inscriptionId}-${item.weekId}-ACCEPTED`;
                const cancelKey = `${item.inscriptionId}-${item.weekId}-CANCELLED`;

                return (
                  <tr key={`${item.inscriptionId}-${item.weekId}`}>
                    <td>{item.week?.number}</td>
                    <td>{item.weekId}</td>
                    <td>{getSignedUpStateLabel(item.state)}</td>
                    <td>{item.earlyRise ? "SI" : "NO"}</td>
                    <td>{item.breakfast ? "SI" : "NO"}</td>
                    <td>{item.lunch ? "SI" : "NO"}</td>
                    <td>{formatMoney(item.priceApplied)}</td>
                    <td>
                      <div className="table-actions">
                        {item.state === "WAITLIST" && (
                          <Button
                            type="button"
                            disabled={
                              updatingSignedUpKey === waitlistToPendingKey
                            }
                            onClick={() =>
                              handleChangeSignedUpStatus({
                                signedUpWeek: item,
                                newState: "PENDING",
                                paymentModeForNewReservation:
                                  inscription.paymentMode || "ONE_PAYMENT",
                              })
                            }
                          >
                            Pasar a pendiente
                          </Button>
                        )}

                        {item.state === "PENDING" && (
                          <Button
                            type="button"
                            disabled={
                              updatingSignedUpKey === pendingToAcceptedKey
                            }
                            onClick={() =>
                              handleChangeSignedUpStatus({
                                signedUpWeek: item,
                                newState: "ACCEPTED",
                              })
                            }
                          >
                            Aceptar inscripción
                          </Button>
                        )}

                        {(item.state === "PENDING" ||
                          item.state === "ACCEPTED") && (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => openExtraPaymentForm(item)}
                          >
                            Crear pago extra
                          </Button>
                        )}

                        {(item.state === "PENDING" ||
                          item.state === "WAITLIST") && (
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={updatingSignedUpKey === cancelKey}
                            onClick={() =>
                              handleChangeSignedUpStatus({
                                signedUpWeek: item,
                                newState: "CANCELLED",
                              })
                            }
                          >
                            Cancelar inscripción
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {signedUpWeeks.length === 0 && (
                <tr>
                  <td colSpan="8">No hay semanas asociadas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="detail-two-columns">
        <Card>
          <h2>Alergias</h2>

          {isEditing ? (
            <>
              {editForm.allergies.map((item, index) => (
                <div className="form-grid" key={`allergy-${index}`}>
                  <Textarea
                    id={`edit-allergy-${index}`}
                    label={`Alergia ${index + 1}`}
                    value={item.description}
                    onChange={(event) =>
                      updateEditArrayItem(
                        "allergies",
                        index,
                        "description",
                        event.target.value
                      )
                    }
                  />

                  <div className="form-actions field-full">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => removeEditArrayItem("allergies", index)}
                    >
                      Eliminar alergia
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  addEditArrayItem("allergies", {
                    description: "",
                  })
                }
              >
                Añadir alergia
              </Button>
            </>
          ) : allergies.length === 0 ? (
            <p>No constan alergias.</p>
          ) : (
            <ul>
              {allergies.map((item) => (
                <li key={item.id}>{item.description}</li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2>Medicación</h2>

          {isEditing ? (
            <>
              {editForm.medications.map((item, index) => (
                <div className="form-grid" key={`medication-${index}`}>
                  <Textarea
                    id={`edit-medication-${index}`}
                    label={`Medicación ${index + 1}`}
                    value={item.description}
                    onChange={(event) =>
                      updateEditArrayItem(
                        "medications",
                        index,
                        "description",
                        event.target.value
                      )
                    }
                  />

                  <div className="form-actions field-full">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => removeEditArrayItem("medications", index)}
                    >
                      Eliminar medicación
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  addEditArrayItem("medications", {
                    description: "",
                  })
                }
              >
                Añadir medicación
              </Button>
            </>
          ) : medications.length === 0 ? (
            <p>No consta medicación.</p>
          ) : (
            <ul>
              {medications.map((item) => (
                <li key={item.id}>{item.description}</li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <h2>Personas autorizadas</h2>

        {isEditing ? (
          <>
            {editForm.authorizedPeople.map((person, index) => (
              <Card key={`authorized-${index}`}>
                <h3>Persona autorizada {index + 1}</h3>

                <div className="form-grid">
                  <Input
                    id={`authorized-name-${index}`}
                    label="Nombre"
                    value={person.name}
                    onChange={(event) =>
                      updateEditArrayItem(
                        "authorizedPeople",
                        index,
                        "name",
                        event.target.value
                      )
                    }
                  />

                  <Input
                    id={`authorized-surname-${index}`}
                    label="Apellidos"
                    value={person.surname}
                    onChange={(event) =>
                      updateEditArrayItem(
                        "authorizedPeople",
                        index,
                        "surname",
                        event.target.value
                      )
                    }
                  />

                  <Input
                    id={`authorized-dni-${index}`}
                    label="DNI/NIE"
                    value={person.dni}
                    onChange={(event) =>
                      updateEditArrayItem(
                        "authorizedPeople",
                        index,
                        "dni",
                        event.target.value
                      )
                    }
                  />

                  <Input
                    id={`authorized-phone-${index}`}
                    label="Teléfono"
                    value={person.phone}
                    onChange={(event) =>
                      updateEditArrayItem(
                        "authorizedPeople",
                        index,
                        "phone",
                        event.target.value
                      )
                    }
                  />

                  <Input
                    id={`authorized-relation-${index}`}
                    label="Relación"
                    value={person.relation}
                    onChange={(event) =>
                      updateEditArrayItem(
                        "authorizedPeople",
                        index,
                        "relation",
                        event.target.value
                      )
                    }
                  />

                  <div className="form-actions field-full">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        removeEditArrayItem("authorizedPeople", index)
                      }
                    >
                      Eliminar persona autorizada
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                addEditArrayItem("authorizedPeople", {
                  name: "",
                  surname: "",
                  dni: "",
                  phone: "",
                  relation: "",
                })
              }
            >
              Añadir persona autorizada
            </Button>
          </>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>DNI/NIE</th>
                  <th>TFNO</th>
                  <th>Relación</th>
                </tr>
              </thead>

              <tbody>
                {authorizedPeople.map((person) => (
                  <tr key={person.id}>
                    <td>{person.name}</td>
                    <td>{person.surname}</td>
                    <td>{person.dni || "-"}</td>
                    <td>{person.phone}</td>
                    <td>{person.relation}</td>
                  </tr>
                ))}

                {authorizedPeople.length === 0 && (
                  <tr>
                    <td colSpan="5">No hay personas autorizadas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h2>Notas y observaciones</h2>

        <div className="detail-grid">
          <DetailItem label="Notas de inscripción">
            {isEditing ? (
              <Textarea
                id="edit-inscription-notes"
                value={editForm.inscription.notes}
                onChange={(event) =>
                  updateEditForm("inscription", "notes", event.target.value)
                }
              />
            ) : (
              <strong>{formatValue(inscription.notes)}</strong>
            )}
          </DetailItem>

          <DetailItem label="Notas de participante">
            {isEditing ? (
              <Textarea
                id="edit-participant-notes"
                value={editForm.participant.notes}
                onChange={(event) =>
                  updateEditForm("participant", "notes", event.target.value)
                }
              />
            ) : (
              <strong>{formatValue(participant?.notes)}</strong>
            )}
          </DetailItem>

          <DetailItem label="Observaciones escolares">
            {isEditing ? (
              <Textarea
                id="edit-school-observations"
                value={editForm.participant.schoolObservations}
                onChange={(event) =>
                  updateEditForm(
                    "participant",
                    "schoolObservations",
                    event.target.value
                  )
                }
              />
            ) : (
              <strong>{formatValue(participant?.schoolObservations)}</strong>
            )}
          </DetailItem>
        </div>
      </Card>

      {participant?.hasDisability && (
        <Card>
          <h2>Formulario discapacidad</h2>

          <p>
            Desde aquí se puede copiar el enlace seguro al formulario extra
            asociado a este participante.
          </p>

          <div className="form-actions">
            <Button type="button" onClick={copyExtraFormLink}>
              Copiar enlace del ExtraForm
            </Button>
          </div>

          {copyMessage && (
  <p className="form-success extraform-copy-message">{copyMessage}</p>
)}
        </Card>
      )}
    </section>
  );
}
