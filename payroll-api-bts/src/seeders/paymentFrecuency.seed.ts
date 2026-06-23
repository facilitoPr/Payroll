import PaymentFrequency, { PaymentFrequencyCode } from '../model/employee-payment-management/paymentFrecuency';

const paymentFrequencies: Array<{
  code: PaymentFrequencyCode;
  name: string;
  description: string;
  legacyCodes?: string[];
}> = [
  {
    code: "DIARIO",
    name: "Diario",
    description: "Forma de pago diaria.",
  },
  {
    code: "SEMANAL",
    name: "Semanal",
    description: "Forma de pago semanal.",
  },
  {
    code: "BISEMANAL",
    name: "Bisemanal",
    description: "Forma de pago cada dos semanas.",
  },
  {
    code: "QUINCENAL",
    name: "Quincenal",
    description: "Forma de pago cada 15 días.",
    legacyCodes: ["QUINCENAl"],
  },
  {
    code: "MENSUAL",
    name: "Mensual",
    description: "Forma de pago cada 30 días.",
  },
  {
    code: "ANUAL",
    name: "Anual",
    description: "Forma de pago anual.",
  },
  {
    code: "UNICO",
    name: "Pago único",
    description: "Pago realizado una sola vez.",
  },
];

export const seedPaymentFrequencies = async () => {
  for (const frequency of paymentFrequencies) {
    const existing = await PaymentFrequency.findOne({
      $or: [
        { code: frequency.code },
        { name: frequency.name },
        ...(frequency.legacyCodes?.length
          ? [{ code: { $in: frequency.legacyCodes } }]
          : []),
      ],
    });

    if (existing) {
      await PaymentFrequency.findByIdAndUpdate(
        existing._id,
        {
          $set: {
            code: frequency.code,
            name: frequency.name,
            description: frequency.description,
          },
        },
        {
          new: true,
          setDefaultsOnInsert: true,
        },
      );

      continue;
    }

    await PaymentFrequency.create({
      code: frequency.code,
      name: frequency.name,
      description: frequency.description,
    });
  }

  console.log("[seedPaymentFrequencies]: Seed completado");
};
