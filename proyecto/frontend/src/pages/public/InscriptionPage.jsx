import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { getPublicSummerCampByYear } from "../../services/summerCampService";
import { createInscription } from "../../services/inscriptionService";
import ParticipantForm from "../../components/forms/ParticipantForm";
import GuardianForm from "../../components/forms/GuardianForm";
import AddressForm from "../../components/forms/AddressForm";
import AuthorizedPeopleForm from "../../components/forms/AuthorizedPeopleForm";
import WeeksSelector from "../../components/forms/WeeksSelector";
import InscriptionOptionsForm from "../../components/forms/InscriptionOptionsForm";
import InscriptionSummary from "../../components/forms/InscriptionSummary";
import Button from "../../components/ui/Button";
import DiscountSelector from "../../components/forms/DiscountSelector";
import { getDiscounts } from "../../services/discountService";
const initialFormData = {
  participant: {
    name: "",
    surname: "",
    birthdate: "",
    gender: "",
    healthCard: "",

    repeatedBefore: false,
    siblings: false,
    schoolRelated: false,

    hasDisability: false,
    disabilityDegree: "",
    dependencyDegree: "",
    disabilityInfo: "",

    allergyDescription: "",
    medicationDescription: "",
    symptomsInfo: "",

    schoolObservations: "",
    notes: "",
  },
  guardian: {
    name: "",
    surname: "",
    dni: "",
    phone: "",
    phone2: "",
    email: "",
    email2: "",
    relation: "",
  },
  address: {
    street: "",
    city: "",
    province: "",
    postalCode: "",
  },
  authorizedPeople: [
    {
      name: "",
      surname: "",
      dni: "",
      phone: "",
      relation: "",
    },
  ],
  weeks: [],
  inscription: {
    paymentMode: "ONE_PAYMENT",
    invoiceRequested: false,
    invoiceName: "",
    invoiceDni: "",
    dataTreatmentAccepted: false,
    outingsAccepted: false,
    imagesAccepted: false,
    notes: "",
  },
  discounts: [],
};



export default function InscriptionPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [stepError, setStepError] = useState("");
  
  const [weeks, setWeeks] = useState([]);
  const [loadingCamps, setLoadingCamps] = useState(false);
  const [loadingWeeks, setLoadingWeeks] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [discountsLoading, setDiscountsLoading] = useState(false);
  const [discountsError, setDiscountsError] = useState("");
  const { year } = useParams();

  const [summerCamp, setSummerCamp] = useState(null);
  const [campLoading, setCampLoading] = useState(true);
  const [campError, setCampError] = useState("");

  const navigate = useNavigate();
  useEffect(() => {
  const loadPublicCamp = async () => {
    try {
      setCampLoading(true);
      setCampError("");

      const result = await getPublicSummerCampByYear(year);

      setSummerCamp(result);
      setWeeks(result.weeks || []);

      setFormData((previous) => ({
        ...previous,
        weeks: [],
      }));
    } catch (error) {
      setCampError(error.message || "El formulario no está disponible.");
      setSummerCamp(null);
      setWeeks([]);
    } finally {
      setCampLoading(false);
    }
  };

  loadPublicCamp();
}, [year]);
  useEffect(() => {
    const loadDiscounts = async () => {
      try {
        setDiscountsLoading(true);
        setDiscountsError("");

        const result = await getDiscounts();

        setAvailableDiscounts(result.filter((discount) => discount.isActive));
      } catch (error) {
        setDiscountsError(error.message || "Error al cargar descuentos");
        setAvailableDiscounts([]);
      } finally {
        setDiscountsLoading(false);
      }
    };

    loadDiscounts();
  }, []);
  

  
  const updateFormSection = (section, value) => {
      setFormData((previous) => ({
        ...previous,
        [section]: value,
      }));
    };

  const clearError = (path) => {
    setFieldErrors((current) => {
      const copy = { ...current };
      delete copy[path];
      return copy;
    });
  };
  const validateCurrentStep = (step = currentStep) => {
    const errors = {};

    const requiredText = (path, value, message) => {
      if (!value || String(value).trim() === "") {
        errors[path] = message;
      }
    };

    const isValidEmail = (value) => {
      if (!value || String(value).trim() === "") return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
    };

    const isValidPhone = (value) => {
      if (!value || String(value).trim() === "") return true;
      return /^[0-9+\s-]{9,15}$/.test(String(value).trim());
    };

    const isValidPostalCode = (value) => {
      if (!value || String(value).trim() === "") return true;
      return /^[0-9]{5}$/.test(String(value).trim());
    };

    const isValidHealthCard = (value) => {
      if (!value || String(value).trim() === "") return true;
      return /^[A-Za-z0-9-]{5,30}$/.test(String(value).trim());
    };

    const isValidDniNie = (value) => {
      if (!value || String(value).trim() === "") return true;
      return /^[XYZ]?\d{7,8}[A-Za-z]$/.test(String(value).trim());
    };

    if (step === 1) {
      requiredText(
        "participant.name",
        formData.participant.name,
        "El nombre del participante es obligatorio"
      );

      requiredText(
        "participant.surname",
        formData.participant.surname,
        "Los apellidos del participante son obligatorios"
      );

      requiredText(
        "participant.birthdate",
        formData.participant.birthdate,
        "La fecha de nacimiento es obligatoria"
      );

      requiredText(
        "participant.gender",
        formData.participant.gender,
        "El género es obligatorio"
      );

      requiredText(
        "participant.healthCard",
        formData.participant.healthCard,
        "La tarjeta sanitaria es obligatoria"
      );

      if (
        formData.participant.healthCard &&
        !isValidHealthCard(formData.participant.healthCard)
      ) {
        errors["participant.healthCard"] =
          "La tarjeta sanitaria debe tener entre 5 y 30 caracteres y solo puede contener letras, números o guiones";
      }

      if (formData.participant.hasDisability) {
        requiredText(
          "participant.disabilityDegree",
          formData.participant.disabilityDegree,
          "El grado de discapacidad es obligatorio"
        );

        requiredText(
          "participant.dependencyDegree",
          formData.participant.dependencyDegree,
          "El grado de dependencia es obligatorio"
        );
      }

      requiredText(
        "guardian.name",
        formData.guardian.name,
        "El nombre del tutor legal es obligatorio"
      );

      requiredText(
        "guardian.surname",
        formData.guardian.surname,
        "Los apellidos del tutor legal son obligatorios"
      );

      requiredText(
        "guardian.dni",
        formData.guardian.dni,
        "El DNI/NIE del tutor legal es obligatorio"
      );

      if (formData.guardian.dni && !isValidDniNie(formData.guardian.dni)) {
        errors["guardian.dni"] = "El DNI/NIE del tutor tiene un formato inválido";
      }

      requiredText(
        "guardian.phone",
        formData.guardian.phone,
        "El teléfono del tutor legal es obligatorio"
      );

      if (formData.guardian.phone && !isValidPhone(formData.guardian.phone)) {
        errors["guardian.phone"] =
          "El teléfono debe tener entre 9 y 15 caracteres y solo puede contener números, espacios, + o -";
      }

      if (formData.guardian.phone2 && !isValidPhone(formData.guardian.phone2)) {
        errors["guardian.phone2"] =
          "El teléfono 2 debe tener entre 9 y 15 caracteres y solo puede contener números, espacios, + o -";
      }

      requiredText(
        "guardian.email",
        formData.guardian.email,
        "El email del tutor legal es obligatorio"
      );

      if (formData.guardian.email && !isValidEmail(formData.guardian.email)) {
        errors["guardian.email"] = "El email del tutor no tiene un formato válido";
      }

      if (formData.guardian.email2 && !isValidEmail(formData.guardian.email2)) {
        errors["guardian.email2"] = "El email 2 no tiene un formato válido";
      }

      requiredText(
        "guardian.relation",
        formData.guardian.relation,
        "La relación familiar es obligatoria"
      );

      requiredText(
        "address.street",
        formData.address.street,
        "La dirección es obligatoria"
      );

      requiredText(
        "address.city",
        formData.address.city,
        "La ciudad es obligatoria"
      );

      requiredText(
        "address.province",
        formData.address.province,
        "La provincia es obligatoria"
      );

      requiredText(
        "address.postalCode",
        formData.address.postalCode,
        "El código postal es obligatorio"
      );

      if (
        formData.address.postalCode &&
        !isValidPostalCode(formData.address.postalCode)
      ) {
        errors["address.postalCode"] =
          "El código postal debe tener exactamente 5 números";
      }

      if (!formData.authorizedPeople || formData.authorizedPeople.length === 0) {
        errors.authorizedPeople =
          "Debe indicarse al menos una persona autorizada";
      }

      formData.authorizedPeople.forEach((person, index) => {
        requiredText(
          `authorizedPeople.${index}.name`,
          person.name,
          "El nombre de la persona autorizada es obligatorio"
        );

        requiredText(
          `authorizedPeople.${index}.surname`,
          person.surname,
          "Los apellidos de la persona autorizada son obligatorios"
        );

        requiredText(
          `authorizedPeople.${index}.dni`,
          person.dni,
          "El DNI/NIE de la persona autorizada es obligatorio"
        );

        if (person.dni && !isValidDniNie(person.dni)) {
          errors[`authorizedPeople.${index}.dni`] =
            "El DNI/NIE de la persona autorizada tiene un formato inválido";
        }

        requiredText(
          `authorizedPeople.${index}.phone`,
          person.phone,
          "El teléfono de la persona autorizada es obligatorio"
        );

        if (person.phone && !isValidPhone(person.phone)) {
          errors[`authorizedPeople.${index}.phone`] =
            "El teléfono debe tener entre 9 y 15 caracteres y solo puede contener números, espacios, + o -";
        }

        requiredText(
          `authorizedPeople.${index}.relation`,
          person.relation,
          "La relación familiar de la persona autorizada es obligatoria"
        );
      });
    }

    if (step === 2) {
      

      if (!formData.weeks || formData.weeks.length === 0) {
        errors.weeks = "Debes seleccionar al menos una semana";
      }
    }

    if (step === 3) {
      requiredText(
        "inscription.paymentMode",
        formData.inscription.paymentMode,
        "La modalidad de pago es obligatoria"
      );

      if (!formData.inscription.dataTreatmentAccepted) {
        errors["inscription.dataTreatmentAccepted"] =
          "Debes aceptar el tratamiento de datos";
      }

        if (!formData.inscription.outingsAccepted) {
    errors["inscription.outingsAccepted"] =
      "Debes autorizar las salidas o excursiones";
  }

      if (formData.inscription.invoiceRequested) {
        requiredText(
          "inscription.invoiceName",
          formData.inscription.invoiceName,
          "El nombre para factura es obligatorio si solicitas factura"
        );

        requiredText(
          "inscription.invoiceDni",
          formData.inscription.invoiceDni,
          "El DNI/NIE para factura es obligatorio si solicitas factura"
        );

        if (
          formData.inscription.invoiceDni &&
          !isValidDniNie(formData.inscription.invoiceDni)
        ) {
          errors["inscription.invoiceDni"] =
            "El DNI/NIE para factura tiene un formato inválido";
        }
      }
    }

    return errors;
  };
  const validateAllSteps = () => {
    return {
      ...validateCurrentStep(1),
      ...validateCurrentStep(2),
      ...validateCurrentStep(3),
    };
  };
  const nextStep = () => {
    const errors = validateCurrentStep(currentStep);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStepError("Revisa los campos marcados antes de continuar.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setFieldErrors({});
    setStepError("");
    setCurrentStep((previous) => Math.min(previous + 1, 4));
  };

  const previousStep = () => {
    setCurrentStep((previous) => Math.max(previous - 1, 1));
  };
  const handleSubmit = async () => {
      const errors = validateAllSteps();

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setStepError("Revisa los campos marcados antes de finalizar la inscripción.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      try {
        setSubmitLoading(true);
        setSubmitError("");
        setStepError("");
        setFieldErrors({});

        const payload = {
          summerCampId: summerCamp.id,
          participant: formData.participant,
          guardian: formData.guardian,
          address: formData.address,
          authorizedPeople: formData.authorizedPeople,
          inscription: formData.inscription,
          weeks: formData.weeks,
          discounts: formData.discounts,
        };

        console.log("Payload inscripción:", payload);

        const createdInscription = await createInscription(payload);

        navigate(`/inscripcion/${year}/confirmacion`, {
          state: {
            inscription: createdInscription,
          },
        });
      } catch (error) {
        if (Array.isArray(error.details) && error.details.length > 0) {
          const backendErrors = {};

          error.details.forEach((item) => {
            if (item.path && item.message) {
              backendErrors[item.path] = item.message;
            }
          });

          setFieldErrors(backendErrors);
          setSubmitError("Revisa los campos marcados antes de enviar la inscripción.");
        } else {
          setSubmitError(error.message || "Error al crear la inscripción");
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
      } finally {
        setSubmitLoading(false);
      }
    };
  if (campLoading) {
    return <p>Cargando formulario de inscripción...</p>;
  }

  if (campError) {
    return (
      <main className="page">
        <section className="inscription-header">
          <h1>Formulario no disponible</h1>
          <p>{campError}</p>
        </section>
      </main>
    );
  }

  if (!summerCamp) {
    return (
      <main className="page">
        <section className="inscription-header">
          <h1>Campamento no encontrado</h1>
        </section>
      </main>
    );
  }
  return (
    <section className="inscription-page">
      <header className="inscription-header">
        <h1>Inscripción {summerCamp.name} {summerCamp.year}</h1>
        <p>
          Campamento en {summerCamp.place}, del{" "}
          {new Date(summerCamp.startDate).toLocaleDateString()} al{" "}
          {new Date(summerCamp.endDate).toLocaleDateString()}.
        </p>
      </header>

      <div className="step-indicator">
        <span className={currentStep === 1 ? "active" : ""}>1. Datos</span>
        <span className={currentStep === 2 ? "active" : ""}>2. Semanas</span>
        <span className={currentStep === 3 ? "active" : ""}>3. Autorizaciones</span>
        <span className={currentStep === 4 ? "active" : ""}>4. Resumen</span>
      </div>
      
      <p className="form-help">
        Los campos marcados con <span className="required-mark">*</span> son obligatorios.
      </p>

      {submitError && <p className="form-error">{submitError}</p>}
      {stepError && <p className="form-error">{stepError}</p>}
      {fieldErrors.weeks && (
        <p className="form-error">{fieldErrors.weeks}</p>
      )}

      <div className="form-shell">
        {currentStep === 1 && (
          <>
            <ParticipantForm
              data={formData.participant}
              errors={fieldErrors}
              onChange={(value) => updateFormSection("participant", value)}
              clearError={clearError}
            />

            <GuardianForm
              data={formData.guardian}
              errors={fieldErrors}
              onChange={(value) => updateFormSection("guardian", value)}
              clearError={clearError}
            />

            <AddressForm
              data={formData.address}
              errors={fieldErrors}
              onChange={(value) => updateFormSection("address", value)}
              clearError={clearError}
            />

            <AuthorizedPeopleForm
              data={formData.authorizedPeople}
              errors={fieldErrors}
              onChange={(value) => updateFormSection("authorizedPeople", value)}
              clearError={clearError}
            />
          </>
        )}

       {currentStep === 2 && (
          <>
           

            <div className="discount-selector-wrapper">
              <DiscountSelector
                participant={formData.participant}
                discounts={formData.discounts}
                onDiscountsChange={(value) => updateFormSection("discounts", value)}
              />
            </div>
            {fieldErrors.weeks && (
              <p className="field-error-message">{fieldErrors.weeks}</p>
            )}
            {formData.participant.hasDisability && (
  <div className="form-info-message">
    <strong>Información importante</strong>
    <p>
      Una vez reservada una plaza, su solicitud deberá ser aprobada por los
      responsables del campamento. Sólo una vez aceptado se procederá al pago y
      formalización de la inscripción.
    </p>
  </div>
)}
            <WeeksSelector
              data={formData.weeks}
              onChange={(value) => {
                clearError("weeks");
                updateFormSection("weeks", value);
              }}
              weeks={weeks}
              loading={loadingWeeks}
              hasDisability={formData.participant.hasDisability}
              participant={formData.participant}
              manualDiscountCodes={formData.discounts}
              availableDiscounts={availableDiscounts}
              discountsLoading={discountsLoading}
              discountsError={discountsError}
            />
          </>
        )}

        {currentStep === 3 && (
          <InscriptionOptionsForm
            inscription={formData.inscription}
            discounts={formData.discounts}
            errors={fieldErrors}
            onInscriptionChange={(value) =>
              updateFormSection("inscription", value)
            }
            onDiscountsChange={(value) =>
              updateFormSection("discounts", value)
            }
            clearError={clearError}
          />
        )}

        {currentStep === 4 && <InscriptionSummary formData={formData} />}

        <div className="form-actions">
          {currentStep > 1 && (
            <Button type="button" variant="secondary" onClick={previousStep}>
              Atrás
            </Button>
          )}

          {currentStep < 4 ? (
            <Button type="button" onClick={nextStep}>
              Seguir
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={submitLoading}>
              {submitLoading ? "Enviando..." : "Finalizar inscripción"}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}