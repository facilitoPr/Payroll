import moment from "moment";
import { Types } from "mongoose";
import WorkSummary from "../../model/punch/workSummary";

function parseYMDStrict(s: string) {
  const m = moment(String(s || "").trim(), ["YYYY-MM-DD", "YYYY/MM/DD"], true);
  return m.isValid() ? m : null;
}

function secondsToMinutes(sec: any) {
  const s = Math.max(0, Number(sec || 0));
  // ✅ recomiendo CEIL para no “perder” segundos: 61s -> 2m (si no quieres eso usa Math.round o Math.floor)
  return Math.ceil(s / 60);
}

export async function getLateWorkSummariesEvidence(input: {
  userId: string | Types.ObjectId;
  workDateString?: string; // DAY
  from?: string; // RANGE
  to?: string; // RANGE
  session?: any;
}) {
  const userId = String(input.userId);

  const hasRange = Boolean(input.from || input.to);
  let fromYMD = "";
  let toYMD = "";

  if (!hasRange) {
    if (!input.workDateString) {
      throw new Error("workDateString es requerido para tardanza por día");
    }
    const m = parseYMDStrict(input.workDateString);
    if (!m) throw new Error("workDateString inválido (YYYY-MM-DD)");
    fromYMD = m.format("YYYY-MM-DD");
    toYMD = fromYMD;
  } else {
    if (!input.from)
      throw new Error("from es requerido para tardanza por rango");
    const mf = parseYMDStrict(input.from);
    const mt = parseYMDStrict(input.to || input.from);
    if (!mf || !mt) throw new Error("from/to inválidos (YYYY-MM-DD)");
    fromYMD = mf.format("YYYY-MM-DD");
    toYMD = mt.format("YYYY-MM-DD");
  }

  const start = moment(fromYMD).format("YYYY-MM-DD");
  const end = moment(toYMD).format("YYYY-MM-DD");

  // ✅ Query por rango (si tienes date: Date en WorkSummary)
  let q = WorkSummary.find({
    user: new Types.ObjectId(userId),
    dateString: { $gte: start, $lte: end }, // si tu campo no se llama date, ajusta
  }).select("_id date dateString lateTime");

  if (input.session) q = q.session(input.session);

  const ws = await q.sort({ date: 1 }).lean();

  if (!ws.length) {
    throw new Error("No se encontraron WorkSummaries en ese rango");
  }

  // Solo los que tengan tardanza real
  const perDay = ws
    .map((d: any) => {
      const lateSeconds = Number(d.lateTime || 0);
      const lateMinutes = secondsToMinutes(lateSeconds);

      return {
        workSummary: d._id,
        workDateString:
          d.dateString || (d.date ? moment(d.date).format("YYYY-MM-DD") : ""),
        lateSeconds,
        lateMinutes,
      };
    })
    .filter((x) => x.lateMinutes > 0);

  if (!perDay.length) {
    throw new Error("No hay tardanzas (lateTime) en ese día/rango");
  }

  const ids = perDay.map((x) => x.workSummary);
  const totalLateSeconds = perDay.reduce((acc, x) => acc + x.lateSeconds, 0);
  const totalLateMinutes = perDay.reduce((acc, x) => acc + x.lateMinutes, 0);

  return {
    scope: hasRange ? "RANGE" : "DAY",
    fromYMD,
    toYMD,
    start,
    end,
    ids,
    perDay,
    totalLateSeconds,
    totalLateMinutes,
    daysCount: perDay.length,
  };
}

export function fmtHM(totalMinutes: number) {
  const m = Math.max(0, Number(totalMinutes || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  return { h, r, text: h > 0 ? `${h}h ${r}m` : `${r}m` };
}

export function buildNotifyByCategory(input: {
  category: string;
  userName?: string;
  lateTotalMinutes?: number;
  lateDaysCount?: number;
  fromYMD?: string;
  toYMD?: string;
}) {
  const cat = input.category;

  if (cat === "LATE_ARRIVAL") {
    const t = fmtHM(input.lateTotalMinutes || 0);
    const isRange = Boolean(
      input.fromYMD && input.toYMD && input.fromYMD !== input.toYMD
    );
    return {
      title: "Amonestación por tardanza",
      message: isRange
        ? `Tardanza acumulada: ${t.text} en ${
            input.lateDaysCount || 0
          } día(s) (${input.fromYMD} a ${input.toYMD}).`
        : `Se detectó una tardanza de ${t.text}. Te recordamos la importancia de cumplir con los horarios establecidos.`,
      link: "/my/disciplinary-actions",
    };
  }

  const MAP: any = {
    EARLY_DEPARTURE: {
      title: "Amonestación por salida temprana",
      message:
        "Se registró una salida antes del horario establecido. Favor verificar y cumplir con el horario.",
    },
    NO_SHOW: {
      title: "Amonestación por inasistencia",
      message:
        "Se registró una inasistencia en la fecha indicada. Favor comunicarse con su supervisor.",
    },
    MISSING_PUNCH: {
      title: "Amonestación por ponche faltante",
      message:
        "Se detectó un ponche faltante. Favor corregir o justificar con su supervisor.",
    },
    UNAUTHORIZED_BREAK: {
      title: "Amonestación por pausa no autorizada",
      message:
        "Se detectó una pausa no autorizada. Favor cumplir con las políticas de pausas.",
    },
    MISCONDUCT: {
      title: "Amonestación por conducta inapropiada",
      message:
        "Se registró un incidente de conducta inapropiada. Favor revisar las políticas internas.",
    },
    INSUBORDINATION: {
      title: "Amonestación por insubordinación",
      message:
        "Se registró un incidente de insubordinación. Favor revisar las políticas internas.",
    },
    DRESS_CODE: {
      title: "Amonestación por código de vestimenta",
      message:
        "Se registró un incumplimiento del código de vestimenta. Favor cumplir con la normativa.",
    },
    POOR_PERFORMANCE: {
      title: "Amonestación por bajo desempeño",
      message:
        "Se registró una observación por bajo desempeño. Favor comunicarse con su supervisor para seguimiento.",
    },
    PROCEDURE_VIOLATION: {
      title: "Amonestación por violación de procedimiento",
      message:
        "Se registró una violación de procedimiento. Favor revisar y cumplir los protocolos establecidos.",
    },
    SAFETY_VIOLATION: {
      title: "Amonestación por violación de seguridad",
      message:
        "Se registró una violación de seguridad. Favor cumplir con las normas de seguridad.",
    },
    CUSTOMER_COMPLAINT: {
      title: "Amonestación por queja de cliente",
      message:
        "Se registró una queja de cliente. Favor revisar el caso con su supervisor.",
    },
    SECURITY_POLICY_VIOLATION: {
      title: "Amonestación por violación de política de seguridad",
      message:
        "Se registró una violación de política de seguridad. Favor revisar y cumplir la normativa.",
    },
    DATA_MISHANDLING: {
      title: "Amonestación por manejo indebido de datos",
      message:
        "Se registró un manejo indebido de datos. Favor revisar las políticas de privacidad y seguridad.",
    },
  };

  return {
    title: MAP[cat]?.title || "Amonestación",
    message:
      MAP[cat]?.message ||
      "Se ha registrado una amonestación. Favor revisar el detalle.",
    link: "/my/disciplinary-actions",
  };
}
