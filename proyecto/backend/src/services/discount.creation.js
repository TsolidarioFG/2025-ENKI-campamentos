import prisma from "../lib/prisma.js";

const DEFAULT_DISCOUNTS = [
  {
    code: "REPEAT",
    question: "¿El participante ha participado en el campamento otros años?",
    percentage: 10,
    isActive: true,
    notes: "Descuento creado automáticamente",
  },
  {
    code: "SIBLING",
    question: "¿El participante tiene algún hermano/a que vaya a participar en el campamento?",
    percentage: 10,
    isActive: true,
    notes: "Descuento creado automáticamente",
  },
  {
    code: "SCHOOL",
    question: "¿El participante acude a la escuela donde se realiza el campamento?",
    percentage: 10,
    isActive: true,
    notes: "Descuento creado automáticamente",
  },
];

export const createDefaultDiscounts = async () => {
  for (const discount of DEFAULT_DISCOUNTS) {
    await prisma.discount.upsert({
      where: {
        code: discount.code,
      },
      update: {
        question: discount.question,
        isActive: true,
      },
      create: discount,
    });
  }

  console.log("Descuentos por defecto comprobados correctamente");
};