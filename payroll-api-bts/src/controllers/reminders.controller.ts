import { Request, Response } from "express";
import Reminders, { REMINDER_MARK_CODES, reminders } from "../model/reminders";
import { deletFile, processImageCover } from "../middlewares/imagen";
import Status from "../model/status";
import {
  cleanText,
  escapeRegex,
  generateRegex,
} from "../middlewares/cleanText";

import Zones from "../model/zones";
import moment from "moment";
import mongoose from "mongoose";
import { Types } from "mongoose";
import User from "../model/account/user";
import Roles from "../model/role";
import Comercial, { comercial } from "../model/comercial/comercial";

import ExcelJS from "exceljs";
import Department from "../model/rrhh/department";

type ReminderMarkCode = (typeof REMINDER_MARK_CODES)[number];

const uniqStrings = (arr: any[]) => {
  return Array.from(new Set(arr));
};

const cleanMarks = (input: any): ReminderMarkCode[] => {
  if (!Array.isArray(input)) return [];
  const upper = input
    .map((x) =>
      String(x || "")
        .trim()
        .toUpperCase(),
    )
    .filter(Boolean);

  const filtered = upper.filter((x) =>
    (REMINDER_MARK_CODES as readonly string[]).includes(x),
  ) as ReminderMarkCode[];

  return uniqStrings(filtered);
};

//

const createReminders = async (req: any, res: Response) => {
  try {
    const { ...data } = req.body;

    const createdByOperatorDate = moment(data.createdByOperatorDate).format(
      "YYYY/MM/DD",
    );

    const date = moment(data.date).format("YYYY/MM/DD");

    const reminder = await Reminders.findOne({
      comercial: data.comercial,
      date,
      createdByOperatorDate: createdByOperatorDate,
      isDeleted: false,
      isActived: true,
    }).lean();

    if (reminder) {
      return res.status(400).send({
        ok: false,
        mensaje: `Este paciente ya tiene una cita candelarizada el día: ${createdByOperatorDate} y agendada el ${date}`,
        // message: `This patient already have an appointment scheduled at: ${createdByOperatorDate}`,
      });
    }

    // const department = await Department.findOne({
    //   code: "TRIPLE_S",
    //   isDeleted: false,
    //   isActive: true,
    // })
    //   .select("_id")
    //   .lean();

    // if (!department) {
    //   return res.status(400).send({
    //     ok: false,
    //     mensaje: "Error al encontrar departamento Triple S",
    //   });
    // }

    const comercial = await Comercial.findById(data.comercial)
      .select("_id MemberFullname")
      .lean();

    if (!comercial) {
      return res.status(400).send({
        ok: false,
        mensaje: "Este paciente no existe",
      });
    }

    if (data.isRescheduled) {
      data.marks = ["REAGENDAR"];
    }

    const status = await Status.findOne({ code: data.code });
    const createReminders: reminders = new Reminders({
      ...data,
      status: status?._id,
      comercial: data.comercial,
    });
    await createReminders.save();

    // const response = await notifyDepartmentManagers({
    //   departmentId: department._id,
    //   type: "TRIPLE_S_APPOINTMENT_CREATED",
    //   severity: "INFO",
    //   title: "Se ha registrado una nueva cita",
    //   message: `${req.user.name} ha agendado para el: ${data?.date} a las ${data?.hour}, para el paciente: ${comercial?.MemberFullname}`,
    //   entityType: "TripleSAppointment",
    //   entityId: createReminders._id,
    //   createdBy: req.user._id,
    //   link: `/appointments?id=${String(createReminders._id)}`,
    // });

    // await Patient.findOneAndUpdate(data.patient, {
    //   memberIdentificationNumber: data?.memberIdentificationNumber,
    // });

    console.log(data);
    res.status(201).send({
      ok: true,
      // reminders: createReminders,
      mensaje: "Cita creada con éxito",
      message: "Appointment created successfully",
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

const getReminders = async (req: Request, res: Response) => {
  try {
    const { limit = "10", initial = "0" } = req.params;

    // ✅ ahora aceptamos rango
    const {
      date, // legacy (un solo día)
      dateFrom,
      dateTo,
      dateRange, // { from, to }
      zone,
      status,
      text = "",
      marks,
      users,
    } = req.body || {};

    const limitNum = parseInt(String(limit)) || 10;
    const initialNum = parseInt(String(initial)) || 0;

    // =========================
    // Helpers para rango (strings "YYYY/MM/DD")
    // =========================
    const normalizeYMD = (v: any) => {
      const s = String(v || "").trim();
      if (!s) return "";

      // soporta "YYYY/MM/DD" o "YYYY-MM-DD"
      const parts = s.includes("/") ? s.split("/") : s.split("-");
      if (parts.length !== 3) return "";

      const [yy, mmRaw, ddRaw] = parts;
      if (!/^\d{4}$/.test(yy)) return "";

      const mm = String(mmRaw || "").padStart(2, "0");
      const dd = String(ddRaw || "").padStart(2, "0");

      if (!/^\d{2}$/.test(mm) || !/^\d{2}$/.test(dd)) return "";
      return `${yy}/${mm}/${dd}`;
    };

    const pickRange = () => {
      // prioridad: dateRange -> dateFrom/dateTo -> date
      let from = "";
      let to = "";

      if (dateRange && typeof dateRange === "object") {
        from = normalizeYMD(dateRange.from);
        to = normalizeYMD(dateRange.to);
      }

      if (!from && dateFrom) from = normalizeYMD(dateFrom);
      if (!to && dateTo) to = normalizeYMD(dateTo);

      // legacy: date => rango de 1 día
      if ((!from || !to) && date) {
        const one = normalizeYMD(date);
        if (one) {
          from = from || one;
          to = to || one;
        }
      }

      // si solo vino uno, lo usamos como ambos
      if (from && !to) to = from;
      if (to && !from) from = to;

      // ordenar si vienen invertidos
      if (from && to && from > to) {
        const tmp = from;
        from = to;
        to = tmp;
      }

      return { from, to };
    };

    const { from: dateFromStr, to: dateToStr } = pickRange();

    // =========================
    // BASE FILTERS (comunes a ambos grupos)
    // =========================
    const baseQuery: any = { isDeleted: false };

    // ✅ Filtro por MARKS (cualquiera de los seleccionados)
    if (Array.isArray(marks) && marks.length) {
      const cleanMarks = marks
        .map((m: any) =>
          String(m || "")
            .trim()
            .toUpperCase(),
        )
        .filter(Boolean);

      if (cleanMarks.length) baseQuery.marks = { $in: cleanMarks };
    }

    // zone/status (opcional)
    if (zone && Types.ObjectId.isValid(zone))
      baseQuery.zone = new Types.ObjectId(zone);

    if (status && Types.ObjectId.isValid(status))
      baseQuery.status = new Types.ObjectId(status);

    // ✅ users (operadoras) => $in ObjectId
    if (Array.isArray(users) && users.length) {
      const userIds = users
        .map((u: any) => String(u || "").trim())
        .filter((id: string) => Types.ObjectId.isValid(id))
        .map((id: string) => new Types.ObjectId(id));

      if (userIds.length) baseQuery.user = { $in: userIds };
    }

    // =========================
    // SEARCH
    // =========================
    const rawText = String(text || "").trim();

    if (rawText) {
      const cleanedText = await cleanText(rawText);
      const nameOrTextRegex = generateRegex(cleanedText);

      const digitsOnly = rawText.replace(/\D/g, "");
      const normalizedDigits = digitsOnly.replace(/^0+/, "");

      const memberIdOrs: any[] = [
        { memberIdentificationNumber: generateRegex(rawText) },
      ];

      if (normalizedDigits) {
        const ignoreLeadingZeros = new RegExp(
          `0*${escapeRegex(normalizedDigits)}`,
          "i",
        );
        memberIdOrs.push({
          memberIdentificationNumber: { $regex: ignoreLeadingZeros },
        });
      }

      const comercialQuery: any = {
        $or: [
          { MemberFullname: nameOrTextRegex },
          ...memberIdOrs,
          { Email: nameOrTextRegex },
          { HomePhone: nameOrTextRegex },
        ],
      };

      const matchingPatients =
        await Comercial.find(comercialQuery).select("_id");

      if (!matchingPatients.length) {
        return res.status(200).send({
          ok: true,
          byAppointmentDate: {
            reminders: [],
            count: 0,
            totalsByOperator: [],
            totalsByZone: [],
            totalsByMarks: [],
          },
          byCreatedByOperatorDate: {
            reminders: [],
            count: 0,
            totalsByOperator: [],
            totalsByZone: [],
            totalsByMarks: [],
          },
          mensaje: "Todos los recordatorios",
          message: "All reminders",
        });
      }

      baseQuery.comercial = { $in: matchingPatients.map((p) => p._id) };
    }

    // =========================
    // ARMAR QUERIES POR GRUPO
    // =========================
    const queryByAppointmentDate: any = { ...baseQuery };
    const queryByCreatedByOperatorDate: any = { ...baseQuery };

    // ✅ AQUI VA EL RANGO
    if (dateFromStr && dateToStr) {
      queryByAppointmentDate.date = { $gte: dateFromStr, $lte: dateToStr };
      queryByCreatedByOperatorDate.createdByOperatorDate = {
        $gte: dateFromStr,
        $lte: dateToStr,
      };
    }

    // =========================
    // Helper para ejecutar el mismo paquete (count + list + totals)
    // =========================
    const fetchGroup = async (q: any) => {
      const queryTotals = { ...q };

      const [count, reminders, totalsByOperator, totalsByZone, totalsByMarks] =
        await Promise.all([
          Reminders.countDocuments(queryTotals),

          Reminders.find(q)
            .populate("patient")
            .populate("zone")
            .populate("reminderType")
            .populate("user")
            .populate("status")
            .populate("statusCompleted")
            // ✅ si quieres optimizar payload del comercial:
            // .populate({ path: "comercial", select: "MemberFullname memberIdentificationNumber HomePhone noteWroteByOperator" })
            .populate("comercial")
            .skip(initialNum)
            .limit(limitNum),

          // Totales por OPERADORA (user)
          Reminders.aggregate([
            { $match: queryTotals },
            { $group: { _id: "$user", count: { $sum: 1 } } },
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
                userId: "$_id",
                name: { $ifNull: ["$user.name", "Sin operadora"] },
                count: 1,
              },
            },
            { $sort: { name: 1 } },
          ]),

          // Totales por ZONA
          Reminders.aggregate([
            { $match: queryTotals },
            { $group: { _id: "$zone", count: { $sum: 1 } } },
            {
              $lookup: {
                from: "zones",
                localField: "_id",
                foreignField: "_id",
                as: "zone",
              },
            },
            { $unwind: { path: "$zone", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 0,
                zoneId: "$_id",
                name: { $ifNull: ["$zone.name", "Sin zona"] },
                count: 1,
              },
            },
            { $sort: { name: 1 } },
          ]),

          // Totales por MARKS
          Reminders.aggregate([
            { $match: queryTotals },
            { $unwind: { path: "$marks", preserveNullAndEmptyArrays: false } },
            { $group: { _id: "$marks", count: { $sum: 1 } } },
            { $project: { _id: 0, mark: "$_id", count: 1 } },
            { $sort: { mark: 1 } },
          ]),
        ]);

      return {
        reminders,
        count,
        totalsByOperator,
        totalsByZone,
        totalsByMarks,
      };
    };

    // =========================
    // Ejecutar ambos grupos
    // =========================
    const [byAppointmentDate, byCreatedByOperatorDate] = await Promise.all([
      fetchGroup(queryByAppointmentDate),
      fetchGroup(queryByCreatedByOperatorDate),
    ]);

    return res.status(200).send({
      ok: true,
      // ✅ opcional: devolver el rango aplicado para mostrarlo arriba en el frontend
      appliedDateRange:
        dateFromStr && dateToStr ? { from: dateFromStr, to: dateToStr } : null,
      byAppointmentDate,
      byCreatedByOperatorDate,
      mensaje: "Todos los recordatorios",
      message: "All reminders",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const getRemindersActived = async (req: Request, res: Response) => {
  try {
    const reminders = await Reminders.find({
      isDeleted: false,
      isActived: true,
    });

    res.status(200).send({
      ok: true,
      reminders,
      mensaje: "Todos los recordatorios",
      message: "All reminders",
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

const getRemindersDates = async (req: Request, res: Response) => {
  try {
    const reminders = await Reminders.find({ isDeleted: false }).select("date");
    const reminderDates = reminders.map((reminder) => reminder.date);

    res.status(200).send({
      ok: true,
      reminders: reminderDates,
      mensaje: "Todos los recordatorios",
      message: "All reminders",
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

const updateReminder = async (req: any, res: Response) => {
  try {
    const { _id } = req.params;

    if (!_id || !Types.ObjectId.isValid(_id)) {
      return res.status(400).send({
        ok: false,
        mensaje: "ID inválido",
        message: "Invalid id",
      });
    }

    const department = await Department.findOne({
      code: "TRIPLE_S",
      isDeleted: false,
      isActive: true,
    })
      .select("_id")
      .lean();

    if (!department) {
      return res.status(400).send({
        ok: false,
        mensaje: "Error al encontrar departamento Triple S",
      });
    }

    const data: any = req.body || {};

    // ✅ permisos (ajusta si tu bandera de manager se llama diferente)
    const isManager = !!req.user?.isManager || req.user.rol.code != "EMPLOYEE";

    // ✅ code del mark “cristal”
    const CRYSTAL_CODE = "CITA_CRISTAL";

    // flags de control (no deben guardarse)
    const isStatus = !!data.isStatus;
    const isMarks = !!data.isMarks;
    const code = data.code ? String(data.code).trim().toUpperCase() : null;

    // (Opcional) toggle mark atomico
    const markCode = data.markCode
      ? String(data.markCode).trim().toUpperCase()
      : null;
    const enabled =
      typeof data.enabled === "boolean" ? data.enabled : undefined;

    // ✅ nota (la usaremos para cristal)
    const noteRaw =
      typeof data.noteWroteByOperator === "string"
        ? data.noteWroteByOperator
        : null;
    const note = noteRaw ? String(noteRaw).trim() : "";

    // armamos update base, quitando banderas internas
    const allData: any = { ...data };
    delete allData.code;
    delete allData.isStatus;
    delete allData.isMarks;
    delete allData.markCode;
    delete allData.enabled;

    // ✅ normaliza la nota si viene (evita espacios raros)
    if (typeof allData.noteWroteByOperator === "string") {
      allData.noteWroteByOperator = String(allData.noteWroteByOperator).trim();
    }

    // Traer record actual SOLO si vamos a tocar marks y queremos sync con status
    let prevReminder: any = null;
    if (isMarks) {
      prevReminder = await Reminders.findById(_id)
        .populate({ path: "status", select: "code" })
        .select("status comercial marks noteWroteByOperator")
        .lean();
    }

    // 1) Manejo de status por code (comportamiento actual)
    if (code && isStatus) {
      const statusDoc = await Status.findOne({ code }).select("_id").lean();
      if (!statusDoc) {
        return res.status(400).send({
          ok: false,
          mensaje: `Status no encontrado: ${code}`,
          message: `Status not found: ${code}`,
        });
      }
      allData.status = statusDoc._id;
    }

    // 2) Manejo de marks
    //    - Si te mandan marks array: lo reemplazamos
    //    - Si te mandan markCode + enabled: hacemos add/remove atómico
    const updateQuery: any = {}; // para soportar $set/$addToSet/$pull

    // Por defecto, todo lo que venga "normal" va a $set
    if (Object.keys(allData).length) {
      updateQuery.$set = { ...allData };
    }

    if (isMarks) {
      // A) toggle atómico
      if (
        markCode &&
        (REMINDER_MARK_CODES as readonly string[]).includes(markCode) &&
        typeof enabled === "boolean"
      ) {
        if (enabled) {
          updateQuery.$addToSet = {
            ...(updateQuery.$addToSet || {}),
            marks: markCode,
          };
        } else {
          updateQuery.$pull = { ...(updateQuery.$pull || {}), marks: markCode };
        }
      } else {
        // B) reemplazar marks completo
        const marks = cleanMarks(data.marks);
        updateQuery.$set = { ...(updateQuery.$set || {}), marks };
      }

      // ✅ Calcula nextMarks para lógica de sync (y para CRISTAL)
      let nextMarks: ReminderMarkCode[] = [];

      if (
        markCode &&
        (REMINDER_MARK_CODES as readonly string[]).includes(markCode) &&
        typeof enabled === "boolean"
      ) {
        const current = cleanMarks(prevReminder?.marks);
        if (enabled)
          nextMarks = uniqStrings([...current, markCode]) as ReminderMarkCode[];
        else
          nextMarks = current.filter(
            (m) => m !== markCode,
          ) as ReminderMarkCode[];
      } else {
        nextMarks = cleanMarks(data.marks);
      }

      // ==========================
      // ✅ NUEVO: regla CRISTAL
      // - Solo manager puede agregarlo
      // - Si se agrega, requiere nota
      // - Si se quita, (opcional) limpia nota
      // ==========================
      const prevMarks = cleanMarks(prevReminder?.marks);
      const hadCrystal = prevMarks.includes(CRYSTAL_CODE as any);
      const willHaveCrystal = nextMarks.includes(CRYSTAL_CODE as any);

      const crystalAdded = willHaveCrystal && !hadCrystal;
      const crystalRemoved = !willHaveCrystal && hadCrystal;

      if (crystalAdded) {
        if (!isManager) {
          return res.status(403).send({
            ok: false,
            mensaje: "Solo un manager puede marcar una cita como CRISTAL.",
            message: "Only manager can mark CRISTAL.",
          });
        }

        const n = (note || "").trim();
        if (n.length < 3) {
          return res.status(400).send({
            ok: false,
            mensaje:
              "Para marcar una cita como CRISTAL debes enviar noteWroteByOperator (mínimo 3 caracteres).",
            message: "noteWroteByOperator is required for CRISTAL.",
          });
        }

        updateQuery.$set = {
          ...(updateQuery.$set || {}),
          noteWroteByOperator: n,
        };
      }

      if (crystalRemoved) {
        // ✅ opcional: limpiar nota cuando quitan cristal
        updateQuery.$set = {
          ...(updateQuery.$set || {}),
          noteWroteByOperator: "",
        };
      }

      // ✅ Si alguien intenta editar noteWroteByOperator sin ser manager, lo bloqueamos
      // (si quieres permitirlo a operadoras en general, quita este bloque)
      if (
        typeof data.noteWroteByOperator === "string" &&
        !isManager &&
        !crystalAdded
      ) {
        return res.status(403).send({
          ok: false,
          mensaje: "No tienes permisos para actualizar noteWroteByOperator.",
          message: "Not allowed to update noteWroteByOperator.",
        });
      }

      // ✅ Sincronizar status con CONFIRMACION (compatibilidad con sistema viejo)
      const willBeConfirmed = nextMarks.includes("CONFIRMACION");

      if (willBeConfirmed) {
        const confirmed = await Status.findOne({ code: "CONFIRMED" })
          .select("_id")
          .lean();

        if (confirmed) {
          updateQuery.$set = {
            ...(updateQuery.$set || {}),
            status: confirmed._id,
          };
        }
      } else {
        // si antes estaba CONFIRMED, lo regresamos a NOTCONTACTED
        const prevStatusCode = prevReminder?.status?.code;
        if (prevStatusCode === "CONFIRMED") {
          const notContacted = await Status.findOne({ code: "NOTCONTACTED" })
            .select("_id")
            .lean();

          if (notContacted) {
            updateQuery.$set = {
              ...(updateQuery.$set || {}),
              status: notContacted._id,
            };
          }
        }
      }
    }

    // Si updateQuery quedó vacío, no hacemos nada
    if (!Object.keys(updateQuery).length) {
      return res.status(400).send({
        ok: false,
        mensaje: "No hay datos para actualizar",
        message: "No data to update",
      });
    }

    const reminders = await Reminders.findByIdAndUpdate(_id, updateQuery, {
      new: true,
      runValidators: true,
    });

    if (!reminders) {
      return res.status(404).send({
        ok: false,
        mensaje: "Recordatorio no encontrado",
        message: "Reminder not found",
      });
    }

    // ✅ Si quedó confirmado, actualiza el Comercial a APPOINTMENT (igual que tu lógica vieja)
    // Para saber si quedó confirmado: chequeamos por marks o por code
    const marksAfter: string[] = Array.isArray((reminders as any).marks)
      ? (reminders as any).marks
      : [];

    const confirmedByMarks = marksAfter.includes("CONFIRMACION");
    const confirmedByCode = code === "CONFIRMED"; // cuando viene por status
    let comercial;

    if (confirmedByMarks || confirmedByCode) {
      const comercialStatus = await Status.findOne({ code: "APPOINTMENT" })
        .select("_id")
        .lean();

      if (!comercialStatus) {
        return res.status(400).send({
          ok: false,
          mensaje: "Status de confirmación de cita no encontrado",
          message: "Appointment confirmation status not found",
        });
      }

      comercial = await Comercial.findByIdAndUpdate(
        (reminders as any).comercial,
        {
          status: comercialStatus._id,
        },
        { new: true },
      );
    }

    return res.status(201).send({
      ok: true,
      reminders,
      mensaje: "Recordatorio actualizado con éxito",
      message: "Reminder updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const deteleReminder = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    await Reminders.updateOne({ _id }, { isDeleted: true });

    res.status(201).send({
      ok: true,
      mensaje: "Recordatorio eliminado con éxito",
      message: "Reminder deleted successfully",
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

const updateReminderImage = async (req, res: Response) => {
  try {
    const { _id } = req.params;

    const reminder = await Reminders.findById(_id);
    if (!reminder) {
      return res.status(400).send({
        ok: false,
        mensaje: "No existe este registro",
      });
    }

    const url = reminder.img;
    if (url) {
      deletFile(url);
    }

    processImageCover(req, res, async (err: any) => {
      if (err) {
        console.log(err);
        return res.status(400).send({
          ok: false,
          err,
        });
      } else {
        if (req.file === undefined) {
          console.log("Error: No image selected");
          return res.status(400).send({
            ok: false,
            mensaje: "Error: No image selected",
          });
        }
      }
      const imageURL = req.imageURL;

      const reminder = await Reminders.findByIdAndUpdate(
        _id,
        { img: imageURL },
        { new: true },
      );
      if (!reminder) {
        return res.status(204).send({
          ok: false,
          mensaje: "Error al subir imagen",
        });
      }

      res.status(200).send({
        ok: true,
        mensaje: "Image actualizada",
      });
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      mensaje: "Algo anda mal",
      message: "Something goes wrog!!",
      error,
    });
  }
};

const getRemindersSearch = async (req: Request, res: Response) => {
  try {
    const { limit = "10", initial = "0", text = "" } = req.params;

    const limitNum = parseInt(String(limit)) || 10;
    const initialNum = parseInt(String(initial)) || 0;

    const cleanedText = await cleanText(text);
    const nameOrTextRegex = generateRegex(cleanedText);

    // helpers
    const digitsOnly = (text || "").replace(/\D/g, ""); // "00123-45" -> "0012345"
    const normalizedDigits = digitsOnly.replace(/^0+/, ""); // "0012345"  -> "12345"

    // ORs para memberIdentificationNumber
    const memberIdOrs: any[] = [
      { memberIdentificationNumber: generateRegex(text) },
    ];

    // Si hay parte numérica, agrega patrón que ignore ceros al inicio (0*12345)
    if (normalizedDigits) {
      const ignoreLeadingZeros = new RegExp(
        `0*${escapeRegex(normalizedDigits)}`,
        "i",
      );
      memberIdOrs.push({
        memberIdentificationNumber: { $regex: ignoreLeadingZeros },
      });
    }

    // Query para pacientes (Comercial)
    const comercialQuery: any = {
      $or: [
        { MemberFullname: nameOrTextRegex },
        ...memberIdOrs,
        { Email: nameOrTextRegex },
        { HomePhone: nameOrTextRegex },
      ],
    };

    // Buscar pacientes que coincidan
    const matchingPatients = await Comercial.find(comercialQuery).select("_id");
    if (!matchingPatients.length) {
      return res.status(200).send({
        ok: true,
        reminders: [],
        count: 0,
        mensaje: "Todos los recordatorios",
        message: "All reminders",
      });
    }

    const patientIds = matchingPatients.map((p) => p._id);

    // Contar y paginar reminders por esos pacientes
    const baseFilter = { isDeleted: false, comercial: { $in: patientIds } };

    const [count, reminders] = await Promise.all([
      Reminders.countDocuments(baseFilter),
      Reminders.find(baseFilter)
        .populate("patient")
        .populate("zone")
        .populate("reminderType")
        .populate("user")
        .populate("status")
        .populate("statusCompleted")
        .populate("comercial")

        .skip(initialNum)
        .limit(limitNum),
    ]);

    res.status(200).send({
      ok: true,
      reminders,
      count,
      mensaje: "Todos los recordatorios",
      message: "All reminders",
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

const getRemindersByOperatorAndDay = async (req: any, res: Response) => {
  try {
    const { users: usersQuery } = req.query;

    const {
      date, // legacy: 1 día
      endDate, // legacy: fin del rango
      dateFrom, // opcional (nuevo)
      dateTo, // opcional (nuevo)
      dateRange, // opcional { from, to } (nuevo)
      zone,
      marks,
    } = req.body || {};

    const query: any = { isDeleted: false };

    const isEmployee =
      req.user?.rol?.code === "EMPLOYEE" && req.user?.isManager == false;

    // Rol OPERADORA ve solo lo suyo
    if (isEmployee) {
      query.user = req.user._id;
    }

    // ✅ Filtro por MARKS (cualquiera de los seleccionados)
    if (Array.isArray(marks) && marks.length) {
      const cleanMarks = marks
        .map((m: any) =>
          String(m || "")
            .trim()
            .toUpperCase(),
        )
        .filter(Boolean);

      if (cleanMarks.length) query.marks = { $in: cleanMarks };
    }

    // ✅ users (solo si NO es employee)
    const normalizeUsersQueryToIds = (v: any): string[] => {
      if (!v || v == "null") return [];
      if (Array.isArray(v))
        return v
          .map(String)
          .map((s) => s.trim())
          .filter(Boolean);
      if (typeof v === "string") {
        return v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [];
    };

    if (!isEmployee) {
      const ids = normalizeUsersQueryToIds(usersQuery);
      if (ids.length) {
        const allValid = ids.every((id) => Types.ObjectId.isValid(id));
        if (!allValid) {
          return res
            .status(400)
            .json({ ok: false, mensaje: "users contiene ObjectId inválido" });
        }
        query.user = { $in: ids.map((id) => new Types.ObjectId(id)) };
      }
    }

    // ✅ zone (validar/castear)
    if (zone) {
      if (!Types.ObjectId.isValid(zone)) {
        return res.status(400).json({ ok: false, mensaje: "zone inválida" });
      }
      query.zone = new Types.ObjectId(zone);
    }

    // =========================
    // Fechas como strings "YYYY/MM/DD" (robusto)
    // =========================
    const normalizeYMD = (v: any) => {
      const s = String(v || "").trim();
      if (!s) return "";

      const parts = s.includes("/") ? s.split("/") : s.split("-");
      if (parts.length !== 3) return "";

      const [yy, mmRaw, ddRaw] = parts;
      if (!/^\d{4}$/.test(yy)) return "";

      const mm = String(mmRaw || "").padStart(2, "0");
      const dd = String(ddRaw || "").padStart(2, "0");

      // Validación real de fecha (evita 2026/99/99, etc.)
      const m = moment(`${yy}-${mm}-${dd}`, "YYYY-MM-DD", true);
      if (!m.isValid()) return "";

      return `${yy}/${mm}/${dd}`;
    };

    const pickRange = () => {
      let from = "";
      let to = "";

      // prioridad: dateRange -> dateFrom/dateTo -> date/endDate
      if (dateRange && typeof dateRange === "object") {
        from = normalizeYMD(dateRange.from);
        to = normalizeYMD(dateRange.to);
      }

      if (!from && dateFrom) from = normalizeYMD(dateFrom);
      if (!to && dateTo) to = normalizeYMD(dateTo);

      if ((!from || !to) && date) {
        const one = normalizeYMD(date);
        if (one) {
          from = from || one;
          to = to || one;
        }
      }

      if (!to && endDate) to = normalizeYMD(endDate);

      // si solo vino uno, lo usamos como ambos (1 día)
      if (from && !to) to = from;
      if (to && !from) from = to;

      // ordenar si vienen invertidos
      if (from && to && from > to) {
        const tmp = from;
        from = to;
        to = tmp;
      }

      return { from, to };
    };

    const { from: dateFromStr, to: dateToStr } = pickRange();

    // ✅ aplicar rango SOLO si hay fechas válidas
    if (dateFromStr && dateToStr) {
      query.createdByOperatorDate = { $gte: dateFromStr, $lte: dateToStr };
    }

    const reminders = await Reminders.find(query)
      .populate("patient")
      .populate("zone")
      .populate("reminderType")
      .populate("user")
      .populate("status")
      .populate("statusCompleted")
      .populate({
        path: "comercial",
        populate: [{ path: "user", model: "User" }],
      })
      .sort({ createdByOperatorDate: 1, createdAt: 1 });

    // ====== Resumen por ZONA ======
    const zoneMap = new Map<
      string,
      { zoneId: string | null; zoneName: string; count: number }
    >();

    // ====== Agrupar por USUARIO ======
    const userMap = new Map<
      string,
      { userId: string | null; user: any | null; reminders: any[] }
    >();

    for (const r of reminders) {
      const zoneId = (r.zone as any)?._id?.toString() || null;
      const zoneName = (r.zone as any)?.name || "Unassigned";
      const zoneKey = zoneId || "unassigned";

      if (!zoneMap.has(zoneKey)) {
        zoneMap.set(zoneKey, { zoneId, zoneName, count: 0 });
      }
      zoneMap.get(zoneKey)!.count += 1;

      const userKey = r.user?._id?.toString() || "unassigned";
      if (!userMap.has(userKey)) {
        userMap.set(userKey, {
          userId: r.user?._id?.toString() || null,
          user: r.user || null,
          reminders: [],
        });
      }
      userMap.get(userKey)!.reminders.push(r);
    }

    const zonesSummary = Array.from(zoneMap.values()).sort((a, b) =>
      a.zoneName.localeCompare(b.zoneName, undefined, { sensitivity: "base" }),
    );

    const usersData = Array.from(userMap.values())
      .map((u) => {
        const sortedReminders = [...u.reminders].sort((ra, rb) => {
          const az = (ra.zone as any)?.name || "zzzzzz";
          const bz = (rb.zone as any)?.name || "zzzzzz";

          const byZone = az.localeCompare(bz, undefined, {
            sensitivity: "base",
          });
          if (byZone !== 0) return byZone;

          const raDate =
            moment(ra.createdByOperatorDate, "YYYY/MM/DD", true).valueOf() || 0;

          const rbDate =
            moment(rb.createdByOperatorDate, "YYYY/MM/DD", true).valueOf() || 0;

          if (raDate !== rbDate) return raDate - rbDate;

          const raCreated = new Date(ra.createdAt).getTime() || 0;
          const rbCreated = new Date(rb.createdAt).getTime() || 0;
          return raCreated - rbCreated;
        });

        return { ...u, reminders: sortedReminders };
      })
      .sort((a, b) => {
        const an = (a.user?.name || "zzzzzz").toLowerCase();
        const bn = (b.user?.name || "zzzzzz").toLowerCase();
        return an.localeCompare(bn);
      });

    return res.status(200).send({
      ok: true,
      appliedDateRange:
        dateFromStr && dateToStr ? { from: dateFromStr, to: dateToStr } : null,
      users: usersData,
      zonesSummary,
      total: reminders.length,
      mensaje: "Las citas agrupadas por usuario y resumen por zona",
      message: "Reminders grouped by user with zone summary",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const getRemindersGroupedByOperator = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, operadora, zone } = req.body;

    // Paso 1: Buscar todos los usuarios con rol operador
    const rol = await Roles.findOne({ code: "OPERADORA" });

    if (!rol) {
      return res
        .status(404)
        .json({ ok: false, message: "Rol 'OPERADORA' no encontrado." });
    }

    let operadoras = [];

    if (operadora) {
      // Buscar solo esa operadora específica
      const singleUser = await User.findOne({
        _id: operadora,
        rol: rol._id,
        isDeleted: false,
        isActived: true,
      });

      if (singleUser) operadoras.push(singleUser);
    } else {
      // Buscar todas las operadoras
      operadoras = await User.find({
        rol: rol._id,
        isDeleted: false,
        isActived: true,
      });
    }

    const groupedData = [];

    for (let i = 0; i < operadoras.length; i++) {
      const operadora = operadoras[i];
      const query: any = {
        user: operadora._id,
        isDeleted: false,
      };

      // Filtro por fechas si aplica
      if (startDate && endDate) {
        query.created_at = {
          $gte: startDate,
          $lte: endDate,
        };
      } else if (startDate) {
        query.created_at = startDate;
      }

      if (zone) {
        query.zone = zone;
      }

      console.log(query, "query");

      const reminders = await Reminders.find(query)
        .populate("patient")
        .populate("zone")
        .populate("comercial");

      const citas = reminders.map((reminder) => {
        const comercial = reminder.comercial as any;
        const zona = reminder.zone as any;
        return {
          memberIdentificationNumber:
            comercial.memberIdentificationNumber || "N/A",
          HomePhone: comercial.HomePhone || "N/A",
          MemberFullname: comercial.MemberFullname || "N/A",
          fechaHora: moment(`${reminder.date} ${reminder.hour}`).format(
            "dddd, MMMM D, YYYY h:mm A",
          ),
          zona: zona.name || "N/A",
        };
      });

      groupedData.push({
        operadora: operadora.name || "N/A",
        operatorNameNumber: operadora.operatorNameNumber || "N/A",
        citas,
      });
    }

    // -----------------------------
    // ✨ Generar archivo Excel aquí
    // -----------------------------

    const dateRange = endDate ? `${startDate} - ${endDate}` : startDate;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reporte de Citas");
    let currentRow = 1;

    for (const group of groupedData) {
      const { operadora, operatorNameNumber, citas } = group;

      // Fila título: TABLA DE CITA POR DÍAS
      worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
      const titleCell = worksheet.getCell(`A${currentRow}`);
      titleCell.value = "TABLA DE CITA POR DÍAS";
      titleCell.alignment = { horizontal: "center" };
      titleCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "009DC7" }, // azul como en la imagen
      };
      currentRow++;

      // Fila 2: Info de operadora y fecha
      worksheet.getRow(currentRow).values = [
        "NOMBRE DE LA CORDINADORA",
        operadora,
        operatorNameNumber,
        "FECHA",
        dateRange,
      ];
      currentRow++;

      // Fila 3: Encabezado
      worksheet.getRow(currentRow).values = [
        "Nombre del cliente",
        "Número de contrato",
        "Número de teléfono",
        "Día y hora de la cita",
        "Centro preventivo",
      ];
      worksheet.getRow(currentRow).font = { bold: true };
      currentRow++;

      // Fila 4+: Citas
      for (const cita of citas) {
        worksheet.getRow(currentRow).values = [
          cita.MemberFullname,
          cita.memberIdentificationNumber,
          cita.HomePhone,
          cita.fechaHora,
          cita.zona,
        ];
        currentRow++;
      }

      // Total
      worksheet.getRow(currentRow).values = ["", "", "", "TOTAL", citas.length];
      currentRow += 3;
    }

    worksheet.columns = [
      { width: 30 },
      { width: 25 },
      { width: 20 },
      { width: 35 },
      { width: 25 },
    ];

    // 🔽 Descargar Excel
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=reporte-citas.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
    // res.status(200).send({
    //   ok: true,
    //   data,
    //   message: "Recordatorios agrupados por operadora",
    // });
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

const getRemindersAsZoneCount = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    const { ...data } = req.body;

    const query: any = {
      isDeleted: false,
      user: _id,
      date: data.date,
      zone: data.zone,
    };

    if (!data.date) delete query.date;
    if (!data.zone) delete query.zone;

    // const count = await Reminders.count(query);
    const reminders = await Reminders.find(query)
      .populate("patient")
      .populate("zone")
      .populate("reminderType")
      .populate("user")
      .populate("status")
      .populate("statusCompleted")
      .populate({
        path: "comercial",
        populate: [{ path: "user", model: "User" }],
      });

    res.status(200).send({
      ok: true,
      reminders,
      // count,
      mensaje: "Las citas",
      message: "All reminders",
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

const getRemindersFilterDate = async (req: Request, res: Response) => {
  try {
    const { dates, user } = req.body; // Recibimos también el usuario desde el body si está presente
    const reports = []; // Reporte que contendrá un objeto por cada rango de fechas

    // Obtener todas las zonas activas (no eliminadas)
    const allZones = await Zones.find({ isDeleted: false });

    // Iterar sobre cada rango de fechas proporcionado en `dates`
    for (let item of dates) {
      // Usar moment para calcular la cantidad de días en el rango de fechas
      const fromDate = item.from;
      const toDate = item.to;

      // Calcular la diferencia en días usando moment
      const daysInRange = moment(toDate).diff(moment(fromDate), "days") + 1;

      // Crear el filtro básico para el rango de fechas
      const matchConditions: any = {
        created_at: {
          $gte: fromDate, // Fecha inicial del rango
          $lte: toDate, // Fecha final del rango
        },
      };

      // Si se ha proporcionado un usuario, agregarlo al filtro
      if (user != "null") {
        matchConditions.user = new mongoose.Types.ObjectId(user); // Filtrar por el usuario proporcionado, asegurándonos que sea un ObjectId si es necesario
      }

      // Crear las etapas de agregación para obtener el total de recordatorios por zona en el rango de fechas actual
      const matchStage = {
        $match: matchConditions,
      };

      const groupStage = {
        $group: {
          _id: "$zone", // Agrupar por zona
          amount: { $sum: 1 }, // Contar el número de recordatorios
        },
      };

      const lookupStage = {
        $lookup: {
          from: "zones", // Colección de zonas
          localField: "_id",
          foreignField: "_id", // Unir por el campo _id de las zonas
          as: "zoneInfo",
        },
      };

      const unwindStage = {
        $unwind: "$zoneInfo", // Descomponer el array de zonas
      };

      const projectStage = {
        $project: {
          _id: 0, // No mostrar el campo _id
          name: "$zoneInfo.name", // Mostrar el nombre de la zona
          amount: 1, // Mostrar el total de recordatorios
        },
      };

      // Ejecutar la agregación para obtener los recordatorios en este rango de fechas
      const results = await Reminders.aggregate([
        matchStage,
        groupStage,
        lookupStage,
        unwindStage,
        projectStage,
      ]);

      // Crear un objeto para este rango de fechas
      const reportForCurrentDateRange = {
        from: fromDate, // Fecha inicial del rango
        to: toDate, // Fecha final del rango
        total: 0, // Inicializar el total de recordatorios para este rango
        zones: [], // Inicializar array para zonas y cantidad de recordatorios
        totalAverage: 0, // Inicializar el promedio total
      };

      // Acumular los resultados en el objeto `zones` del rango actual y sumar al total
      results.forEach((curr) => {
        const zoneAverage = parseFloat((curr.amount / daysInRange).toFixed(2)); // Calcular el promedio por zona, convertido a número
        reportForCurrentDateRange.zones.push({
          zone: curr.name, // Nombre de la zona
          amount: curr.amount, // Total de recordatorios en esta zona
          average: zoneAverage, // Promedio por zona (2 decimales, convertido a número)
        });
        reportForCurrentDateRange.total += curr.amount; // Acumular total de recordatorios
      });

      // Asegurarse de que todas las zonas estén representadas, incluso con 0 recordatorios
      allZones.forEach((zone) => {
        const zoneExistsInResults = reportForCurrentDateRange.zones.find(
          (z) => z.zone === zone.name,
        );
        if (!zoneExistsInResults) {
          // Si la zona no tiene recordatorios, agregarla con 0
          reportForCurrentDateRange.zones.push({
            zone: zone.name,
            amount: 0,
            average: 0, // Promedio 0 para zonas sin recordatorios
          });
        }
      });

      // Calcular el promedio total para el rango de fechas, convertido a número
      reportForCurrentDateRange.totalAverage = parseFloat(
        (reportForCurrentDateRange.total / daysInRange).toFixed(2),
      );

      // Añadir el reporte para este rango de fechas a `reports`
      reports.push(reportForCurrentDateRange);
    }

    // Enviar respuesta con datos
    res.status(200).send({
      ok: true,
      reports, // Reporte con un objeto por cada rango de fechas, y la lista de zonas dentro de cada rango
      mensaje: "Reportes creados correctamente",
      message: "Reports created successfully",
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

//

const getRemindersByComercial = async (req: Request, res: Response) => {
  try {
    const { comercial } = req.params;

    const reminders = await Reminders.find({
      comercial,
      isDeleted: false,
      isActived: true,
    })
      .sort({ created_at: -1 })
      .populate("user");

    res.status(200).send({
      ok: true,
      reminders,
      message: "Citas conseguidas correctamente",
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

const exportRemindersExcel = async (req: Request, res: Response) => {
  try {
    const { date, zone, status, text = "" } = req.body || {};

    // ✅ Arma el query igual que getReminders (incluyendo búsqueda en Comercial)
    const query: any = { isDeleted: false };
    if (date) query.date = date;

    if (zone && Types.ObjectId.isValid(zone))
      query.zone = new Types.ObjectId(zone);
    if (status && Types.ObjectId.isValid(status))
      query.status = new Types.ObjectId(status);

    const rawText = String(text || "").trim();
    if (rawText) {
      const cleanedText = await cleanText(rawText);
      const nameOrTextRegex = generateRegex(cleanedText);

      const digitsOnly = rawText.replace(/\D/g, "");
      const normalizedDigits = digitsOnly.replace(/^0+/, "");

      const memberIdOrs: any[] = [
        { memberIdentificationNumber: generateRegex(rawText) },
      ];

      if (normalizedDigits) {
        const ignoreLeadingZeros = new RegExp(
          `0*${escapeRegex(normalizedDigits)}`,
          "i",
        );
        memberIdOrs.push({
          memberIdentificationNumber: { $regex: ignoreLeadingZeros },
        });
      }

      const comercialQuery: any = {
        $or: [
          { MemberFullname: nameOrTextRegex },
          ...memberIdOrs,
          { Email: nameOrTextRegex },
          { HomePhone: nameOrTextRegex },
        ],
      };

      const matchingPatients =
        await Comercial.find(comercialQuery).select("_id");
      if (!matchingPatients.length) {
        // Devuelve un excel vacío (o 204). Aquí devolvemos excel con headers.
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet("Citas");
        ws.addRow([
          "Cliente",
          "Contrato",
          "Teléfono",
          "Fecha/Hora",
          "Zona",
          "Status",
        ]);
        const fileName = `citas_${moment(date || new Date()).format(
          "YYYY-MM-DD",
        )}.xlsx`;
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName}"`,
        );
        await wb.xlsx.write(res);
        return res.end();
      }

      query.comercial = { $in: matchingPatients.map((p) => p._id) };
    }

    // ✅ Busca TODO (sin paginación)
    const reminders = await Reminders.find(query)
      .populate("comercial")
      .populate("zone")
      .populate("status")
      .lean();

    // ✅ Excel
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Citas");

    sheet.columns = [
      { header: "Cliente", key: "cliente", width: 35 },
      { header: "Contrato", key: "contrato", width: 18 },
      { header: "Teléfono", key: "telefono", width: 18 },
      { header: "Fecha/Hora", key: "fechaHora", width: 22 },
      { header: "Zona", key: "zona", width: 18 },
      { header: "Status", key: "status", width: 18 },
    ];

    // Header style simple
    sheet.getRow(1).font = { bold: true };

    reminders.forEach((r: any) => {
      sheet.addRow({
        cliente: r?.comercial?.MemberFullname || "N/A",
        contrato: r?.comercial?.memberIdentificationNumber || "N/A",
        telefono: r?.comercial?.HomePhone || "N/A",
        fechaHora:
          r?.fechaHora ||
          r?.dateTime ||
          (r?.createdAt
            ? moment(r.createdAt).format("YYYY-MM-DD HH:mm")
            : "N/A"),
        zona: r?.zone?.name || "N/A",
        status: r?.status?.name || "N/A",
      });
    });

    const fileName = `citas_${moment(date || new Date()).format(
      "YYYY-MM-DD",
    )}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    // stream directo
    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error generando Excel",
    });
  }
};

export {
  createReminders,
  getReminders,
  getRemindersDates,
  updateReminder,
  deteleReminder,
  getRemindersActived,
  updateReminderImage,
  getRemindersSearch,
  getRemindersByOperatorAndDay,
  getRemindersAsZoneCount,
  getRemindersFilterDate,
  getRemindersGroupedByOperator,
  getRemindersByComercial,
  exportRemindersExcel,
};
