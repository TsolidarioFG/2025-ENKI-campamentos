import Card from "../ui/Card";
import Input from "../ui/Input";

export default function GuardianForm({ data, onChange, errors = {}, clearError }) {
  const updateField = (field, value) => {
    clearError?.(`guardian.${field}`);
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <Card>
      <h2>Información madre/padre/tutor legal</h2>

      <div className="form-grid">
        <Input
          id="guardian-name"
          label="Nombre"
          required
          value={data.name}
           error={errors["guardian.name"]}
          onChange={(event) => updateField("name", event.target.value)}
        />

        <Input
          id="guardian-surname"
          label="Apellidos"
          required
          value={data.surname}
           error={errors["guardian.surname"]}
          onChange={(event) => updateField("surname", event.target.value)}
        />

        <Input
          id="guardian-dni"
          label="DNI/NIE"
          required
          value={data.dni}
          error={errors["guardian.dni"]}
          onChange={(event) => updateField("dni", event.target.value)}
        />

        <Input
          id="guardian-phone"
          label="Teléfono"
          required
          value={data.phone}
          error={errors["guardian.phone"]}
          onChange={(event) => updateField("phone", event.target.value)}
        />

        <Input
          id="guardian-phone2"
          label="Teléfono 2"
          value={data.phone2}
          error={errors["guardian.phone2"]}
          onChange={(event) => updateField("phone2", event.target.value)}
        />

        <Input
          id="guardian-email"
          label="Email"
          type="email"
          required
          value={data.email}
           error={errors["guardian.email"]}
          onChange={(event) => updateField("email", event.target.value)}
        />

        <Input
          id="guardian-email2"
          label="Email 2"
          type="email"
          value={data.email2}
          error={errors["guardian.email2"]}
          onChange={(event) => updateField("email2", event.target.value)}
        />

        <Input
          id="guardian-relation"
          label="Relación familiar"
          required
          value={data.relation}
           error={errors["guardian.relation"]}
          onChange={(event) => updateField("relation", event.target.value)}
        />
      </div>
    </Card>
  );
}