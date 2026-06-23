import { Request, Response } from "express";

import PaymentFrequency, {
  IPaymentFrequency,
} from "../../model/employee-payment-management/paymentFrecuency";
import User from "../../model/account/user";
import PaymentPeriod from "../../model/employee-payment-management/paymentPeriod";

export const createPaymentFrecuency = async (req: Request, res: Response) => {
  try {
    const { ...data } = req.body;

    const paymentFrecuency: IPaymentFrequency = new PaymentFrequency({
      ...data,
    });

    await paymentFrecuency.save();

    return res.status(201).send({
      ok: true,
      mensaje: "Tipo de salario creado exitosamente",
      message: "Tipo de salario creado exitosamente",
      paymentFrecuency,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

// Obtener todos los registros
export const getAllPaymentFrecuency = async (req: Request, res: Response) => {
  try {
    const paymentFrequency = await PaymentFrequency.find();
    res.status(200).send({
      ok: true,
      paymentFrequency,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

// export const getEmployeesWithPayToday = async (req: Request, res: Response) => {
//   try {
//     const today = new Date();
//     const dayOfMonth = today.getDate(); // 1–31
//     const systemDayOfWeek = today.getDay() + 1; // 1 = Domingo, ..., 7 = Sábado

//     // Buscar todos los empleados con sus esquemas de pago
//     const empleados = await User.find({
//       isDeleted: false,
//       isActived: true,
//     }).populate({
//       path: "paymentSchedule",
//       model: "PaymentSchedule",
//     });

//     const empleadosQueCobranHoy = empleados.filter((empleado: any) => {
//       const schedule = empleado.paymentSchedule;
//       if (!schedule) return false;

//       const payDays: number[] = schedule.payDays || [];
//       const weeklyDays: number[] = schedule.weeklyDays || [];

//       return (
//         payDays.includes(dayOfMonth) || weeklyDays.includes(systemDayOfWeek)
//       );
//     });

//     res.status(200).json({
//       ok: true,
//       cantidad: empleadosQueCobranHoy.length,
//       empleados: empleadosQueCobranHoy.map((e: any) => ({
//         _id: e._id,
//         nombre: e.name,
//         metodoPago: e.paymentSchedule?.name,
//         diasPagoMensual: e.paymentSchedule?.payDays || [],
//         diasPagoSemanal: e.paymentSchedule?.weeklyDays || [],
//       })),
//       systemDayOfWeek,
//     });
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
//   }
// };

export const getEmployeesWithPayToday = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const dayOfMonth = today.getDate(); // 1–31
    const systemDayOfWeek = new Date().getDay() + 1; // 1 = Domingo, ..., 7 = Sábado

    const empleados = await User.find({
      isDeleted: false,
      isActived: true,
    })
      .populate("paymentSchedule")
      .populate("project")
      .populate("department");

    const empleadosConPago = await Promise.all(
      empleados.map(async (empleado: any) => {
        const schedule = empleado.paymentSchedule;
        if (!schedule) return null;

        const payDays: number[] = schedule.payDays || [];
        const weeklyDays: number[] = schedule.weeklyDays || [];

        const debeCobrarHoy =
          payDays.includes(dayOfMonth) || weeklyDays.includes(systemDayOfWeek);

        if (!debeCobrarHoy) return null;

        const yaFuePagado = await PaymentPeriod.exists({
          user: empleado._id,
          isPaid: true,
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        });

        return {
          _id: empleado._id,
          nombre: empleado.name,
          metodoPago: schedule?.name,
          diasPagoMensual: schedule?.payDays || [],
          diasPagoSemanal: schedule?.weeklyDays || [],
          yaFuePagadoHoy: !!yaFuePagado,
          department: empleado.department,
          project: empleado.project,
        };
      }),
    );

    const empleadosQueCobranHoy = empleadosConPago.filter(Boolean);

    res.status(200).json({
      ok: true,
      cantidad: empleadosQueCobranHoy.length,
      empleados: empleadosQueCobranHoy,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};
