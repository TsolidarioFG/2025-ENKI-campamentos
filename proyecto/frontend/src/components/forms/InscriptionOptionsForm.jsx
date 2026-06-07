import { useState } from "react";
import Card from "../ui/Card";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Textarea from "../ui/Textarea";


export default function InscriptionOptionsForm({
  inscription,
  discounts,
  onInscriptionChange,
  onDiscountsChange,
  errors = {},
  clearError,
}) {
  const [newDiscountCode, setNewDiscountCode] = useState("");

  const updateField = (field, value) => {
    clearError?.(`inscription.${field}`);

    onInscriptionChange({
      ...inscription,
      [field]: value,
    });
  };

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
      <h2>Pago, factura y autorizaciones</h2>

      <div className="form-grid">
        <Select
          id="payment-mode"
          required
          label="Modalidad de pago"
          value={inscription.paymentMode}
          onChange={(event) => updateField("paymentMode", event.target.value)}
        >
          <option value="ONE_PAYMENT">Pago único</option>
          <option value="TWO_PAYMENTS">Dos pagos</option>
        </Select>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={inscription.invoiceRequested}
            onChange={(event) =>
              updateField("invoiceRequested", event.target.checked)
            }
          />
          Solicitar factura
        </label>

        {inscription.invoiceRequested && (
          <>
            <Input
              id="invoice-name"
              required
              label="Nombre para factura"
              value={inscription.invoiceName}
              error={errors["inscription.invoiceName"]}
              onChange={(event) =>
                updateField("invoiceName", event.target.value)
              }
            />

            <Input
              id="invoice-dni"
              label="DNI/NIE para factura"
              required
              value={inscription.invoiceDni}
              error={errors["inscription.invoiceDni"]}
              onChange={(event) =>
                updateField("invoiceDni", event.target.value)
              }
            />
          </>
        )}

        

        <Textarea
          id="inscription-notes"
          label="Notas adicionales"
          value={inscription.notes}
          onChange={(event) => updateField("notes", event.target.value)}
        />
        <Textarea
        placeholder="Ley Oficial de Protección de Datos (LOPD)
PROTECCIÓN DE DATOS
Responsable del tratamiento:
Entidad: FUNDACIÓN ABRENTE // CIF: G70397849 // Rúa Novoa Santos, 36, Bajo, 15006 A Coruña //
Teléfono: 881 243 819 // Correo electrónico: info@enkiproyecto.com.
En nombre de la FUNDACIÓN ABRENTE le indicamos que tratamos la información que nos facilita con la
finalidad de llevar a cabo una correcta gestión y control de la actividad para realizar. En caso de realizar la
actividad a través de otra entidad, sus datos serán cedidos a esta con la finalidad de que pueda llevar a
cabo @dito actividad, y no se cederán la otros terceros salvo en los casos en que exista una obligación
legal o consentimiento del interesado. Los datos proporcionados se conservarán mientras dure la
actividad o durante el tiempo necesario para cumplir con las obligaciones legales y atender las posibles
responsabilidades que pudieran derivar del cumplimiento de la finalidad para la que los datos fueron
solicitados. La FUNDACIÓN ABRENTE no elaborará ningún tipo de “perfil” en base a la información
facilitada. No se tomarán decisiones automatizadas en base a perfiles. Usted podrá ejercer los derechos
de acceso, rectificación, supresión, oposición, limitación del tratamiento, portabilidade de datos y la no
ser objeto de decisiones individualizadas, automatizadas, en relación con los datos objeto del
tratamiento, ante lo responsable del tratamiento en la dirección anteriormente mencionada, acercando
copia de su DNI o documento equivalente, o directamente ante lo delegado de protección de datos. En
caso de que no obtuviera satisfacción en el ejercicio de sus derechos, puede presentar una reclamación
ante la Autoridad de Control en materia Protección de Datos competente, siendo esta la Agencia
Española de Protección de Datos, y cuyos datos de contacto están accesibles en:
https://sedeagpd.gob.es/sed-electronica-web/vistas/formNuevaReclamacion/reclamacion.jsf"/>
        <label className={`checkbox-field field-full ${errors["inscription.dataTreatmentAccepted"] ? "checkbox-error" : ""}`}>
            <input
              type="checkbox"
              checked={inscription.dataTreatmentAccepted}
              onChange={(event) =>
                updateField("dataTreatmentAccepted", event.target.checked)
              }
            />
            Yo, padre-madre-tutor del niño/a inscrito/a, autorizo la Fundación Abrente al tratamiento de la información 
facilitada con fines exclusivos de selección y contacto para adecuada valoración y asignación de plazas disponibles <span className="required-mark">*</span>
          </label>

          {errors["inscription.dataTreatmentAccepted"] && (
            <p className="field-error-message">
              {errors["inscription.dataTreatmentAccepted"]}
            </p>
          )}
          <Textarea placeholder="Si la actividad lo requiere, se harán salidas o excursiones en autobús o andando. Se cumplirán todas las  medidas de seguridad y control de los menores en el exterior. Los menores siempre estarán acompañados y supervisados de un profesional"/>
        <label className={`checkbox-field field-full ${errors["inscription.dataTreatmentAccepted"] ? "checkbox-error" : ""}`}>
          <input
            type="checkbox"
            checked={inscription.outingsAccepted}
            onChange={(event) =>
              updateField("outingsAccepted", event.target.checked)
            }
          />
          Autorizo las salidas o excursiones.
        </label>
<Textarea placeholder="Dado que el derecho a la propia imagen está reconocido al artículo 18 de la Constitución y regulado por la Ley
1/1982, de 5 de mayo , sobre el derecho a la honra, a la intimidad personal y familiar y a la propia imagen y el Reglamento (UE) 
2016/679 del Parlamento Europeo y del Consejo, de 27 de abril de 2016, relativo a la protección de las personas físicas en el que 
respeta al tratamiento de datos personales y a la libre circulación de estos datos, Fundación Abrente pide el consentimiento a los 
padres o tutores #legal para poder publicar las imágenes en las cuales aparezcan individualmente o en grupo que sin ningún tipo" />
        <label className="checkbox-field field-full">
          <input
            type="checkbox"
            checked={inscription.imagesAccepted}
            onChange={(event) =>
              updateField("imagesAccepted", event.target.checked)
            }
          />
          Autorizo el uso de imágenes.
        </label>
      </div>
    </Card>
  );
}