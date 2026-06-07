import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import {
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from "../../services/discountService";

const emptyDiscountForm = {
  code: "",
  question: "",
  percentage: "",
  isActive: true,
  notes: "",
};

export default function AdminDiscountsPage() {
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

  const [discounts, setDiscounts] = useState([]);
  const [discountForm, setDiscountForm] = useState(emptyDiscountForm);
  const [editingDiscountId, setEditingDiscountId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getDiscounts();
      setDiscounts(result);
    } catch (error) {
      setError(error.message || "Error al cargar descuentos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  const resetDiscountForm = () => {
    setDiscountForm(emptyDiscountForm);
    setEditingDiscountId(null);
  };

  const updateDiscountField = (field, value) => {
    setError("");
    setSuccess("");

    setDiscountForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleEditDiscount = (discount) => {
    setEditingDiscountId(discount.id);
    setDiscountForm({
      code: discount.code || "",
      question: discount.question || "",
      percentage: discount.percentage ?? "",
      isActive: discount.isActive ?? true,
      notes: discount.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveDiscount = async (event) => {
    event.preventDefault();

    if (!canEdit) {
      setError("Tu usuario solo puede consultar descuentos, no modificarlos.");
      return;
    }

    if (!discountForm.code.trim()) {
      setError("El código del descuento es obligatorio.");
      return;
    }

    if (!discountForm.question.trim()) {
      setError("La pregunta o descripción del descuento es obligatoria.");
      return;
    }

    if (Number(discountForm.percentage) < 0) {
      setError("El porcentaje no puede ser negativo.");
      return;
    }

    try {
      setSavingDiscount(true);
      setError("");
      setSuccess("");

      const payload = {
        code: discountForm.code,
        question: discountForm.question,
        percentage: Number(discountForm.percentage),
        isActive: discountForm.isActive,
        notes: discountForm.notes || null,
      };

      if (editingDiscountId) {
        const result = await updateDiscount(editingDiscountId, payload);

        setDiscounts((current) =>
          current.map((item) =>
            item.id === editingDiscountId ? result.discount : item
          )
        );

        setSuccess("Descuento actualizado correctamente");
      } else {
        const result = await createDiscount(payload);

        setDiscounts((current) => [result.discount, ...current]);
        setSuccess("Descuento creado correctamente");
      }

      resetDiscountForm();
    } catch (error) {
      setError(error.message || "Error al guardar descuento");
    } finally {
      setSavingDiscount(false);
    }
  };

  const handleDeactivateDiscount = async (discountId) => {
    if (!canEdit) return;

    try {
      setError("");
      setSuccess("");

      const result = await deleteDiscount(discountId);

      setDiscounts((current) =>
        current.map((item) =>
          item.id === discountId ? result.discount : item
        )
      );

      setSuccess("Descuento desactivado correctamente");
    } catch (error) {
      setError(error.message || "Error al desactivar descuento");
    }
  };

  if (loading) return <p>Cargando descuentos...</p>;

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

        <h1>Descuentos</h1>
        <p>Gestiona descuentos, porcentajes y preguntas asociadas.</p>
      </div>

      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}

      <Card>
        <h2>{editingDiscountId ? "Editar descuento" : "Crear descuento"}</h2>

        {!canEdit && (
          <p className="helper-text">
            Puedes consultar los descuentos, pero no modificarlos.
          </p>
        )}

        {canEdit && (
          <form onSubmit={handleSaveDiscount} className="form-grid">
            <Input
              id="discount-code"
              label="Código"
              required
              value={discountForm.code}
              onChange={(event) =>
                updateDiscountField("code", event.target.value)
              }
            />

            <Input
              id="discount-percentage"
              label="Porcentaje"
              type="number"
              min="0"
              step="0.01"
              required
              value={discountForm.percentage}
              onChange={(event) =>
                updateDiscountField("percentage", event.target.value)
              }
            />

            <Input
              id="discount-question"
              label="Pregunta o descripción"
              required
              value={discountForm.question}
              onChange={(event) =>
                updateDiscountField("question", event.target.value)
              }
            />

            <Textarea
              id="discount-notes"
              label="Notas"
              value={discountForm.notes}
              onChange={(event) =>
                updateDiscountField("notes", event.target.value)
              }
            />

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={discountForm.isActive}
                onChange={(event) =>
                  updateDiscountField("isActive", event.target.checked)
                }
              />
              Descuento activo
            </label>

            <div className="form-actions field-full">
              <Button type="submit" disabled={savingDiscount}>
                {savingDiscount
                  ? "Guardando..."
                  : editingDiscountId
                  ? "Guardar descuento"
                  : "Crear descuento"}
              </Button>

              {editingDiscountId && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetDiscountForm}
                >
                  Cancelar edición
                </Button>
              )}
            </div>
          </form>
        )}
      </Card>

      <Card>
        <h2>Listado de descuentos</h2>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Porcentaje</th>
                <th>Activo</th>
                <th>Notas</th>
                {canEdit && <th>Acciones</th>}
              </tr>
            </thead>

            <tbody>
              {discounts.map((discount) => (
                <tr key={discount.id}>
                  <td>{discount.code}</td>
                  <td>{discount.question}</td>
                  <td>{discount.percentage}%</td>
                  <td>{discount.isActive ? "Sí" : "No"}</td>
                  <td>{discount.notes || "-"}</td>
                  {canEdit && (
                    <td>
                      <div className="table-actions">
                        <Button
                          type="button"
                          onClick={() => handleEditDiscount(discount)}
                        >
                          Editar
                        </Button>

                        {discount.isActive && (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() =>
                              handleDeactivateDiscount(discount.id)
                            }
                          >
                            Desactivar
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {discounts.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? "6" : "5"}>
                    Todavía no hay descuentos configurados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
