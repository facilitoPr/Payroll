import { Request, Response } from "express";
import { Types } from "mongoose";
import PayrollEarningEntry from "../../model/employee-payment-management/payrollEarningEntry";
import PayrollEarningType from "../../model/employee-payment-management/payrollEarningType";
import { parseISODateToYMD } from "../../helper/payroll/payroll.parse";

type AuthRequest = Request & { user?: any };

function isValidObjectId(id: any) {
  return Types.ObjectId.isValid(String(id));
}

function isValidDateString(d: any) {
  return typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
}

export const listEarningTypes = async (_req: Request, res: Response) => {
  try {
    const types = await PayrollEarningType.find({
      isActive: true,
      isDeleted: false,
    })
      .select("_id code name description")
      .sort({ name: 1 })
      .lean();

    return res.status(200).send({ ok: true, types });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ ok: false, error, mensaje: "Error listando tipos de ingresos" });
  }
};

export const getEarningsByPeriod = async (req: Request, res: Response) => {
  try {
    const { periodStart, periodEnd, userId } = req.query as any;

    if (!isValidDateString(periodStart) || !isValidDateString(periodEnd)) {
      return res.status(400).send({
        ok: false,
        mensaje: "Debe enviar periodStart y periodEnd en formato YYYY-MM-DD",
      });
    }

    const filter: any = {
      isActive: true,
      isDeleted: false,
      periodStart,
      periodEnd,
      isClaimed: false,
    };

    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        return res
          .status(400)
          .send({ ok: false, mensaje: "userId no es válido" });
      }
      filter.user = new Types.ObjectId(userId);
    }

    const entries = await PayrollEarningEntry.find(filter)
      .populate({ path: "earningType", select: "code name" })
      .populate({ path: "user", select: "name email username" })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).send({ ok: true, entries });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      ok: false,
      error,
      mensaje: "Error buscando ingresos del período",
    });
  }
};

/**
 * Upsert en batch:
 * body: { periodStart, periodEnd, items: [{ userId, earningTypeId, amount, notes? }] }
 */
export const upsertEarningsBatch = async (req: any, res: Response) => {
  try {
    const { periodStart, periodEnd, items } = req.body as {
      periodStart: string;
      periodEnd: string;
      items: Array<{
        userId: string;
        earningTypeId: string;
        amountPeriod: number;
        isRecurring: boolean;
        notes?: string;
      }>;
    };

    if (!isValidDateString(periodStart) || !isValidDateString(periodEnd)) {
      return res
        .status(400)
        .send({ ok: false, mensaje: "Fechas inválidas (YYYY-MM-DD)" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).send({ ok: false, mensaje: "Debe enviar items" });
    }

    const createdBy = req.user?._id
      ? new Types.ObjectId(req.user.id)
      : undefined;

    let upserted = 0;

    for (const it of items) {
      if (
        !Types.ObjectId.isValid(it.userId) ||
        !Types.ObjectId.isValid(it.earningTypeId)
      ) {
        return res
          .status(400)
          .send({ ok: false, mensaje: "IDs inválidos en items" });
      }
      const amount = Number(it.amountPeriod || 0);
      if (!Number.isFinite(amount) || amount < 0) {
        return res.status(400).send({ ok: false, mensaje: "amount inválido" });
      }

      await PayrollEarningEntry.updateOne(
        {
          user: new Types.ObjectId(it.userId),
          earningType: new Types.ObjectId(it.earningTypeId),
          periodStart,
          periodEnd,
        },
        {
          $set: {
            amountPeriod: amount,
            notes: it.notes || "",
            isRecurring: it.isRecurring,
            isActive: true,
            isDeleted: false,
            ...(createdBy ? { createdBy } : {}),
          },
        },
        { upsert: true },
      );

      upserted++;
    }

    return res
      .status(200)
      .send({ ok: true, upserted, mensaje: "Ingresos guardados" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ ok: false, error, mensaje: "Error guardando ingresos" });
  }
};

export const softDeleteEarningEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).send({ ok: false, mensaje: "ID inválido" });
    }

    const updated = await PayrollEarningEntry.findByIdAndUpdate(
      id,
      { isDeleted: true, isActive: false },
      { new: true },
    );

    if (!updated) {
      return res
        .status(404)
        .send({ ok: false, mensaje: "Ingreso no encontrado" });
    }

    return res.status(200).send({ ok: true, mensaje: "Ingreso eliminado" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ ok: false, error, mensaje: "Error eliminando ingreso" });
  }
};

export const upsertEarningsForPeriod = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actorId = req.user?._id;
    if (!actorId || !isValidObjectId(actorId)) {
      return res.status(401).send({ ok: false, mensaje: "No autorizado" });
    }

    const { periodStart, periodEnd, entries } = req.body as any;
    if (!periodStart || !periodEnd) {
      return res
        .status(400)
        .send({ ok: false, mensaje: "Falta periodStart/periodEnd" });
    }
    if (!Array.isArray(entries) || !entries.length) {
      return res
        .status(400)
        .send({ ok: false, mensaje: "Debes enviar entries[]" });
    }

    const start = parseISODateToYMD(periodStart);
    const end = parseISODateToYMD(periodEnd);

    // entries: [{ userId, code, amountPeriod, notes? }]
    let upserted = 0;
    const errors: any[] = [];

    for (const e of entries) {
      const userId = String(e.userId || "");
      const code = String(e.code || "");
      const amountPeriod = Number(e.amountPeriod || 0);

      if (!isValidObjectId(userId)) {
        errors.push({ entry: e, error: "userId inválido" });
        continue;
      }
      //   if (!EARNINGS_CATALOG.some((x) => x.code === code)) {
      //     errors.push({ entry: e, error: "code inválido" });
      //     continue;
      //   }
      if (amountPeriod < 0) {
        errors.push({ entry: e, error: "amountPeriod no puede ser negativo" });
        continue;
      }

      await PayrollEarningEntry.findOneAndUpdate(
        {
          periodStart: start,
          periodEnd: end,
          user: new Types.ObjectId(userId),
          code,
          isDeleted: false,
        },
        {
          periodStart: start,
          periodEnd: end,
          user: new Types.ObjectId(userId),
          code,
          amountPeriod,
          notes: e.notes || "",
          createdBy: new Types.ObjectId(actorId),
          isActive: true,
          isDeleted: false,
        },
        { upsert: true, new: true },
      );

      upserted++;
    }

    return res.status(200).send({
      ok: true,
      mensaje: "Ingresos guardados/actualizados.",
      upserted,
      errors,
    });
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .send({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};

export const listEarningsForPeriod = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { periodStart, periodEnd, userId } = req.query as any;

    if (!periodStart || !periodEnd) {
      return res
        .status(400)
        .send({ ok: false, mensaje: "Falta periodStart/periodEnd" });
    }

    const start = parseISODateToYMD(periodStart);
    const end = parseISODateToYMD(periodEnd);

    const filter: any = {
      periodStart: start,
      periodEnd: end,
      isDeleted: false,
    };
    if (userId) {
      if (!isValidObjectId(userId)) {
        return res.status(400).send({ ok: false, mensaje: "userId inválido" });
      }
      filter.user = new Types.ObjectId(userId);
    }

    const items = await PayrollEarningEntry.find(filter)
      .select("user code amountPeriod notes")
      .lean();

    return res.status(200).send({ ok: true, items });
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .send({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};
