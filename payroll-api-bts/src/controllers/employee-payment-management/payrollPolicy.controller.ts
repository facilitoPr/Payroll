import { Response } from "express";
import { Types } from "mongoose";
import { getMongoIdString } from "../../helper/objectIds";
import PayrollPolicy from "../../model/employee-payment-management/payrollPolicy";

const getPayrollPolicyByCompany = async (req: any, res: Response) => {
  try {
    const companyId =
      req.params.companyId ||
      req.query.companyId ||
      req.user?.company ||
      req.user?.companyId ||
      "";

    const cleanCompanyId = getMongoIdString(companyId);

    if (!cleanCompanyId) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debe enviar una empresa válida.",
      });
    }

    const policy = await PayrollPolicy.findOne({
      company: new Types.ObjectId(cleanCompanyId),
      isDeleted: false,
    })
      .populate("company", "legalName commercialName name")
      .lean();

    return res.status(200).json({
      ok: true,
      policy,
    });
  } catch (error) {
    console.error("[getPayrollPolicyByCompany]", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error obteniendo la política de nómina.",
      error,
    });
  }
};

const upsertPayrollPolicy = async (req: any, res: Response) => {
  try {
    const {
      companyId,

      name,
      code,
      description,

      lateGraceEnabled,
      lateGraceMinutes,
      lateGraceMode,

      deductLateArrivals,
      deductAbsences,

      rdFactorDiasMes,
      useGrossSalaryForDailyDiscount,

      requireConfirmedDaysDefault,
      allowIncompleteDaysOnClose,
      autoPaidLeaveNoDeduct,

      notes,
    } = req.body;

    const cleanCompanyId = getMongoIdString(
      companyId || req.user?.company || req.user?.companyId,
    );

    if (!cleanCompanyId) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debe enviar una empresa válida.",
      });
    }

    const payload: any = {
      company: new Types.ObjectId(cleanCompanyId),

      name: name || "Política de nómina",
      code: code || "DEFAULT_PAYROLL_POLICY",
      description: description || "",

      lateGraceEnabled: lateGraceEnabled === false ? false : true,
      lateGraceMinutes: Math.max(Number(lateGraceMinutes || 0), 0),
      lateGraceMode: ["FULL_GRACE", "DEDUCT_AFTER_GRACE"].includes(
        String(lateGraceMode || ""),
      )
        ? lateGraceMode
        : "FULL_GRACE",

      deductLateArrivals: deductLateArrivals === false ? false : true,
      deductAbsences: deductAbsences === false ? false : true,

      rdFactorDiasMes: Number(rdFactorDiasMes || 23.83),
      useGrossSalaryForDailyDiscount:
        useGrossSalaryForDailyDiscount === false ? false : true,

      requireConfirmedDaysDefault:
        requireConfirmedDaysDefault === false ? false : true,

      allowIncompleteDaysOnClose:
        allowIncompleteDaysOnClose === true ? true : false,

      autoPaidLeaveNoDeduct: autoPaidLeaveNoDeduct === false ? false : true,

      notes: notes || "",
      isActive: true,
      isDeleted: false,
      updatedBy: req.user?._id || req.user?.id || null,
    };

    if (!payload.rdFactorDiasMes || payload.rdFactorDiasMes <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "El factor de días del mes debe ser mayor que 0.",
      });
    }

    const existing = await PayrollPolicy.findOne({
      company: new Types.ObjectId(cleanCompanyId),
      isActive: true,
      isDeleted: false,
    });

    let policy;

    if (existing) {
      Object.assign(existing, payload);
      policy = await existing.save();
    } else {
      policy = await PayrollPolicy.create({
        ...payload,
        createdBy: req.user?._id || req.user?.id || null,
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Política de nómina guardada correctamente.",
      policy,
    });
  } catch (error: any) {
    console.error("[upsertPayrollPolicy]", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        ok: false,
        mensaje:
          "Ya existe una política activa para esta empresa. Actualiza la existente.",
      });
    }

    return res.status(500).json({
      ok: false,
      mensaje: "Error guardando la política de nómina.",
      error,
    });
  }
};

const deletePayrollPolicy = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const cleanId = getMongoIdString(id);

    if (!cleanId) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido.",
      });
    }

    const policy = await PayrollPolicy.findByIdAndUpdate(
      cleanId,
      {
        isActive: false,
        isDeleted: true,
        updatedBy: req.user?._id || req.user?.id || null,
      },
      { new: true },
    );

    if (!policy) {
      return res.status(404).json({
        ok: false,
        mensaje: "Política no encontrada.",
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Política eliminada correctamente.",
      policy,
    });
  } catch (error) {
    console.error("[deletePayrollPolicy]", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error eliminando la política.",
      error,
    });
  }
};

export {
    getPayrollPolicyByCompany,
    upsertPayrollPolicy,
    deletePayrollPolicy,
}