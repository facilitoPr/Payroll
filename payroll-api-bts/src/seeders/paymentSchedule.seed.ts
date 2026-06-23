import PaymentFrequency from "../model/employee-payment-management/paymentFrecuency";
import PaymentSchedule from "../model/employee-payment-management/paymentSchedule";

type PaymentScheduleSeed = {
  code: string;
  name: string;
  description: string;
  frequencyCode: string;
  payDays: number[];
  weeklyDays: any[];
  legacyNames?: string[];
};

const paymentSchedules: PaymentScheduleSeed[] = [
  {
    code: "MENSUAL_DIA_30",
    name: "Pago mensual día 30",
    description: "Pago mensual realizado el día 30 de cada mes.",
    frequencyCode: "MENSUAL",
    payDays: [30],
    weeklyDays: [],
  },
  {
    code: "MENSUAL_DIA_15",
    name: "Pago mensual día 15",
    description: "Pago mensual realizado el día 15 de cada mes.",
    frequencyCode: "MENSUAL",
    payDays: [15],
    weeklyDays: [],
  },
  {
    code: "QUINCENAL_15_30",
    name: "Pagos los días 15 y 30",
    description: "Pagos quincenales realizados los días 15 y 30.",
    frequencyCode: "QUINCENAL",
    payDays: [15, 30],
    weeklyDays: [],
    legacyNames: ["Pagos los dias 15 y 30"],
  },
  {
    code: "QUINCENAL_15_ULTIMO",
    name: "Pagos los días 15 y último día del mes",
    description:
      "Pagos quincenales realizados los días 15 y el último día del mes. Se usa 31 como referencia para último día.",
    frequencyCode: "QUINCENAL",
    payDays: [15, 31],
    weeklyDays: [],
  },
  {
    code: "SEMANAL_VIERNES",
    name: "Pago semanal los viernes",
    description: "Pago semanal realizado los viernes.",
    frequencyCode: "SEMANAL",
    payDays: [],
    weeklyDays: [5],
  },
  {
    code: "SEMANAL_SABADO",
    name: "Pago semanal los sábados",
    description: "Pago semanal realizado los sábados.",
    frequencyCode: "SEMANAL",
    payDays: [],
    weeklyDays: [6],
  },
  {
    code: "BISEMANAL_VIERNES",
    name: "Pago bisemanal los viernes",
    description: "Pago cada dos semanas realizado los viernes.",
    frequencyCode: "BISEMANAL",
    payDays: [],
    weeklyDays: [5],
  },
  {
    code: "DIARIO",
    name: "Pago diario",
    description: "Pago realizado diariamente.",
    frequencyCode: "DIARIO",
    payDays: [],
    weeklyDays: [1, 2, 3, 4, 5],
  },
];

export const seedPaymentSchedules = async () => {
  for (const schedule of paymentSchedules) {
    const frequency = await PaymentFrequency.findOne({
      code: schedule.frequencyCode,
    });

    if (!frequency) {
      console.warn(
        `No se encontró PaymentFrequency con code ${schedule.frequencyCode}. Se omite PaymentSchedule ${schedule.name}.`,
      );
      continue;
    }

    const existing = await PaymentSchedule.findOne({
      $or: [
        { code: schedule.code },
        { name: schedule.name },
        ...(schedule.legacyNames?.length
          ? [{ name: { $in: schedule.legacyNames } }]
          : []),
      ],
    });

    const payload = {
      code: schedule.code,
      name: schedule.name,
      paymentFrequency: frequency._id,
      payDays: schedule.payDays,
      weeklyDays: schedule.weeklyDays,
      description: schedule.description,
      isActive: true,
      isDeleted: false,
    };

    if (existing) {
      await PaymentSchedule.findByIdAndUpdate(
        existing._id,
        {
          $set: payload,
        },
        {
          new: true,
          setDefaultsOnInsert: true,
        },
      );

      continue;
    }

    await PaymentSchedule.create(payload);
  }

  console.log("[seedPaymentSchedules]: Seed completado");
};
