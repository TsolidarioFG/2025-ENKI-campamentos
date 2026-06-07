import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import { getSummerCamps } from "../../services/summerCampService";
import { updateWeek, createWeek, deleteWeek } from "../../services/weekService";
import { updatePrice } from "../../services/priceService";
import { useAuth } from "../../context/AuthContext";

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
};

const formatMoney = (value) => `${Number(value || 0).toFixed(2)} €`;

const getActivePrice = (week) => {
  return (
    week.prices?.find((price) => price.isActive) || week.prices?.[0] || {}
  );
};

const buildWeekForms = (weeks = []) => {
  const forms = {};

  weeks.forEach((week) => {
    const activePrice = getActivePrice(week);

    forms[week.id] = {
      totalPlaces: week.totalPlaces ?? 0,
      availablePlaces: week.availablePlaces ?? 0,
      totalDisabilityPlaces: week.totalDisabilityPlaces ?? 0,
      availableDisabilityPlaces: week.availableDisabilityPlaces ?? 0,
      active: week.active ?? true,
      prices: {
        basePrice: activePrice.basePrice ?? 0,
        disabilityPrice: activePrice.disabilityPrice ?? 0,
        earlyRisePrice: activePrice.earlyRisePrice ?? 0,
        breakfastPrice: activePrice.breakfastPrice ?? 0,
        lunchPrice: activePrice.lunchPrice ?? 0,
        notes: activePrice.notes || "",
      },
    };
  });

  return forms;
};

export default function AdminCampWeeksPage() {
  const { campId } = useParams();
  const { user } = useAuth();

  const canEdit = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

  const [summerCamps, setSummerCamps] = useState([]);
  const [weekForms, setWeekForms] = useState({});
  const [editingWeekId, setEditingWeekId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingWeekId, setSavingWeekId] = useState(null);
  const [creatingWeek, setCreatingWeek] = useState(false);
  const [deletingWeekId, setDeletingWeekId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedCamp = useMemo(() => {
    return summerCamps.find((camp) => String(camp.id) === String(campId));
  }, [summerCamps, campId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const campsResult = await getSummerCamps();
      setSummerCamps(campsResult);

      const camp = campsResult.find((item) => String(item.id) === String(campId));
      setWeekForms(buildWeekForms(camp?.weeks || []));
    } catch (error) {
      setError(error.message || "Error al cargar semanas del campamento");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [campId]);

  const updateWeekFormField = (weekId, field, value) => {
    setError("");
    setSuccess("");

    setWeekForms((current) => ({
      ...current,
      [weekId]: {
        ...current[weekId],
        [field]: value,
      },
    }));
  };

  const updateWeekPriceField = (weekId, field, value) => {
    setError("");
    setSuccess("");

    setWeekForms((current) => ({
      ...current,
      [weekId]: {
        ...current[weekId],
        prices: {
          ...current[weekId].prices,
          [field]: value,
        },
      },
    }));
  };

  const handleSaveWeek = async (week) => {
    if (!canEdit) {
      setError("Tu usuario solo puede consultar semanas, no modificarlas.");
      return;
    }

    try {
      setSavingWeekId(week.id);
      setError("");
      setSuccess("");

      const form = weekForms[week.id];

      await updateWeek({
        summerCampId: week.summerCampId,
        number: week.number,
        payload: {
          totalPlaces: Number(form.totalPlaces),
          availablePlaces: Number(form.availablePlaces),
          totalDisabilityPlaces: Number(form.totalDisabilityPlaces),
          availableDisabilityPlaces: Number(form.availableDisabilityPlaces),
          active: form.active,
        },
      });

      await updatePrice({
        summerCampId: week.summerCampId,
        number: week.number,
        basePrice: Number(form.prices.basePrice),
        disabilityPrice: Number(form.prices.disabilityPrice),
        earlyRisePrice: Number(form.prices.earlyRisePrice),
        breakfastPrice: Number(form.prices.breakfastPrice),
        lunchPrice: Number(form.prices.lunchPrice),
        notes: form.prices.notes || null,
      });

      setSuccess(`Semana ${week.number} actualizada correctamente`);
      setEditingWeekId(null);
      await loadData();
    } catch (error) {
      setError(error.message || "Error al actualizar la semana");
    } finally {
      setSavingWeekId(null);
    }
  };

  const handleCreateWeek = async () => {
    if (!selectedCamp) return;

    if (!canEdit) {
      setError("Tu usuario no puede crear semanas.");
      return;
    }

    try {
      setCreatingWeek(true);
      setError("");
      setSuccess("");

      await createWeek({
        summerCampId: selectedCamp.id,
        totalPlaces: selectedCamp.defaultTotalPlaces,
        totalDisabilityPlaces: selectedCamp.defaultTotalDisabilityPlaces,
        priceDefaults: {
          basePrice: selectedCamp.defaultBasePrice,
          disabilityPrice: selectedCamp.defaultDisabilityPrice,
          earlyRisePrice: selectedCamp.defaultEarlyRisePrice,
          breakfastPrice: selectedCamp.defaultBreakfastPrice,
          lunchPrice: selectedCamp.defaultLunchPrice,
        },
      });

      setSuccess("Semana añadida correctamente");
      await loadData();
    } catch (error) {
      setError(error.message || "Error al añadir semana");
    } finally {
      setCreatingWeek(false);
    }
  };

  const handleDeleteWeek = async (week) => {
    if (!canEdit) return;

    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar la semana ${week.number}? Solo se podrá si es la última y no tiene inscripciones.`
    );

    if (!confirmed) return;

    try {
      setDeletingWeekId(week.id);
      setError("");
      setSuccess("");

      await deleteWeek({
        summerCampId: week.summerCampId,
        number: week.number,
      });

      setSuccess("Semana eliminada correctamente");
      await loadData();
    } catch (error) {
      setError(error.message || "Error al eliminar semana");
    } finally {
      setDeletingWeekId(null);
    }
  };

  if (loading) return <p>Cargando semanas...</p>;

  if (!selectedCamp) {
    return (
      <section>
        <div className="admin-page-heading">
          <button
            type="button"
            onClick={() => history.back()}
            className="back-button"
          >
            Atrás
          </button>
          <h1>Semanas</h1>
          <p>No se encontró el campamento seleccionado.</p>
        </div>
      </section>
    );
  }

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

        <h1>Semanas de {selectedCamp.name}</h1>
        <p>
          Configuración individual de plazas, disponibilidad, estado y precios de
          cada semana del campamento {selectedCamp.year}.
        </p>
      </div>

      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}

      <Card>
        <h2>Resumen del campamento</h2>

        <div className="detail-grid">
          <div>
            <span className="summary-label">Campamento</span>
            <strong>{selectedCamp.name}</strong>
          </div>

          <div>
            <span className="summary-label">Año</span>
            <strong>{selectedCamp.year}</strong>
          </div>

          <div>
            <span className="summary-label">Inicio</span>
            <strong>{formatDate(selectedCamp.startDate)}</strong>
          </div>

          <div>
            <span className="summary-label">Fin</span>
            <strong>{formatDate(selectedCamp.endDate)}</strong>
          </div>
        </div>

        {canEdit && (
          <div className="form-actions">
            <Button type="button" disabled={creatingWeek} onClick={handleCreateWeek}>
              {creatingWeek ? "Añadiendo..." : "Añadir semana al final"}
            </Button>
          </div>
        )}
      </Card>

      {selectedCamp.weeks?.length === 0 ? (
        <Card>
          <p>No hay semanas configuradas para este campamento.</p>
        </Card>
      ) : (
        <div className="settings-section-stack">
          {selectedCamp.weeks.map((week) => {
            const form = weekForms[week.id];
            const isWeekEditing = editingWeekId === week.id;

            if (!form) return null;

            return (
              <Card key={week.id}>
                <h2>Semana {week.number}</h2>

                <p>
                  {formatDate(week.startDate)} - {formatDate(week.endDate)}
                </p>

                {!isWeekEditing ? (
                  <>
                    <div className="detail-grid">
                      <div>
                        <span className="summary-label">
                          Plazas totales sin discapacidad
                        </span>
                        <strong>{week.totalPlaces}</strong>
                      </div>

                      <div>
                        <span className="summary-label">
                          Plazas libres sin discapacidad
                        </span>
                        <strong>{week.availablePlaces}</strong>
                      </div>

                      <div>
                        <span className="summary-label">
                          Plazas totales con discapacidad
                        </span>
                        <strong>{week.totalDisabilityPlaces}</strong>
                      </div>

                      <div>
                        <span className="summary-label">
                          Plazas libres con discapacidad
                        </span>
                        <strong>{week.availableDisabilityPlaces}</strong>
                      </div>

                      <div>
                        <span className="summary-label">Activa</span>
                        <strong>{week.active ? "SI" : "NO"}</strong>
                      </div>

                      <div>
                        <span className="summary-label">Precio base</span>
                        <strong>{formatMoney(form.prices.basePrice)}</strong>
                      </div>

                      <div>
                        <span className="summary-label">Precio discapacidad</span>
                        <strong>{formatMoney(form.prices.disabilityPrice)}</strong>
                      </div>

                      <div>
                        <span className="summary-label">Madrugadores</span>
                        <strong>{formatMoney(form.prices.earlyRisePrice)}</strong>
                      </div>

                      <div>
                        <span className="summary-label">Desayuno</span>
                        <strong>{formatMoney(form.prices.breakfastPrice)}</strong>
                      </div>

                      <div>
                        <span className="summary-label">Comedor</span>
                        <strong>{formatMoney(form.prices.lunchPrice)}</strong>
                      </div>
                    </div>

                    {canEdit && (
                      <div className="form-actions">
                        <Button
                          type="button"
                          onClick={() => setEditingWeekId(week.id)}
                        >
                          Editar semana
                        </Button>

                        <Button
                          type="button"
                          variant="secondary"
                          disabled={deletingWeekId === week.id}
                          onClick={() => handleDeleteWeek(week)}
                        >
                          {deletingWeekId === week.id
                            ? "Eliminando..."
                            : "Eliminar semana"}
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="form-grid">
                      <Input
                        id={`week-${week.id}-total-places`}
                        label="Plazas totales sin discapacidad"
                        type="number"
                        min="0"
                        value={form.totalPlaces}
                        onChange={(event) =>
                          updateWeekFormField(
                            week.id,
                            "totalPlaces",
                            event.target.value
                          )
                        }
                      />

                      <Input
                        id={`week-${week.id}-available-places`}
                        label="Plazas libres sin discapacidad"
                        type="number"
                        min="0"
                        value={form.availablePlaces}
                        onChange={(event) =>
                          updateWeekFormField(
                            week.id,
                            "availablePlaces",
                            event.target.value
                          )
                        }
                      />

                      <Input
                        id={`week-${week.id}-total-disability-places`}
                        label="Plazas totales con discapacidad"
                        type="number"
                        min="0"
                        value={form.totalDisabilityPlaces}
                        onChange={(event) =>
                          updateWeekFormField(
                            week.id,
                            "totalDisabilityPlaces",
                            event.target.value
                          )
                        }
                      />

                      <Input
                        id={`week-${week.id}-available-disability-places`}
                        label="Plazas libres con discapacidad"
                        type="number"
                        min="0"
                        value={form.availableDisabilityPlaces}
                        onChange={(event) =>
                          updateWeekFormField(
                            week.id,
                            "availableDisabilityPlaces",
                            event.target.value
                          )
                        }
                      />

                      <Select
                        id={`week-${week.id}-active`}
                        label="Semana activa"
                        value={String(form.active)}
                        onChange={(event) =>
                          updateWeekFormField(
                            week.id,
                            "active",
                            event.target.value === "true"
                          )
                        }
                      >
                        <option value="true">SI</option>
                        <option value="false">NO</option>
                      </Select>

                      <Input
                        id={`week-${week.id}-base-price`}
                        label="Precio base"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.prices.basePrice}
                        onChange={(event) =>
                          updateWeekPriceField(
                            week.id,
                            "basePrice",
                            event.target.value
                          )
                        }
                      />

                      <Input
                        id={`week-${week.id}-disability-price`}
                        label="Precio discapacidad"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.prices.disabilityPrice}
                        onChange={(event) =>
                          updateWeekPriceField(
                            week.id,
                            "disabilityPrice",
                            event.target.value
                          )
                        }
                      />

                      <Input
                        id={`week-${week.id}-early-rise-price`}
                        label="Precio madrugadores"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.prices.earlyRisePrice}
                        onChange={(event) =>
                          updateWeekPriceField(
                            week.id,
                            "earlyRisePrice",
                            event.target.value
                          )
                        }
                      />

                      <Input
                        id={`week-${week.id}-breakfast-price`}
                        label="Precio desayuno"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.prices.breakfastPrice}
                        onChange={(event) =>
                          updateWeekPriceField(
                            week.id,
                            "breakfastPrice",
                            event.target.value
                          )
                        }
                      />

                      <Input
                        id={`week-${week.id}-lunch-price`}
                        label="Precio comedor"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.prices.lunchPrice}
                        onChange={(event) =>
                          updateWeekPriceField(
                            week.id,
                            "lunchPrice",
                            event.target.value
                          )
                        }
                      />

                      <Textarea
                        id={`week-${week.id}-price-notes`}
                        label="Notas del precio"
                        value={form.prices.notes}
                        onChange={(event) =>
                          updateWeekPriceField(week.id, "notes", event.target.value)
                        }
                      />
                    </div>

                    <div className="form-actions">
                      <Button
                        type="button"
                        disabled={savingWeekId === week.id}
                        onClick={() => handleSaveWeek(week)}
                      >
                        {savingWeekId === week.id
                          ? "Guardando..."
                          : "Guardar semana"}
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setEditingWeekId(null);
                          setWeekForms(buildWeekForms(selectedCamp.weeks || []));
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
