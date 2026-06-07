import Card from "../ui/Card";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Textarea from "../ui/Textarea";

export default function ParticipantForm({ data, onChange, errors = {}, clearError }) {
  const updateField = (field, value) => {
    clearError?.(`participant.${field}`);
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <Card>
      <h2>Datos de la persona menor</h2>

      <div className="form-grid">
        <Input
          id="participant-name"
          label="Nombre"
          required
          value={data.name}
          error={errors["participant.name"]}
          onChange={(event) => updateField("name", event.target.value)}
        />

        <Input
          id="participant-surname"
          label="Apellidos"
          required
          value={data.surname}
          error={errors["participant.surname"]}
          onChange={(event) => updateField("surname", event.target.value)}
        />

        <Input
          id="participant-birthdate"
          label="Fecha de nacimiento"
          type="date"
          required
          value={data.birthdate}
          error={errors["participant.birthdate"]}
          onChange={(event) => updateField("birthdate", event.target.value)}
        />

        <Select
          id="participant-gender"
          label="Género"
          required
          value={data.gender}
          error={errors["participant.gender"]}
          onChange={(event) => updateField("gender", event.target.value)}
        >
          <option value="">Selecciona una opción</option>
          <option value="HOMBRE">Hombre</option>
          <option value="MUJER">Mujer</option>
          <option value="NO_BINARIO">No binario</option>
          <option value="PREFIERO_NO_DECIRLO">Prefiero no decirlo</option>
        </Select>

        <Input
          id="participant-health-card"
          label="Nº tarjeta sanitaria"
          required
          value={data.healthCard}
          error={errors["participant.healthCard"]}
          onChange={(event) => updateField("healthCard", event.target.value)}
        />

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={data.repeatedBefore}
            onChange={(event) =>
              updateField("repeatedBefore", event.target.checked)
            }
          />
          ¿Acudió en otras ediciones a los campamentos ENKI?
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={data.hasDisability}
            onChange={(event) =>
              updateField("hasDisability", event.target.checked)
            }
          />
          ¿Tiene discapacidad o necesita algún apoyo específico?
        </label>

        {data.hasDisability && (
          <>
            <Input
              id="participant-disability-degree"
              label="Grado de discapacidad"
              required
              value={data.disabilityDegree}
              error={errors["participant.disabilityDegree"]}
              onChange={(event) =>
                updateField("disabilityDegree", event.target.value)
              }
            />

            <Input
              id="participant-dependency-degree"
              label="Grado de dependencia"
              required
              value={data.dependencyDegree}
              error={errors["participant.dependencyDegree"]}
              onChange={(event) =>
                updateField("dependencyDegree", event.target.value)
              }
            />

            <Textarea
              id="participant-disability-info"
              label="¿Nos podrías dar más información?"
              value={data.disabilityInfo}
              error={errors["participant.disabilityInfo"]}
              onChange={(event) =>
                updateField("disabilityInfo", event.target.value)
              }
            />
          </>
        )}

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={data.siblings}
            onChange={(event) => updateField("siblings", event.target.checked)}
          />
          ¿Tiene algún hermano o hermana participando?
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={data.schoolRelated}
            onChange={(event) =>
              updateField("schoolRelated", event.target.checked)
            }
          />
          ¿Acude al colegio donde se realiza el campamento?
        </label>

        <Textarea
          id="participant-allergy-description"
          label="Si la persona inscrita padece alguna alergia o intolerancia o sigue algún régimen alimentario, descríbanos cuál."
          value={data.allergyDescription}
          onChange={(event) =>
            updateField("allergyDescription", event.target.value)
          }
        />

        <Textarea
          id="participant-medication-description"
          label="Si la persona inscrita debe tomar medicación durante el campamento, descríbanos cuál."
          value={data.medicationDescription}
          onChange={(event) =>
            updateField("medicationDescription", event.target.value)
          }
        />

        <Textarea
          id="participant-symptoms-info"
          label="Si la persona inscrita es propensa a algún síntoma en concreto: dolores de cabeza, vértigos... Indique cuál."
          value={data.symptomsInfo}
          onChange={(event) =>
            updateField("symptomsInfo", event.target.value)
          }
        />
      </div>
    </Card>
  );
}