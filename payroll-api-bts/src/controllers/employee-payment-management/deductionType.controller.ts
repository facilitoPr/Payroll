import { Request, Response } from "express";
import DeductionType, {
  IDeductionType,
} from "../../model/employee-payment-management/deductionType";

import EmployeeDeduction, {
  IEmployeeDeduction,
} from "../../model/employee-payment-management/employeeDeduction";
import User from "../../model/account/user";
import {
  calcularISR,
  calcularPagoPorPeriodo,
} from "../../services/workSummary.service";
import PaymentPeriod from "../../model/employee-payment-management/paymentPeriod";
import IncomeTaxRD from "../../model/employee-payment-management/incomeTaxRD";
import { calculateMonthlyISR } from "../../helper/payroll/calculate-salary";
import { round2, toNum } from "../../helper/parse";

export const createDeductionType = async (req: Request, res: Response) => {
  try {
    const { ...data } = req.body;

    const deduction: IDeductionType = new DeductionType({
      ...data,
    });

    await deduction.save();

    return res.status(201).send({
      ok: true,
      mensaje: "Tipo de salario creado exitosamente",
      message: "Tipo de salario creado exitosamente",
      deduction,
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
export const getDeductionType = async (req: Request, res: Response) => {
  try {
    const deductionType = await DeductionType.find({ isActive: true });
    res.status(200).send({
      ok: true,
      deductionType,
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

export const getDeductionTypeAdmin = async (req: Request, res: Response) => {
  try {
    const deductionType = await DeductionType.find();
    res.status(200).send({
      ok: true,
      deductionType,
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

export const updateDeductionType = async (req: Request, res: Response) => {
  try {
    const { ...data } = req.body;
    const { id } = req.params;

    const deductionType = await DeductionType.findByIdAndUpdate(
      id,
      { ...data },
      { new: true },
    );

    return res.status(200).send({
      ok: true,
      deductionType,
      mensaje: "deductionType actualizado con éxito",
      message: "deductionType updated successfully",
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

export const getUserDeductionByUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deduction = await EmployeeDeduction.find({ user: id });
    res.status(200).send({
      ok: true,
      deduction,
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

// Crear o actualizar una deducción para un empleado
export const upsertEmployeeDeduction = async (req, res: Response) => {
  try {
    const { id, deductionType, isEnabled, customPercentage, customAmount } =
      req.body;

    // Validar existencia de empleado y deducción
    const user = await User.findById(id);
    const deduction = await DeductionType.findById(deductionType);

    if (!user || !deduction) {
      return res
        .status(404)
        .json({ message: "Empleado o deducción no encontrada" });
    }

    const existing = await EmployeeDeduction.findOne({ user, deductionType });

    if (existing) {
      existing.isEnabled = isEnabled;
      existing.customPercentage = customPercentage;
      existing.customAmount = customAmount;
      existing.updatedAt = new Date().toISOString();

      await existing.save();
      return res.status(200).json({
        mensaje: "Actualizado",
        message: "Actualizado",
        data: existing,
      });
    }

    const newRecord = await EmployeeDeduction.create({
      user: id,
      deductionType,
      isEnabled,
      customPercentage,
      customAmount,
    });

    return res
      .status(201)
      .json({ ok: true, message: "Creado", mensaje: "Actualizado", newRecord });
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

export const getEmployeePaymentSummary = async (
  req: Request,
  res: Response,
) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) {
      return res
        .status(400)
        .send({ ok: false, mensaje: "Falta el ID del empleado" });
    }

    const empleado: any = await User.findById(employeeId)
      .populate("salaryType")
      .populate({
        path: "paymentSchedule",
        populate: { path: "paymentFrequency" },
      });

    if (!empleado) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Empleado no encontrado" });
    }

    const tipoSalario = empleado.salaryType?.code;
    let sueldoBrutoMensual = 0;
    let horasEstimadas = 0;

    if (tipoSalario === "FIJO") {
      sueldoBrutoMensual = toNum(empleado.baseSalary, 0);
    } else if (tipoSalario === "HORAS") {
      horasEstimadas = toNum(empleado.weeklyWorkHours, 0);
      sueldoBrutoMensual = round2(
        toNum(empleado.hourlyRate, 0) * horasEstimadas * 4,
      );
    } else {
      return res
        .status(400)
        .json({ ok: false, mensaje: "Tipo de salario inválido" });
    }

    const paymentFrequency = empleado.paymentSchedule?.paymentFrequency;
    const frecuenciaPago = paymentFrequency?.name?.toLowerCase() || "mensual";

    const sueldoBrutoPeriodo = round2(
      calcularPagoPorPeriodo(frecuenciaPago, sueldoBrutoMensual),
    );

    // Deducciones
    const deducciones: any[] = await EmployeeDeduction.find({
      user: employeeId,
      isEnabled: true,
    }).populate("deductionType");

    let totalDeduccionesMensual = 0;
    let totalDeduccionesPeriodo = 0;

    // ✅ SOLO estas reducen la baseISR (legales y NO post-ISR)
    let totalDeduccionesLegalesParaBaseISR = 0;

    const detallePreISR: any[] = [];
    const detallePostISR: any[] = [];

    for (const d of deducciones) {
      let montoMensual = 0;
      let tipo = "";
      let valor = 0;
      let modo = "";

      const tipoDeduccion: any = d.deductionType;

      // ✅ deducibleIsr puede venir del registro (EmployeeDeduction) o del tipo (DeductionType)
      const deducibleIsr =
        typeof d.deducibleIsr === "boolean"
          ? d.deducibleIsr
          : !!tipoDeduccion?.deducibleIsr;

      if (!!d.customAmount) {
        tipo = "montoFijo";
        valor = toNum(d.customAmount, 0);
        montoMensual = valor;
        modo = "personalizado";
      } else if (!!d.customPercentage) {
        tipo = "porcentaje";
        valor = toNum(d.customPercentage, 0);
        montoMensual = round2((valor / 100) * sueldoBrutoMensual);
        modo = "personalizado";
      } else if (!!tipoDeduccion?.percentage) {
        tipo = "porcentaje";
        valor = toNum(tipoDeduccion.percentage, 0);
        montoMensual = round2((valor / 100) * sueldoBrutoMensual);
        modo = "por tipo";
      } else if (!!tipoDeduccion?.fixedAmount) {
        tipo = "montoFijo";
        valor = toNum(tipoDeduccion.fixedAmount, 0);
        montoMensual = valor;
        modo = "por tipo";
      }

      montoMensual = round2(montoMensual);
      const montoPeriodo = round2(
        calcularPagoPorPeriodo(frecuenciaPago, montoMensual),
      );

      // Totales (incluye TODO, pre y post)
      totalDeduccionesMensual = round2(totalDeduccionesMensual + montoMensual);
      totalDeduccionesPeriodo = round2(totalDeduccionesPeriodo + montoPeriodo);

      // ✅ Solo las legales y NO deducibleIsr reducen baseISR
      const aplicaEnBaseISR = !!tipoDeduccion?.isLegal && !deducibleIsr;
      if (aplicaEnBaseISR) {
        totalDeduccionesLegalesParaBaseISR = round2(
          totalDeduccionesLegalesParaBaseISR + montoMensual,
        );
      }

      const item = {
        nombre: tipoDeduccion?.name,
        tipo,
        valor,
        modo,
        isLegal: !!tipoDeduccion?.isLegal,
        deducibleIsr, // ✅ para UI/auditoría
        aplicaEnBaseISR, // ✅ útil para depurar
        montoMensual,
        montoPeriodo,
      };

      // ✅ Si deducibleIsr = true => va al FINAL (post ISR)
      if (deducibleIsr) detallePostISR.push(item);
      else detallePreISR.push(item);
    }

    // Base ISR (igual que tu regla actual)
    const baseISR = round2(
      Math.max(0, sueldoBrutoMensual - totalDeduccionesLegalesParaBaseISR),
    );

    console.log(sueldoBrutoMensual, "BRUTO MENSUAL");
    console.log(totalDeduccionesLegalesParaBaseISR, "TOTAL DEDUCCIONES");
    console.log(baseISR, "BASE ISR");

    // Buscar tabla ISR activa
    const isrTable = await IncomeTaxRD.findOne({
      isActive: true,
      isDeleted: false,
    })
      .sort({ year: -1, version: -1 })
      .lean();

    if (!isrTable) {
      return res.status(400).json({
        ok: false,
        mensaje: "No existe una tabla ISR activa (IncomeTaxRD).",
      });
    }

    // ISR mensual por tramos (mensual)
    const isrInfo = calculateMonthlyISR({
      grossMonthly: baseISR,
      table: isrTable,
    });

    const isrMensual = round2(isrInfo.amount);
    const isrPeriodo = round2(
      calcularPagoPorPeriodo(frecuenciaPago, isrMensual),
    );

    const detalleDeducciones: any[] = [...detallePreISR];

    // ISR como deducción automática (como ya lo hacías)
    if (isrMensual > 0) {
      detalleDeducciones.push({
        nombre: "ISR",
        tipo: "tramos",
        valor: isrInfo?.bracket?.rate ?? 0,
        isLegal: true,
        modo: "automático",
        montoMensual: isrMensual,
        montoPeriodo: isrPeriodo,
      });

      totalDeduccionesMensual = round2(totalDeduccionesMensual + isrMensual);
      totalDeduccionesPeriodo = round2(totalDeduccionesPeriodo + isrPeriodo);
    }

    // ✅ Post ISR al final
    detalleDeducciones.push(...detallePostISR);

    const sueldoNetoMensual = round2(
      sueldoBrutoMensual - totalDeduccionesMensual,
    );
    const sueldoNetoPeriodo = round2(
      sueldoBrutoPeriodo - totalDeduccionesPeriodo,
    );

    return res.status(200).send({
      ok: true,

      empleado: {
        nombre: empleado.name,
        tipoSalario,
        sueldoBase: toNum(empleado.baseSalary, 0),
        tarifaHora: toNum(empleado.hourlyRate, 0),
        horasEstimadas,
        pago: paymentFrequency?.name,
        diasPago: empleado.paymentSchedule?.days,
      },

      sueldoMensual: {
        bruto: round2(sueldoBrutoMensual),
        deducciones: round2(totalDeduccionesMensual),
        neto: round2(sueldoNetoMensual),
      },

      sueldoPeriodo: {
        frecuencia: frecuenciaPago,
        bruto: round2(sueldoBrutoPeriodo),
        deducciones: round2(totalDeduccionesPeriodo),
        neto: round2(sueldoNetoPeriodo),
      },

      detalleDeducciones,

      isr: {
        baseISR: round2(baseISR),
        mensual: round2(isrMensual),
        periodo: round2(isrPeriodo),
        exemptAmount: round2(toNum(isrInfo.exemptAmount, 0)),
        bracket: isrInfo.bracket,
        tableMeta: isrInfo.tableMeta,
      },
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

export const registerEmployeePayment = async (req: Request, res: Response) => {
  try {
    const { employeeId, descuentoManual = 0 } = req.body;

    const empleado = await User.findById(employeeId)
      .populate("salaryType")
      .populate({
        path: "paymentSchedule",
        populate: { path: "paymentFrequency" },
      });

    if (!empleado) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Empleado no encontrado" });
    }

    const tipoSalario = (empleado.salaryType as any)?.code;
    const paymentFrequency = (
      empleado.paymentSchedule as any
    )?.paymentFrequency?.name?.toLowerCase();

    let sueldoBrutoMensual = 0;
    let horasEstimadas = 0;

    if (tipoSalario === "FIJO") {
      sueldoBrutoMensual = empleado.baseSalary || 0;
    } else if (tipoSalario === "HORAS") {
      // horasEstimadas = calcularHorasDesdeHorario(empleado.schedule || {});
      horasEstimadas = empleado.weeklyWorkHours;
      sueldoBrutoMensual = (empleado.hourlyRate || 0) * horasEstimadas * 4;
    }

    const sueldoBrutoPeriodo = calcularPagoPorPeriodo(
      paymentFrequency,
      sueldoBrutoMensual,
    );

    const deducciones = await EmployeeDeduction.find({
      user: employeeId,
      isEnabled: true,
    }).populate("deductionType");

    let sumaDeduccionesPeriodo = 0;
    const detalles: any[] = [];

    let totalDeduccionesLegalesMensual = 0;

    for (const d of deducciones) {
      const tipoDeduccion: any = d.deductionType;
      const isLegal = tipoDeduccion.isLegal;

      let montoMensual = 0;
      let tipo = "";
      let valor = 0;
      let origen =
        d.customAmount || d.customPercentage ? "personalizado" : "por tipo";

      if (d.customAmount) {
        montoMensual = d.customAmount;
        tipo = "montoFijo";
        valor = d.customAmount;
      } else if (d.customPercentage) {
        montoMensual = (d.customPercentage / 100) * sueldoBrutoMensual;
        tipo = "porcentaje";
        valor = d.customPercentage;
      } else if (tipoDeduccion?.percentage) {
        montoMensual = (tipoDeduccion.percentage / 100) * sueldoBrutoMensual;
        tipo = "porcentaje";
        valor = tipoDeduccion.percentage;
      } else if (tipoDeduccion?.fixedAmount) {
        montoMensual = tipoDeduccion.fixedAmount;
        tipo = "montoFijo";
        valor = tipoDeduccion.fixedAmount;
      }

      const montoPeriodo = calcularPagoPorPeriodo(
        paymentFrequency,
        montoMensual,
      );

      if (isLegal && tipoDeduccion.name !== "ISR") {
        totalDeduccionesLegalesMensual += montoMensual;
      }

      sumaDeduccionesPeriodo += montoPeriodo;
      detalles.push({
        name: tipoDeduccion.name,
        type: tipo,
        value: valor,
        amount: Number(montoPeriodo.toFixed(2)),
        origin: origen,
        isLegal,
      });
    }

    const baseISR = sueldoBrutoMensual - totalDeduccionesLegalesMensual;
    const isrMensual = calcularISR(baseISR);
    const isrPeriodo = calcularPagoPorPeriodo(paymentFrequency, isrMensual);

    detalles.push({
      name: "ISR",
      type: "porcentaje",
      value: 0,
      amount: Number(isrPeriodo.toFixed(2)),
      origin: "automático",
      isLegal: true,
    });
    sumaDeduccionesPeriodo += isrPeriodo;

    if (descuentoManual && descuentoManual > 0) {
      sumaDeduccionesPeriodo += descuentoManual;
      detalles.push({
        name: "Descuento Manual",
        type: "montoFijo",
        value: descuentoManual,
        amount: descuentoManual,
        origin: "manual",
        isLegal: false,
      });
    }

    const sueldoNetoPeriodo = sueldoBrutoPeriodo - sumaDeduccionesPeriodo;

    await PaymentPeriod.create({
      user: employeeId,
      frequency: paymentFrequency,
      grossSalary: sueldoBrutoPeriodo,
      deductions: detalles,
      netSalary: sueldoNetoPeriodo,
      periodStart: new Date(),
      periodEnd: new Date(),
      totalDeductions: sumaDeduccionesPeriodo,
      isPaid: true,
      project: empleado.project,
      createdAt: new Date(),
    });

    res.status(201).json({
      ok: true,
      mensaje: "Pago registrado exitosamente",
      empleado: empleado.name,
      data: {
        sueldoBruto: sueldoBrutoPeriodo,
        deducciones: detalles,
        sueldoNeto: sueldoNetoPeriodo,
      },
    });
  } catch (error) {
    console.error("Error al registrar pago:", error);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

export const getEmployeePayment = async (req: Request, res: Response) => {
  try {
    const payment = await PaymentPeriod.find()
      .populate("user")
      .populate("project");
    res.status(200).send({
      ok: true,
      payment,
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
