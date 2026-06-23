import { Request, Response } from "express";
import User from "../model/account/user";
import Rol from "../model/role";
import CallsReports from "../model/callsReports";
import moment from "moment";
import RecruitmentApplication from "../model/recruitment/recruitmentApplication";
import PuncHistory from "../model/punch/puncHistory";
import ProblemReport from "../model/problemReport";
import Status from "../model/status";
import PermissionRequest from "../model/punch/permissionRequest";

const getInitials = (name: string = "") => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
};

const getHrDashboardSummary = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const todayYMD = moment(now).format("YYYY-MM-DD");
    const todayYMDSlash = moment(now).format("YYYY/MM/DD");

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // ─────────────────────────────
    // 1) Datos base / KPIs
    // ─────────────────────────────
    const roles = await Rol.find({
      code: ["EMPLOYEE"],
    }).lean();

    const rolesIds = roles.map((r) => r._id);

    const employeesQuery: any = {
      isActived: true,
      isDeleted: false,
    };
    if (rolesIds.length > 0) {
      employeesQuery.rol = { $in: rolesIds };
    }

    const status = await Status.findOne({ code: "PENDING" });

    const [
      employeesActive,
      callsToday,
      pendingPermissions,
      interviewsToday,
      punchesTodayCount,
      lateEmployees,

      errorReportsCount,
    ] = await Promise.all([
      User.countDocuments(employeesQuery),
      CallsReports.countDocuments({ callDay: todayYMDSlash }),
      // "solicitudes nuevas" (pendientes)
      // RecruitmentApplication.countDocuments({
      //   status: "Pendiente",
      //   isDeleted: false,
      // }),
      PermissionRequest.countDocuments({ status: "PENDIENTE" }),
      // entrevistas agendadas para hoy
      RecruitmentApplication.countDocuments({
        status: "Aprobada",
        isDeleted: false,
        "interview.scheduledAt": {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      }),
      PuncHistory.countDocuments({ date: todayYMD }),
      PuncHistory.countDocuments({
        date: todayYMD,
        isLate: true,
      }),
      ProblemReport.countDocuments({ isDeleted: false, status: status?._id }),
    ]);

    // empleados ausentes = activos - los que tienen ponche hoy
    const punchedUsersToday = await PuncHistory.distinct("user", {
      date: todayYMD,
    });
    const absentEmployees = Math.max(
      employeesActive - punchedUsersToday.length,
      0,
    );

    const kpis = [
      {
        key: "activeEmployees",
        label: "Empleados activos",
        value: employeesActive,
        icon: "groups",
      },
      {
        key: "callsToday",
        label: "Llamadas de hoy",
        value: callsToday,
        icon: "call",
      },
      {
        key: "pendingPemissions",
        label: "Permisos pendientes",
        value: pendingPermissions,
        icon: "multiple_stop",
      },
      {
        key: "todayInterviews",
        label: "Entrevistas de hoy",
        value: interviewsToday,
        icon: "event",
      },
      {
        key: "punchesToday",
        label: "Ponches de hoy",
        value: punchesTodayCount,
        icon: "schedule",
      },
      {
        key: "lateArrivals",
        label: "Llegadas tarde",
        value: lateEmployees,
        icon: "alarm_on",
      },
      {
        key: "absentEmployees",
        label: "Ausentes",
        value: absentEmployees,
        icon: "person_off",
      },
      {
        key: "errorReports",
        label: "Reporte de errores",
        value: errorReportsCount,
        icon: "warning",
      },
    ];

    // ─────────────────────────────
    // 2) Distribución + % de avance de reclutamiento
    // ─────────────────────────────
    const [
      totalApplications,
      enRevisionCount,
      entrevistaAgendadaCount,
      preseleccionadosCount,
      descartadosCount,
      evaluatedCount,
      completedExpedientsCount,
    ] = await Promise.all([
      RecruitmentApplication.countDocuments({ isDeleted: false }),
      RecruitmentApplication.countDocuments({
        status: "Pendiente",
        isDeleted: false,
      }),
      RecruitmentApplication.countDocuments({
        isDeleted: false,
        "interview.scheduledAt": { $exists: true, $ne: null },
      }),
      RecruitmentApplication.countDocuments({
        isDeleted: false,
        decision: { $in: ["INTERVIEW", "HIRING", "POOL"] },
      }),
      RecruitmentApplication.countDocuments({
        isDeleted: false,
        status: "Rechazada",
      }),
      // Aplicaciones "evaluadas" (tienen entrevista y/o evaluación y/o decisión)
      RecruitmentApplication.countDocuments({
        isDeleted: false,
        $or: [
          { "interview.scheduledAt": { $exists: true, $ne: null } },
          { "interview.evaluation": { $exists: true } },
          { decision: { $in: ["INTERVIEW", "HIRING", "POOL"] } },
        ],
      }),
      // Expedientes con clasificación completada (al menos se creó la estructura)
      RecruitmentApplication.countDocuments({
        isDeleted: false,
        "classification.sections": { $exists: true },
      }),
    ]);

    const percent = (count: number) =>
      totalApplications > 0
        ? Math.round((count * 10000) / totalApplications) / 100
        : 0;

    // Progreso de reclutamiento basado en datos reales
    const recruitmentProgress = {
      // % de aplicaciones que ya tienen algún tipo de avance
      evaluated: percent(evaluatedCount),
      // % de aplicaciones que ya tienen expediente clasificado
      completed: percent(completedExpedientsCount),
    };

    const distribution = [
      {
        label: "En revisión",
        count: enRevisionCount,
        percent: percent(enRevisionCount),
        color: "primary",
      },
      {
        label: "Entrevista agendada",
        count: entrevistaAgendadaCount,
        percent: percent(entrevistaAgendadaCount),
        color: "indigo-6",
      },
      {
        label: "Preseleccionados",
        count: preseleccionadosCount,
        percent: percent(preseleccionadosCount),
        color: "teal-5",
      },
      {
        label: "Descartados",
        count: descartadosCount,
        percent: percent(descartadosCount),
        color: "red-5",
      },
    ];

    // ─────────────────────────────
    // 4) Entrevistas (hoy)
    // ─────────────────────────────
    const upcomingInterviews = await RecruitmentApplication.find({
      isDeleted: false,
      "interview.scheduledAt": { $gte: startOfDay, $lt: endOfDay },
    })
      .populate({
        path: "form",
        populate: {
          path: "jobPosition",
        },
      })
      .sort({ "interview.scheduledAt": 1 })
      .limit(5)
      .lean();

    const interviews = upcomingInterviews.map((app: any) => {
      const candidateName =
        app.candidateName || app.answers?.fullName || "Sin nombre";
      const scheduled = app.interview?.scheduledAt
        ? new Date(app.interview.scheduledAt)
        : null;

      return {
        id: app._id,
        candidate: candidateName,
        candidateInitials: getInitials(candidateName),
        position:
          app.form.jobPosition.name ||
          app.desiredPosition ||
          app.answers?.position ||
          "Sin puesto",
        mode: app.interview?.mode || "Presencial",
        date: scheduled ? moment(scheduled).format("DD/MM/YYYY") : "-",
        time: scheduled ? moment(scheduled).format("hh:mm A") : "",
      };
    });

    // ─────────────────────────────
    // 5) Últimos candidatos
    // ─────────────────────────────
    const lastCandidatesRaw = await RecruitmentApplication.find({
      isDeleted: false,
    })
      .populate({
        path: "form",
        populate: {
          path: "jobPosition",
        },
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const statusMap: Record<string, { label: string; color: string }> = {
      Pendiente: { label: "En revisión", color: "orange-6" },
      Aprobada: { label: "Aprobado", color: "positive" },
      Rechazada: { label: "Descartado", color: "red-5" },
    };

    const lastCandidates = lastCandidatesRaw.map((app: any) => {
      const name = app.candidateName || app.answers?.fullName || "Sin nombre";
      const status = app.status || "Pendiente";
      const mapped = statusMap[status] || {
        label: status,
        color: "grey-6",
      };

      return {
        id: app._id,
        initials: getInitials(name),
        name,
        email: app.candidateEmail || app.answers?.email || "",
        position:
          app.form.jobPosition.name ||
          app.desiredPosition ||
          app.answers?.position ||
          "",
        source: app.source || app.answers?.source || "Formulario web",
        status: mapped.label,
        statusColor: mapped.color,
        createdAt: moment(app.createdAt).fromNow(), // Ej: "hace 2 horas"
      };
    });

    // ─────────────────────────────
    // 6) Ponches de hoy
    // ─────────────────────────────
    const punchesTodayRaw = await PuncHistory.find({
      date: todayYMD,
    })
      .populate({
        path: "user",
        select: "name img department rol",
        populate: [
          {
            path: "department",
            select: "name",
          },
          {
            path: "rol",
            select: "name",
          },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const punchesToday = punchesTodayRaw.map((p: any) => {
      const employeeName = p.user?.name || "Sin nombre";

      const department =
        p.user?.department?.name || // departamento populado
        p.user?.department || // string por si no se populó
        "";

      const rol =
        p.user?.rol?.name || // rol populado
        p.user?.rol || // string por si no se populó
        "";

      const timeLabel = p.timestamp
        ? moment(p.timestamp).format("hh:mm A")
        : "";

      const statusLabel = p.isLate ? "Tarde" : "A tiempo";
      const statusColor = p.isLate ? "negative" : "positive";

      return {
        id: p._id,
        img: p.user?.img,
        initials: getInitials(employeeName),
        employee: employeeName,
        department,
        rol,
        time: timeLabel,
        status: statusLabel,
        statusColor,
      };
    });

    // ─────────────────────────────
    // RESPUESTA
    // ─────────────────────────────
    return res.status(200).send({
      ok: true,
      kpis,
      recruitmentProgress,
      distribution,
      interviews,
      lastCandidates,
      punchesToday,
    });
  } catch (error: any) {
    console.error("getHrDashboardSummary error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al cargar el dashboard de RRHH",
    });
  }
};

const getActiveEmployees = async (req: Request, res: Response) => {
  try {
    const role = await Rol.find({
      code: "EMPLOYEE",
    }).lean();

    const employeesQuery: any = {
      isActived: true,
      isDeleted: false,
    };
    if (role) {
      employeesQuery.rol = role;
    }

    const activeEmployees = await User.find(employeesQuery)
      .populate({ path: "jobPosition", select: "name" })
      .populate({ path: "department", select: "name" })
      .lean();

    const data = activeEmployees.map((e: any) => ({
      _id: e._id,
      name: e.name,
      department: e.department?.name || "N/A",
      jobPosition: e.jobPosition?.name || "N/A",
    }));

    return res.status(200).send({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("getActiveEmployees error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al cargar active employees",
    });
  }
};

const getApplicationsToday = async (req: Request, res: Response) => {
  try {
    const applicationsToday = await RecruitmentApplication.find({
      status: "Pendiente",
      isDeleted: false,
    })
      .populate({
        path: "form",
        select: "name jobPosition createdAt", // ajusta según tu schema
        populate: {
          path: "jobPosition",
          select: "name",
        },
      })
      .lean();

    const data = applicationsToday.map((app: any) => ({
      _id: app._id,
      applicantName: app.applicantName || "N/A",
      position: app.form?.jobPosition?.name || "N/A",
      form: app.form?.name || "N/A",
      createdAt: moment(app.createdAt).format("lll"),
    }));

    return res.status(200).send({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("getApplicationsToday error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al cargar solicitudes nuevas",
    });
  }
};

const getInterviewsToday = async (req: Request, res: Response) => {
  try {
    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const InterviewsToday = await RecruitmentApplication.find({
      status: "Aprobada",
      isDeleted: false,
      "interview.scheduledAt": {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    return res.status(200).send({
      ok: true,
      data: InterviewsToday,
    });
  } catch (error) {
    console.error("getInterviewsToday error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al cargar active employees",
    });
  }
};

const getLateEmployees = async (req: Request, res: Response) => {
  try {
    const todayYMD = moment().format("YYYY-MM-DD");

    const latePunches = await PuncHistory.find({
      date: todayYMD,
      isLate: true,
    })
      .populate({
        path: "user",
        select: "name department",
        populate: { path: "department", select: "name" },
      })
      .lean();

    const data = latePunches.map((p: any) => {
      const expected = p.expectedTime; // puede venir "08:00" o Date
      const actualDate = p.timestamp ? new Date(p.timestamp) : null;

      // scheduled (hora esperada)
      let scheduledText = "N/A";
      let expectedDate: Date | null = null;

      // Si expectedTime es string "HH:mm"
      if (typeof expected === "string" && expected.includes(":")) {
        scheduledText = expected;

        // construir expectedDate con la fecha de hoy + HH:mm
        const [hh, mm] = expected
          .split(":")
          .map((x: string) => parseInt(x, 10));
        expectedDate = new Date(actualDate ?? new Date());
        expectedDate.setHours(hh || 0, mm || 0, 0, 0);
      }

      // Si expectedTime es Date
      if (expected instanceof Date) {
        expectedDate = new Date(expected);
        scheduledText = moment(expectedDate).format("HH:mm:ss");
      }

      // actual (hora real)
      const actualText = actualDate
        ? moment(actualDate).format("HH:mm:ss")
        : "N/A";

      // minutesLate
      let minutesLate = 0;
      if (expectedDate && actualDate) {
        minutesLate = Math.max(
          0,
          Math.round((actualDate.getTime() - expectedDate.getTime()) / 60000),
        );
      }

      return {
        _id: p._id,
        employeeId: p.user?._id || "N/A",
        employee: p.user?.name || "N/A",
        department: p.user?.department?.name || "N/A",
        scheduled: scheduledText,
        actual: actualText,
        minutesLate,
      };
    });

    return res.status(200).send({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("getLateEmployees error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al cargar llegadas tarde",
    });
  }
};

const getAbsentEmployees = async (req: Request, res: Response) => {
  try {
    const todayYMD = moment().format("YYYY-MM-DD");

    // 1) Mismos roles que usas en el dashboard summary
    const roles = await Rol.find({
      code: ["EMPLOYEE"],
    }).lean();

    const rolesIds = roles.map((r: any) => r._id);

    // 2) Usuarios "empleados activos" según tus reglas
    const employeesQuery: any = {
      isActived: true,
      isDeleted: false,
    };

    if (rolesIds.length > 0) {
      employeesQuery.rol = { $in: rolesIds };
    }

    // 3) Usuarios que sí poncharon hoy
    const punchedUsersToday = await PuncHistory.distinct("user", {
      date: todayYMD,
    });

    // 4) Ausentes = activos que NO están en punchedUsersToday
    const absentUsers = await User.find({
      ...employeesQuery,
      _id: { $nin: punchedUsersToday },
    })
      .populate({ path: "department", select: "name" })
      .populate({ path: "rol", select: "name code" })
      .populate({ path: "jobPosition", select: "name" }) // si existe en tu User
      .select("name email phone img department rol jobPosition isActived")
      .sort({ name: 1 })
      .lean();

    // 5) Formato plano (para tablas)
    const data = absentUsers.map((u: any) => ({
      id: u._id,
      employee: u.name || "N/A",
      department: u.department?.name || "N/A",
      jobPosition: u.jobPosition?.name || "N/A",
      rol: u.rol?.name || u.rol?.code || "N/A",
      img: u.img || null,
    }));

    return res.status(200).send({
      ok: true,
      date: todayYMD,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("getAbsentEmployees error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al cargar empleados ausentes",
    });
  }
};

const getErrorsReports = async (req: Request, res: Response) => {
  try {
    const status = await Status.findOne({
      code: "PENDING",
    }).select("_id");

    if (!status?._id) {
      return res.status(200).send({ ok: true, errorsReports: [] });
    }

    const errorsReports = await ProblemReport.find({
      isDeleted: false,
      status: status._id,
    })
      .populate("comercial")
      .populate("createdBy")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).send({
      ok: true,
      data: errorsReports,
    });
  } catch (error) {
    console.error("getErrorsReports error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al cargar reportes de errores",
    });
  }
};

const getPendingPermissions = async (req: Request, res: Response) => {
  try {
    const permissionRequest = await PermissionRequest.find({
      status: "PENDIENTE",
    })
      .populate({ path: "user", select: "_id name" })
      .populate({ path: "permissionType", select: "_id name" })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).send({
      ok: true,
      data: permissionRequest,
    });
  } catch (error) {
    console.error("getErrorsReports error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al cargar reportes de errores",
    });
  }
};

export {
  getHrDashboardSummary,
  getActiveEmployees,
  getApplicationsToday,
  getInterviewsToday,
  getLateEmployees,
  getAbsentEmployees,
  getErrorsReports,
  getPendingPermissions,
};
