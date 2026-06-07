import Card from "../ui/Card";
import Input from "../ui/Input";

export default function AddressForm({ data, onChange, errors = {}, clearError }) {
  const updateField = (field, value) => {
    clearError?.(`address.${field}`);
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <Card>
      <h2>Dirección</h2>

      <div className="form-grid">
        <Input
          id="address-street"
          label="Dirección"
          required
          value={data.street}
          error={errors["address.street"]}
          onChange={(event) => updateField("street", event.target.value)}
        />

        <Input
          id="address-city"
          label="Ciudad"
          required
          value={data.city}
          error={errors["address.city"]}
          onChange={(event) => updateField("city", event.target.value)}
        />

        <Input
          id="address-province"
          label="Provincia"
          required
          value={data.province}
          error={errors["address.province"]}
          onChange={(event) => updateField("province", event.target.value)}
        />

        <Input
          id="address-postal-code"
          label="Código postal"
          required
          value={data.postalCode}
          error={errors["address.postalCode"]}
          onChange={(event) => updateField("postalCode", event.target.value)}
        />
      </div>
    </Card>
  );
}