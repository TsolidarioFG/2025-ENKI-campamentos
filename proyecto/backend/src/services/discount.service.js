export const getAutomaticDiscountCodesFromParticipant = (participant) => {
  const codes = [];

  if (participant?.repeatedBefore) codes.push("REPEAT");
  if (participant?.siblings) codes.push("SIBLING");
  if (participant?.schoolRelated) codes.push("SCHOOL");

  return [...new Set(codes)];
};

export const resolveApplicableDiscountsForCreation = async (
  tx,
  participant,
  manualDiscountRequests = []
) => {
  const codes = [
    ...getAutomaticDiscountCodesFromParticipant(participant),
    ...manualDiscountRequests,
  ];

  const uniqueCodes = [...new Set(codes)];

  if (uniqueCodes.length === 0) {
    return [];
  }

  const discounts = await tx.discount.findMany({
    where: {
      code: {
        in: uniqueCodes,
      },
      isActive: true,
    },
  });

  return discounts;
};

export const createInscriptionDiscountRows = async (
  tx,
  inscriptionId,
  appliedDiscounts
) => {
  if (!appliedDiscounts || appliedDiscounts.length === 0) {
    return;
  }

  await tx.inscriptionDiscount.createMany({
    data: appliedDiscounts.map((discount) => ({
      inscriptionId,
      discountId: discount.id,
    })),
    skipDuplicates: true,
  });
};

export const getApplicableDiscountsForInscription = async (tx, inscriptionId) => {
  const inscriptionDiscounts = await tx.inscriptionDiscount.findMany({
    where: { inscriptionId },
    include: {
      discount: true,
    },
  });

  return inscriptionDiscounts
    .filter((item) => item.discount && item.discount.isActive)
    .map((item) => ({
      id: item.discount.id,
      code: item.discount.code,
      percentage: item.discount.percentage,
      isActive: item.discount.isActive,
      question: item.discount.question,
      notes: item.discount.notes,
    }));
};

export const applyDiscountsToAmount = (grossAmount, applicableDiscounts = []) => {
  const roundedGrossAmount = Number(Number(grossAmount || 0).toFixed(2));

  let totalDiscountPercentage = 0;

  for (const discount of applicableDiscounts) {
    totalDiscountPercentage += Number(discount.percentage || 0);
  }

  totalDiscountPercentage = Math.min(totalDiscountPercentage, 100);

  const totalDiscountAmount = Number(
    (roundedGrossAmount * (totalDiscountPercentage / 100)).toFixed(2)
  );

  const finalAmount = Number(
    Math.max(0, roundedGrossAmount - totalDiscountAmount).toFixed(2)
  );

  return {
    grossAmount: roundedGrossAmount,
    totalDiscountPercentage,
    totalDiscountAmount,
    finalAmount,
  };
};