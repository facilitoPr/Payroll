import {
  ALLOWED_DATABASE_NAME,
  AnalysisReport,
  aggregateSafe,
  connectMongoClientToAllowedDb,
  countDocumentsSafe,
  getExpectedCurrentCollections,
  issue,
  listCollectionsAnalysis,
  mdTable,
  MIGRATION_KEY,
  MigrationIssue,
  summarizeIssues,
  timestampForFile,
  writeReportFiles,
} from "./prodCopyMigrationCommon";

const userActiveQuery = {
  isDeleted: { $ne: true },
  $and: [{ isActived: { $ne: false } }, { isActive: { $ne: false } }],
};

const addIfCount = (
  issues: MigrationIssue[],
  priority: "BLOCKER" | "WARNING" | "INFO",
  count: number,
  message: string,
  collection: string,
  details: Record<string, any> = {},
) => {
  if (count > 0) {
    issue(issues, priority, message, collection, { count, ...details });
  }
};

const runDomainChecks = async (db: any, issues: MigrationIssue[]) => {
  const usersCount = await countDocumentsSafe(db, "users");

  if (!usersCount) {
    issue(issues, "BLOCKER", "No se encontró colección users con datos.", "users");
    return;
  }

  addIfCount(
    issues,
    "BLOCKER",
    await countDocumentsSafe(db, "users", {
      ...userActiveQuery,
      $or: [{ salaryType: { $exists: false } }, { salaryType: null }],
      baseSalary: { $in: [null, 0, "", undefined] },
      hourlyRate: { $in: [null, 0, "", undefined] },
    }),
    "Empleado activo sin tipo de salario ni salario base/tarifa por hora.",
    "users",
  );

  addIfCount(
    issues,
    "WARNING",
    await countDocumentsSafe(db, "users", {
      ...userActiveQuery,
      $or: [{ company: { $exists: false } }, { company: null }],
    }),
    "Empleado activo sin compañía.",
    "users",
  );

  addIfCount(
    issues,
    "WARNING",
    await countDocumentsSafe(db, "users", {
      ...userActiveQuery,
      $or: [{ schedule: { $exists: false } }, { schedule: null }],
    }),
    "Empleado activo sin horario.",
    "users",
  );

  addIfCount(
    issues,
    "WARNING",
    await countDocumentsSafe(db, "users", {
      ...userActiveQuery,
      $or: [{ paymentSchedule: { $exists: false } }, { paymentSchedule: null }],
    }),
    "Empleado activo sin calendario/frecuencia de pago.",
    "users",
  );

  addIfCount(
    issues,
    "INFO",
    await countDocumentsSafe(db, "users", {
      employmentStatus: { $exists: false },
    }),
    "Usuarios sin employmentStatus formal; migración debe derivar ACTIVE/INACTIVE/TERMINATED de forma conservadora.",
    "users",
  );

  addIfCount(
    issues,
    "INFO",
    await countDocumentsSafe(db, "users", {
      payrollCalculationMode: { $exists: false },
    }),
    "Usuarios sin payrollCalculationMode; migración debe asignar default compatible.",
    "users",
  );

  const duplicateEmails = await aggregateSafe(db, "users", [
    {
      $match: {
        email: { $nin: [null, ""] },
        isDeleted: { $ne: true },
      },
    },
    { $group: { _id: "$email", count: { $sum: 1 }, ids: { $push: "$_id" } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 20 },
  ]);

  addIfCount(
    issues,
    "WARNING",
    duplicateEmails.length,
    "Correos duplicados en usuarios activos/no eliminados.",
    "users",
    { examples: duplicateEmails },
  );

  const wsWithoutPunch = await aggregateSafe(db, "worksummaries", [
    { $match: { isDeleted: { $ne: true } } },
    {
      $lookup: {
        from: "punchhistories",
        localField: "_id",
        foreignField: "workSummary",
        as: "punches",
      },
    },
    { $match: { punches: { $size: 0 } } },
    { $count: "count" },
  ]);

  addIfCount(
    issues,
    "INFO",
    Number(wsWithoutPunch?.[0]?.count || 0),
    "WorkSummary sin PunchHistory. Puede ser día especial, permiso, ausencia o dato incompleto.",
    "worksummaries",
  );

  const punchWithoutWs = await aggregateSafe(db, "punchhistories", [
    { $match: { isDeleted: { $ne: true }, workSummary: { $ne: null } } },
    {
      $lookup: {
        from: "worksummaries",
        localField: "workSummary",
        foreignField: "_id",
        as: "ws",
      },
    },
    { $match: { ws: { $size: 0 } } },
    { $count: "count" },
  ]);

  addIfCount(
    issues,
    "WARNING",
    Number(punchWithoutWs?.[0]?.count || 0),
    "PunchHistory con referencia a WorkSummary inexistente.",
    "punchhistories",
  );

  const duplicateWorkSummary = await aggregateSafe(db, "worksummaries", [
    { $match: { isDeleted: { $ne: true } } },
    {
      $group: {
        _id: { user: "$user", dateString: "$dateString" },
        count: { $sum: 1 },
        ids: { $push: "$_id" },
      },
    },
    { $match: { count: { $gt: 1 } } },
    { $limit: 20 },
  ]);

  addIfCount(
    issues,
    "BLOCKER",
    duplicateWorkSummary.length,
    "WorkSummary duplicado por empleado y fecha.",
    "worksummaries",
    { examples: duplicateWorkSummary },
  );

  const invalidWorkSummaryDates = await countDocumentsSafe(db, "worksummaries", {
    $or: [
      { dateString: { $exists: false } },
      { dateString: null },
      { dateString: { $not: /^\d{4}-\d{2}-\d{2}$/ } },
    ],
  });

  addIfCount(
    issues,
    "WARNING",
    invalidWorkSummaryDates,
    "WorkSummary con dateString faltante o formato inválido.",
    "worksummaries",
  );

  const runsWithoutPayments = await aggregateSafe(db, "payrollruns", [
    { $match: { isDeleted: { $ne: true } } },
    {
      $lookup: {
        from: "payrollpayments",
        localField: "_id",
        foreignField: "payrollRun",
        as: "payments",
      },
    },
    { $match: { payments: { $size: 0 } } },
    { $count: "count" },
  ]);

  addIfCount(
    issues,
    "WARNING",
    Number(runsWithoutPayments?.[0]?.count || 0),
    "PayrollRun sin PayrollPayment.",
    "payrollruns",
  );

  const paymentsWithoutUser = await aggregateSafe(db, "payrollpayments", [
    { $match: { isDeleted: { $ne: true }, user: { $ne: null } } },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "employee",
      },
    },
    { $match: { employee: { $size: 0 } } },
    { $count: "count" },
  ]);

  addIfCount(
    issues,
    "WARNING",
    Number(paymentsWithoutUser?.[0]?.count || 0),
    "PayrollPayment con empleado inexistente.",
    "payrollpayments",
  );

  addIfCount(
    issues,
    "INFO",
    await countDocumentsSafe(db, "payrollpayments", {
      "snapshot.attendance.version": { $exists: false },
    }),
    "PayrollPayment histórico sin metadata de asistencia. Debe tratarse como FULL_PERIOD sin recalcular montos.",
    "payrollpayments",
  );

  const duplicateVacationBalances = await aggregateSafe(
    db,
    "employeevacationbalances",
    [
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: { user: "$user", year: "$year" },
          count: { $sum: 1 },
          ids: { $push: "$_id" },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $limit: 20 },
    ],
  );

  addIfCount(
    issues,
    "BLOCKER",
    duplicateVacationBalances.length,
    "EmployeeVacationBalance duplicado por empleado y año.",
    "employeevacationbalances",
    { examples: duplicateVacationBalances },
  );

  addIfCount(
    issues,
    "WARNING",
    await countDocumentsSafe(db, "employeevacationbalances", {
      $or: [
        { availableDays: { $lt: 0 } },
        { availableForLoanDays: { $lt: 0 } },
        { netPayableVacationDays: { $lt: 0 } },
      ],
    }),
    "Balance de vacaciones con campos disponibles negativos.",
    "employeevacationbalances",
  );

  const activeLoansWithoutReservations = await aggregateSafe(
    db,
    "employeeloanrequests",
    [
      {
        $match: {
          isDeleted: { $ne: true },
          status: { $in: ["APPROVED", "SUBMITTED", "ACTIVE"] },
          guaranteedDays: { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: "vacationdayreservations",
          localField: "_id",
          foreignField: "loanRequest",
          as: "reservations",
        },
      },
      {
        $match: {
          reservations: {
            $not: {
              $elemMatch: { status: "ACTIVE", isDeleted: { $ne: true } },
            },
          },
        },
      },
      { $count: "count" },
    ],
  );

  addIfCount(
    issues,
    "WARNING",
    Number(activeLoansWithoutReservations?.[0]?.count || 0),
    "Préstamos activos con guaranteedDays sin VacationDayReservation ACTIVE.",
    "employeeloanrequests",
  );

  const inactiveWithoutTermination = await aggregateSafe(db, "users", [
    {
      $match: {
        isDeleted: { $ne: true },
        $or: [{ isActived: false }, { isActive: false }],
        terminationRecord: { $in: [null, undefined] },
        employmentStatus: { $ne: "TERMINATED" },
      },
    },
    { $count: "count" },
  ]);

  addIfCount(
    issues,
    "INFO",
    Number(inactiveWithoutTermination?.[0]?.count || 0),
    "Usuarios inactivos sin registro formal de desvinculación; no deben marcarse TERMINATED sin evidencia.",
    "users",
  );
};

const buildMarkdown = (report: AnalysisReport) => {
  const topIssues = report.issues.slice(0, 120).map((item) => [
    item.priority,
    item.collection || "-",
    item.message,
    item.details?.count ?? "",
  ]);

  const collectionRows = report.collections.map((col) => [
    col.name,
    col.count,
    col.modelMatch,
    col.fields
      .slice(0, 8)
      .map((field) => field.path)
      .join(", "),
  ]);

  return [
    `# Análisis ${ALLOWED_DATABASE_NAME}`,
    "",
    `- Migración: \`${report.migrationKey}\``,
    `- Generado: ${report.generatedAt}`,
    `- Colecciones: ${report.collectionCount}`,
    `- BLOCKER: ${report.summary.blockers}`,
    `- WARNING: ${report.summary.warnings}`,
    `- INFO: ${report.summary.info}`,
    "",
    "## Colecciones",
    "",
    mdTable(["Colección", "Docs", "Modelo", "Campos frecuentes"], collectionRows),
    "",
    "## Colecciones Sin Match Directo",
    "",
    report.unknownOrLegacyCollections.length
      ? report.unknownOrLegacyCollections.map((x) => `- ${x}`).join("\n")
      : "No se detectaron colecciones sin match heurístico.",
    "",
    "## Colecciones Actuales Faltantes",
    "",
    report.missingCurrentCollections.length
      ? report.missingCurrentCollections.map((x) => `- ${x}`).join("\n")
      : "No se detectaron colecciones actuales faltantes según heurística.",
    "",
    "## Hallazgos",
    "",
    topIssues.length
      ? mdTable(["Prioridad", "Colección", "Mensaje", "Conteo"], topIssues)
      : "No se detectaron hallazgos.",
    "",
    "## Mapa De Migración Propuesto",
    "",
    mdTable(
      ["Origen legacy/actual", "Modelo objetivo", "Estrategia", "Riesgo"],
      [
        [
          "users",
          "User",
          "Completar employmentStatus y payrollCalculationMode solo si faltan; no inferir TERMINATED sin EmployeeTermination.",
          "Medio",
        ],
        [
          "worksummaries + punchhistories",
          "WorkSummary/PunchHistory + snapshot.attendance.days",
          "Conservar históricos; nuevos cierres generan ledger. Históricos quedan FULL_PERIOD compatible.",
          "Alto si se recalculan montos",
        ],
        [
          "payrollruns + payrollpayments",
          "PayrollRun/PayrollPayment",
          "No cambiar montos cerrados; añadir metadata segura solo bajo ejecución confirmada.",
          "Alto",
        ],
        [
          "employeevacationbalances",
          "EmployeeVacationBalance",
          "Recalcular fórmulas nuevas de disponibilidad usando campos existentes y reservas ACTIVE.",
          "Medio",
        ],
        [
          "employeeloanrequests",
          "EmployeeLoanRequest + VacationDayReservation",
          "Crear reservas solo si guaranteedDays existe y el préstamo está vigente.",
          "Medio",
        ],
        [
          "employeeterminations + terminationpayments",
          "EmployeeTermination/TerminationPayment",
          "Vincular estado TERMINATED solo cuando exista desvinculación válida.",
          "Medio",
        ],
        [
          "colecciones desconocidas",
          "Revisión manual",
          "No modificar; reportar como legacy/externas.",
          "Bajo",
        ],
      ],
    ),
    "",
  ].join("\n");
};

const main = async () => {
  const { client, db } = await connectMongoClientToAllowedDb();

  try {
    const collections = await listCollectionsAnalysis(db, {
      sampleLimit: Number(process.env.MIGRATION_ANALYSIS_SAMPLE_LIMIT || 300),
    });
    const issues: MigrationIssue[] = [];
    const expectedCurrentCollections = getExpectedCurrentCollections();
    const actualLower = new Set(collections.map((x) => x.name.toLowerCase()));
    const missingCurrentCollections = expectedCurrentCollections.filter(
      (name) => !actualLower.has(name.toLowerCase()),
    );
    const unknownOrLegacyCollections = collections
      .filter((x) => x.modelMatch === "UNKNOWN_OR_LEGACY")
      .map((x) => x.name);

    await runDomainChecks(db, issues);

    unknownOrLegacyCollections.forEach((name) => {
      issue(
        issues,
        "INFO",
        "Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada.",
        name,
      );
    });

    missingCurrentCollections.forEach((name) => {
      issue(
        issues,
        "INFO",
        "Colección esperada por modelos actuales no existe en la copia.",
        name,
      );
    });

    const report: AnalysisReport = {
      migrationKey: MIGRATION_KEY,
      databaseName: db.databaseName,
      generatedAt: new Date().toISOString(),
      collectionCount: collections.length,
      collections,
      expectedCurrentCollections,
      missingCurrentCollections,
      unknownOrLegacyCollections,
      issues,
      summary: summarizeIssues(issues),
    };

    const stamp = timestampForFile();
    const files = writeReportFiles(
      report,
      `bts-payroll-prod-copy-analysis-${stamp}`,
      buildMarkdown(report),
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          database: db.databaseName,
          collectionCount: report.collectionCount,
          summary: report.summary,
          jsonPath: files.jsonPath,
          mdPath: files.mdPath,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.close();
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
