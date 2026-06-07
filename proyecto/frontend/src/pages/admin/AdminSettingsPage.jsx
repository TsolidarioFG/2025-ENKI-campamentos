import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import {
  createSummerCamp,
  getSummerCamps,
  updateSummerCamp,
  deleteSummerCamp,
} from "../../services/summerCampService";
import { useAuth } from "../../context/AuthContext";
import {
  getAppSettings,
  updateAppSettings,
} from "../../services/settingsService";

const toDateInputValue = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

const emptyCampForm = {
  name: "",
  place: "",
  year: "",
  description: "",
  startDate: "",
  endDate: "",
  inscriptionOpenDate: "",
  inscriptionCloseDate: "",
  formEnabled: true,
  isActive: true,
  defaultTotalPlaces: 0,
  defaultTotalDisabilityPlaces: 0,
  defaultBasePrice: 0,
  defaultDisabilityPrice: 0,
  defaultEarlyRisePrice: 0,
  defaultBreakfastPrice: 0,
  defaultLunchPrice: 0,
};

const emptyCreateCampForm = {
  name: "",
  place: "",
  year: new Date().getFullYear(),
  description: "",
  startDate: "",
  endDate: "",
  inscriptionOpenDate: "",
  inscriptionCloseDate: "",
  formEnabled: true,
  isActive: true,
  totalPlaces: 0,
  totalDisabilityPlaces: 0,
  basePrice: 0,
  disabilityPrice: 0,
  earlyRisePrice: 0,
  breakfastPrice: 0,
  lunchPrice: 0,
};

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const canEdit = user?.role === "ADMIN" || user?.role === "SUPERADMIN";
  const canManageUsers = user?.role === "SUPERADMIN";

  const [summerCamps, setSummerCamps] = useState([]);
  const [selectedCampId, setSelectedCampId] = useState("");
  const [campMode, setCampMode] = useState("view");
  const [campForm, setCampForm] = useState(emptyCampForm);
  const [createCampForm, setCreateCampForm] = useState(emptyCreateCampForm);

  const [appSettings, setAppSettings] = useState({
    pendingReservationHours: 48,
  });

  const [loading, setLoading] = useState(true);
  const [savingCamp, setSavingCamp] = useState(false);
  const [creatingCamp, setCreatingCamp] = useState(false);
  const [deletingCamp, setDeletingCamp] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedCamp = useMemo(() => {
    return summerCamps.find(
      (camp) => String(camp.id) === String(selectedCampId)
    );
  }, [summerCamps, selectedCampId]);

  const fillCampForm = (camp) => {
    setCampForm({
      name: camp.name || "",
      place: camp.place || "",
      year: camp.year || "",
      description: camp.description || "",
      startDate: toDateInputValue(camp.startDate),
      endDate: toDateInputValue(camp.endDate),
      inscriptionOpenDate: toDateInputValue(camp.inscriptionOpenDate),
      inscriptionCloseDate: toDateInputValue(camp.inscriptionCloseDate),
      formEnabled: camp.formEnabled ?? true,
      isActive: camp.isActive ?? true,
      defaultTotalPlaces: camp.defaultTotalPlaces ?? 0,
      defaultTotalDisabilityPlaces: camp.defaultTotalDisabilityPlaces ?? 0,
      defaultBasePrice: camp.defaultBasePrice ?? 0,
      defaultDisabilityPrice: camp.defaultDisabilityPrice ?? 0,
      defaultEarlyRisePrice: camp.defaultEarlyRisePrice ?? 0,
      defaultBreakfastPrice: camp.defaultBreakfastPrice ?? 0,
      defaultLunchPrice: camp.defaultLunchPrice ?? 0,
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [campsResult, settingsResult] = await Promise.all([
        getSummerCamps(),
        getAppSettings(),
      ]);

      setSummerCamps(campsResult);
      setAppSettings({
        pendingReservationHours:
          settingsResult?.pendingReservationHours ?? 48,
      });

      if (campsResult.length > 0) {
        const currentSelected = campsResult.find(
          (camp) => String(camp.id) === String(selectedCampId)
        );
        const campToSelect = currentSelected || campsResult[0];

        setSelectedCampId(String(campToSelect.id));
        fillCampForm(campToSelect);
      } else {
        setSelectedCampId("");
        setCampForm(emptyCampForm);
      }
    } catch (error) {
      setError(error.message || "Error al cargar ajustes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectCamp = (campId) => {
    setSelectedCampId(campId);
    setCampMode("view");
    setError("");
    setSuccess("");

    const camp = summerCamps.find((item) => String(item.id) === String(campId));

    if (camp) {
      fillCampForm(camp);
    } else {
      setCampForm(emptyCampForm);
    }
  };

  const updateCampField = (field, value) => {
    setError("");
    setSuccess("");

    setCampForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateCreateCampField = (field, value) => {
    setError("");
    setSuccess("");

    setCreateCampForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateSettingsField = (field, value) => {
    setError("");
    setSuccess("");

    setAppSettings((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const validateCampDates = (form) => {
    if (!form.name.trim()) return "El nombre del campamento es obligatorio";
    if (!form.place.trim()) return "El lugar del campamento es obligatorio";
    if (!form.year || Number(form.year) <= 0) return "El año debe ser válido";
    if (!form.startDate) return "La fecha de inicio es obligatoria";
    if (!form.endDate) return "La fecha de fin es obligatoria";

    if (new Date(form.endDate) <= new Date(form.startDate)) {
      return "La fecha de fin debe ser posterior a la fecha de inicio";
    }

    if (
      form.inscriptionOpenDate &&
      form.inscriptionCloseDate &&
      new Date(form.inscriptionCloseDate) <= new Date(form.inscriptionOpenDate)
    ) {
      return "El cierre de inscripción debe ser posterior a la apertura";
    }

    if (
      form.inscriptionCloseDate &&
      new Date(form.inscriptionCloseDate) > new Date(form.startDate)
    ) {
      return "El cierre de inscripción no puede ser posterior al inicio del campamento";
    }

    return "";
  };

  const validateNumericDefaults = (form, mode) => {
    const fields =
      mode === "create"
        ? [
            ["totalPlaces", "Las plazas generales"],
            ["totalDisabilityPlaces", "Las plazas de discapacidad"],
            ["basePrice", "El precio base"],
            ["disabilityPrice", "El precio de discapacidad"],
            ["earlyRisePrice", "El precio de madrugadores"],
            ["breakfastPrice", "El precio de desayuno"],
            ["lunchPrice", "El precio de comedor"],
          ]
        : [
            ["defaultTotalPlaces", "Las plazas generales por defecto"],
            [
              "defaultTotalDisabilityPlaces",
              "Las plazas de discapacidad por defecto",
            ],
            ["defaultBasePrice", "El precio base por defecto"],
            ["defaultDisabilityPrice", "El precio de discapacidad por defecto"],
            ["defaultEarlyRisePrice", "El precio de madrugadores por defecto"],
            ["defaultBreakfastPrice", "El precio de desayuno por defecto"],
            ["defaultLunchPrice", "El precio de comedor por defecto"],
          ];

    for (const [field, label] of fields) {
      if (Number(form[field]) < 0) {
        return `${label} debe ser mayor o igual que 0`;
      }
    }

    return "";
  };

  const validateEditCampForm = () => {
    if (!selectedCampId) return "Debes seleccionar un campamento";

    const dateError = validateCampDates(campForm);
    if (dateError) return dateError;

    return validateNumericDefaults(campForm, "edit");
  };

  const validateCreateCampForm = () => {
    const dateError = validateCampDates(createCampForm);
    if (dateError) return dateError;

    return validateNumericDefaults(createCampForm, "create");
  };

  const handleSaveCamp = async (event) => {
    event.preventDefault();

    if (!canEdit) {
      setError("Tu usuario solo puede consultar campamentos, no modificarlos.");
      return;
    }

    const validationError = validateEditCampForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSavingCamp(true);
      setError("");
      setSuccess("");

      const updatedCamp = await updateSummerCamp(selectedCampId, {
        name: campForm.name,
        place: campForm.place,
        year: Number(campForm.year),
        description: campForm.description || null,
        startDate: campForm.startDate,
        endDate: campForm.endDate,
        inscriptionOpenDate: campForm.inscriptionOpenDate || null,
        inscriptionCloseDate: campForm.inscriptionCloseDate || null,
        formEnabled: campForm.formEnabled,
        isActive: campForm.isActive,
        weekDefaults: {
          totalPlaces: Number(campForm.defaultTotalPlaces),
          totalDisabilityPlaces: Number(
            campForm.defaultTotalDisabilityPlaces
          ),
        },
        priceDefaults: {
          basePrice: Number(campForm.defaultBasePrice),
          disabilityPrice: Number(campForm.defaultDisabilityPrice),
          earlyRisePrice: Number(campForm.defaultEarlyRisePrice),
          breakfastPrice: Number(campForm.defaultBreakfastPrice),
          lunchPrice: Number(campForm.defaultLunchPrice),
        },
      });

      setSummerCamps((current) =>
        current.map((camp) =>
          String(camp.id) === String(selectedCampId) ? updatedCamp : camp
        )
      );

      fillCampForm(updatedCamp);
      setSuccess("Campamento actualizado correctamente");
    } catch (error) {
      setError(error.message || "Error al guardar campamento");
    } finally {
      setSavingCamp(false);
    }
  };

  const handleCreateCamp = async (event) => {
    event.preventDefault();

    if (!canEdit) {
      setError("Tu usuario no puede crear campamentos.");
      return;
    }

    const validationError = validateCreateCampForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setCreatingCamp(true);
      setError("");
      setSuccess("");

      const createdCamp = await createSummerCamp({
        name: createCampForm.name,
        place: createCampForm.place,
        year: Number(createCampForm.year),
        description: createCampForm.description || null,
        startDate: createCampForm.startDate,
        endDate: createCampForm.endDate,
        inscriptionOpenDate: createCampForm.inscriptionOpenDate || null,
        inscriptionCloseDate: createCampForm.inscriptionCloseDate || null,
        formEnabled: createCampForm.formEnabled,
        isActive: createCampForm.isActive,
        weekDefaults: {
          totalPlaces: Number(createCampForm.totalPlaces),
          totalDisabilityPlaces: Number(createCampForm.totalDisabilityPlaces),
        },
        priceDefaults: {
          basePrice: Number(createCampForm.basePrice),
          disabilityPrice: Number(createCampForm.disabilityPrice),
          earlyRisePrice: Number(createCampForm.earlyRisePrice),
          breakfastPrice: Number(createCampForm.breakfastPrice),
          lunchPrice: Number(createCampForm.lunchPrice),
        },
      });

      setSummerCamps((current) => [createdCamp, ...current]);
      setSelectedCampId(String(createdCamp.id));
      setCampMode("view");
      fillCampForm(createdCamp);
      setCreateCampForm(emptyCreateCampForm);
      setSuccess("Campamento creado correctamente");
    } catch (error) {
      setError(error.message || "Error al crear campamento");
    } finally {
      setCreatingCamp(false);
    }
  };

  const handleDeleteCamp = async () => {
    if (!selectedCampId || !selectedCamp) return;

    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar el campamento ${selectedCamp.name} ${selectedCamp.year}? Solo se podrá si no tiene inscripciones.`
    );

    if (!confirmed) return;

    try {
      setDeletingCamp(true);
      setError("");
      setSuccess("");

      await deleteSummerCamp(selectedCampId);

      const remainingCamps = summerCamps.filter(
        (camp) => String(camp.id) !== String(selectedCampId)
      );

      setSummerCamps(remainingCamps);

      if (remainingCamps.length > 0) {
        setSelectedCampId(String(remainingCamps[0].id));
        fillCampForm(remainingCamps[0]);
      } else {
        setSelectedCampId("");
        setCampForm(emptyCampForm);
      }

      setSuccess("Campamento eliminado correctamente");
    } catch (error) {
      setError(error.message || "Error al eliminar campamento");
    } finally {
      setDeletingCamp(false);
    }
  };

  const handleSaveAppSettings = async (event) => {
    event.preventDefault();

    if (!canEdit) {
      setError(
        "Tu usuario solo puede consultar los ajustes generales, no modificarlos."
      );
      return;
    }

    const parsedHours = Number(appSettings.pendingReservationHours);

    if (!Number.isInteger(parsedHours) || parsedHours <= 0) {
      setError(
        "El tiempo para pagar la reserva debe ser un número entero mayor que 0"
      );
      return;
    }

    try {
      setSavingSettings(true);
      setError("");
      setSuccess("");

      const updatedSettings = await updateAppSettings({
        pendingReservationHours: parsedHours,
      });

      setAppSettings({
        pendingReservationHours: updatedSettings.pendingReservationHours,
      });

      setSuccess("Ajustes generales actualizados correctamente");
    } catch (error) {
      setError(error.message || "Error al guardar ajustes generales");
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) return <p>Cargando ajustes...</p>;

  return (
    <section className="settings-section-stack">
      <div className="admin-page-heading">
        <button
          type="button"
          onClick={() => history.back()}
          className="back-button"
        >
          Atrás
        </button>

        <h1>Ajustes</h1>
        <p>Consulta y configura campamentos, formulario público y administración.</p>
      </div>

      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}

      <Card>
        <h2>Ajustes generales</h2>

        <form onSubmit={handleSaveAppSettings} className="form-grid">
          <Input
            id="pending-reservation-hours"
            label="Tiempo para pagar la reserva, en horas"
            type="number"
            min="1"
            required
            disabled={!canEdit}
            value={appSettings.pendingReservationHours}
            onChange={(event) =>
              updateSettingsField("pendingReservationHours", event.target.value)
            }
          />

          {!canEdit && (
            <p className="helper-text field-full">
              Puedes consultar este ajuste, pero no modificarlo.
            </p>
          )}

          {canEdit && (
            <div className="form-actions field-full">
              <Button type="submit" disabled={savingSettings}>
                {savingSettings ? "Guardando..." : "Guardar ajustes generales"}
              </Button>
            </div>
          )}
        </form>
      </Card>

      <Card>
        <h2>Campamentos</h2>

        <div className="form-actions">
          <Button
            type="button"
            variant={campMode === "view" ? undefined : "secondary"}
            onClick={() => setCampMode("view")}
          >
            Ver campamento
          </Button>

          {canEdit && (
            <Button
              type="button"
              variant={campMode === "create" ? undefined : "secondary"}
              onClick={() => {
                setCampMode("create");
                setError("");
                setSuccess("");
              }}
            >
              Crear campamento
            </Button>
          )}
        </div>

        {campMode === "view" && (
          <>
            <div className="form-grid">
              <Select
                id="settings-camp"
                label="Seleccionar campamento"
                value={selectedCampId}
                onChange={(event) => handleSelectCamp(event.target.value)}
              >
                <option value="">Selecciona un campamento</option>
                {summerCamps.map((camp) => (
                  <option key={camp.id} value={camp.id}>
                    {camp.name} - {camp.year}
                  </option>
                ))}
              </Select>
            </div>

            {selectedCampId && (
              <div className="field field-full">
                <label>URL pública de inscripción</label>
                <div className="inline-control">
                  <input
                    readOnly
                    value={`${window.location.origin}/inscripcion/${campForm.year}`}
                  />
                  <Button
                    type="button"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `${window.location.origin}/inscripcion/${campForm.year}`
                      )
                    }
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            )}

            {selectedCampId && (
              <form onSubmit={handleSaveCamp} className="form-grid">
                <Input
                  id="settings-camp-name"
                  label="Nombre"
                  required
                  disabled={!canEdit}
                  value={campForm.name}
                  onChange={(event) =>
                    updateCampField("name", event.target.value)
                  }
                />

                <Input
                  id="settings-camp-place"
                  label="Lugar"
                  required
                  disabled={!canEdit}
                  value={campForm.place}
                  onChange={(event) =>
                    updateCampField("place", event.target.value)
                  }
                />

                <Input
                  id="settings-camp-year"
                  label="Año"
                  type="number"
                  required
                  disabled={!canEdit}
                  value={campForm.year}
                  onChange={(event) =>
                    updateCampField("year", event.target.value)
                  }
                />

                <Textarea
                  id="settings-camp-description"
                  label="Descripción"
                  disabled={!canEdit}
                  value={campForm.description}
                  onChange={(event) =>
                    updateCampField("description", event.target.value)
                  }
                />

                <Input
                  id="settings-camp-start"
                  label="Fecha inicio campamento"
                  type="date"
                  required
                  disabled={!canEdit}
                  value={campForm.startDate}
                  onChange={(event) =>
                    updateCampField("startDate", event.target.value)
                  }
                />

                <Input
                  id="settings-camp-end"
                  label="Fecha fin campamento"
                  type="date"
                  required
                  disabled={!canEdit}
                  value={campForm.endDate}
                  onChange={(event) =>
                    updateCampField("endDate", event.target.value)
                  }
                />

                <Input
                  id="settings-inscription-open"
                  label="Apertura inscripciones"
                  type="date"
                  disabled={!canEdit}
                  value={campForm.inscriptionOpenDate}
                  onChange={(event) =>
                    updateCampField("inscriptionOpenDate", event.target.value)
                  }
                />

                <Input
                  id="settings-inscription-close"
                  label="Cierre inscripciones"
                  type="date"
                  disabled={!canEdit}
                  value={campForm.inscriptionCloseDate}
                  onChange={(event) =>
                    updateCampField("inscriptionCloseDate", event.target.value)
                  }
                />

                <h3 className="field-full">Valores por defecto</h3>

                <Input
                  id="settings-default-total-places"
                  label="Plazas generales por semana"
                  type="number"
                  min="0"
                  required
                  disabled={!canEdit}
                  value={campForm.defaultTotalPlaces}
                  onChange={(event) =>
                    updateCampField("defaultTotalPlaces", event.target.value)
                  }
                />

                <Input
                  id="settings-default-total-disability-places"
                  label="Plazas discapacidad por semana"
                  type="number"
                  min="0"
                  required
                  disabled={!canEdit}
                  value={campForm.defaultTotalDisabilityPlaces}
                  onChange={(event) =>
                    updateCampField(
                      "defaultTotalDisabilityPlaces",
                      event.target.value
                    )
                  }
                />

                <Input
                  id="settings-default-base-price"
                  label="Precio base"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  disabled={!canEdit}
                  value={campForm.defaultBasePrice}
                  onChange={(event) =>
                    updateCampField("defaultBasePrice", event.target.value)
                  }
                />

                <Input
                  id="settings-default-disability-price"
                  label="Precio discapacidad"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  disabled={!canEdit}
                  value={campForm.defaultDisabilityPrice}
                  onChange={(event) =>
                    updateCampField("defaultDisabilityPrice", event.target.value)
                  }
                />

                <Input
                  id="settings-default-early-rise-price"
                  label="Precio madrugadores"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  disabled={!canEdit}
                  value={campForm.defaultEarlyRisePrice}
                  onChange={(event) =>
                    updateCampField("defaultEarlyRisePrice", event.target.value)
                  }
                />

                <Input
                  id="settings-default-breakfast-price"
                  label="Precio desayuno"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  disabled={!canEdit}
                  value={campForm.defaultBreakfastPrice}
                  onChange={(event) =>
                    updateCampField("defaultBreakfastPrice", event.target.value)
                  }
                />

                <Input
                  id="settings-default-lunch-price"
                  label="Precio comedor"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  disabled={!canEdit}
                  value={campForm.defaultLunchPrice}
                  onChange={(event) =>
                    updateCampField("defaultLunchPrice", event.target.value)
                  }
                />

                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={campForm.formEnabled}
                    onChange={(event) =>
                      updateCampField("formEnabled", event.target.checked)
                    }
                  />
                  Formulario de inscripción habilitado
                </label>

                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={campForm.isActive}
                    onChange={(event) =>
                      updateCampField("isActive", event.target.checked)
                    }
                  />
                  Campamento activo
                </label>

                {!canEdit && (
                  <p className="helper-text field-full">
                    Puedes consultar la información de los campamentos, pero no modificarla.
                  </p>
                )}

                {canEdit && (
                  <div className="form-actions field-full">
                    <Button type="submit" disabled={savingCamp}>
                      {savingCamp
                        ? "Guardando..."
                        : "Guardar ajustes del campamento"}
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        navigate(
                          `/administracion/ajustes/campamentos/${selectedCampId}/semanas`
                        )
                      }
                    >
                      Ver semanas
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      disabled={deletingCamp}
                      onClick={handleDeleteCamp}
                    >
                      {deletingCamp ? "Eliminando..." : "Eliminar campamento"}
                    </Button>
                  </div>
                )}

                {!canEdit && selectedCampId && (
                  <div className="form-actions field-full">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        navigate(
                          `/administracion/ajustes/campamentos/${selectedCampId}/semanas`
                        )
                      }
                    >
                      Ver semanas
                    </Button>
                  </div>
                )}
              </form>
            )}
          </>
        )}

        {campMode === "create" && canEdit && (
          <form onSubmit={handleCreateCamp} className="form-grid">
            <Input
              id="create-camp-name"
              label="Nombre"
              required
              value={createCampForm.name}
              onChange={(event) =>
                updateCreateCampField("name", event.target.value)
              }
            />

            <Input
              id="create-camp-place"
              label="Lugar"
              required
              value={createCampForm.place}
              onChange={(event) =>
                updateCreateCampField("place", event.target.value)
              }
            />

            <Input
              id="create-camp-year"
              label="Año"
              type="number"
              required
              value={createCampForm.year}
              onChange={(event) =>
                updateCreateCampField("year", event.target.value)
              }
            />

            <Textarea
              id="create-camp-description"
              label="Descripción"
              value={createCampForm.description}
              onChange={(event) =>
                updateCreateCampField("description", event.target.value)
              }
            />

            <Input
              id="create-camp-start"
              label="Fecha inicio campamento"
              type="date"
              required
              value={createCampForm.startDate}
              onChange={(event) =>
                updateCreateCampField("startDate", event.target.value)
              }
            />

            <Input
              id="create-camp-end"
              label="Fecha fin campamento"
              type="date"
              required
              value={createCampForm.endDate}
              onChange={(event) =>
                updateCreateCampField("endDate", event.target.value)
              }
            />

            <Input
              id="create-inscription-open"
              label="Apertura inscripciones"
              type="date"
              value={createCampForm.inscriptionOpenDate}
              onChange={(event) =>
                updateCreateCampField(
                  "inscriptionOpenDate",
                  event.target.value
                )
              }
            />

            <Input
              id="create-inscription-close"
              label="Cierre inscripciones"
              type="date"
              value={createCampForm.inscriptionCloseDate}
              onChange={(event) =>
                updateCreateCampField(
                  "inscriptionCloseDate",
                  event.target.value
                )
              }
            />

            <Input
              id="create-total-places"
              label="Plazas generales por semana"
              type="number"
              min="0"
              required
              value={createCampForm.totalPlaces}
              onChange={(event) =>
                updateCreateCampField("totalPlaces", event.target.value)
              }
            />

            <Input
              id="create-total-disability-places"
              label="Plazas discapacidad por semana"
              type="number"
              min="0"
              required
              value={createCampForm.totalDisabilityPlaces}
              onChange={(event) =>
                updateCreateCampField(
                  "totalDisabilityPlaces",
                  event.target.value
                )
              }
            />

            <Input
              id="create-base-price"
              label="Precio base"
              type="number"
              step="0.01"
              min="0"
              required
              value={createCampForm.basePrice}
              onChange={(event) =>
                updateCreateCampField("basePrice", event.target.value)
              }
            />

            <Input
              id="create-disability-price"
              label="Precio discapacidad"
              type="number"
              step="0.01"
              min="0"
              required
              value={createCampForm.disabilityPrice}
              onChange={(event) =>
                updateCreateCampField("disabilityPrice", event.target.value)
              }
            />

            <Input
              id="create-early-rise-price"
              label="Precio madrugadores"
              type="number"
              step="0.01"
              min="0"
              required
              value={createCampForm.earlyRisePrice}
              onChange={(event) =>
                updateCreateCampField("earlyRisePrice", event.target.value)
              }
            />

            <Input
              id="create-breakfast-price"
              label="Precio desayuno"
              type="number"
              step="0.01"
              min="0"
              required
              value={createCampForm.breakfastPrice}
              onChange={(event) =>
                updateCreateCampField("breakfastPrice", event.target.value)
              }
            />

            <Input
              id="create-lunch-price"
              label="Precio comedor"
              type="number"
              step="0.01"
              min="0"
              required
              value={createCampForm.lunchPrice}
              onChange={(event) =>
                updateCreateCampField("lunchPrice", event.target.value)
              }
            />

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={createCampForm.formEnabled}
                onChange={(event) =>
                  updateCreateCampField("formEnabled", event.target.checked)
                }
              />
              Formulario de inscripción habilitado
            </label>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={createCampForm.isActive}
                onChange={(event) =>
                  updateCreateCampField("isActive", event.target.checked)
                }
              />
              Campamento activo
            </label>

            <div className="form-actions field-full">
              <Button type="submit" disabled={creatingCamp}>
                {creatingCamp ? "Creando..." : "Crear campamento"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => setCampMode("view")}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </Card>

      <Card>
        <h2>Descuentos</h2>
        <p>Gestiona descuentos, porcentajes y preguntas asociadas.</p>

        <div className="form-actions">
          <Button
            type="button"
            onClick={() => navigate("/administracion/descuentos")}
          >
            Gestionar descuentos
          </Button>
        </div>
      </Card>

      {canManageUsers && (
        <Card>
          <h2>Usuarios</h2>
          <p>Gestiona usuarios, roles y permisos de acceso al sistema.</p>

          <div className="form-actions">
            <Link to="/administracion/usuarios" className="button">
              Gestionar usuarios
            </Link>
          </div>
        </Card>
      )}
    </section>
  );
}
