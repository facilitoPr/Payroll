import { Request, Response } from "express";
import { Types } from "mongoose";
import CallReports from "../model/callsReports";

import * as fs from "fs";
import csvParser from "csv-parser";
import User from "../model/account/user";
import moment from "moment";
import ExcelJS from "exceljs";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  TableLayoutType,
} from "docx";
import { hmsFromSec, hmsToSec } from "../helper/hours";

const callsRepotsColumns = {
  "Call Time": "callTime",
  "Call ID": "callId",
  From: "from",
  To: "to",
  Status: "status",
  Direction: "direction",
  Ringing: "ringing",
  Talking: "talking",
  Cost: "cost",
  //   "Call Activity Details": "endByOperator",
};

function getThreeDigitsInParens(input?: string): number | null {
  if (!input) return null;
  const m = input.trim().match(/\(\s*(\d{3,})\s*\)\s*$/);
  return m ? Number(m[1]) : null;
}

// helper: extrae "Ended by X (nnn)" de Call Activity Details
function parseEndedBy(details?: string): {
  endedByText: string | null;
  endedByExt: number | null;
} {
  if (!details) return { endedByText: null, endedByExt: null };
  const m = details.match(/Ended by\s+([^.→\n\r]+)(?:[.→]|$)/i);
  if (!m) return { endedByText: null, endedByExt: null };

  const raw = m[1].trim(); // p.ej. "Operadora 11 (274)" o "System"
  const extM = raw.match(/\(\s*(\d{3,})\s*\)\s*$/);
  const name = raw.replace(/\(\s*\d+\s*\)\s*$/, "").trim();

  return {
    endedByText: name || raw,
    endedByExt: extM ? Number(extM[1]) : null,
  };
}

const processCallsReportFile = async (req: Request, res: Response) => {
  try {
    // const { } = req.body;

    const filePath = req.file?.path;
    const batchSize = 100;

    if (!filePath) {
      return res.status(400).send({ ok: false, message: "No file uploaded" });
    }

    const pending: Promise<void>[] = [];
    const rows: any[] = [];

    fs.createReadStream(filePath)
      .pipe(
        csvParser({
          separator: ",",
          mapHeaders: ({ header }) => header.trim(),
        }),
      )
      .on("data", (row) => {
        const task = (async () => {
          const cleaned: any = {};
          for (const key in row) {
            const mappedKey = callsRepotsColumns[key] || key;
            cleaned[mappedKey] = row[key]?.toString?.().trim() || "";
          }

          const callTimeIso: string | undefined = cleaned["callTime"];
          if (callTimeIso) {
            cleaned.callDay = moment(callTimeIso).format("YYYY/MM/DD"); // "YYYY-MM-DD"
          }

          const from: string | undefined = cleaned["from"];
          const to: string | undefined = cleaned["to"];

          if (!from || !to) {
            return;
          }

          const direction = cleaned["direction"]
            ?.toString()
            .trim()
            .toLowerCase();

          const toCode = getThreeDigitsInParens(to);
          const fromCode = getThreeDigitsInParens(from);

          // 1) Resolver ext con prioridad al "to" y SOLO si hay usuario con esa ext
          let ext: number | null = null;

          if (toCode !== null) {
            const uTo = await User.findOne({ ext: toCode });
            if (uTo) {
              cleaned.user = uTo._id;
              ext = toCode;
            }
          }

          if (ext === null && fromCode !== null) {
            const uFrom = await User.findOne({ ext: fromCode });
            if (uFrom) {
              cleaned.user = uFrom._id;
              ext = fromCode;
            }
          }

          if (ext !== null) cleaned.ext = ext;

          // 2) Parsear "Ended by ..." del detalle
          const details =
            cleaned["call activity details"] ||
            cleaned["Call Activity Details"] ||
            cleaned["callActivityDetails"];

          const { endedByExt } = parseEndedBy(details);
          // cleaned.endedByText = endedByText;
          // cleaned.endedByExt = endedByExt;

          // 3) endByOperator = endedByExt === ext
          //    (si quieres evitar marcar llamadas internas, agrega && direction !== 'internal')
          cleaned.endByOperator =
            endedByExt !== null && ext !== null && endedByExt === ext;
          // && direction !== 'internal'

          if (cleaned.callId) {
            const exists = await CallReports.exists({
              callId: cleaned.callId,
            });
            if (exists) {
              console.log(`⏭️  Skip duplicado callId=${cleaned.callId}`);
              return;
            }
          }

          rows.push(cleaned);
        })();

        pending.push(task);
      })
      .on("end", async () => {
        try {
          await Promise.all(pending); // <- clave
          console.log(`📦 Total filas leídas: ${rows.length}`);
          console.log(rows);

          for (let i = 0; i < rows.length; i += batchSize) {
            const chunk = rows.slice(i, i + batchSize);
            await CallReports.insertMany(chunk);
          }

          fs.unlinkSync(filePath);
          res.status(201).json({
            ok: true,
            mensaje: "Archivo procesado correctamente",
            total: rows.length,
          });
        } catch (e) {
          res
            .status(500)
            .json({ ok: false, mensaje: "Error procesando filas", e });
        }
      })
      .on("error", (err) => {
        res
          .status(500)
          .json({ ok: false, mensaje: "Error leyendo archivo CSV", err });
      });
  } catch (err) {
    console.error("❌ Error general:", err);
    res
      .status(500)
      .json({ ok: false, mensaje: "Error al procesar archivo", err });
  }
};

const getCallsReports = async (req: any, res: Response) => {
  try {
    const { limit = "10", initial = "0", users } = req.query;
    const { startDate, endDate } = req.body;

    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit)) || 20));
    const initialNum = Math.max(0, parseInt(String(initial)) || 0);

    const filter: Record<string, any> = {};

    // Rol OPERADORA ve solo lo suyo
    if (req.user?.rol?.code === "EMPLOYEE" && req.user?.isManager == false) {
      filter.user = req.user._id;
    }

    // Filtro por usuario (override)
    if (typeof users === "string" && users !== "null" && users.trim() !== "") {
      const ids = users
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const allValid = ids.every((id) => Types.ObjectId.isValid(id));
      if (!allValid) {
        return res
          .status(400)
          .json({ ok: false, mensaje: "user no es ObjectId válido" });
      }

      filter.user = { $in: ids.map((id) => new Types.ObjectId(id)) };
    }

    // Rango por callDay (STRING "YYYY-MM-DD")
    const start =
      typeof startDate === "string" && startDate.trim()
        ? moment(startDate.trim(), "YYYY/MM/DD").format("YYYY/MM/DD")
        : null;
    const end =
      typeof endDate === "string" && endDate.trim()
        ? moment(endDate.trim(), "YYYY/MM/DD").format("YYYY/MM/DD")
        : null;

    if (start && end) {
      filter.callDay = { $gte: start, $lte: end };
    } else if (start) {
      filter.callDay = { $gte: start }; // desde start inclusive
    } else if (end) {
      filter.callDay = { $lte: end }; // hasta end inclusive
    }

    // Página + conteo total de filas
    const [callsReports, count, summaryAgg] = await Promise.all([
      CallReports.find(filter)
        .populate("user")
        .sort({ callTime: -1 })
        .skip(initialNum)
        .limit(limitNum)
        .lean(),

      CallReports.countDocuments(filter),

      // Resumen (total, outbound, inbound, answered, unanswered)
      CallReports.aggregate([
        { $match: filter },
        {
          $addFields: {
            _dir: { $toLower: "$direction" },
            _status: { $toLower: { $ifNull: ["$status", ""] } },
            _durationAny: {
              $max: [
                { $ifNull: ["$durationSec", 0] },
                { $ifNull: ["$billSec", 0] },
                { $ifNull: ["$talkTimeSec", 0] },
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            outbound: {
              $sum: { $cond: [{ $eq: ["$_dir", "outbound"] }, 1, 0] },
            },
            inbound: { $sum: { $cond: [{ $eq: ["$_dir", "inbound"] }, 1, 0] } },
            internal: {
              $sum: { $cond: [{ $eq: ["$_dir", "internal"] }, 1, 0] },
            },
            answered: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ["$_status", "answered"] },
                      { $gt: ["$_durationAny", 0] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $addFields: { unanswered: { $subtract: ["$total", "$answered"] } } },
        {
          $project: {
            _id: 0,
            total: 1,
            outbound: 1,
            inbound: 1,
            internal: 1,
            answered: 1,
            unanswered: 1,
          },
        },
      ]).allowDiskUse(true),
    ]);

    const summary = summaryAgg[0] || {
      total: 0,
      outbound: 0,
      inbound: 0,
      answered: 0,
      unanswered: 0,
      internal: 0,
    };

    res.status(200).json({
      ok: true,
      mensaje: "Consulta realizada correctamente",
      callsReports,
      count,
      summary, // 👈 aquí tienes los totales solicitados
    });
  } catch (error) {
    console.error("❌ Error general:", error);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

const getTalkingTotals = async (req: any, res: Response) => {
  try {
    const { users, answeredOnly } = req.query;
    const { startDate, endDate } = req.body;

    // Filtro reutilizando tu misma lógica
    const filter: Record<string, any> = {};

    if (req.user?.rol?.code === "EMPLOYEE" && req.user?.isManager == false) {
      filter.user = req.user._id;
    }
    // if (typeof user === "string" && user !== "null" && user.trim() !== "") {
    //   if (!Types.ObjectId.isValid(user)) {
    //     return res
    //       .status(400)
    //       .json({ ok: false, mensaje: "user no es ObjectId válido" });
    //   }
    //   filter.user = new Types.ObjectId(user);
    // }

    // Filtro por usuario (override)
    if (typeof users === "string" && users !== "null" && users.trim() !== "") {
      const ids = users
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const allValid = ids.every((id) => Types.ObjectId.isValid(id));
      if (!allValid) {
        return res
          .status(400)
          .json({ ok: false, mensaje: "user no es ObjectId válido" });
      }

      filter.user = { $in: ids.map((id) => new Types.ObjectId(id)) };
    }

    // Rango por callDay (STRING "YYYY-MM-DD")
    const start =
      typeof startDate === "string" && startDate.trim()
        ? moment(startDate.trim(), "YYYY/MM/DD").format("YYYY/MM/DD")
        : null;
    const end =
      typeof endDate === "string" && endDate.trim()
        ? moment(endDate.trim(), "YYYY/MM/DD").format("YYYY/MM/DD")
        : null;

    if (start && end) {
      filter.callDay = { $gte: start, $lte: end };
    } else if (start) {
      filter.callDay = { $gte: start }; // desde start inclusive
    } else if (end) {
      filter.callDay = { $lte: end }; // hasta end inclusive
    }

    // Si piden solo contestadas, filtramos aquí (usando tu “answered” lógico)
    // answered = status == "answered" || max(durationSec,billSec,talkTimeSec) > 0
    if (answeredOnly === "1" || answeredOnly === "true") {
      filter.$or = [
        { status: /^answered$/i },
        {
          $expr: {
            $gt: [
              {
                $max: [
                  { $ifNull: ["$durationSec", 0] },
                  { $ifNull: ["$billSec", 0] },
                  { $ifNull: ["$talkTimeSec", 0] },
                ],
              },
              0,
            ],
          },
        },
      ];
    }

    // Proyección mínima para rendimiento
    const projection = {
      direction: 1,
      talking: 1,
      status: 1,
      durationSec: 1,
      billSec: 1,
      talkTimeSec: 1,
    } as const;

    // Si el dataset es grande, usa cursor streaming (descomenta el bloque cursor y comenta el find-lean)
    const docs = await CallReports.find(filter, projection).lean();

    // Acumuladores
    let totalCount = 0;
    let sumAll = 0,
      sumOut = 0,
      sumIn = 0,
      sumInternal = 0;
    let cAll = 0,
      cOut = 0,
      cIn = 0,
      cInternal = 0;

    for (const d of docs) {
      const dir = String(d?.direction || "").toLowerCase();
      const sec = hmsToSec(d?.talking);

      totalCount += 1;

      // all
      sumAll += sec;
      cAll += 1;

      // por dirección
      if (dir === "outbound") {
        sumOut += sec;
        cOut += 1;
      } else if (dir === "inbound") {
        sumIn += sec;
        cIn += 1;
      } else if (dir === "internal") {
        sumInternal += sec;
        cInternal += 1;
      }
    }

    // Promedios (opcional, ya que pediste “sumas”, pero te los dejo listos)
    const avgAll = cAll ? Math.round(sumAll / cAll) : 0;
    const avgOut = cOut ? Math.round(sumOut / cOut) : 0;
    const avgIn = cIn ? Math.round(sumIn / cIn) : 0;
    const avgInt = cInternal ? Math.round(sumInternal / cInternal) : 0;

    res.status(200).json({
      ok: true,
      mensaje: "Totales de talking calculados",
      count: totalCount,

      sums: {
        all: { seconds: sumAll, formatted: hmsFromSec(sumAll) },
        outbound: { seconds: sumOut, formatted: hmsFromSec(sumOut) },
        inbound: { seconds: sumIn, formatted: hmsFromSec(sumIn) },
        internal: { seconds: sumInternal, formatted: hmsFromSec(sumInternal) },
      },

      averages: {
        all: { seconds: avgAll, formatted: hmsFromSec(avgAll) },
        outbound: { seconds: avgOut, formatted: hmsFromSec(avgOut) },
        inbound: { seconds: avgIn, formatted: hmsFromSec(avgIn) },
        internal: { seconds: avgInt, formatted: hmsFromSec(avgInt) },
      },
    });
  } catch (error) {
    console.error("❌ Error getTalkingTotals:", error);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

const exportCallsReportExcel = async (req: any, res: Response) => {
  try {
    const { user } = req.query;
    const { startDate, endDate } = req.body; // YYYY-MM-DD

    const match: Record<string, any> = {};
    if (req.user?.rol?.code === "EMPLOYEE" && req.user?.isManager == false)
      match.user = req.user._id;
    if (typeof user === "string" && user.trim() && user !== "null") {
      if (!Types.ObjectId.isValid(user)) {
        return res
          .status(400)
          .json({ ok: false, mensaje: "user no es ObjectId válido" });
      }
      match.user = new Types.ObjectId(user);
    }
    // Rango por callDay (STRING "YYYY-MM-DD")
    const start =
      typeof startDate === "string" && startDate.trim()
        ? moment(startDate.trim(), "YYYY/MM/DD").format("YYYY/MM/DD")
        : null;
    const end =
      typeof endDate === "string" && endDate.trim()
        ? moment(endDate.trim(), "YYYY/MM/DD").format("YYYY/MM/DD")
        : null;

    if (start && end) {
      match.callDay = { $gte: start, $lte: end };
    } else if (start) {
      match.callDay = { $gte: start }; // desde start inclusive
    } else if (end) {
      match.callDay = { $lte: end }; // hasta end inclusive
    }

    const pipeline: any = [
      { $match: match },
      {
        $addFields: {
          _dir: { $toLower: "$direction" },
          _status: { $toLower: { $ifNull: ["$status", ""] } },
          _durationAny: {
            $max: [
              { $ifNull: ["$durationSec", 0] },
              { $ifNull: ["$billSec", 0] },
              { $ifNull: ["$talkTimeSec", 0] },
            ],
          },
        },
      },
      // ⬇️ EXCLUIR llamadas internas
      { $match: { _dir: { $ne: "internal" } } },

      {
        $group: {
          _id: "$user",
          total: { $sum: 1 },
          outbound: { $sum: { $cond: [{ $eq: ["$_dir", "outbound"] }, 1, 0] } },
          inbound: { $sum: { $cond: [{ $eq: ["$_dir", "inbound"] }, 1, 0] } },
          answered: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$_status", "answered"] },
                    { $gt: ["$_durationAny", 0] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $addFields: { unanswered: { $subtract: ["$total", "$answered"] } } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          operator: { $ifNull: ["$user.name", "Sin asignar"] },
          ext: "$user.ext",
          outbound: 1,
          inbound: 1,
          answered: 1,
          unanswered: 1,
          total: 1,
        },
      },
      { $sort: { operator: 1 } },
    ];

    const rows = await CallReports.aggregate(pipeline).allowDiskUse(true);

    if (rows.length == 0) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "No hay datos de llamadas" });
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Resumen por Operador");

    ws.columns = [
      { header: "Operador", key: "operator", width: 32 },
      { header: "Ext", key: "ext", width: 10 },
      { header: "Llamadas salientes", key: "outbound", width: 20 },
      { header: "Llamadas entrantes", key: "inbound", width: 20 },
      { header: "Contestadas", key: "answered", width: 14 },
      { header: "No contestadas", key: "unanswered", width: 16 },
      { header: "Total", key: "total", width: 12 },
    ];

    rows.forEach((r) => ws.addRow(r));
    ws.getRow(1).font = { bold: true };

    const totals = rows.reduce(
      (a: any, r: any) => ({
        outbound: (a.outbound || 0) + (r.outbound || 0),
        inbound: (a.inbound || 0) + (r.inbound || 0),
        answered: (a.answered || 0) + (r.answered || 0),
        unanswered: (a.unanswered || 0) + (r.unanswered || 0),
        total: (a.total || 0) + (r.total || 0),
      }),
      {},
    );

    const totalRow = ws.addRow({ operator: "TOTAL", ext: "", ...totals });
    totalRow.font = { bold: true };
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: ws.columnCount },
    };

    const filename = `reporte_operadores_${startDate || "inicio"}_${
      endDate || "fin"
    }.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("❌ Error exportando excel:", error);
    res.status(500).json({ ok: false, mensaje: "Error exportando reporte" });
  }
};

const exportCallsReportDocx = async (req: any, res: Response) => {
  try {
    const { user } = req.query;
    const { startDate, endDate } = req.body;

    const COLS = [5500, 2000, 2000, 2000, 2400, 1600]; // Operador, Salientes, Entrantes, Contestadas, No contestadas, Total

    const match: Record<string, any> = {};
    if (req.user?.rol?.code === "EMPLOYEE" && req.user?.isManager == false)
      match.user = req.user._id;
    if (typeof user === "string" && user.trim() && user !== "null") {
      if (!Types.ObjectId.isValid(user)) {
        return res
          .status(400)
          .json({ ok: false, mensaje: "user no es ObjectId válido" });
      }
      match.user = new Types.ObjectId(user);
    }
    if (startDate || endDate) {
      if (startDate && !endDate) match.callDay = { $gte: String(startDate) };
      else if (startDate && endDate)
        match.callDay = { $gte: String(startDate), $lte: String(endDate) };
      else if (!startDate && endDate) match.callDay = { $lte: String(endDate) };
    }

    const pipeline: any = [
      { $match: match },
      {
        $addFields: {
          _dir: { $toLower: "$direction" },
          _status: { $toLower: { $ifNull: ["$status", ""] } },
          _durationAny: {
            $max: [
              { $ifNull: ["$durationSec", 0] },
              { $ifNull: ["$billSec", 0] },
              { $ifNull: ["$talkTimeSec", 0] },
            ],
          },
        },
      },
      // ⛔️ excluir llamadas internas
      { $match: { _dir: { $ne: "internal" } } },
      {
        $group: {
          _id: "$user",
          total: { $sum: 1 },
          outbound: { $sum: { $cond: [{ $eq: ["$_dir", "outbound"] }, 1, 0] } },
          inbound: { $sum: { $cond: [{ $eq: ["$_dir", "inbound"] }, 1, 0] } },
          answered: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$_status", "answered"] },
                    { $gt: ["$_durationAny", 0] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $addFields: { unanswered: { $subtract: ["$total", "$answered"] } } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          operator: { $ifNull: ["$user.name", "Sin asignar"] },
          ext: "$user.ext",
          outbound: 1,
          inbound: 1,
          answered: 1,
          unanswered: 1,
          total: 1,
        },
      },
      { $sort: { operator: 1 } },
    ];

    const rows = await CallReports.aggregate(pipeline).allowDiskUse(true);

    if (rows.length == 0) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "No hay datos de llamadas" });
    }

    const totals = rows.reduce(
      (a: any, r: any) => ({
        outbound: (a.outbound || 0) + (r.outbound || 0),
        inbound: (a.inbound || 0) + (r.inbound || 0),
        answered: (a.answered || 0) + (r.answered || 0),
        unanswered: (a.unanswered || 0) + (r.unanswered || 0),
        total: (a.total || 0) + (r.total || 0),
      }),
      {},
    );

    // ---- DOCX ----
    const headerCell = (text: string, w: number) =>
      new TableCell({
        width: { size: w, type: WidthType.DXA },
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text, bold: true })],
          }),
        ],
      });

    const bodyCell = (
      text: string | number,
      w: number,
      align: any = AlignmentType.CENTER,
      bold = false,
    ) =>
      new TableCell({
        width: { size: w, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [
          new Paragraph({
            alignment: align,
            children: [new TextRun({ text: String(text), bold })],
          }),
        ],
      });

    const header = new TableRow({
      children: [
        headerCell("OPERADOR", COLS[0]),
        headerCell("LLAMADAS SALIENTES", COLS[1]),
        headerCell("LLAMADAS ENTRANTES", COLS[2]),
        headerCell("CONTESTADAS", COLS[3]),
        headerCell("NO CONTESTADAS", COLS[4]),
        headerCell("TOTAL", COLS[5]),
      ],
    });

    // Filas: "Nombre (ext)"
    const bodyRows = rows.map(
      (r: any) =>
        new TableRow({
          children: [
            bodyCell(
              `${r.operator}${r.ext ? ` (${r.ext})` : ""}`,
              COLS[0],
              AlignmentType.LEFT,
            ),
            bodyCell(r.outbound, COLS[1]),
            bodyCell(r.inbound, COLS[2]),
            bodyCell(r.answered, COLS[3]),
            bodyCell(r.unanswered, COLS[4]),
            bodyCell(r.total, COLS[5]),
          ],
        }),
    );

    // Totales
    const totalRow = new TableRow({
      children: [
        bodyCell("TOTAL", COLS[0], AlignmentType.LEFT, true),
        bodyCell(totals.outbound ?? 0, COLS[1], AlignmentType.CENTER, true),
        bodyCell(totals.inbound ?? 0, COLS[2], AlignmentType.CENTER, true),
        bodyCell(totals.answered ?? 0, COLS[3], AlignmentType.CENTER, true),
        bodyCell(totals.unanswered ?? 0, COLS[4], AlignmentType.CENTER, true),
        bodyCell(totals.total ?? 0, COLS[5], AlignmentType.CENTER, true),
      ],
    });
    const table = new Table({
      width: { size: 10000, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [header, ...bodyRows, totalRow],
    });

    const doc = new Document({
      sections: [
        {
          properties: {
            page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } }, // márgenes ~1"
          },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "REPORTE DE LLAMADAS",
                  bold: true,
                  size: 28,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Rango: ${startDate || "inicio"} — ${endDate || "fin"}`,
                  italics: true,
                }),
              ],
              spacing: { after: 200 },
            }),
            table,
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = `reporte_operadores_${startDate || "inicio"}_${
      endDate || "fin"
    }.docx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error("❌ Error exportando docx:", error);
    res.status(500).json({ ok: false, mensaje: "Error exportando reporte" });
  }
};

const exportOutboundAnsweredTalkingExcel = async (req: any, res: Response) => {
  try {
    const { user } = req.query;
    const { startDate, endDate } = req.body; // "YYYY/MM/DD"

    // ==== Filtro base ====
    const filter: Record<string, any> = {};
    if (req.user?.rol?.code === "EMPLOYEE" && req.user?.isManager == false)
      filter.user = req.user._id;

    if (typeof user === "string" && user.trim() && user !== "null") {
      if (!Types.ObjectId.isValid(user)) {
        return res
          .status(400)
          .json({ ok: false, mensaje: "user no es ObjectId válido" });
      }
      filter.user = new Types.ObjectId(user);
    }

    const start =
      typeof startDate === "string" && startDate.trim()
        ? moment(startDate.trim(), "YYYY/MM/DD").format("YYYY/MM/DD")
        : null;
    const end =
      typeof endDate === "string" && endDate.trim()
        ? moment(endDate.trim(), "YYYY/MM/DD").format("YYYY/MM/DD")
        : null;

    if (start && end) filter.callDay = { $gte: start, $lte: end };
    else if (start) filter.callDay = { $gte: start };
    else if (end) filter.callDay = { $lte: end };

    // Solo OUTBOUND
    filter.direction = /^(outbound)$/i;

    // Proyección mínima
    const projection = {
      user: 1,
      status: 1,
      talking: 1,
    } as const;

    const docs = await CallReports.find(filter, projection).lean();

    // === Agrupación en Node por operador ===
    type Acc = {
      userId?: string;
      total: number;
      answered: number;
      sumSec: number;
    };
    const byUser = new Map<string, Acc>();
    const unassignedKey = "unassigned";

    for (const d of docs) {
      const id = d?.user ? String(d.user) : unassignedKey;
      const acc = byUser.get(id) || {
        userId: d?.user ? String(d.user) : undefined,
        total: 0,
        answered: 0,
        sumSec: 0,
      };

      // Siempre contamos las salientes totales
      acc.total += 1;

      // Contestadas
      const status = String(d?.status || "").toLowerCase();
      if (status === "answered") {
        acc.answered += 1;
        acc.sumSec += hmsToSec(d?.talking);
      }

      byUser.set(id, acc);
    }

    if (byUser.size === 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "No hay llamadas salientes en el rango",
      });
    }

    // === Cargamos info de usuarios (nombre/ext) ===
    const ids = Array.from(byUser.keys()).filter((k) => k !== unassignedKey);
    const users = ids.length
      ? await User.find(
          { _id: { $in: ids.map((id) => new Types.ObjectId(id)) } },
          { name: 1, ext: 1 },
        ).lean()
      : [];
    const userMap = new Map<string, { name?: string; ext?: string }>();
    for (const u of users)
      userMap.set(String(u._id), { name: u?.name, ext: u?.ext });

    // === Preparamos filas ===
    type Row = {
      operator: string;
      ext?: string;
      outboundCount: number; // TOTAL salientes
      outboundAnsweredCount: number; // Salientes contestadas
      avgOutboundAnsweredSec: number;
      avgOutboundAnsweredHHMMSS: string;
      sumOutboundAnsweredSec: number; // Para totales/ponderado
    };
    const rows: Row[] = [];

    for (const [id, acc] of byUser) {
      const info =
        id === unassignedKey
          ? { name: "Sin asignar", ext: "" }
          : userMap.get(id) || { name: "Sin asignar", ext: "" };

      const avgSec = acc.answered ? Math.round(acc.sumSec / acc.answered) : 0;

      rows.push({
        operator: info.name || "Sin asignar",
        ext: info.ext || "",
        outboundCount: acc.total,
        outboundAnsweredCount: acc.answered,
        avgOutboundAnsweredSec: avgSec,
        avgOutboundAnsweredHHMMSS: hmsFromSec(avgSec),
        sumOutboundAnsweredSec: acc.sumSec,
      });
    }

    // Orden por nombre operador
    rows.sort((a, b) => a.operator.localeCompare(b.operator));

    // === Excel ===
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Salientes");

    ws.columns = [
      { header: "Operador", key: "operator", width: 32 },
      { header: "Ext", key: "ext", width: 10 },
      { header: "Salientes", key: "outboundCount", width: 16 }, // <— TOTAL
      {
        header: "Salientes contestadas",
        key: "outboundAnsweredCount",
        width: 22,
      },
      {
        header: "Promedio contestadas (HH:MM:SS)",
        key: "avgOutboundAnsweredHHMMSS",
        width: 26,
      },
    ];

    for (const r of rows) {
      ws.addRow({
        operator: r.operator,
        ext: r.ext,
        outboundCount: r.outboundCount, // <— ahora se escribe
        outboundAnsweredCount: r.outboundAnsweredCount,
        avgOutboundAnsweredHHMMSS: r.avgOutboundAnsweredHHMMSS,
      });
    }

    // Header bold
    ws.getRow(1).font = { bold: true };

    // Totales
    const totals = rows.reduce(
      (a, r) => {
        a.totalOut += r.outboundCount || 0;
        a.ansCount += r.outboundAnsweredCount || 0;
        a.sumSec += r.sumOutboundAnsweredSec || 0;
        return a;
      },
      { totalOut: 0, ansCount: 0, sumSec: 0 },
    );

    const overallAvg = totals.ansCount
      ? Math.round(totals.sumSec / totals.ansCount)
      : 0;

    const totalRow = ws.addRow({
      operator: "TOTAL",
      ext: "",
      outboundCount: totals.totalOut, // <— total salientes
      outboundAnsweredCount: totals.ansCount, // <— total contestadas
      avgOutboundAnsweredHHMMSS: hmsFromSec(overallAvg),
    });
    totalRow.font = { bold: true };

    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: ws.columnCount },
    };

    const filename = `salientes_${startDate || "inicio"}_${
      endDate || "fin"
    }.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("❌ Error exportOutboundAnsweredTalkingExcel:", error);
    res.status(500).json({ ok: false, mensaje: "Error exportando reporte" });
  }
};

export {
  processCallsReportFile,
  getCallsReports,
  getTalkingTotals,
  exportCallsReportExcel,
  exportCallsReportDocx,
  exportOutboundAnsweredTalkingExcel,
};
