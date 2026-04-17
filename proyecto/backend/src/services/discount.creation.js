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
  for (const defaultDiscount of DEFAULT_DISCOUNTS) {
    const existingDiscount = await prisma.discount.findUnique({
      where: { code: defaultDiscount.code },
    });

    if (!existingDiscount) {
      await prisma.discount.create({
        data: defaultDiscount,
      });
      continue;
    }

    if (!existingDiscount.isActive) {
      await prisma.discount.update({
        where: { id: existingDiscount.id },
        data: {
          isActive: true,
        },
      });
    }
  }
};