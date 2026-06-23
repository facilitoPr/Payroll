import { Request, Response } from "express";
import User, { IUser } from "../model/account/user";
import Roles, { IRole } from "../model/role";
import { encrypt } from "../helper/password-bcrypts";
import { generateCode, generateReference } from "../helper/generate-code";
import { cleanText, generateRegex } from "../middlewares/cleanText";
import { deletFile, processImageCover, upload } from "../middlewares/imagen";

import {
  deleteDocument,
  processDocumentUpload,
  processDocumentUploadContract,
} from "../middlewares/files";
import { CustomRequest } from "../types/CustomRequest"; // Ajusta la ruta si lo pones en otro lugar
import {
  calcularHorasSemanales,
  procesarHorarioConHoras,
} from "../services/workSummary.service";
import Projects from "../model/rrhh/projects";
import PunchTypes from "../model/punch/punchTypes";
import mongoose, { isValidObjectId, Types } from "mongoose";
import Expedient from "../model/expedient/expedient";
import RecruitmentApplication from "../model/recruitment/recruitmentApplication";
import Department from "../model/rrhh/department";
import AuditLog from "../model/auditLog";
import {
  buildTitleTagsSummary,
  diffObjects,
  isPlainObject,
  parseMaybeJsonObject,
} from "../utils/audit.utils";
import { getAuditConfig } from "../audits/audit.config";
import { hydrateRefChanges } from "../audits/hydrateRefChanges";
import { getRoleByCode } from "../helper/role/role.code";
import { getClientIp } from "../helper/token/client-ip";
import { toStr } from "../helper/parse";
import { AuthRequest } from "../middlewares/validate-jwt";
import { getUploadedFieldUrl } from "../helper/upload/upload.get";
import { getQueryString } from "../helper/request/request.query";
import { generateTemporaryPassword } from "../helper/user/user.password";

const parseTags = (auditTags: any): string[] => {
  if (!auditTags) return [];

  // viene como array real
  if (Array.isArray(auditTags)) {
    return auditTags
      .map(String)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  // viene como string
  if (typeof auditTags === "string") {
    const raw = auditTags.trim();
    if (!raw) return [];

    // intenta JSON primero: '["a","b"]'
    if (
      (raw.startsWith("[") && raw.endsWith("]")) ||
      (raw.startsWith("{") && raw.endsWith("}"))
    ) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed
            .map(String)
            .map((x) => x.trim())
            .filter(Boolean);
        }
      } catch (_) {
        // cae al split por coma
      }
    }

    // fallback: "a,b,c"
    return raw
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
};

const redactPayloadKeys = (payload: any) => {
  // solo guardamos claves, no valores
  if (!payload || typeof payload !== "object") return [];
  return Object.keys(payload).filter((k) => k !== "password");
};

const createUser = async (req: Request, res: Response) => {
  try {
    const { ...data } = req.body;

    const verifyEmailUser = await User.findOne({
      email: data.email,
      isDeleted: false,
    });

    if (verifyEmailUser) {
      return res
        .status(409)
        .send({ ok: false, mensaje: "Email ya esta en uso" });
    }

    const encrypts = await encrypt(data.password);
    data.password = encrypts;

    const code = await generateCode(4);
    data.code = code;

    const create: IUser = await new User({
      ...data,
    });
    await create.save();

    res.status(201).send({
      ok: true,
      mensaje: "Usuario creado con éxito",
      message: "User created successfully",
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

const getUsers = async (req: Request, res: Response) => {
  try {
    const { limit, initial } = req.params;

    const limitNum = parseInt(limit) || 10;
    const initialNum = parseInt(initial) || 0;

    const roles = await getRoleByCode("ADMIN");

    const count = await User.count({ isDeleted: false });
    const users = await User.find({ rol: { $ne: roles }, isDeleted: false })
      .populate("rol")
      .populate("punchTypeId")
      .skip(initialNum)
      .limit(limitNum);

    res.status(200).send({
      ok: true,
      users,
      count,
      mensaje: "Usuarios encontrados con éxito",
      message: "Users found successfully",
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

const getUsersByRole = async (req: Request, res: Response) => {
  try {
    const { limit, initial, code } = req.params;

    const role = await Roles.findOne({ code });
    if(!role) {
      return res.status(400).send({
        ok: false,
        message: "Role not found"
      })
    }

    const count = await User.count({ rol: role?._id, isDeleted: false });
    const users = await User.find({
      rol: role?._id,
      isDeleted: false,
    })
      .populate("rol")
      .skip(Number(initial))
      .limit(Number(limit));

    res.status(200).send({
      ok: true,
      users,
      count,
      mensaje: "Usuarios encontrados con éxito",
      message: "Users found successfully",
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

const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.uid;

    const { department, departmentCode, password, ...data } = req.body;

    if (departmentCode === "TRIPLE_S" && !data.ext) {
      return res.status(400).json({
        ok: false,
        mensaje: "Este departamento requiere una extensión.",
        message: "This department requires an EXT.",
      });
    }

    /**
     * Evita que se actualicen campos sensibles desde este endpoint.
     */
    delete data.rol;
    delete data.role;
    delete data.isSuperAdmin;
    delete data.isDeleted;
    delete data.createdAt;
    delete data.updatedAt;

    const updateData: any = {
      ...data,
    };

    /**
     * Solo actualizar department si realmente viene en el body.
     */
    if (department !== undefined && department !== null && department !== "") {
      updateData.department = department;
    }

    /**
     * Solo actualizar password si viene con valor.
     */
    if (password && String(password).trim()) {
      updateData.password = await encrypt(String(password).trim());
    }

    /**
     * ✅ Imagen desde createUploadFieldsProcessor
     * El frontend debe mandar el archivo con el campo "image".
     */
    const imageURL =
      getUploadedFieldUrl(req, "image") ||
      getUploadedFieldUrl(req, "img") ||
      getUploadedFieldUrl(req, "avatar");

    if (imageURL) {
      updateData.img = imageURL;
    }

    /**
     * Permite eliminar la imagen enviando img: null o img: ""
     */
    if (data.img === null || data.img === "") {
      updateData.img = null;
    }

    const user: any = await User.findOneAndUpdate(
      {
        _id: userId,
        isDeleted: false,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate("rol", "code name")
      .populate(
        "company",
        "code legalName tradeName logo primaryColor secondaryColor",
      )
      .populate("paymentSchedule")
      .populate("salaryType")
      .populate("department")
      .populate("project")
      .populate("jobPosition")
      .lean();

    if (!user) {
      return res.status(404).json({
        ok: false,
        mensaje: "Usuario no encontrado.",
        message: "User not found.",
      });
    }

    delete user.password;

    return res.status(200).json({
      ok: true,
      user,
      mensaje: "Usuario actualizado con éxito.",
      message: "User updated successfully.",
    });
  } catch (error) {
    console.log("updateUser error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal.",
      message: "Ups! Something went wrong.",
    });
  }
};

const searchUsers = async (req: Request, res: Response) => {
  try {
    const { limit, initial } = req.params;
    const { ...data } = req.body;

    const cleanedText = await cleanText(data.text);
    const regex = generateRegex(cleanedText);

    const roles = await getRoleByCode("ADMIN");

    const count = await User.count({
      rol: { $ne: roles },
      isDeleted: false,
      name: { $regex: regex },
    });

    const users = await User.find({
      rol: { $ne: roles },
      isDeleted: false,
      name: { $regex: regex },
    })
      .populate("rol")
      .skip(Number(initial))
      .limit(Number(limit));

    res.status(200).send({
      ok: true,
      users,
      count,
      mensaje: "Usuarios encontrados con éxito",
      message: "Users found successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
    });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    await User.updateOne({ _id }, { isDeleted: true });

    res.status(201).send({
      ok: true,
      mensaje: "Usuario eliminado con éxito",
      message: "User deleted successfully",
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

const getOperadoras = async (req: Request, res: Response) => {
  try {
    const { limit, initial } = req.params;

    const limitNum = parseInt(limit) || 10;
    const initialNum = parseInt(initial) || 0;

    // const rol = await Roles.findOne({ code: "OPERADORA" });
    const roles = await Roles.find({
      code: { $in: ["EMPLOYEE"] },
    });
    const count = await User.count({ isDeleted: false, rol: roles });
    const operadoras = await User.find({ isDeleted: false, rol: roles })
      .populate("punchTypeId")
      .populate({
        path: "paymentSchedule",
        populate: {
          path: "paymentFrequency",
        },
      })
      .populate({ path: "salaryType" })
      .populate("department")
      .populate("project")
      .populate("rol")
      .skip(initialNum)
      .limit(limitNum);

    res.status(200).send({
      ok: true,
      operadoras,
      count,
      mensaje: "Operadoras encontrados con éxito",
      message: "Operators found successfully",
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

const updateUserImage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.uid;

    const existingUser = await User.findOne({
      _id: userId,
      isDeleted: false,
    });

    if (!existingUser) {
      return res.status(404).json({
        ok: false,
        mensaje: "Usuario no encontrado.",
        message: "User not found.",
      });
    }

    const imageURL =
      getUploadedFieldUrl(req, "image") ||
      getUploadedFieldUrl(req, "img") ||
      getUploadedFieldUrl(req, "avatar");

    if (!imageURL) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debes seleccionar una imagen.",
        message: "You must select an image.",
      });
    }

    const user: any = await User.findOneAndUpdate(
      {
        _id: userId,
        isDeleted: false,
      },
      {
        $set: {
          img: imageURL,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate("rol", "code name")
      .populate(
        "company",
        "code legalName tradeName logo primaryColor secondaryColor",
      )
      .populate("paymentSchedule")
      .populate("salaryType")
      .populate("department")
      .populate("project")
      .populate("jobPosition")
      .lean();

    if (!user) {
      return res.status(404).json({
        ok: false,
        mensaje: "Usuario no encontrado.",
        message: "User not found.",
      });
    }

    delete user.password;

    return res.status(200).json({
      ok: true,
      user,
      imageURL,
      mensaje: "Imagen actualizada correctamente.",
      message: "Image updated successfully.",
    });
  } catch (error) {
    console.log("updateUserImage error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal.",
      message: "Ups! Something went wrong.",
    });
  }
};

const updateSchedule = async (req: any, res: Response) => {
  try {
    const { user_id } = req.params;
    const { punchTypeId } = req.body;
    const scheduleRaw = req.body?.schedule;

    if (!user_id || !isValidObjectId(user_id)) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "Falta user_id válido" });
    }

    if (!punchTypeId || !isValidObjectId(punchTypeId)) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "Falta punchTypeId válido" });
    }

    // schedule puede venir objeto o JSON string
    const scheduleParsed = parseMaybeJsonObject(scheduleRaw);
    if (scheduleParsed === "__INVALID_JSON__") {
      return res
        .status(400)
        .json({ ok: false, mensaje: "schedule inválido: JSON mal formado" });
    }
    if (!scheduleParsed || !isPlainObject(scheduleParsed)) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "Falta schedule válido" });
    }

    // PunchType (para code: 2-punch, 4-punch, entry-only, etc.)
    const punchType = await PunchTypes.findById(punchTypeId).lean();
    if (!punchType) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "PunchType no encontrado" });
    }

    // =========================
    // 1) Snapshot BEFORE
    // =========================
    const beforeUser = await User.findOne({
      _id: user_id,
      isDeleted: false,
    }).lean();
    if (!beforeUser) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    // Procesa horario + total horas
    const data = procesarHorarioConHoras(scheduleParsed, punchType.code);

    // =========================
    // 2) Update
    // =========================
    await User.updateOne(
      { _id: user_id },
      {
        $set: {
          schedule: data.horarioConHoras,
          punchTypeId,
          weeklyWorkHours: Number.isFinite(data.totalHours)
            ? data.totalHours
            : 0,
          updated_at: new Date().toISOString(), // tu schema usa strings
        },
      },
      { runValidators: true },
    );

    // =========================
    // 3) Snapshot AFTER
    // =========================
    const afterUser = await User.findById(user_id).lean();
    if (!afterUser) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    // =========================
    // 4) AuditLog (solo si cambió algo)
    // =========================
    const cfg = getAuditConfig("User");
    const changes = diffObjects(beforeUser, afterUser, cfg);

    if (changes.length) {
      const { title, tags, summary } = buildTitleTagsSummary(changes, cfg);

      const ip = getClientIp(req);
      const changedBy = req.user?._id || null;

      await AuditLog.create({
        rootUser: user_id,
        entityType: "User",
        entityId: user_id,
        action: "UPDATE",
        title, // debería caer en "Actualizó horario" por tu regla schedule.*
        subtitle: "",
        tags: Array.from(new Set([...(tags || []), "schedule"])), // fuerza tag schedule
        summary,
        changes,
        note: "",
        changedBy,
        context: {
          route: req.originalUrl || req.url || "",
          method: req.method || "",
          ip,
          userAgent: toStr(req.headers["user-agent"]),
          requestId:
            req.requestId || req.id || req.headers["x-request-id"] || "",
          statusCode: 200,
          meta: {
            source: "updateSchedule",
            punchTypeId: String(punchTypeId),
            punchTypeCode: punchType?.code || null,
            totalHours: Number.isFinite(data.totalHours) ? data.totalHours : 0,
          },
        },
      });
    }

    const user = await User.findById(user_id)
      .select("-password")
      .populate("punchTypeId")
      .lean();

    return res.status(200).send({
      ok: true,
      user,
      data,
      mensaje: "Usuario actualizado con éxito",
      message: "User updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
    });
  }
};

const createEmployee = async (req: any, res: Response) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { department, departmentCode, recruitmentApplication, ...data } =
      req.body;

    // ✅ Validar applicationId si viene
    if (
      recruitmentApplication &&
      !Types.ObjectId.isValid(recruitmentApplication)
    ) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        ok: false,
        mensaje: "recruitmentApplication inválido.",
      });
    }

    // 1) Validar rol EMPLOYEE (ideal filtrar por isDeleted/isActive si aplican)
    const roleEmployee = await Roles.findOne({
      code: "EMPLOYEE",
      // isDeleted: false,
      // isActive: true,
    }).session(session);

    if (!roleEmployee) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        ok: false,
        mensaje: "No existe el rol EMPLOYEE o está inactivo/eliminado.",
        message: "EMPLOYEE role not found or inactive/deleted.",
      });
    }

    // 2) Validar email en uso (en tu modelo usas isActived, ojo)
    if (!data?.email) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        ok: false,
        mensaje: "Email es requerido.",
      });
    }

    const verifyEmailUser = await User.findOne({
      email: data.email,
      isActived: true,
      isDeleted: false,
    })
      .session(session)
      .lean();

    if (verifyEmailUser) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(409)
        .send({ ok: false, mensaje: "Email ya esta en uso" });
    }

    // 3) Password
    const password = data.password ? String(data.password) : "123456";
    data.password = await encrypt(password);

    // 4) Code / code_punch (si debe ser único, conviene índice unique en DB)
    const code = await generateReference(4);
    data.code = code;

    // 5) Imagen
    if (req.uploaded?.images?.length) {
      data.img = req.uploaded.images[0];
    }

    // 6) Crear usuario
    const createdUser = await User.create(
      [
        {
          ...data,
          rol: roleEmployee._id,
          code_punch: code,
          department,
          recruitmentApplication,
          payrollBank: {},
        },
      ],
      { session },
    );

    const userDoc = createdUser?.[0];
    if (!userDoc?._id) {
      throw new Error("No se pudo crear el usuario.");
    }

    // 7) Si viene recruitmentApplication, actualizar expediente + application
    if (recruitmentApplication) {
      // 7.1) Asegurar que exista la solicitud (para no marcar HIRED algo inexistente)
      const app = await RecruitmentApplication.findOne({
        _id: new Types.ObjectId(recruitmentApplication),
        isDeleted: false,
      })
        .session(session)
        .lean();

      if (!app) {
        // Si esto falla, rollback total
        throw new Error("RecruitmentApplication no encontrada o eliminada.");
      }

      // 7.2) Link en Expedient (opcional: exigir que exista)
      const exp = await Expedient.findOneAndUpdate(
        {
          application: new Types.ObjectId(recruitmentApplication),
          // isDeleted: false, // si aplica
        },
        { $set: { user: userDoc._id } },
        { session, new: true },
      );

      // // Si tú quieres que sea obligatorio que exista un expediente:
      // if (!exp) {
      //   throw new Error(
      //     "No existe Expedient para esa recruitmentApplication (no se creó empleado)."
      //   );
      // }

      // 7.3) Marcar aplicación como HIRED
      await RecruitmentApplication.updateOne(
        {
          _id: new Types.ObjectId(recruitmentApplication),
          isDeleted: false,
        },
        { $set: { decision: "HIRED" } },
        { session },
      );
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).send({
      ok: true,
      user: userDoc,
      mensaje: "Usuario creado con éxito",
      message: "User created successfully",
    });
  } catch (error: any) {
    try {
      await session.abortTransaction();
    } catch {}
    session.endSession();

    console.log(error);

    return res.status(500).json({
      ok: false,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
      error: String(error?.message || error),
    });
  }
};

const getEmployees = async (req: Request, res: Response) => {
  try {
    const {
      limit,
      initial,
      isActived,
      text = "",
      departmentCode,

      company,
      department,
      jobPosition,
      project,
      salaryType,
      paymentSchedule,

      hiringDateFrom,
      hiringDateTo,
    } = req.query;

    const setObjectIdFilter = (
      filter: Record<string, any>,
      field: string,
      value: unknown,
    ) => {
      const rawValue = getQueryString(value);

      if (!rawValue) return;

      if (!Types.ObjectId.isValid(rawValue)) {
        throw {
          statusCode: 400,
          mensaje: `El parámetro '${field}' no es un ObjectId válido.`,
          message: `'${field}' is not a valid ObjectId.`,
        };
      }

      filter[field] = new Types.ObjectId(rawValue);
    };

    // 1) Validar rol EMPLOYEE
    const roleEmployee = await Roles.findOne({
      code: "EMPLOYEE",
    });

    if (!roleEmployee) {
      return res.status(404).json({
        ok: false,
        mensaje: "No existe el rol EMPLOYEE o está inactivo/eliminado.",
        message: "EMPLOYEE role not found or inactive/deleted.",
      });
    }

    // 2) Normalizar isActived
    let isActiveBool: boolean | undefined;

    const isActivedValue = getQueryString(isActived);

    if (isActivedValue) {
      if (isActivedValue.toLowerCase() === "true") {
        isActiveBool = true;
      } else if (isActivedValue.toLowerCase() === "false") {
        isActiveBool = false;
      }
    }

    // 3) Filtro base
    const filter: Record<string, any> = {
      isDeleted: false,
      rol: roleEmployee._id,
    };

    if (typeof isActiveBool === "boolean") {
      filter.isActived = isActiveBool;
    }

    // 4) Filtros directos por ObjectId
    try {
      setObjectIdFilter(filter, "company", company);
      setObjectIdFilter(filter, "department", department);
      setObjectIdFilter(filter, "jobPosition", jobPosition);
      setObjectIdFilter(filter, "project", project);
      setObjectIdFilter(filter, "salaryType", salaryType);
      setObjectIdFilter(filter, "paymentSchedule", paymentSchedule);
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({
        ok: false,
        mensaje: error.mensaje || "Filtro inválido.",
        message: error.message || "Invalid filter.",
      });
    }

    // 5) Filtro por departmentCode.
    // Solo se aplica si NO vino department por ID.
    const departmentCodeValue = getQueryString(departmentCode);

    if (!filter.department && departmentCodeValue) {
      const departmentByCode = await Department.findOne({
        code: departmentCodeValue,
        isActive: true,
        isDeleted: false,
      });

      if (departmentByCode) {
        filter.department = departmentByCode._id;
      } else {
        return res.status(404).json({
          ok: false,
          mensaje: "No existe un departamento activo con ese código.",
          message: "No active department found with that code.",
        });
      }
    }

    // 6) Filtro por fecha de contratación
    const hiringFromValue = getQueryString(hiringDateFrom);
    const hiringToValue = getQueryString(hiringDateTo);

    if (hiringFromValue || hiringToValue) {
      filter.hiringDate = {};

      if (hiringFromValue) {
        filter.hiringDate.$gte = hiringFromValue;
      }

      if (hiringToValue) {
        filter.hiringDate.$lte = hiringToValue;
      }
    }

    // 7) Búsqueda por texto
    const searchText = getQueryString(text);

    if (searchText) {
      const regex = generateRegex(searchText);

      filter.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { code: regex },
        { code_punch: regex },
        { ext: regex },
      ];
    }

        // 8) Validación de acceso a empleados
    const authPayload = (req as any).user;

    const authUserId =
      authPayload?.id ||
      authPayload?._id ||
      authPayload?.uid ||
      (req as any).uid;

    if (!authUserId || !Types.ObjectId.isValid(String(authUserId))) {
      filter._id = { $in: [] };
    } else {
      const currentUser = await User.findById(authUserId)
        .select("rol department")
        .populate("rol", "code name")
        .populate("department", "code name managers")
        .lean();

      if (!currentUser) {
        filter._id = { $in: [] };
      } else {
        const toCode = (value: any) =>
          String(value || "")
            .trim()
            .toUpperCase();

        const currentRoleCode = toCode((currentUser.rol as any)?.code);

        const currentDepartment: any = currentUser.department;
        const currentDepartmentCode = toCode(currentDepartment?.code);

        const currentRoleId = String(
          (currentUser.rol as any)?._id || currentUser.rol || "",
        );

        const isEmployeeRole =
          currentRoleCode === "EMPLOYEE" ||
          currentRoleId === String(roleEmployee._id);

        /**
         * Admin / Super Admin se validan por el código del rol.
         */
        const adminRoleCodes = ["ADMIN", "SUPER_ADMIN", "ADMINISTRATOR"];

        /**
         * Recursos Humanos puede ser rol o departamento.
         * Ajusta estos códigos según tus seeders reales.
         */
        const humanResourcesCodes = [
          "HR",
          "RRHH",
          "HUMAN_RESOURCES",
          "RECURSOS_HUMANOS",
          "RECURSOS HUMANOS",
        ];

        const isAdmin = adminRoleCodes.includes(currentRoleCode);

        const isHumanResources =
          humanResourcesCodes.includes(currentRoleCode) ||
          humanResourcesCodes.includes(currentDepartmentCode);

        /**
         * Verificar si el usuario autenticado es manager
         * del departamento al que pertenece.
         *
         * Department.managers: Types.ObjectId[]
         */
        const departmentManagers = Array.isArray(currentDepartment?.managers)
          ? currentDepartment.managers
          : [];

        const isManagerOfDepartment = departmentManagers.some(
          (managerId: any) => String(managerId) === String(authUserId),
        );

        const isEmployeeManager = isEmployeeRole && isManagerOfDepartment;

        /**
         * Caso 1:
         * Admin, Super Admin o Recursos Humanos ven todos los empleados.
         */
        if (isAdmin || isHumanResources) {
          // No se agrega restricción extra.
        }

        /**
         * Caso 2:
         * Si es empleado y manager de su departamento,
         * solo ve empleados de ese departamento.
         */
        else if (isEmployeeManager) {
          const departmentId = currentDepartment?._id;

          if (!departmentId || !Types.ObjectId.isValid(String(departmentId))) {
            filter._id = { $in: [] };
          } else {
            filter.department = new Types.ObjectId(String(departmentId));

            // Evita que el manager se vea a sí mismo.
            filter._id = {
              $ne: new Types.ObjectId(String(authUserId)),
            };
          }
        }

        /**
         * Caso 3:
         * Si no es Admin, Super Admin, RRHH o Employee Manager,
         * no ve empleados.
         */
        else {
          filter._id = { $in: [] };
        }
      }
    }

    // 9) Paginación opcional
    const hasPagination = limit !== undefined || initial !== undefined;

    let limitNum: number | undefined;
    let initialNum = 0;

    if (hasPagination) {
      if (initial !== undefined) {
        initialNum = Math.max(0, parseInt(String(initial), 10) || 0);
      }

      if (limit !== undefined) {
        const parsedLimit = parseInt(String(limit), 10);

        if (Number.isNaN(parsedLimit) || parsedLimit <= 0) {
          return res.status(400).json({
            ok: false,
            mensaje: "El parámetro 'limit' debe ser un número mayor a 0.",
            message: "'limit' must be a number greater than 0.",
          });
        }

        limitNum = Math.min(200, parsedLimit);
      }
    }

    // 10) Query
    let query = User.find(filter)
      .select("-password")
      .populate("punchTypeId")
      .populate("company", "legalName commercialName name code")
      .populate("department")
      .populate("project")
      .populate("jobPosition")
      .populate({
        path: "paymentSchedule",
        populate: {
          path: "paymentFrequency",
        },
      })
      .populate("salaryType")
      .populate("rol")
      .sort("name");

    if (hasPagination) {
      query = query.skip(initialNum);

      if (limitNum !== undefined) {
        query = query.limit(limitNum);
      }
    }

    const [employees, count] = await Promise.all([
      query,
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      ok: true,
      count,
      employees,
      pagination: hasPagination
        ? {
            initial: initialNum,
            limit: limitNum ?? null,
          }
        : null,
      filters: {
        company: filter.company || null,
        department: filter.department || null,
        jobPosition: filter.jobPosition || null,
        project: filter.project || null,
        salaryType: filter.salaryType || null,
        paymentSchedule: filter.paymentSchedule || null,
        hiringDate: filter.hiringDate || null,
        isActived: filter.isActived,
      },
      mensaje: "Empleados encontrados con éxito",
      message: "Employees found successfully",
    });
  } catch (error) {
    console.log("getEmployees error:", error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
    });
  }
};

const updateEmployee = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ ok: false, mensaje: "ID inválido" });
    }

    const { department, departmentCode, auditNote, auditTags, ...data } =
      req.body;

    // =========================
    // payrollBank parse (tu lógica intacta, solo pulida)
    // =========================
    if (Object.prototype.hasOwnProperty.call(data, "payrollBank")) {
      const raw = (data as any).payrollBank;

      // Caso: mandaron payrollBank: "" (o null) => no actualizar ese campo
      if (raw === "" || raw === null || raw === undefined) {
        delete (data as any).payrollBank;
      } else if (typeof raw === "string") {
        try {
          const parsed = JSON.parse(raw);

          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return res.status(400).json({
              ok: false,
              mensaje: "payrollBank inválido: formato no permitido.",
            });
          }

          Object.keys(parsed).forEach((k) => {
            if (typeof (parsed as any)[k] === "string")
              (parsed as any)[k] = (parsed as any)[k].trim();
          });

          (data as any).payrollBank = parsed;
        } catch {
          return res.status(400).json({
            ok: false,
            mensaje: "payrollBank inválido: JSON mal formado.",
          });
        }
      } else if (typeof raw === "object") {
        if (Array.isArray(raw)) {
          return res.status(400).json({
            ok: false,
            mensaje: "payrollBank inválido: no puede ser array.",
          });
        }

        Object.keys(raw).forEach((k) => {
          if (typeof (raw as any)[k] === "string")
            (raw as any)[k] = (raw as any)[k].trim();
        });

        (data as any).payrollBank = raw;
      } else {
        return res.status(400).json({
          ok: false,
          mensaje: "payrollBank inválido: tipo no permitido.",
        });
      }
    }

    // =========================
    // 1) Verificar usuario + snapshot BEFORE
    // =========================
    const existingUser = await User.findOne({
      _id: id,
      isDeleted: false,
    }).lean();

    if (!existingUser) {
      return res.status(404).json({
        ok: false,
        mensaje: "Empleado no encontrado",
        message: "Employee not found",
      });
    }

    if (data.email && String(data.email).trim() !== "") {
      const verifyEmailUser = await User.findOne({
        _id: { $ne: id },
        email: String(data.email).trim(),
        isDeleted: false,
        isActived: true,
      }).lean();

      if (verifyEmailUser) {
        return res.status(409).json({
          ok: false,
          mensaje: "Email ya está en uso por otro usuario activo",
          message: "Email already in use by an active user",
        });
      }
    }

    if (data.password && String(data.password).trim() !== "") {
      (data as any).password = await encrypt(String(data.password));
    } else {
      delete (data as any).password;
    }

    if (req.uploaded?.images?.length) {
      (data as any).img = req.uploaded.images[0];
    }

    // department opcional
    if (department !== undefined) {
      (data as any).department = department;
    }

    // ✅ si tu schema no usa timestamps, asegúrate de refrescar updated_at
    // (si ya usas timestamps: true, puedes quitar esto)
    (data as any).updated_at = new Date().toISOString();

    // =========================
    // 5) Update + snapshot AFTER (lean)
    // =========================
    await User.updateOne({ _id: id }, { $set: data }, { runValidators: true });

    const afterUser = await User.findById(id).lean();

    // =========================
    // 6) Guardar AuditLog (si hubo cambios reales)
    // =========================
    if (afterUser) {
      const cfg = getAuditConfig("User");
      const changes = diffObjects(existingUser, afterUser, cfg);
      await hydrateRefChanges(changes, cfg);

      if (changes.length) {
        const { title, tags, summary } = buildTitleTagsSummary(changes, cfg);

        const extraTags = parseTags(auditTags);
        const ip = getClientIp(req);

        const changedBy = req.user?._id || null;

        await AuditLog.create({
          rootUser: id,
          entityType: "User",
          entityId: id,
          action: "UPDATE",
          title,
          subtitle: "",
          tags: Array.from(new Set([...(tags || []), ...extraTags])),
          summary,
          changes,
          note: auditNote ? String(auditNote).slice(0, 500) : "",
          changedBy,
          context: {
            route: req.originalUrl || req.url || "",
            method: req.method || "",
            ip,
            userAgent: toStr(req.headers["user-agent"]),
            requestId:
              req.requestId || req.id || req.headers["x-request-id"] || "",
            statusCode: 200,
            meta: {
              departmentCode: departmentCode || null,
              payloadKeys: redactPayloadKeys(req.body),
            },
          },
        });
      }
    }

    const updated = await User.findById(id)
      .select("-password")
      .populate("punchTypeId")
      .populate({
        path: "paymentSchedule",
        populate: { path: "paymentFrequency" },
      })
      .populate("salaryType")
      .populate("department")
      .populate("project")
      .populate("rol");

    return res.status(200).json({
      ok: true,
      user: updated,
      mensaje: "Empleado actualizado con éxito",
      message: "Employee updated successfully",
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

const getEmployeesByDepartment = async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;

    const employees = await User.find({
      department: departmentId,
      isDeleted: false,
      isActived: true,
    })
      .select("name email jobPosition department")
      .populate({ path: "jobPosition", select: "name" })
      .populate({ path: "department", select: "name" })
      .lean();

    const data = employees.map((u: any) => ({
      _id: u._id,
      name: u.name || "N/A",
      email: u.email || "N/A",
      jobPosition: u.jobPosition?.name || "N/A",
      department: u.department?.name || "N/A",
    }));

    return res.status(200).json({ ok: true, data });
  } catch (error) {
    console.error("getEmployeesByDepartment error:", error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error cargando empleados" });
  }
};

const lookupEmployees = async (req: Request, res: Response) => {
  try {
    const { search = "", limit = "30" } = req.query as any;

    const roleEmployee = await Roles.findOne({ code: "EMPLOYEE" })
      .select("_id code")
      .lean();

    if (!roleEmployee) {
      return res.status(404).json({
        ok: false,
        mensaje: "No existe el rol EMPLOYEE o está inactivo/eliminado.",
      });
    }

    let limitNum = parseInt(String(limit), 10);
    if (Number.isNaN(limitNum) || limitNum <= 0) limitNum = 30;
    limitNum = Math.min(100, limitNum);

    const filter: any = {
      isDeleted: false,
      rol: roleEmployee._id,
      // si manejas isActive:
      isActived: true,
    };

    const s = String(search || "").trim();
    if (s) {
      // escape regex
      const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(escaped, "i");

      filter.$or = [{ name: rx }, { email: rx }];
    }

    const employees = await User.find(filter)
      .select("name email department jobPosition")
      .populate({ path: "department", select: "name code" })
      .populate({ path: "jobPosition", select: "name" })
      .sort({ name: 1 })
      .limit(limitNum)
      .lean();

    return res.status(200).send({
      ok: true,
      employees,
      count: employees.length,
      mensaje: "Empleados encontrados con éxito",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
    });
  }
};

const resetEmployeePassword = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { autoGenerate = true, password = "" } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido",
      });
    }

    const employee = await User.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!employee) {
      return res.status(404).json({
        ok: false,
        mensaje: "Empleado no encontrado",
      });
    }

    let newPassword = "";

    if (autoGenerate) {
      newPassword = generateTemporaryPassword(12);
    } else {
      newPassword = String(password || "").trim();

      if (!newPassword) {
        return res.status(400).json({
          ok: false,
          mensaje: "La contraseña es obligatoria",
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          ok: false,
          mensaje: "La contraseña debe tener al menos 8 caracteres",
        });
      }
    }

    employee.password = newPassword;
    employee.updated_at = new Date().toISOString();

    await employee.save();

    return res.status(200).json({
      ok: true,
      mensaje: autoGenerate
        ? "Contraseña generada correctamente"
        : "Contraseña actualizada correctamente",
      temporaryPassword: autoGenerate ? newPassword : "",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
    });
  }
};

export {
  createUser,
  getUsers,
  searchUsers,
  updateUser,
  deleteUser,
  getUsersByRole,
  getOperadoras,
  updateUserImage,
  updateSchedule,
  getEmployees,
  createEmployee,
  updateEmployee,
  getEmployeesByDepartment,
  lookupEmployees,
  resetEmployeePassword,
};
