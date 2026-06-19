import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import Button from "../../components/ui/Button";
import {
  getExtraFormByToken,
  updateExtraFormByToken,
} from "../../services/extraFormTokenService";

const initialExtraForm = {
  calledBefore: "",
  routines: "",
  emotionalRegulation: "",
  schoolingType: "",
  schoolingTypeOther: "",
  supportType: "",
  hygiene: "",
  bladderControl: "",
  bowelControl: "",
  eatingSupport: "",
  feedingAdaptation: "",
  chokingEpisodes: "",
  extraInfo: "",

  disability: {
    functionalDiversity: "",
    disabilityDegree: "",
    dependencyDegree: "",
    wheelchair: "",
    mobilityAid: "",
    walking: "",
    running: "",
    climbing: "",
    crawling: "",
    jumping: "",
    stairs: "",
    outdoorMobility: "",
  },

  sports: [
    {
      doesSport: "",
      favoriteSports: "",
      swimmingLevel: "",
      socialPlay: "",
      playFixation: "",
    },
  ],

  fears: [
    {
      fears: "",
      copingMechanisms: "",
    },
  ],

  communication: [
    {
      oralLanguage: "",
      imitation: "",
      writing: "",
      comprehension: "",
      reading: "",
      alternativeCommunication: "",
      alternativeCommunicationOther: "",
      comprehensionOther: "",
      readingOther: "",
    },
  ],

  foodSensitivities: [],
};

const booleanToSelectValue = (value) => {
  if (value === true) return "true";
  if (value === false) return "false";
  return "";
};

const selectValueToBoolean = (value) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return null;
};

const isEmpty = (value) => {
  return value === undefined || value === null || String(value).trim() === "";
};

export default function ExtraFormPage() {
  const { token } = useParams();

  const [formData, setFormData] = useState(initialExtraForm);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const loadExtraForm = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getExtraFormByToken(token);
        const result = response.extraForm || {};

        setFormData({
          ...initialExtraForm,
          ...result,
          calledBefore: booleanToSelectValue(result.calledBefore),
          chokingEpisodes: booleanToSelectValue(result.chokingEpisodes),
          disability: {
            ...initialExtraForm.disability,
            ...(result.disability || {}),
            wheelchair: booleanToSelectValue(result.disability?.wheelchair),
          },
          sports: result.sports?.length
            ? [
                {
                  ...initialExtraForm.sports[0],
                  ...result.sports[0],
                  doesSport: booleanToSelectValue(result.sports[0]?.doesSport),
                },
              ]
            : initialExtraForm.sports,
          fears: result.fears?.length ? result.fears : initialExtraForm.fears,
          communication: result.communication?.length
            ? result.communication
            : initialExtraForm.communication,
          foodSensitivities: result.foodSensitivities || [],
        });
      } catch (error) {
        setError(error.message || "Error al cargar el formulario extra");
      } finally {
        setLoading(false);
      }
    };

    loadExtraForm();
  }, [token]);

  const clearFieldError = (field) => {
    setFieldErrors((current) => {
      const copy = { ...current };
      delete copy[field];
      return copy;
    });
  };

  const updateField = (field, value) => {
    clearFieldError(field);
    setError("");

    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateDisabilityField = (field, value) => {
    clearFieldError(field);
    setError("");

    setFormData((current) => ({
      ...current,
      disability: {
        ...current.disability,
        [field]: value,
      },
    }));
  };

  const updateFirstArrayItem = (section, field, value) => {
    clearFieldError(field);
    setError("");

    setFormData((current) => ({
      ...current,
      [section]: [
        {
          ...current[section][0],
          [field]: value,
        },
      ],
    }));
  };

  const toggleFoodSensitivity = (type) => {
    clearFieldError("foodSensitivities");
    clearFieldError("foodSensitivityOther");
    setError("");

    setFormData((current) => {
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

  const updateFoodSensitivityOther = (value) => {
    clearFieldError("foodSensitivityOther");
    setError("");

    setFormData((current) => {
      const exists = current.foodSensitivities.some(
        (item) => item.type === "OTHER"
      );

      if (!exists) {
        return {
          ...current,
          foodSensitivities: [
            ...current.foodSensitivities.filter((item) => item.type !== "NONE"),
            {
              type: "OTHER",
              otherText: value,
            },
          ],
        };
      }

      return {
        ...current,
        foodSensitivities: current.foodSensitivities.map((item) =>
          item.type === "OTHER"
            ? {
                ...item,
                otherText: value,
              }
            : item
        ),
      };
    });
  };

  const validateExtraForm = () => {
    const errors = {};
    const communication = formData.communication?.[0] || {};
    const sport = formData.sports?.[0] || {};
    const fear = formData.fears?.[0] || {};
    const disability = formData.disability || {};

    

    if (isEmpty(formData.routines)) {
      errors.routines = "Las rutinas importantes son obligatorias.";
    }

    if (isEmpty(formData.emotionalRegulation)) {
      errors.emotionalRegulation = "La regulación emocional es obligatoria.";
    }

    if (isEmpty(formData.schoolingType)) {
      errors.schoolingType = "El tipo de escolarización es obligatorio.";
    }

    if (
      formData.schoolingType === "OTHER" &&
      isEmpty(formData.schoolingTypeOther)
    ) {
      errors.schoolingTypeOther = "Indica el otro tipo de escolarización.";
    }

    if (isEmpty(formData.supportType)) {
      errors.supportType = "El tipo de apoyo es obligatorio.";
    }

    if (isEmpty(formData.hygiene)) {
      errors.hygiene = "El nivel de higiene es obligatorio.";
    }

    if (isEmpty(formData.bladderControl)) {
      errors.bladderControl = "El control de esfínteres de vejiga es obligatorio.";
    }

    if (isEmpty(formData.bowelControl)) {
      errors.bowelControl =
        "El control de esfínteres de intestino es obligatorio.";
    }

    if (isEmpty(formData.eatingSupport)) {
      errors.eatingSupport = "El apoyo en la comida es obligatorio.";
    }

    if (isEmpty(formData.feedingAdaptation)) {
      errors.feedingAdaptation =
        "Las adaptaciones en la alimentación son obligatorias. Si no aplica, escribe “No aplica”.";
    }

    if (isEmpty(formData.chokingEpisodes)) {
      errors.chokingEpisodes =
        "Indica si ha tenido episodios de atragantamiento.";
    }

    if (isEmpty(disability.functionalDiversity)) {
      errors.functionalDiversity = "La diversidad funcional es obligatoria.";
    }

    if (isEmpty(disability.disabilityDegree)) {
      errors.disabilityDegree = "El grado de discapacidad es obligatorio.";
    }

    if (isEmpty(disability.dependencyDegree)) {
      errors.dependencyDegree = "El grado de dependencia es obligatorio.";
    }

    if (isEmpty(disability.wheelchair)) {
      errors.wheelchair = "Indica si usa silla de ruedas.";
    }

    if (isEmpty(disability.mobilityAid)) {
      errors.mobilityAid =
        "La ayuda técnica de movilidad es obligatoria. Si no usa, escribe “Ninguna”.";
    }

    if (isEmpty(disability.walking)) {
      errors.walking = "El nivel para caminar es obligatorio.";
    }

    if (isEmpty(disability.running)) {
      errors.running = "El nivel para correr es obligatorio.";
    }

    if (isEmpty(disability.climbing)) {
      errors.climbing = "El nivel para subir obstáculos es obligatorio.";
    }

    if (isEmpty(disability.crawling)) {
      errors.crawling = "El nivel para gatear es obligatorio.";
    }

    if (isEmpty(disability.jumping)) {
      errors.jumping = "El nivel para saltar es obligatorio.";
    }

    if (isEmpty(disability.stairs)) {
      errors.stairs = "El nivel para escaleras es obligatorio.";
    }

    if (isEmpty(disability.outdoorMobility)) {
      errors.outdoorMobility = "La movilidad exterior es obligatoria.";
    }

    if (isEmpty(communication.oralLanguage)) {
      errors.oralLanguage = "El lenguaje oral es obligatorio.";
    }

    if (isEmpty(communication.imitation)) {
      errors.imitation = "La imitación es obligatoria.";
    }

    if (isEmpty(communication.writing)) {
      errors.writing = "La escritura es obligatoria.";
    }

    if (isEmpty(communication.comprehension)) {
      errors.comprehension = "La comprensión es obligatoria.";
    }

    if (
      communication.comprehension === "OTHER" &&
      isEmpty(communication.comprehensionOther)
    ) {
      errors.comprehensionOther = "Indica la otra forma de comprensión.";
    }

    if (isEmpty(communication.reading)) {
      errors.reading = "La lectura es obligatoria.";
    }

    if (
      communication.reading === "OTHER" &&
      isEmpty(communication.readingOther)
    ) {
      errors.readingOther = "Indica la otra forma de lectura.";
    }

    if (isEmpty(communication.alternativeCommunication)) {
      errors.alternativeCommunication =
        "La comunicación alternativa es obligatoria.";
    }

    if (
      communication.alternativeCommunication === "OTHER" &&
      isEmpty(communication.alternativeCommunicationOther)
    ) {
      errors.alternativeCommunicationOther =
        "Indica la otra comunicación alternativa.";
    }

    if (isEmpty(sport.doesSport)) {
      errors.doesSport = "Indica si practica deporte.";
    }

    if (isEmpty(sport.favoriteSports)) {
      errors.favoriteSports =
        "Indica los deportes o actividades favoritas. Si no practica, escribe “No aplica”.";
    }

    if (isEmpty(sport.swimmingLevel)) {
      errors.swimmingLevel = "El nivel de natación es obligatorio.";
    }

    if (isEmpty(sport.socialPlay)) {
      errors.socialPlay = "El tipo de juego social es obligatorio.";
    }

    if (isEmpty(sport.playFixation)) {
      errors.playFixation = "La duración/fijación del juego es obligatoria.";
    }

    if (isEmpty(fear.fears)) {
      errors.fears =
        "Indica los miedos o situaciones que puedan generar malestar. Si no tiene, escribe “Ninguno”.";
    }

    if (isEmpty(fear.copingMechanisms)) {
      errors.copingMechanisms =
        "Indica qué ayuda a calmarle o acompañarle. Si no aplica, escribe “No aplica”.";
    }

    if (formData.foodSensitivities.length === 0) {
      errors.foodSensitivities =
        "Selecciona al menos una opción de sensibilidad alimentaria.";
    }

    const otherFoodSensitivity = formData.foodSensitivities.find(
      (item) => item.type === "OTHER"
    );

    if (otherFoodSensitivity && isEmpty(otherFoodSensitivity.otherText)) {
      errors.foodSensitivityOther =
        "Indica la otra sensibilidad alimentaria.";
    }

    return errors;
  };

const buildPayload = () => {
  const communication = formData.communication?.[0] || {};
  const sport = formData.sports?.[0] || {};
  const fear = formData.fears?.[0] || {};

  return {
    calledBefore: true,
    routines: formData.routines || null,
    emotionalRegulation: formData.emotionalRegulation || null,
    schoolingType: formData.schoolingType || null,
    schoolingTypeOther:
      formData.schoolingType === "OTHER"
        ? formData.schoolingTypeOther || null
        : null,
    supportType: formData.supportType || null,
    hygiene: formData.hygiene || null,
    bladderControl: formData.bladderControl || null,
    bowelControl: formData.bowelControl || null,
    eatingSupport: formData.eatingSupport || null,
    feedingAdaptation: formData.feedingAdaptation || null,
    chokingEpisodes: selectValueToBoolean(formData.chokingEpisodes),
    extraInfo: formData.extraInfo || null,

    disability: {
      functionalDiversity:
        formData.disability.functionalDiversity || null,
      disabilityDegree:
        formData.disability.disabilityDegree || null,
      dependencyDegree:
        formData.disability.dependencyDegree || null,
      wheelchair: selectValueToBoolean(formData.disability.wheelchair),
      mobilityAid: formData.disability.mobilityAid || null,
      walking: formData.disability.walking || null,
      running: formData.disability.running || null,
      climbing: formData.disability.climbing || null,
      crawling: formData.disability.crawling || null,
      jumping: formData.disability.jumping || null,
      stairs: formData.disability.stairs || null,
      outdoorMobility: formData.disability.outdoorMobility || null,
    },

    sports: [
      {
        doesSport: selectValueToBoolean(sport.doesSport),
        favoriteSports: sport.favoriteSports || null,
        swimmingLevel: sport.swimmingLevel || null,
        socialPlay: sport.socialPlay || null,
        playFixation: sport.playFixation || null,
      },
    ],

    fears: [
      {
        fears: fear.fears || null,
        copingMechanisms: fear.copingMechanisms || null,
      },
    ],

    communication: [
      {
        oralLanguage: communication.oralLanguage || null,
        imitation: communication.imitation || null,
        writing: communication.writing || null,
        comprehension: communication.comprehension || null,
        comprehensionOther:
          communication.comprehension === "OTHER"
            ? communication.comprehensionOther || null
            : null,
        reading: communication.reading || null,
        readingOther:
          communication.reading === "OTHER"
            ? communication.readingOther || null
            : null,
        alternativeCommunication:
          communication.alternativeCommunication || null,
        alternativeCommunicationOther:
          communication.alternativeCommunication === "OTHER"
            ? communication.alternativeCommunicationOther || null
            : null,
      },
    ],

    foodSensitivities: formData.foodSensitivities.map((item) => ({
      type: item.type,
      otherText: item.type === "OTHER" ? item.otherText || null : null,
    })),
  };
};

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = validateExtraForm();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Revisa los campos obligatorios antes de enviar el formulario.");
      setSuccessMessage("");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setSubmitLoading(true);
      setError("");
      setSuccessMessage("");
      setFieldErrors({});

      await updateExtraFormByToken(token, buildPayload());

      setSubmitted(true);
      setSuccessMessage("Formulario extra enviado correctamente.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setError(error.message || "Error al enviar el formulario extra");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="page">
        <Card>
          <p>Cargando formulario extra...</p>
        </Card>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="page">
        <section className="confirmation-hero">
          <p className="eyebrow">Formulario enviado</p>
          <h1>Gracias, la información se ha enviado correctamente</h1>
          <p>
            ENKI ha recibido el formulario complementario y lo revisará para
            adaptar correctamente la participación en el campamento.
          </p>
        </section>

        <Card>
          <h2>Próximos pasos</h2>
          <p>
            Un representante de ENKI se pondrá en contacto con la familia si
            necesita aclarar algún dato adicional.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="page extraform-section-stack">
      <section className="confirmation-hero">
        <p className="eyebrow">Formulario adicional</p>
        <h1>Información complementaria del participante</h1>
        <p>
          Completa la información necesaria para adaptar correctamente la
          participación en el campamento.
        </p>
      </section>

      {error && <p className="form-error">{error}</p>}
      {successMessage && <p className="form-success">{successMessage}</p>}

      <form onSubmit={handleSubmit}>
        <Card>
          <h2>Información general</h2>

          <div className="form-grid">
            
            <Textarea
              id="routines"
              label="Rutinas importantes"
              required
              error={fieldErrors.routines}
              value={formData.routines || ""}
              onChange={(event) => updateField("routines", event.target.value)}
            />

            <Textarea
              id="emotional-regulation"
              label="Regulación emocional"
              required
              error={fieldErrors.emotionalRegulation}
              value={formData.emotionalRegulation || ""}
              onChange={(event) =>
                updateField("emotionalRegulation", event.target.value)
              }
            />

            <Select
              id="schooling-type"
              label="Tipo de escolarización"
              required
              error={fieldErrors.schoolingType}
              value={formData.schoolingType || ""}
              onChange={(event) =>
                updateField("schoolingType", event.target.value)
              }
            >
              <option value="">Selecciona una opción</option>
              <option value="ORDINARY">Ordinaria</option>
              <option value="SPECIAL">Especial</option>
              <option value="OTHER">Otra</option>
            </Select>

            {formData.schoolingType === "OTHER" && (
              <Input
                id="schooling-type-other"
                label="Otro tipo de escolarización"
                required
                error={fieldErrors.schoolingTypeOther}
                value={formData.schoolingTypeOther || ""}
                onChange={(event) =>
                  updateField("schoolingTypeOther", event.target.value)
                }
              />
            )}

            <Select
              id="support-type"
              label="Tipo de apoyo"
              required
              error={fieldErrors.supportType}
              value={formData.supportType || ""}
              onChange={(event) =>
                updateField("supportType", event.target.value)
              }
            >
              <option value="">Selecciona una opción</option>
              <option value="NONE">Sin apoyo</option>
              <option value="INTERMITTENT">Intermitente</option>
              <option value="LIMITED_EXTENSIVE">Limitado/extenso</option>
              <option value="GENERALIZED_CONSTANT">
                Generalizado/constante
              </option>
            </Select>
          </div>
        </Card>

        <Card>
          <h2>Autonomía y alimentación</h2>

          <div className="form-grid">
            <Select
              id="hygiene"
              label="Higiene: lavado de manos"
              required
              error={fieldErrors.hygiene}
              value={formData.hygiene || ""}
              onChange={(event) => updateField("hygiene", event.target.value)}
            >
              <option value="">Selecciona una opción</option>
              <option value="INDEPENDENT">Independiente</option>
              <option value="NEEDS_SUPERVISION">Necesita supervisión</option>
              <option value="NEEDS_PHYSICAL_SUPPORT">
                Necesita apoyo físico
              </option>
            </Select>

            <Select
              id="bladder-control"
              label="Control de esfínteres: vejiga"
              required
              error={fieldErrors.bladderControl}
              value={formData.bladderControl || ""}
              onChange={(event) =>
                updateField("bladderControl", event.target.value)
              }
            >
              <option value="">Selecciona una opción</option>
              <option value="GOES_ALONE">Va solo/a</option>
              <option value="ASKS_OR_WARNS">Lo pide o avisa</option>
              <option value="MUST_BE_ASKED">Hay que preguntarle</option>
              <option value="USES_DIAPER">Usa pañal</option>
            </Select>

            <Select
              id="bowel-control"
              label="Control de esfínteres: intestino"
              required
              error={fieldErrors.bowelControl}
              value={formData.bowelControl || ""}
              onChange={(event) =>
                updateField("bowelControl", event.target.value)
              }
            >
              <option value="">Selecciona una opción</option>
              <option value="GOES_ALONE">Va solo/a</option>
              <option value="ASKS_OR_WARNS">Lo pide o avisa</option>
              <option value="MUST_BE_ASKED">Hay que preguntarle</option>
              <option value="USES_DIAPER">Usa pañal</option>
            </Select>

            <Select
              id="eating-support"
              label="Apoyo en la comida"
              required
              error={fieldErrors.eatingSupport}
              value={formData.eatingSupport || ""}
              onChange={(event) =>
                updateField("eatingSupport", event.target.value)
              }
            >
              <option value="">Selecciona una opción</option>
              <option value="INDEPENDENT">Independiente</option>
              <option value="NEEDS_SUPERVISION">Necesita supervisión</option>
              <option value="NEEDS_INTERMITTENT_SUPPORT">
                Necesita apoyo intermitente
              </option>
              <option value="NEEDS_CONTINUOUS_SUPPORT">
                Necesita apoyo continuo
              </option>
            </Select>

            <Textarea
              id="feeding-adaptation"
              label="Adaptaciones en la alimentación"
              required
              error={fieldErrors.feedingAdaptation}
              value={formData.feedingAdaptation || ""}
              onChange={(event) =>
                updateField("feedingAdaptation", event.target.value)
              }
            />

            <Select
              id="choking-episodes"
              label="¿Ha tenido episodios de atragantamiento?"
              required
              error={fieldErrors.chokingEpisodes}
              value={formData.chokingEpisodes}
              onChange={(event) =>
                updateField("chokingEpisodes", event.target.value)
              }
            >
              <option value="">Selecciona una opción</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </Select>
          </div>
        </Card>

        <Card>
          <h2>Discapacidad y movilidad</h2>

          <div className="form-grid">
            <Input
              id="functional-diversity"
              label="Diversidad funcional"
              required
              error={fieldErrors.functionalDiversity}
              value={formData.disability.functionalDiversity || ""}
              onChange={(event) =>
                updateDisabilityField("functionalDiversity", event.target.value)
              }
            />

            <Input
              id="disability-degree"
              label="Grado de discapacidad"
              required
              error={fieldErrors.disabilityDegree}
              value={formData.disability.disabilityDegree || ""}
              onChange={(event) =>
                updateDisabilityField("disabilityDegree", event.target.value)
              }
            />

            <Input
              id="dependency-degree"
              label="Grado de dependencia"
              required
              error={fieldErrors.dependencyDegree}
              value={formData.disability.dependencyDegree || ""}
              onChange={(event) =>
                updateDisabilityField("dependencyDegree", event.target.value)
              }
            />

            <Select
              id="wheelchair"
              label="¿Usa silla de ruedas?"
              required
              error={fieldErrors.wheelchair}
              value={formData.disability.wheelchair}
              onChange={(event) =>
                updateDisabilityField("wheelchair", event.target.value)
              }
            >
              <option value="">Selecciona una opción</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </Select>

            <Input
              id="mobility-aid"
              label="Ayuda técnica de movilidad"
              required
              error={fieldErrors.mobilityAid}
              value={formData.disability.mobilityAid || ""}
              onChange={(event) =>
                updateDisabilityField("mobilityAid", event.target.value)
              }
            />

            {[
              ["walking", "Caminar"],
              ["running", "Correr"],
              ["climbing", "Subir obstáculos"],
              ["crawling", "Gatear"],
              ["jumping", "Saltar"],
              ["stairs", "Escaleras"],
              ["outdoorMobility", "Movilidad exterior"],
            ].map(([field, label]) => (
              <Select
                key={field}
                id={field}
                label={label}
                required
                error={fieldErrors[field]}
                value={formData.disability[field] || ""}
                onChange={(event) =>
                  updateDisabilityField(field, event.target.value)
                }
              >
                <option value="">Selecciona una opción</option>
                <option value="INDEPENDENT">Independiente</option>
                <option value="NEEDS_SUPERVISION">Necesita supervisión</option>
                <option value="NEEDS_PHYSICAL_SUPPORT_OR_AID">
                  Necesita apoyo físico o ayuda técnica
                </option>
              </Select>
            ))}
          </div>
        </Card>

        <Card>
          <h2>Comunicación</h2>

          <div className="form-grid">
            <Select
              id="oral-language"
              label="Lenguaje oral"
              required
              error={fieldErrors.oralLanguage}
              value={formData.communication[0]?.oralLanguage || ""}
              onChange={(event) =>
                updateFirstArrayItem(
                  "communication",
                  "oralLanguage",
                  event.target.value
                )
              }
            >
              <option value="">Selecciona una opción</option>
              <option value="SOUNDS">Sonidos</option>
              <option value="SOME_WORDS">Algunas palabras</option>
              <option value="PHRASES">Frases</option>
              <option value="FLUENT">Fluido</option>
              <option value="DOES_NOT_SPEAK">No habla</option>
            </Select>

            <Select
              id="imitation"
              label="Imitación"
              required
              error={fieldErrors.imitation}
              value={formData.communication[0]?.imitation || ""}
              onChange={(event) =>
                updateFirstArrayItem(
                  "communication",
                  "imitation",
                  event.target.value
                )
              }
            >
              <option value="">Selecciona una opción</option>
              <option value="IMITATES_GESTURES">Imita gestos</option>
              <option value="IMITATES_COMPLEX_ACTIONS">
                Imita acciones complejas
              </option>
              <option value="IMITATES_SOUNDS">Imita sonidos</option>
              <option value="IMITATES_WORDS">Imita palabras</option>
              <option value="DOES_NOT_IMITATE">No imita</option>
            </Select>

            <Select
              id="writing"
              label="Escritura"
              required
              error={fieldErrors.writing}
              value={formData.communication[0]?.writing || ""}
              onChange={(event) =>
                updateFirstArrayItem(
                  "communication",
                  "writing",
                  event.target.value
                )
              }
            >
              <option value="">Selecciona una opción</option>
              <option value="LETTERS">Letras</option>
              <option value="NUMBERS">Números</option>
              <option value="WORDS">Palabras</option>
              <option value="SENTENCES">Frases</option>
              <option value="TEXTS">Textos</option>
            </Select>

            <Select
              id="comprehension"
              label="Comprensión"
              required
              error={fieldErrors.comprehension}
              value={formData.communication[0]?.comprehension || ""}
              onChange={(event) =>
                updateFirstArrayItem(
                  "communication",
                  "comprehension",
                  event.target.value
                )
              }
            >
              <option value="">Selecciona una opción</option>
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

            {formData.communication[0]?.comprehension === "OTHER" && (
              <Input
                id="comprehension-other"
                label="Otra comprensión"
                required
                error={fieldErrors.comprehensionOther}
                value={formData.communication[0]?.comprehensionOther || ""}
                onChange={(event) =>
                  updateFirstArrayItem(
                    "communication",
                    "comprehensionOther",
                    event.target.value
                  )
                }
              />
            )}

            <Select
              id="reading"
              label="Lectura"
              required
              error={fieldErrors.reading}
              value={formData.communication[0]?.reading || ""}
              onChange={(event) =>
                updateFirstArrayItem(
                  "communication",
                  "reading",
                  event.target.value
                )
              }
            >
              <option value="">Selecciona una opción</option>
              <option value="LETTERS">Letras</option>
              <option value="NUMBERS">Números</option>
              <option value="WORDS">Palabras</option>
              <option value="SENTENCES">Frases</option>
              <option value="TEXTS">Textos</option>
              <option value="DOES_NOT_READ">No lee</option>
              <option value="OTHER">Otra</option>
            </Select>

            {formData.communication[0]?.reading === "OTHER" && (
              <Input
                id="reading-other"
                label="Otra lectura"
                required
                error={fieldErrors.readingOther}
                value={formData.communication[0]?.readingOther || ""}
                onChange={(event) =>
                  updateFirstArrayItem(
                    "communication",
                    "readingOther",
                    event.target.value
                  )
                }
              />
            )}

            <Select
              id="alternative-communication"
              label="Comunicación alternativa"
              required
              error={fieldErrors.alternativeCommunication}
              value={formData.communication[0]?.alternativeCommunication || ""}
              onChange={(event) =>
                updateFirstArrayItem(
                  "communication",
                  "alternativeCommunication",
                  event.target.value
                )
              }
            >
              <option value="">Selecciona una opción</option>
              <option value="NONE">Ninguna</option>
              <option value="SIGN_LANGUAGE">Lengua de signos</option>
              <option value="PECS">PECS</option>
              <option value="COMMUNICATOR">Comunicador</option>
              <option value="BRAILLE">Braille</option>
              <option value="OTHER">Otra</option>
            </Select>

            {formData.communication[0]?.alternativeCommunication ===
              "OTHER" && (
              <Textarea
                id="alternative-communication-other"
                label="Otra comunicación alternativa"
                required
                error={fieldErrors.alternativeCommunicationOther}
                value={
                  formData.communication[0]?.alternativeCommunicationOther || ""
                }
                onChange={(event) =>
                  updateFirstArrayItem(
                    "communication",
                    "alternativeCommunicationOther",
                    event.target.value
                  )
                }
              />
            )}
          </div>
        </Card>

        <Card>
          <h2>Deporte, juego y miedos</h2>

          <div className="form-grid">
            <Select
              id="does-sport"
              label="¿Practica deporte?"
              required
              error={fieldErrors.doesSport}
              value={formData.sports[0]?.doesSport || ""}
              onChange={(event) =>
                updateFirstArrayItem("sports", "doesSport", event.target.value)
              }
            >
              <option value="">Selecciona una opción</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </Select>

            <Textarea
              id="favorite-sports"
              label="Deportes o actividades favoritas"
              required
              error={fieldErrors.favoriteSports}
              value={formData.sports[0]?.favoriteSports || ""}
              onChange={(event) =>
                updateFirstArrayItem(
                  "sports",
                  "favoriteSports",
                  event.target.value
                )
              }
            />

            <Select
              id="swimming-level"
              label="Nivel de natación"
              required
              error={fieldErrors.swimmingLevel}
              value={formData.sports[0]?.swimmingLevel || ""}
              onChange={(event) =>
                updateFirstArrayItem(
                  "sports",
                  "swimmingLevel",
                  event.target.value
                )
              }
            >
              <option value="">Selecciona una opción</option>
              <option value="YES">Sí sabe nadar</option>
              <option value="NO">No sabe nadar</option>
              <option value="WITH_TECHNICAL_AIDS">
                Con ayudas técnicas
              </option>
              <option value="WITH_SUPPORT">Con apoyo</option>
            </Select>

            <Select
              id="social-play"
              label="Juego social"
              required
              error={fieldErrors.socialPlay}
              value={formData.sports[0]?.socialPlay || ""}
              onChange={(event) =>
                updateFirstArrayItem("sports", "socialPlay", event.target.value)
              }
            >
              <option value="">Selecciona una opción</option>
              <option value="NO_INTEREST_IN_GROUP_PLAY">
                No muestra interés por juego en grupo
              </option>
              <option value="SMALL_GROUPS">Grupos pequeños</option>
              <option value="LARGE_GROUPS">Grupos grandes</option>
            </Select>

            <Select
              id="play-fixation"
              label="Duración/fijación del juego"
              required
              error={fieldErrors.playFixation}
              value={formData.sports[0]?.playFixation || ""}
              onChange={(event) =>
                updateFirstArrayItem(
                  "sports",
                  "playFixation",
                  event.target.value
                )
              }
            >
              <option value="">Selecciona una opción</option>
              <option value="SHORT_TIME">Poco tiempo</option>
              <option value="LONG_TIME">Mucho tiempo</option>
            </Select>

            <Textarea
              id="fears"
              label="Miedos o situaciones que puedan generar malestar"
              required
              error={fieldErrors.fears}
              value={formData.fears[0]?.fears || ""}
              onChange={(event) =>
                updateFirstArrayItem("fears", "fears", event.target.value)
              }
            />

            <Textarea
              id="coping-mechanisms"
              label="Qué ayuda a calmarle o acompañarle"
              required
              error={fieldErrors.copingMechanisms}
              value={formData.fears[0]?.copingMechanisms || ""}
              onChange={(event) =>
                updateFirstArrayItem(
                  "fears",
                  "copingMechanisms",
                  event.target.value
                )
              }
            />
          </div>
        </Card>

        <Card>
          <h2>Sensibilidades alimentarias</h2>

          <div className="checkbox-group">
            {[
              ["SOLIDS", "Sólidos"],
              ["PUREES", "Purés"],
              ["SOUPS", "Sopas"],
              ["WATER_JUICES", "Agua o zumos"],
              ["YOGURTS", "Yogures"],
              ["FRUIT", "Fruta"],
              ["NONE", "Ninguna"],
              ["OTHER", "Otra"],
            ].map(([value, label]) => (
              <label className="checkbox-field" key={value}>
                <input
                  type="checkbox"
                  checked={formData.foodSensitivities.some(
                    (item) => item.type === value
                  )}
                  onChange={() => toggleFoodSensitivity(value)}
                />
                {label}
              </label>
            ))}
          </div>

          {fieldErrors.foodSensitivities && (
            <p className="field-error-message">
              {fieldErrors.foodSensitivities}
            </p>
          )}

          {formData.foodSensitivities.some((item) => item.type === "OTHER") && (
            <Input
              id="food-sensitivity-other"
              label="Otra sensibilidad alimentaria"
              required
              error={fieldErrors.foodSensitivityOther}
              value={
                formData.foodSensitivities.find((item) => item.type === "OTHER")
                  ?.otherText || ""
              }
              onChange={(event) => updateFoodSensitivityOther(event.target.value)}
            />
          )}
        </Card>

        <Card>
          <h2>Otra información</h2>

          <Textarea
            id="extra-info"
            label="Información adicional"
            value={formData.extraInfo || ""}
            onChange={(event) => updateField("extraInfo", event.target.value)}
          />

          <div className="form-actions">
            <Button type="submit" disabled={submitLoading}>
              {submitLoading ? "Enviando..." : "Enviar formulario"}
            </Button>
          </div>
        </Card>
      </form>
    </main>
  );
}