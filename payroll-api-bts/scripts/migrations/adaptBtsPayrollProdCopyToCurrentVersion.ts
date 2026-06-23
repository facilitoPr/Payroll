import {
  ALLOWED_DATABASE_NAME,
  MIGRATION_KEY,
  assertExecuteAllowed,
  connectMongoClientToAllowedDb,
  countDocumentsSafe,
  issue,
  mdTable,
  parseArgs,
  summarizeIssues,
  timestampForFile,
  writeReportFiles,
  MigrationIssue,
} from "./prodCopyMigrationCommon";

const modeFromArgs = () => {
  const args = parseArgs();
  if (args.execute === true) return "execute";
  return "dry-run";
};

type PlannedOperation = {
  collectionName: string;
  documentId?: any;
  operation: "UPDATE" | "CREATE";
  reason: string;
  before?: any;
  set?: Record<string, any>;
  insert?: Record<string, any>;
};

const round2 = (value: number) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
const toNum = (value: any, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const objectIdToString = (value: any) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value.toHexString) return value.toHexString();
  return String(value);
};

const getSalaryTypeText = (user: any) => {
  const raw = user.salaryTypeName || user.salaryTypeCode || user.salaryType || user.tipoSalario || "";
  return String(raw).toUpperCase();
};

const deriveEmploymentStatus = (user: any) => {
  if (user.employmentStatus) return user.employmentStatus;
  if (user.terminationRecord || user.termination || user.terminatedAt) return "TERMINATED";
  if (user.isActived === false || user.isActive === false) return "INACTIVE";
  return "ACTIVE";
};

const derivePayrollCalculationMode = (user: any) => {
  if (user.payrollCalculationMode) return user.payrollCalculationMode;

  const salaryTypeText = getSalaryTypeText(user);

  if (salaryTypeText.includes("HORA") || salaryTypeText.includes("HOUR")) {
    return "PAY_SELECTED_HOURS_ONLY";
  }

  if (salaryTypeText.includes("DIA") || salaryTypeText.includes("DAY")) {
    return "PAY_SELECTED_DAYS_ONLY";
  }

  return "FULL_PERIOD_WITH_DAY_ADJUSTMENTS";
};

const buildLegacyAttendanceSnapshot = (payment: any) => ({
  version: 1,
  compatibilityMode: true,
  generatedAt: new Date(),
  source: "LEGACY_DEFAULT",
  calculationMode: "FULL_PERIOD",
  attendanceCutoffDate:
    payment?.snapshot?.period?.end ||
    payment?.periodEndDate ||
    payment?.endDate ||
    payment?.createdAt ||
    null,
  totals: {
    workedDays: 0,
    payableDays: 0,
    absentDays: 0,
    lateDays: 0,
    permissionDays: 0,
    vacationDays: 0,
    holidayDays: 0,
    workedHours: 0,
    regularHours: 0,
    overtimeHours: 0,
    unpaidHours: 0,
  },
  days: [],
  lateOrAbsentDays: payment?.snapshot?.attendance?.lateOrAbsentDays || [],
  notes: [
    "Metadata agregada por migración de compatibilidad. Los montos históricos no fueron recalculados.",
  ],
});

const planUserDefaults = async (db: any, operations: PlannedOperation[]) => {
  const cursor = db.collection("users").find({
    isDeleted: { $ne: true },
    $or: [
      { employmentStatus: { $exists: false } },
      { employmentStatus: null },
      { payrollCalculationMode: { $exists: false } },
      { payrollCalculationMode: null },
    ],
  });

  for await (const user of cursor) {
    const set: Record<string, any> = {};

    if (!user.employmentStatus) {
      set.employmentStatus = deriveEmploymentStatus(user);
    }

    if (!user.payrollCalculationMode) {
      set.payrollCalculationMode = derivePayrollCalculationMode(user);
    }

    if (Object.keys(set).length) {
      operations.push({
        collectionName: "users",
        documentId: user._id,
        operation: "UPDATE",
        reason: "Completar campos actuales de estado laboral y modo de cálculo sin tocar salario ni historial.",
        before: user,
        set,
      });
    }
  }
};

const planPayrollPaymentCompatibility = async (
  db: any,
  operations: PlannedOperation[],
) => {
  const exists = await countDocumentsSafe(db, "payrollpayments");
  if (!exists) return;

  const cursor = db.collection("payrollpayments").find({
    isDeleted: { $ne: true },
    "snapshot.attendance.version": { $exists: false },
  });

  for await (const payment of cursor) {
    operations.push({
      collectionName: "payrollpayments",
      documentId: payment._id,
      operation: "UPDATE",
      reason: "Agregar metadata de asistencia legacy para que pantallas nuevas no recalculen montos históricos.",
      before: payment,
      set: {
        "snapshot.attendance": buildLegacyAttendanceSnapshot(payment),
      },
    });
  }
};

const calculateVacationFields = (balance: any, activeReservedDays: number) => {
  const accruedPaymentDays = toNum(balance.accruedPaymentDays);
  const enjoyableDays = toNum(balance.enjoyableDays);
  const carryOverDays = toNum(balance.carryOverDays);
  const adjustmentDays = toNum(balance.adjustmentDays);
  const usedDays = toNum(balance.usedDays);
  const reservedDays = Math.max(0, activeReservedDays);

  const availableDays = Math.max(
    0,
    round2(enjoyableDays + carryOverDays + adjustmentDays - usedDays),
  );
  const payableVacationDays = Math.max(
    0,
    round2(accruedPaymentDays + carryOverDays + adjustmentDays - usedDays),
  );
  const availableForLoanDays = Math.max(0, round2(payableVacationDays - reservedDays));
  const netPayableVacationDays = availableForLoanDays;

  return {
    reservedDays,
    availableDays,
    payableVacationDays,
    availableForLoanDays,
    netPayableVacationDays,
  };
};

const planVacationBalanceFormulas = async (
  db: any,
  operations: PlannedOperation[],
) => {
  const exists = await countDocumentsSafe(db, "employeevacationbalances");
  if (!exists) return;

  const cursor = db.collection("employeevacationbalances").find({
    isDeleted: { $ne: true },
  });

  for await (const balance of cursor) {
    const reservations = await db
      .collection("vacationdayreservations")
      .find({
        balance: balance._id,
        status: "ACTIVE",
        isDeleted: { $ne: true },
      })
      .toArray();

    const activeReservedDays = reservations.reduce(
      (sum: number, reservation: any) => sum + toNum(reservation.reservedDays),
      0,
    );
    const expected = calculateVacationFields(balance, activeReservedDays);
    const set: Record<string, any> = {};

    for (const [key, value] of Object.entries(expected)) {
      if (round2(toNum(balance[key])) !== round2(value as number)) {
        set[key] = value;
      }
    }

    if (Object.keys(set).length) {
      operations.push({
        collectionName: "employeevacationbalances",
        documentId: balance._id,
        operation: "UPDATE",
        reason: "Normalizar fórmulas actuales de vacaciones, separando días disfrutables de días reservados por préstamo.",
        before: balance,
        set,
      });
    }
  }
};

const loanHasActiveReservation = async (db: any, loanId: any) => {
  const count = await db.collection("vacationdayreservations").countDocuments({
    loanRequest: loanId,
    status: "ACTIVE",
    isDeleted: { $ne: true },
  });

  return count > 0;
};

const planLoanVacationReservations = async (
  db: any,
  operations: PlannedOperation[],
  issues: MigrationIssue[],
) => {
  const loanCount = await countDocumentsSafe(db, "employeeloanrequests");
  if (!loanCount) return;

  const cursor = db.collection("employeeloanrequests").find({
    isDeleted: { $ne: true },
    status: { $in: ["APPROVED", "SUBMITTED", "ACTIVE"] },
    $or: [
      { "vacationSnapshot.guaranteedDays": { $gt: 0 } },
      { guaranteedDays: { $gt: 0 } },
    ],
  });

  for await (const loan of cursor) {
    if (await loanHasActiveReservation(db, loan._id)) continue;

    const guaranteedDays = Math.max(
      0,
      toNum(loan?.vacationSnapshot?.guaranteedDays || loan.guaranteedDays),
    );
    const employee = loan.employee || loan.user;
    const year = Number(loan?.vacationSnapshot?.year || new Date().getFullYear());

    if (!employee || !guaranteedDays || !loan.createdBy) {
      issue(
        issues,
        "WARNING",
        "Préstamo con garantía sin datos suficientes para crear VacationDayReservation automáticamente.",
        "employeeloanrequests",
        {
          loan: objectIdToString(loan._id),
          employee: objectIdToString(employee),
          guaranteedDays,
          hasCreatedBy: Boolean(loan.createdBy),
        },
        objectIdToString(loan._id),
      );
      continue;
    }

    const balance =
      (loan?.vacationSnapshot?.balance &&
        (await db.collection("employeevacationbalances").findOne({
          _id: loan.vacationSnapshot.balance,
        }))) ||
      (await db.collection("employeevacationbalances").findOne({
        user: employee,
        year,
        isDeleted: { $ne: true },
      }));

    if (!balance) {
      issue(
        issues,
        "WARNING",
        "No se encontró balance anual para crear reserva de préstamo.",
        "employeeloanrequests",
        { loan: objectIdToString(loan._id), year },
        objectIdToString(loan._id),
      );
      continue;
    }

    const now = new Date();
    operations.push({
      collectionName: "vacationdayreservations",
      operation: "CREATE",
      reason: "Crear reserva activa de días garantizados por préstamo ya aprobado/vigente.",
      insert: {
        user: employee,
        company: loan.company || balance.company || null,
        balance: balance._id,
        year,
        loanRequest: loan._id,
        source: "EMPLOYEE_LOAN_REQUEST",
        reservedDays: guaranteedDays,
        status: "ACTIVE",
        reason: "Reserva creada por migración desde solicitud de préstamo existente.",
        reservedAt: loan.approvedAt || loan.submittedAt || loan.createdAt || now,
        createdBy: loan.createdBy,
        metadata: {
          migrationKey: MIGRATION_KEY,
          sourceLoanRequest: loan._id,
          compatibilityNote:
            "Creada solo cuando el préstamo tenía días garantizados y no existía reserva activa.",
        },
        isActive: true,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
};

const planOperations = async (db: any) => {
  const operations: PlannedOperation[] = [];
  const issues: MigrationIssue[] = [];

  await planUserDefaults(db, operations);
  await planPayrollPaymentCompatibility(db, operations);
  await planVacationBalanceFormulas(db, operations);
  await planLoanVacationReservations(db, operations, issues);

  return { operations, issues };
};

const groupedCounts = (operations: PlannedOperation[]) =>
  operations.reduce<Record<string, number>>((acc, operation) => {
    const key = `${operation.operation}:${operation.collectionName}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

const createMigrationRun = async (db: any, mode: "dry-run" | "execute") => {
  const now = new Date();
  const result = await db.collection("migrationruns").insertOne({
    migrationKey: MIGRATION_KEY,
    startedAt: now,
    status: mode === "execute" ? "RUNNING" : "DRY_RUN",
    databaseName: ALLOWED_DATABASE_NAME,
    executedBy: "scripts/migrations/adaptBtsPayrollProdCopyToCurrentVersion.ts",
    createdCounts: {},
    updatedCounts: {},
    skippedCounts: {},
    warningCounts: {},
    errorItems: [],
    metadata: { mode },
    createdAt: now,
    updatedAt: now,
  });

  return result.insertedId;
};

const executeOperations = async (
  client: any,
  db: any,
  operations: PlannedOperation[],
) => {
  const session = client.startSession();
  const migrationRunId = await createMigrationRun(db, "execute");
  const createdCounts: Record<string, number> = {};
  const updatedCounts: Record<string, number> = {};

  try {
    await session.withTransaction(async () => {
      for (const operation of operations) {
        if (operation.operation === "UPDATE") {
          await db.collection("migrationbackups").insertOne(
            {
              migrationKey: MIGRATION_KEY,
              migrationRun: migrationRunId,
              databaseName: ALLOWED_DATABASE_NAME,
              collectionName: operation.collectionName,
              documentId: operation.documentId,
              operation: "UPDATE",
              before: operation.before,
              after: { $set: operation.set },
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            { session },
          );

          await db.collection(operation.collectionName).updateOne(
            { _id: operation.documentId },
            {
              $set: {
                ...operation.set,
                updatedAt: new Date(),
              },
            },
            { session },
          );
          updatedCounts[operation.collectionName] =
            (updatedCounts[operation.collectionName] || 0) + 1;
          continue;
        }

        if (operation.operation === "CREATE" && operation.insert) {
          const insertResult = await db
            .collection(operation.collectionName)
            .insertOne(operation.insert, { session });

          await db.collection("migrationbackups").insertOne(
            {
              migrationKey: MIGRATION_KEY,
              migrationRun: migrationRunId,
              databaseName: ALLOWED_DATABASE_NAME,
              collectionName: operation.collectionName,
              documentId: insertResult.insertedId,
              operation: "CREATE",
              before: null,
              after: { ...operation.insert, _id: insertResult.insertedId },
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            { session },
          );

          createdCounts[operation.collectionName] =
            (createdCounts[operation.collectionName] || 0) + 1;
        }
      }
    });

    await db.collection("migrationruns").updateOne(
      { _id: migrationRunId },
      {
        $set: {
          finishedAt: new Date(),
          status: "COMPLETED",
          createdCounts,
          updatedCounts,
          updatedAt: new Date(),
        },
      },
    );

    return { migrationRunId, createdCounts, updatedCounts };
  } catch (error: any) {
    await db.collection("migrationruns").updateOne(
      { _id: migrationRunId },
      {
        $set: {
          finishedAt: new Date(),
          status: "FAILED",
          errorItems: [{ message: error?.message || String(error) }],
          updatedAt: new Date(),
        },
      },
    );
    throw error;
  } finally {
    await session.endSession();
  }
};

const buildMarkdown = (
  mode: "dry-run" | "execute",
  operations: PlannedOperation[],
  issues: MigrationIssue[],
  executionResult?: any,
) => {
  const operationRows = operations.slice(0, 200).map((operation) => [
    operation.operation,
    operation.collectionName,
    objectIdToString(operation.documentId || operation.insert?.loanRequest || ""),
    operation.reason,
  ]);

  const issueRows = issues.slice(0, 100).map((item) => [
    item.priority,
    item.collection || "-",
    item.documentId || "-",
    item.message,
  ]);

  return [
    `# Plan De Migración ${ALLOWED_DATABASE_NAME}`,
    "",
    `- Modo: \`${mode}\``,
    `- Migración: \`${MIGRATION_KEY}\``,
    `- Generado: ${new Date().toISOString()}`,
    `- Operaciones planeadas: ${operations.length}`,
    `- BLOCKER: ${summarizeIssues(issues).blockers}`,
    `- WARNING: ${summarizeIssues(issues).warnings}`,
    `- INFO: ${summarizeIssues(issues).info}`,
    "",
    "## Conteo Por Colección",
    "",
    mdTable(
      ["Operación", "Cantidad"],
      Object.entries(groupedCounts(operations)).map(([key, count]) => [key, count]),
    ),
    "",
    "## Operaciones Planeadas",
    "",
    operationRows.length
      ? mdTable(["Operación", "Colección", "Documento", "Razón"], operationRows)
      : "No hay operaciones planeadas.",
    "",
    "## Hallazgos Que Requieren Atención",
    "",
    issueRows.length
      ? mdTable(["Prioridad", "Colección", "Documento", "Mensaje"], issueRows)
      : "No hay hallazgos adicionales.",
    "",
    executionResult
      ? [
          "## Ejecución",
          "",
          `- MigrationRun: \`${objectIdToString(executionResult.migrationRunId)}\``,
          `- Creados: ${JSON.stringify(executionResult.createdCounts)}`,
          `- Actualizados: ${JSON.stringify(executionResult.updatedCounts)}`,
          "",
        ].join("\n")
      : "",
  ].join("\n");
};

const main = async () => {
  const mode = modeFromArgs();

  if (mode === "execute") {
    assertExecuteAllowed();
  }

  const { client, db } = await connectMongoClientToAllowedDb();

  try {
    const { operations, issues } = await planOperations(db);
    let executionResult: any = null;

    if (mode === "execute") {
      executionResult = await executeOperations(client, db, operations);
    }

    const report = {
      migrationKey: MIGRATION_KEY,
      databaseName: db.databaseName,
      mode,
      generatedAt: new Date().toISOString(),
      operationCount: operations.length,
      groupedCounts: groupedCounts(operations),
      issues,
      summary: summarizeIssues(issues),
      operations: operations.map((operation) => ({
        collectionName: operation.collectionName,
        documentId: objectIdToString(operation.documentId),
        operation: operation.operation,
        reason: operation.reason,
        set: operation.set,
        insert: operation.insert,
      })),
      executionResult,
    };

    const stamp = timestampForFile();
    const files = writeReportFiles(
      report,
      `bts-payroll-prod-copy-migration-${mode}-${stamp}`,
      buildMarkdown(mode, operations, issues, executionResult),
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          mode,
          database: db.databaseName,
          operationCount: operations.length,
          groupedCounts: report.groupedCounts,
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
