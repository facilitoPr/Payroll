import { Response } from "express";
import fs from "fs";
import path from "path";
import os from "os";
import archiver from "archiver";

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

import WorkSummary from "../../model/punch/workSummary";
import PunchHistory from "../../model/punch/puncHistory";
import User from "../../model/account/user";

import { buildDateQuery } from "../../helper/date";
import {
  diffMinutesRoundedUp,
  formatYMD,
  makeExpectedDate,
  normalizeHHmm,
  toNum,
} from "../../utils/date.util";
import { pickEntryPunch } from "../../helper/punchs/pick-first-punch";
import moment from "moment";
import { findEmployeeIdsByFilters } from "../../services/employees.service";
moment.locale("es-do");

/**
 * =========================
 * Helpers (inline)
 * =========================
 */

/**
 * late = max(0, ceil(actual - expected) - grace)
 */
function calcLateMinutesFinal(args: {
  dayDate: Date;
  expectedHHmm: string;
  actualTimestamp: any;
  graceMinutes: number;
}) {
  const { dayDate, expectedHHmm, actualTimestamp, graceMinutes } = args;
  if (!expectedHHmm) return 0;

  const actual = actualTimestamp ? new Date(actualTimestamp) : null;
  if (!actual || isNaN(actual.getTime())) return 0;

  const expected = makeExpectedDate(dayDate, expectedHHmm);
  const raw = diffMinutesRoundedUp(actual, expected);
  const finalLate = Math.max(0, raw - Math.max(0, graceMinutes));
  return finalLate;
}

type LetterDateStrategy = "useEndDate" | "useFirstLateDay" | "useIssueDate";

function renderDocxFromTemplate(args: {
  templatePath: string;
  data: any;
  outPath: string;
}) {
  const { templatePath, data, outPath } = args;

  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" },
  });

  doc.render(data);

  const buf = doc.getZip().generate({ type: "nodebuffer" });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf);
}

export const previewLateLetters = async (req: any, res: Response) => {
  try {
    const {
      fechaInicio,
      fechaFin,
      departmentId,
      projectId,
      userId,
      userIds,
      onlySpecialDay,

      graceMinutes = 10,
      letterDateStrategy = "useEndDate",

      // preparado para luego
      includeEvidence = false,
    } = req.body || {};

    const start = String(fechaInicio || "").trim() || formatYMD(new Date());
    const end = String(fechaFin || "").trim();
    const periodFrom = start;
    const periodTo = end || start;

    // 1) empleados filtrados
    const empResp = await findEmployeeIdsByFilters({
      departmentId: req.user.isManager ? req.user.department : departmentId,
      projectId,
      userId,
      userIds,
      managerId: req.user.isManager ? req.user._id : null,
      paymentScheduleId: null,
    });

    if (!empResp.ok) {
      return res
        .status(empResp.status)
        .send({ ok: false, mensaje: empResp.mensaje });
    }

    const employeeIds = empResp.employeeIds || [];
    if (!employeeIds.length) {
      return res.status(200).send({
        ok: true,
        periodFrom,
        periodTo,
        graceMinutes: toNum(graceMinutes, 10),
        groups: [],
      });
    }

    // 2) WorkSummaries
    const dateQuery = buildDateQuery(start, end || null);

    const wsQuery: any = {
      user: { $in: employeeIds },
      dateString: dateQuery,
      isDeleted: false,
    };

    if (onlySpecialDay) {
      const excludeValue = "Trabajo regular";
      wsQuery.$and = wsQuery.$and || [];
      wsQuery.$and.push(
        { classification: { $exists: true } },
        { classification: { $nin: [excludeValue, null] } },
      );
    }

    const workSummaries = await WorkSummary.find(wsQuery)
      .select(["_id", "user", "date", "dateString"].join(" "))
      .sort({ date: 1 })
      .lean();

    if (!workSummaries.length) {
      return res.status(200).send({
        ok: true,
        periodFrom,
        periodTo,
        graceMinutes: toNum(graceMinutes, 10),
        groups: [],
      });
    }

    // 3) Users (incluye cédula: AJUSTA el campo real)
    const involvedUserIds = Array.from(
      new Set(workSummaries.map((w: any) => String(w.user))),
    );
    const usersDocs = await User.find({ _id: { $in: involvedUserIds } })
      .select("_id name payrollBank isActived isDeleted") // <-- AJUSTA
      .lean();

    const usersById = new Map<string, any>();
    for (const u of usersDocs as any[]) {
      if (u && !u.isDeleted && u.isActived !== false) {
        usersById.set(String(u._id), u);
      }
    }

    // 4) PunchHistory por WS
    const wsIds = workSummaries.map((w: any) => w._id);
    const punches = await PunchHistory.find({
      workSummary: { $in: wsIds },
      isDeleted: false,
    })
      .select("workSummary punchStep expectedTime timestamp isLate")
      .lean();

    const punchStepsByWS = new Map<string, any[]>();
    for (const p of punches as any[]) {
      const key = String(p.workSummary);
      const arr = punchStepsByWS.get(key) || [];
      arr.push(p);
      punchStepsByWS.set(key, arr);
    }

    for (const [k, arr] of punchStepsByWS.entries()) {
      arr.sort((a: any, b: any) => {
        const ta = new Date(a?.timestamp || 0).getTime();
        const tb = new Date(b?.timestamp || 0).getTime();
        return ta - tb;
      });
      punchStepsByWS.set(k, arr);
    }

    // 5) Agrupar por expectedEntryTimeKey
    type LateDayRow = {
      dateString: string;
      expectedEntryTimeKey: string;
      actualEntryTime: string;
      lateMinutes: number;
    };

    type EmployeeAgg = {
      userId: string;
      name: string;
      payrollBank?: any;
      totalLateMinutes: number;
      totalLateCount: number;
      lateDays: LateDayRow[];
    };

    const grace = toNum(graceMinutes, 10);
    const groupsMap = new Map<string, Map<string, EmployeeAgg>>(); // expectedKey -> userId -> agg
    const firstLateDayByGroup = new Map<string, string>();

    for (const w of workSummaries as any[]) {
      const u = usersById.get(String(w.user));
      if (!u) continue;

      const steps = punchStepsByWS.get(String(w._id)) || [];
      const entryPunch = pickEntryPunch(steps);
      if (!entryPunch) continue;
      if (!entryPunch.isLate) continue;

      const expectedKey = normalizeHHmm(entryPunch.expectedTime);
      if (!expectedKey) continue;

      const dayDate = w.date ? new Date(w.date) : new Date();
      const dateStr =
        String(w.dateString || "").slice(0, 10) || formatYMD(dayDate);

      const lateMinutes = calcLateMinutesFinal({
        dayDate,
        expectedHHmm: expectedKey,
        actualTimestamp: entryPunch.timestamp,
        graceMinutes: grace,
      });

      if (lateMinutes <= 0) continue;

      if (!firstLateDayByGroup.has(expectedKey))
        firstLateDayByGroup.set(expectedKey, dateStr);

      const actual = entryPunch.timestamp
        ? new Date(entryPunch.timestamp)
        : null;
      const actualEntryTime =
        actual && !isNaN(actual.getTime())
          ? `${String(actual.getHours()).padStart(2, "0")}:${String(actual.getMinutes()).padStart(2, "0")}`
          : "";

      if (!groupsMap.has(expectedKey)) groupsMap.set(expectedKey, new Map());

      const empMap = groupsMap.get(expectedKey)!;
      const empId = String(u._id);

      const agg: EmployeeAgg = empMap.get(empId) || {
        userId: empId,
        name: String(u.name || "").trim(),
        payrollBank: u.payrollBank,
        totalLateMinutes: 0,
        totalLateCount: 0,
        lateDays: [],
      };

      agg.totalLateMinutes += lateMinutes;
      agg.totalLateCount += 1;
      agg.lateDays.push({
        dateString: dateStr,
        expectedEntryTimeKey: expectedKey,
        actualEntryTime,
        lateMinutes,
      });

      empMap.set(empId, agg);
    }

    const strategy = (letterDateStrategy || "useEndDate") as LetterDateStrategy;

    const groups = Array.from(groupsMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([expectedEntryTimeKey, empMap]) => {
        const employees = Array.from(empMap.values()).sort((x, y) =>
          x.name.localeCompare(y.name),
        );

        const totalLateMinutes = employees.reduce(
          (s, e) => s + e.totalLateMinutes,
          0,
        );
        const totalLateCount = employees.reduce(
          (s, e) => s + e.totalLateCount,
          0,
        );

        return {
          expectedEntryTimeKey,
          periodFrom,
          periodTo,
          graceMinutes: grace,
          totals: {
            totalEmployees: employees.length,
            totalLateMinutes,
            totalLateCount,
          },
          employees: employees.map((e) => ({
            userId: e.userId,
            name: e.name,
            payrollBank: e.payrollBank || "",
            totalLateMinutes: e.totalLateMinutes,
            totalLateCount: e.totalLateCount,
            // preparado para luego
            lateDays: includeEvidence ? e.lateDays : [],
          })),
        };
      })
      .filter((g) => g.employees.length > 0);

    return res.status(200).send({
      ok: true,
      periodFrom,
      periodTo,
      graceMinutes: grace,
      letterDateStrategy: strategy,
      includeEvidence: !!includeEvidence,
      groups,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).send({
      ok: false,
      mensaje: error?.message || "¡Ups! Algo salió mal generando el preview",
    });
  }
};

export const exportLateLetters = async (req: any, res: Response) => {
  try {
    const {
      // filtros
      fechaInicio,
      fechaFin,
      departmentId,
      projectId,
      userId,
      userIds,
      onlySpecialDay,

      // reglas
      graceMinutes = 10,
      letterDateStrategy = "useEndDate",

      // data empresa (puedes sacarlo de settings/DB luego)
      cityLine = "Santo Domingo, D. N.",
      rnc = "",
      address = "",
      signerName = "",
      signerRole = "",

      // preparado para luego
      includeEvidence = false,

      // template
      templatePath, // opcional si lo mandas desde el front
    } = req.body || {};

    // 1) reutiliza el preview internamente (para no duplicar lógica)
    //    (llamamos a previewLateLetters logic re-ejecutando, sin HTTP)
    //    Para simplificar, replicamos el cuerpo mínimo aquí:
    const start = String(fechaInicio || "").trim() || formatYMD(new Date());
    const end = String(fechaFin || "").trim();
    const periodFrom = start;
    const periodTo = end || start;

    const empResp = await findEmployeeIdsByFilters({
      departmentId: req.user.isManager ? req.user.department : departmentId,
      projectId,
      userId,
      userIds,
      managerId: req.user.isManager ? req.user._id : null,
      paymentScheduleId: null,
    });

    if (!empResp.ok) {
      return res
        .status(empResp.status)
        .send({ ok: false, mensaje: empResp.mensaje });
    }

    const employeeIds = empResp.employeeIds || [];
    if (!employeeIds.length) {
      return res.status(200).send({
        ok: true,
        mensaje: "No hay empleados para generar cartas.",
        groups: [],
      });
    }

    const dateQuery = buildDateQuery(start, end || null);

    const wsQuery: any = {
      user: { $in: employeeIds },
      dateString: dateQuery,
      isDeleted: false,
    };

    if (onlySpecialDay) {
      const excludeValue = "Trabajo regular";
      wsQuery.$and = wsQuery.$and || [];
      wsQuery.$and.push(
        { classification: { $exists: true } },
        { classification: { $nin: [excludeValue, null] } },
      );
    }

    const workSummaries = await WorkSummary.find(wsQuery)
      .select(["_id", "user", "date", "dateString"].join(" "))
      .sort({ date: 1 })
      .lean();

    if (!workSummaries.length) {
      return res.status(200).send({
        ok: true,
        mensaje: "No hay WorkSummaries en el rango para generar cartas.",
        groups: [],
      });
    }

    const involvedUserIds = Array.from(
      new Set(workSummaries.map((w: any) => String(w.user))),
    );
    const usersDocs = await User.find({ _id: { $in: involvedUserIds } })
      .select("_id name payrollBank isActived isDeleted")
      .lean();

    const usersById = new Map<string, any>();
    for (const u of usersDocs as any[]) {
      if (u && !u.isDeleted && u.isActived !== false) {
        usersById.set(String(u._id), u);
      }
    }

    const wsIds = workSummaries.map((w: any) => w._id);
    const punches = await PunchHistory.find({
      workSummary: { $in: wsIds },
      isDeleted: false,
    })
      .select("workSummary punchStep expectedTime timestamp isLate")
      .lean();

    const punchStepsByWS = new Map<string, any[]>();
    for (const p of punches as any[]) {
      const key = String(p.workSummary);
      const arr = punchStepsByWS.get(key) || [];
      arr.push(p);
      punchStepsByWS.set(key, arr);
    }

    for (const [k, arr] of punchStepsByWS.entries()) {
      arr.sort((a: any, b: any) => {
        const ta = new Date(a?.timestamp || 0).getTime();
        const tb = new Date(b?.timestamp || 0).getTime();
        return ta - tb;
      });
      punchStepsByWS.set(k, arr);
    }

    type LateDayRow = {
      dateString: string;
      actualEntryTime: string;
      lateMinutes: number;
    };
    type EmployeeAgg = {
      userId: string;
      name: string;
      payrollBank?: any;
      totalLateMinutes: number;
      totalLateCount: number;
      lateDays: LateDayRow[];
    };

    const grace = toNum(graceMinutes, 10);
    const groupsMap = new Map<string, Map<string, EmployeeAgg>>();
    const firstLateDayByGroup = new Map<string, string>();

    for (const w of workSummaries as any[]) {
      const u = usersById.get(String(w.user));
      if (!u) continue;

      const steps = punchStepsByWS.get(String(w._id)) || [];
      const entryPunch = pickEntryPunch(steps);
      if (!entryPunch) continue;
      if (!entryPunch.isLate) continue;

      const expectedKey = normalizeHHmm(entryPunch.expectedTime);
      if (!expectedKey) continue;

      const dayDate = w.date ? new Date(w.date) : new Date();
      const dateStr =
        String(w.dateString || "").slice(0, 10) || formatYMD(dayDate);

      const lateMinutes = calcLateMinutesFinal({
        dayDate,
        expectedHHmm: expectedKey,
        actualTimestamp: entryPunch.timestamp,
        graceMinutes: grace,
      });

      if (lateMinutes <= 0) continue;

      if (!firstLateDayByGroup.has(expectedKey))
        firstLateDayByGroup.set(expectedKey, dateStr);
      if (!groupsMap.has(expectedKey)) groupsMap.set(expectedKey, new Map());

      const actual = entryPunch.timestamp
        ? new Date(entryPunch.timestamp)
        : null;
      const actualEntryTime =
        actual && !isNaN(actual.getTime())
          ? `${String(actual.getHours()).padStart(2, "0")}:${String(actual.getMinutes()).padStart(2, "0")}`
          : "";

      const empMap = groupsMap.get(expectedKey)!;
      const empId = String(u._id);

      const agg: EmployeeAgg = empMap.get(empId) || {
        userId: empId,
        name: String(u.name || "").trim(),
        payrollBank: u.payrollBank,
        totalLateMinutes: 0,
        totalLateCount: 0,
        lateDays: [],
      };

      agg.totalLateMinutes += lateMinutes;
      agg.totalLateCount += 1;
      agg.lateDays.push({ dateString: dateStr, actualEntryTime, lateMinutes });

      empMap.set(empId, agg);
    }

    const groups = Array.from(groupsMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([expectedEntryTimeKey, empMap]) => {
        const employees = Array.from(empMap.values()).sort((x, y) =>
          x.name.localeCompare(y.name),
        );

        return {
          expectedEntryTimeKey,
          employees,
        };
      })
      .filter((g) => g.employees.length > 0);

    if (!groups.length) {
      return res.status(200).send({
        ok: true,
        mensaje: "No se encontraron tardanzas en el rango para generar cartas.",
        groups: [],
      });
    }

    // 2) Template path (ENV o default)
    const tpl =
      String(templatePath || "").trim() ||
      process.env.LATE_LETTER_TEMPLATE_PATH ||
      "src/templates/template-carta-tardanza.docx";

    if (!fs.existsSync(tpl)) {
      return res.status(400).send({
        ok: false,
        mensaje: `No existe la plantilla DOCX en: ${tpl}`,
      });
    }

    // 3) Generar DOCX por grupo en tmp
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "late-letters-"));

    for (const g of groups) {
      const fileName = `Carta_Tardanzas_${g.expectedEntryTimeKey.replace(":", "")}.docx`;
      const outPath = path.join(tmpDir, fileName);

      const data = {
        cityLine,
        incidentDate: moment(new Date()).format("LL"),

        // regla
        expectedEntryTime: g.expectedEntryTimeKey,
        graceMinutes: grace,
        periodFrom,
        periodTo,

        // loop empleados
        employees: g.employees.map((e) => ({
          name: e.name,
          id: e?.payrollBank?.idNumber || "",
          totalLateCount: e.totalLateCount,
          totalLateMinutes: e.totalLateMinutes,
        })),

        // firma/empresa
        signerName,
        signerRole,
        rnc,
        address,

        // preparado para evidencia luego
        includeEvidence: !!includeEvidence,
        evidenceRows: includeEvidence
          ? g.employees.flatMap((e) =>
              e.lateDays.map((d) => ({
                employeeName: e.name,
                employeeId: e?.payrollBank?.idNumber || "",
                date: d.dateString,
                expected: g.expectedEntryTimeKey,
                actual: d.actualEntryTime,
                lateMinutes: d.lateMinutes,
              })),
            )
          : [],
      };

      renderDocxFromTemplate({ templatePath: tpl, data, outPath });
    }

    // 4) Zip
    const zipPath = path.join(tmpDir, "Cartas_Tardanzas.zip");

    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", () => resolve());
      archive.on("error", (err) => reject(err));

      archive.pipe(output);

      // solo los docx (evita meter el zip dentro del zip si re-intentas)
      const files = fs
        .readdirSync(tmpDir)
        .filter((f) => f.toLowerCase().endsWith(".docx"));
      for (const f of files) {
        archive.file(path.join(tmpDir, f), { name: f });
      }

      archive.finalize();
    });

    const buf = fs.readFileSync(zipPath);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Cartas_Tardanzas.zip"`,
    );
    return res.status(200).send(buf);
  } catch (error: any) {
    console.log(error);
    return res.status(500).send({
      ok: false,
      mensaje: error?.message || "¡Ups! Algo salió mal exportando las cartas",
    });
  }
};
