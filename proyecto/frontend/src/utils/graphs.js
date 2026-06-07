export const buildDashboardStats = ({ inscriptions = [], payments = [], summerCamps = [] }) => {
  const totalInscriptions = inscriptions.length;

  const acceptedInscriptions = inscriptions.filter((inscription) =>
    inscription.signedUpWeeks?.some(
      (item) => item.state === "ACCEPTED" || item.state === "PENDING"
    )
  ).length;

  const waitlistInscriptions = inscriptions.filter((inscription) =>
    inscription.signedUpWeeks?.some((item) => item.state === "WAITLIST")
  ).length;

  const disabilityInscriptions = inscriptions.filter(
    (inscription) => inscription.participant?.hasDisability
  ).length;

  const totalExpected = inscriptions.reduce(
    (sum, item) => sum + Number(item.totalAmountExpected || 0),
    0
  );

  const totalPaid = inscriptions.reduce(
    (sum, item) => sum + Number(item.totalAmountPaid || 0),
    0
  );

  const totalPending = inscriptions.reduce(
    (sum, item) => sum + Number(item.totalAmountPending || 0),
    0
  );

  const paymentStatusData = ["PENDING", "PAID", "OVERDUE", "CANCELLED"].map(
    (status) => ({
      name: status,
      value: payments.filter((payment) => payment.status === status).length,
    })
  );

  const inscriptionStatusData = [
    {
      name: "Aceptadas/Pendientes",
      value: acceptedInscriptions,
    },
    {
      name: "Lista de espera",
      value: waitlistInscriptions,
    },
    {
      name: "Con discapacidad",
      value: disabilityInscriptions,
    },
  ];

  const campsData = summerCamps.map((camp) => {
    const campInscriptions = inscriptions.filter((inscription) =>
      inscription.signedUpWeeks?.some(
        (signedUp) => signedUp.week?.summerCampId === camp.id
      )
    );

    return {
      name: `${camp.name} ${camp.year}`,
      inscripciones: campInscriptions.length,
    };
  });

  const weekStatusMap = {};

  inscriptions.forEach((inscription) => {
    inscription.signedUpWeeks?.forEach((signedUp) => {
      const weekNumber = signedUp.week?.number || signedUp.weekId;
      const key = `Semana ${weekNumber}`;

      if (!weekStatusMap[key]) {
        weekStatusMap[key] = {
          name: key,
          ACCEPTED: 0,
          PENDING: 0,
          WAITLIST: 0,
          CANCELLED: 0,
        };
      }

      weekStatusMap[key][signedUp.state] += 1;
    });
  });

  const weekStatusData = Object.values(weekStatusMap);

  return {
    totalInscriptions,
    acceptedInscriptions,
    waitlistInscriptions,
    disabilityInscriptions,
    totalExpected,
    totalPaid,
    totalPending,
    paymentStatusData,
    inscriptionStatusData,
    campsData,
    weekStatusData,
  };
};