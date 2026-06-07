import Card from "../ui/Card";
import Button from "../ui/Button";

const SYSTEM_DISCOUNT_CODES = {
  repeatedBefore: "REPEAT",
  siblings: "SIBLING",
  schoolRelated: "SCHOOL",
};

const getActivePrice = (week) => {
  if (!week.prices || week.prices.length === 0) return null;

  const activePrice = week.prices.find((price) => price.isActive);

  return activePrice || week.prices[0];
};

const hasWeekPlaces = (week, hasDisability) => {
  return hasDisability
    ? week.availableDisabilityPlaces > 0
    : week.availablePlaces > 0;
};

const calculateWeekGrossTotal = (selectedWeek, weeks, hasDisability) => {
  const weekInfo = weeks.find(
    (week) =>
      week.summerCampId === selectedWeek.summerCampId &&
      week.number === selectedWeek.number
  );

  if (!weekInfo) return 0;

  const price = getActivePrice(weekInfo);

  if (!price) return 0;

  let total = hasDisability ? price.disabilityPrice : price.basePrice;

  if (selectedWeek.breakfast) total += price.breakfastPrice;
  if (selectedWeek.lunch) total += price.lunchPrice;
  if (selectedWeek.earlyRise) total += price.earlyRisePrice;

  return Number(total.toFixed(2));
};

const getAutomaticDiscountCodes = (participant) => {
  const codes = [];

  if (participant?.repeatedBefore) codes.push(SYSTEM_DISCOUNT_CODES.repeatedBefore);
  if (participant?.siblings) codes.push(SYSTEM_DISCOUNT_CODES.siblings);
  if (participant?.schoolRelated) codes.push(SYSTEM_DISCOUNT_CODES.schoolRelated);

  return codes;
};

const resolveAppliedDiscounts = ({
  participant,
  manualDiscountCodes = [],
  availableDiscounts = [],
}) => {
  const requestedCodes = [
    ...getAutomaticDiscountCodes(participant),
    ...manualDiscountCodes,
  ];

  const uniqueCodes = [...new Set(requestedCodes.map((code) => code.toUpperCase()))];

  return availableDiscounts.filter(
    (discount) => discount.isActive && uniqueCodes.includes(discount.code)
  );
};

const applyDiscounts = (grossAmount, appliedDiscounts) => {
  const totalDiscountPercentage = Math.min(
    appliedDiscounts.reduce(
      (sum, discount) => sum + Number(discount.percentage || 0),
      0
    ),
    100
  );

  const discountAmount = Number(
    (grossAmount * (totalDiscountPercentage / 100)).toFixed(2)
  );

  const finalAmount = Number(Math.max(0, grossAmount - discountAmount).toFixed(2));

  return {
    grossAmount,
    totalDiscountPercentage,
    discountAmount,
    finalAmount,
  };
};

export default function WeeksSelector({
  data,
  onChange,
  weeks,
  loading,
  hasDisability,
  participant,
  manualDiscountCodes = [],
  availableDiscounts = [],
  discountsLoading = false,
  discountsError = "",
}) {
  const appliedDiscounts = resolveAppliedDiscounts({
    participant,
    manualDiscountCodes,
    availableDiscounts,
  });

  const isSelected = (week) => {
    return data.some(
      (item) =>
        item.summerCampId === week.summerCampId &&
        item.number === week.number
    );
  };

  const getSelectedWeek = (week) => {
    return data.find(
      (item) =>
        item.summerCampId === week.summerCampId &&
        item.number === week.number
    );
  };

  const toggleWeek = (week) => {
    if (isSelected(week)) {
      onChange(
        data.filter(
          (item) =>
            !(
              item.summerCampId === week.summerCampId &&
              item.number === week.number
            )
        )
      );
      return;
    }

    onChange([
      ...data,
      {
        summerCampId: week.summerCampId,
        number: week.number,
        breakfast: false,
        lunch: false,
        earlyRise: false,
      },
    ]);
  };

  const updateService = (week, service, value) => {
    onChange(
      data.map((item) => {
        if (
          item.summerCampId === week.summerCampId &&
          item.number === week.number
        ) {
          return {
            ...item,
            [service]: value,
          };
        }

        return item;
      })
    );
  };

  const totals = data.reduce(
    (acc, selectedWeek) => {
      const weekInfo = weeks.find(
        (week) =>
          week.summerCampId === selectedWeek.summerCampId &&
          week.number === selectedWeek.number
      );

      if (!weekInfo) return acc;

      const grossAmount = calculateWeekGrossTotal(
        selectedWeek,
        weeks,
        hasDisability
      );

      const discountResult = applyDiscounts(grossAmount, appliedDiscounts);

      if (hasWeekPlaces(weekInfo, hasDisability)) {
        acc.payNowGross += discountResult.grossAmount;
        acc.payNowDiscount += discountResult.discountAmount;
        acc.payNowFinal += discountResult.finalAmount;
      } else {
        acc.waitlistGross += discountResult.grossAmount;
        acc.waitlistDiscount += discountResult.discountAmount;
        acc.waitlistFinal += discountResult.finalAmount;
      }

      acc.potentialGross += discountResult.grossAmount;
      acc.potentialDiscount += discountResult.discountAmount;
      acc.potentialFinal += discountResult.finalAmount;

      return acc;
    },
    {
      payNowGross: 0,
      payNowDiscount: 0,
      payNowFinal: 0,
      waitlistGross: 0,
      waitlistDiscount: 0,
      waitlistFinal: 0,
      potentialGross: 0,
      potentialDiscount: 0,
      potentialFinal: 0,
    }
  );

  Object.keys(totals).forEach((key) => {
    totals[key] = Number(totals[key].toFixed(2));
  });

  if (loading) {
    return (
      <Card>
        <h2>Selección de semanas</h2>
        <p>Cargando semanas disponibles...</p>
      </Card>
    );
  }

  if (!weeks || weeks.length === 0) {
    return (
      <Card>
        <h2>Selección de semanas</h2>
        <p>No hay semanas disponibles.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2>Selección de semanas</h2>

      <p className="helper-text">
        Selecciona las semanas en las que quieres inscribir al menor. Las
        semanas sin plazas se enviarán como lista de espera.
      </p>

      {discountsLoading && (
        <p className="helper-text">Cargando descuentos...</p>
      )}

      {discountsError && (
        <p className="form-error">{discountsError}</p>
      )}

      {appliedDiscounts.length > 0 && (
        <div className="discount-summary">
          <strong>Descuentos aplicados:</strong>

          <ul>
            {appliedDiscounts.map((discount) => (
              <li key={discount.id}>
                {discount.code} - {discount.percentage}%
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="weeks-grid">
        {weeks.map((week) => {
          const selectedWeek = getSelectedWeek(week);
          const selected = Boolean(selectedWeek);
          const price = getActivePrice(week);
          const hasPlaces = hasWeekPlaces(week, hasDisability);

          const baseWeekPrice = price
            ? hasDisability
              ? price.disabilityPrice
              : price.basePrice
            : 0;

          const selectedGrossTotal =
            selected && price
              ? calculateWeekGrossTotal(selectedWeek, weeks, hasDisability)
              : baseWeekPrice;

          const selectedDiscountResult = applyDiscounts(
            selectedGrossTotal,
            appliedDiscounts
          );

          return (
            <div className="week-card" key={week.id}>
              <div className="week-card-header">
                <div>
                  <h3>Semana {week.number}</h3>
                  <p>
                    {new Date(week.startDate).toLocaleDateString()} -{" "}
                    {new Date(week.endDate).toLocaleDateString()}
                  </p>
                </div>

                <strong>
                  {price ? `${selectedDiscountResult.finalAmount} €` : "Sin precio"}
                </strong>
              </div>

              {price && appliedDiscounts.length > 0 && (
                <p className="helper-text">
                  Precio original: {selectedGrossTotal} € · Descuento: -
                  {selectedDiscountResult.discountAmount} €
                </p>
              )}

              {!hasPlaces && (
                <p className="waitlist-label">Sin plazas: lista de espera</p>
              )}

              {!week.active && (
                <p className="waitlist-label">Semana inactiva</p>
              )}

              <Button
                type="button"
                onClick={() => toggleWeek(week)}
                disabled={!week.active || !price}
              >
                {selected
                  ? "Anular"
                  : hasPlaces
                    ? "Reservar"
                    : "Apuntarse a lista de espera"}
              </Button>

              {selected && price && (
                <div className="week-services">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedWeek.breakfast}
                      onChange={(event) =>
                        updateService(week, "breakfast", event.target.checked)
                      }
                    />
                    Desayuno (+{price.breakfastPrice} €)
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      checked={selectedWeek.lunch}
                      onChange={(event) =>
                        updateService(week, "lunch", event.target.checked)
                      }
                    />
                    Comedor (+{price.lunchPrice} €)
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      checked={selectedWeek.earlyRise}
                      onChange={(event) =>
                        updateService(week, "earlyRise", event.target.checked)
                      }
                    />
                    Madrugadores (+{price.earlyRisePrice} €)
                  </label>

                  <p className="week-total">
                    Total semana: {selectedDiscountResult.finalAmount} €
                  </p>

                  {appliedDiscounts.length > 0 && (
                    <p className="helper-text">
                      Sin descuento: {selectedGrossTotal} € · Descuento aplicado:
                      -{selectedDiscountResult.discountAmount} €
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="price-box">
        <p>
          <strong>Total bruto con plaza:</strong> {totals.payNowGross} €
        </p>

        <p>
          <strong>Descuento aplicado:</strong> -{totals.payNowDiscount} €
        </p>

        <p>
          <strong>Total a pagar ahora:</strong> {totals.payNowFinal} €
        </p>

        <hr />

        <p>
          <strong>Importe bruto en lista de espera:</strong>{" "}
          {totals.waitlistGross} €
        </p>

        <p>
          <strong>Descuento aplicado en lista de espera:</strong>{" "}
          -{totals.waitlistDiscount} €
        </p>

        <p>
          <strong>Total si entran las semanas en lista de espera:</strong>{" "}
          {totals.waitlistFinal} €
        </p>

        <hr />

        <p>
          <strong>Total potencial con todas las semanas:</strong>{" "}
          {totals.potentialFinal} €
        </p>
      </div>
    </Card>
  );
}