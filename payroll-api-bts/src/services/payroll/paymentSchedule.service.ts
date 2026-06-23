import { Types } from "mongoose";
import PaymentSchedule from "../../model/employee-payment-management/paymentSchedule";

export const getPaymentScheduleOrFail = async (paymentScheduleId: string) =>  {
  if (!Types.ObjectId.isValid(paymentScheduleId)) {
    return {
      ok: false as const,
      status: 400,
      mensaje: "paymentSchedule no es ObjectId válido",
    };
  }

  const ps = await PaymentSchedule.findById(paymentScheduleId)
    .select("paymentFrequency payDays weeklyDays isActive name")
    .populate({ path: "paymentFrequency", select: "code name" })
    .lean();

  if (!ps || ps.isActive === false) {
    return {
      ok: false as const,
      status: 404,
      mensaje: "PaymentSchedule no encontrado o inactivo",
    };
  }

  const freqCode = (ps as any)?.paymentFrequency?.code;
  if (!freqCode) {
    return {
      ok: false as const,
      status: 400,
      mensaje: "PaymentFrequency inválida en PaymentSchedule",
    };
  }

  return {
    ok: true as const,
    paymentSchedule: ps,
    frequencyCode: String(freqCode),
  };
}