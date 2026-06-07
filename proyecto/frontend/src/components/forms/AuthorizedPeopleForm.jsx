import Card from "../ui/Card";
import Input from "../ui/Input";
import Button from "../ui/Button";

const emptyAuthorizedPerson = {
  name: "",
  surname: "",
  dni: "",
  phone: "",
  relation: "",
};

export default function AuthorizedPeopleForm({
  data,
  onChange,
  errors = {},
  clearError,
}) {
  const updatePerson = (index, field, value) => {
    clearError?.(`authorizedPeople.${index}.${field}`);
    clearError?.("authorizedPeople");

    const updatedPeople = data.map((person, currentIndex) => {
      if (currentIndex !== index) return person;

      return {
        ...person,
        [field]: value,
      };
    });

    onChange(updatedPeople);
  };

  const addPerson = () => {
    clearError?.("authorizedPeople");
    onChange([...data, emptyAuthorizedPerson]);
  };

  const removePerson = (index) => {
    if (data.length === 1) return;
    onChange(data.filter((_, currentIndex) => currentIndex !== index));
  };


  return (
    <Card>
      <h2>Personas autorizadas para recoger al menor</h2>

      <p className="helper-text">
        Estas personas serán las únicas autorizadas a recoger al menor.
      </p>

      {data.map((person, index) => (
        <div className="nested-card" key={index}>
          <div className="form-grid">
            <Input
              id={`authorized-name-${index}`}
              label="Nombre"
              required
              value={person.name}
              error={errors[`authorizedPeople.${index}.name`]}
              onChange={(event) => updatePerson(index, "name", event.target.value)}
            />

            <Input
              id={`authorized-surname-${index}`}
              label="Apellidos"
              required
              value={person.surname}
              error={errors[`authorizedPeople.${index}.surname`]}
              onChange={(event) => updatePerson(index, "surname", event.target.value)}
            />

            <Input
              id={`authorized-dni-${index}`}
              label="DNI/NIE"
              required
              value={person.dni}
              error={errors[`authorizedPeople.${index}.dni`]}
              onChange={(event) => updatePerson(index, "dni", event.target.value)}
            />

            <Input
              id={`authorized-phone-${index}`}
              label="Teléfono"
              required
              value={person.phone}
              error={errors[`authorizedPeople.${index}.phone`]}
              onChange={(event) => updatePerson(index, "phone", event.target.value)}
            />

            <Input
              id={`authorized-relation-${index}`}
              label="Relación familiar"
              required
              value={person.relation}
              error={errors[`authorizedPeople.${index}.relation`]}
              onChange={(event) => updatePerson(index, "relation", event.target.value)}
            />
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={() => removePerson(index)}
          >
            Eliminar persona
          </Button>
        </div>
      ))}

      <Button type="button" onClick={addPerson}>
        + Añadir persona autorizada
      </Button>
    </Card>
  );
}