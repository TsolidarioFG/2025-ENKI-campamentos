import { useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";

const getAutomaticDiscounts = (participant) => {
  const discounts = [];

  if (participant.repeatedBefore) {
    discounts.push({
      code: "REPEAT",
      label: "Repetición de campamento",
      percentage: 10,
    });
  }

  if (participant.siblings) {
    discounts.push({
      code: "SIBLING",
      label: "Hermano/a participante",
      percentage: 10,
    });
  }

  if (participant.schoolRelated) {
    discounts.push({
      code: "SCHOOL",
      label: "Colegio del campamento",
      percentage: 10,
    });
  }

  return discounts;
};

export default function DiscountSelector({
  participant,
  discounts = [],
  onDiscountsChange,
}) {
  const [newDiscountCode, setNewDiscountCode] = useState("");

  const automaticDiscounts = getAutomaticDiscounts(participant);

  const addDiscount = () => {
    const normalizedCode = newDiscountCode.trim().toUpperCase();

    if (!normalizedCode) return;
    if (discounts.includes(normalizedCode)) return;

    onDiscountsChange([...discounts, normalizedCode]);
    setNewDiscountCode("");
  };

  const removeDiscount = (code) => {
    onDiscountsChange(discounts.filter((item) => item !== code));
  };

  return (
    <Card>
      <h2>Descuentos</h2>

      <div className="discount-block">
        <h3>Descuentos automáticos</h3>

        {automaticDiscounts.length === 0 ? (
          <p className="helper-text">
            No hay descuentos automáticos marcados.
          </p>
        ) : (
          <ul className="discount-list">
            {automaticDiscounts.map((discount) => (
              <li key={discount.code}>
                {discount.label} - {discount.percentage}%
              </li>
            ))}
          </ul>
        )}

        <p className="helper-text">
          Estos descuentos se aplican según las respuestas marcadas en los datos
          de la persona menor.
        </p>
      </div>

      <div className="field field-full">
        <span>Código de descuento adicional</span>

        <div className="inline-control">
          <input
            value={newDiscountCode}
            placeholder="Ej: VERANO10"
            onChange={(event) => setNewDiscountCode(event.target.value)}
          />

          <Button type="button" onClick={addDiscount}>
            Añadir
          </Button>
        </div>

        {discounts.length > 0 && (
          <div className="tag-list">
            {discounts.map((code) => (
              <button
                type="button"
                className="tag"
                key={code}
                onClick={() => removeDiscount(code)}
              >
                {code} ×
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}