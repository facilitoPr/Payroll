import {
  ALLOWED_DATABASE_NAME,
  MIGRATION_KEY,
  aggregateSafe,
  connectMongoClientToAllowedDb,
  countDocumentsSafe,
  issue,
  mdTable,
  summarizeIssues,
  timestampForFile,
  writeReportFiles,
  MigrationIssue,
} from "./prodCopyMigrationCommon";

const round2 = (value: number) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
const toNum = (value: any, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const validateUserDefaults = async (db: any, issues: MigrationIssue[]) => {
  const missingEmploymentStatus = await countDocumentsSafe(db, "users", {
    isDeleted: { $ne: true },
    $or: [{ employmentStatus: { $exists: false } }, { employmentStatus: null }],
  });

  if (missingEmploymentStatus > 0) {
    issue(
      issues,
      "WARNING",
      "Usuarios sin employmentStatus luego de la migración.",
      "users",
      { count: missingEmploymentStatus },
    );
  }

  const missingPayrollMode = await countDocumentsSafe(db, "users", {
    isDeleted: { $ne: true },
    $or: [
      { payrollCalculationMode: { $exists: false } },
      { payrollCalculationMode: null },
    ],
  });

  if (missingPayrollMode > 0) {
    issue(
      issues,
      "WARNING",
      "Usuarios sin payrollCalculationMode luego de la migración.",
      "users",
      { count: missingPayrollMode },
    );
  }
};

const validatePayrollCompatibility = async (db: any, issues: MigrationIssue[]) => {
  const missingAttendanceVersion = await countDocumentsSafe(db, "payrollpayments", {
    isDeleted: { $ne: true },
    "snapshot.attendance.version": { $exists: false },
  });

  if (missingAttendanceVersion > 0) {
    issue(
      issues,
      "INFO",
      "PayrollPayment histórico sin snapshot.attendance.version. Es válido si todavía no se ejecutó la migración.",
      "payrollpayments",
      { count: missingAttendanceVersion },
    );
  }
};

const validateVacationBalances = async (db: any, issues: MigrationIssue[]) => {
  const duplicates = await aggregateSafe(db, "employeevacationbalances", [
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
  ]);

  if (duplicates.length) {
    issue(
      issues,
      "BLOCKER",
      "EmployeeVacationBalance duplicado por empleado/año.",
      "employeevacationbalances",
      { count: duplicates.length, examples: duplicates },
    );
  }

  const balances = await db
    .collection("employeevacationbalances")
    .find({ isDeleted: { $ne: true } })
    .limit(5000)
    .toArray();
  let formulaMismatches = 0;

  for (const balance of balances) {
    const reservations = await db
      .collection("vacationdayreservations")
      .find({
        balance: balance._id,
        status: "ACTIVE",
        isDeleted: { $ne: true },
      })
      .toArray();
    const reservedDays = reservations.reduce(
      (sum: number, reservation: any) => sum + toNum(reservation.reservedDays),
      0,
    );
    const payableVacationDays = Math.max(
      0,
      round2(
        toNum(balance.accruedPaymentDays) +
          toNum(balance.carryOverDays) +
          toNum(balance.adjustmentDays) -
          toNum(balance.usedDays),
      ),
    );
    const availableDays = Math.max(
      0,
      round2(
        toNum(balance.enjoyableDays) +
          toNum(balance.carryOverDays) +
          toNum(balance.adjustmentDays) -
          toNum(balance.usedDays),
      ),
    );
    const availableForLoanDays = Math.max(0, round2(payableVacationDays - reservedDays));

    if (
      round2(toNum(balance.reservedDays)) !== round2(reservedDays) ||
      round2(toNum(balance.payableVacationDays)) !== round2(payableVacationDays) ||
      round2(toNum(balance.availableDays)) !== round2(availableDays) ||
      round2(toNum(balance.availableForLoanDays)) !== round2(availableForLoanDays) ||
      round2(toNum(balance.netPayableVacationDays)) !== round2(availableForLoanDays)
    ) {
      formulaMismatches += 1;
    }
  }

  if (formulaMismatches > 0) {
    issue(
      issues,
      "WARNING",
      "Balances de vacaciones con fórmulas no alineadas a reservas activas.",
      "employeevacationbalances",
      { count: formulaMismatches },
    );
  }
};

const validateLoanReservations = async (db: any, issues: MigrationIssue[]) => {
  const missingReservations = await aggregateSafe(db, "employeeloanrequests", [
    {
      $match: {
        isDeleted: { $ne: true },
        status: { $in: ["APPROVED", "SUBMITTED", "ACTIVE"] },
        $or: [
          { "vacationSnapshot.guaranteedDays": { $gt: 0 } },
          { guaranteedDays: { $gt: 0 } },
        ],
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
    { $limit: 20 },
  ]);

  if (missingReservations.length) {
    issue(
      issues,
      "WARNING",
      "Préstamos vigentes con garantía de vacaciones sin reserva activa.",
      "employeeloanrequests",
      { count: missingReservations.length, examples: missingReservations.map((x: any) => x._id) },
    );
  }

  const duplicateReservations = await aggregateSafe(db, "vacationdayreservations", [
    { $match: { status: "ACTIVE", isDeleted: { $ne: true }, loanRequest: { $ne: null } } },
    { $group: { _id: "$loanRequest", count: { $sum: 1 }, ids: { $push: "$_id" } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 20 },
  ]);

  if (duplicateReservations.length) {
    issue(
      issues,
      "BLOCKER",
      "Más de una reserva activa para el mismo préstamo.",
      "vacationdayreservations",
      { count: duplicateReservations.length, examples: duplicateReservations },
    );
  }
};

const validateMigrationAudit = async (db: any, issues: MigrationIssue[]) => {
  const orphanBackups = await aggregateSafe(db, "migrationbackups", [
    { $match: { migrationKey: MIGRATION_KEY } },
    {
      $lookup: {
        from: "migrationruns",
        localField: "migrationRun",
        foreignField: "_id",
        as: "run",
      },
    },
    { $match: { run: { $size: 0 } } },
    { $count: "count" },
  ]);

  const count = Number(orphanBackups?.[0]?.count || 0);
  if (count > 0) {
    issue(
      issues,
      "BLOCKER",
      "Backups de migración sin MigrationRun asociado.",
      "migrationbackups",
      { count },
    );
  }
};

const buildMarkdown = (issues: MigrationIssue[]) => {
  const rows = issues.map((item) => [
    item.priority,
    item.collection || "-",
    item.message,
    item.details?.count ?? "",
  ]);

  return [
    `# Validación ${ALLOWED_DATABASE_NAME}`,
    "",
    `- Migración: \`${MIGRATION_KEY}\``,
    `- Generado: ${new Date().toISOString()}`,
    `- BLOCKER: ${summarizeIssues(issues).blockers}`,
    `- WARNING: ${summarizeIssues(issues).warnings}`,
    `- INFO: ${summarizeIssues(issues).info}`,
    "",
    "## Hallazgos",
    "",
    rows.length
      ? mdTable(["Prioridad", "Colección", "Mensaje", "Conteo"], rows)
      : "No se detectaron hallazgos.",
    "",
  ].join("\n");
};

const main = async () => {
  const { client, db } = await connectMongoClientToAllowedDb();

  try {
    const issues: MigrationIssue[] = [];

    await validateUserDefaults(db, issues);
    await validatePayrollCompatibility(db, issues);
    await validateVacationBalances(db, issues);
    await validateLoanReservations(db, issues);
    await validateMigrationAudit(db, issues);

    const report = {
      migrationKey: MIGRATION_KEY,
      databaseName: db.databaseName,
      generatedAt: new Date().toISOString(),
      issues,
      summary: summarizeIssues(issues),
    };
    const stamp = timestampForFile();
    const files = writeReportFiles(
      report,
      `bts-payroll-prod-copy-validation-${stamp}`,
      buildMarkdown(issues),
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          database: db.databaseName,
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
