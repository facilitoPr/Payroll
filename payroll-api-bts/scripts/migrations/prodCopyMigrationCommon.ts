import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose, { Types } from "mongoose";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const { MongoClient, ObjectId } = require("mongodb");

export const ALLOWED_DATABASE_NAME = "bts-payroll-prod-copy";
export const MIGRATION_KEY =
  "BTS_PAYROLL_PROD_COPY_TO_CURRENT_VERSION_V1";

export type IssuePriority = "BLOCKER" | "WARNING" | "INFO";

export interface MigrationIssue {
  priority: IssuePriority;
  collection?: string;
  documentId?: string;
  message: string;
  details?: Record<string, any>;
}

export interface CollectionAnalysis {
  name: string;
  count: number;
  fields: Array<{ path: string; count: number; percent: number }>;
  modelMatch: "CURRENT_MODEL" | "LIKELY_CURRENT_MODEL" | "UNKNOWN_OR_LEGACY";
  indexes?: any[];
}

export interface AnalysisReport {
  migrationKey: string;
  databaseName: string;
  generatedAt: string;
  collectionCount: number;
  collections: CollectionAnalysis[];
  expectedCurrentCollections: string[];
  missingCurrentCollections: string[];
  unknownOrLegacyCollections: string[];
  issues: MigrationIssue[];
  summary: {
    blockers: number;
    warnings: number;
    info: number;
  };
}

export const parseArgs = () => {
  const args: Record<string, string | boolean> = {};

  for (const raw of process.argv.slice(2)) {
    if (!raw.startsWith("--")) continue;

    const withoutPrefix = raw.slice(2);
    const eqIndex = withoutPrefix.indexOf("=");

    if (eqIndex === -1) {
      args[withoutPrefix] = true;
      continue;
    }

    args[withoutPrefix.slice(0, eqIndex)] = withoutPrefix.slice(eqIndex + 1);
  }

  return args;
};

export const assertConfirmedDatabaseArg = () => {
  const args = parseArgs();
  const confirmed = String(args["confirm-database"] || "");

  if (confirmed !== ALLOWED_DATABASE_NAME) {
    throw new Error(
      `Missing --confirm-database=${ALLOWED_DATABASE_NAME}. Received "${confirmed || "(empty)"}".`,
    );
  }
};

export const assertExecuteAllowed = () => {
  assertConfirmedDatabaseArg();

  if (process.env.ALLOW_PROD_COPY_MIGRATION !== "true") {
    throw new Error(
      "Execution blocked. Set ALLOW_PROD_COPY_MIGRATION=true to allow writes.",
    );
  }
};

export const forceAllowedDatabaseInUri = (uri: string) => {
  if (!uri) throw new Error("DB_CNN is not configured.");

  const parsed = new URL(uri);
  parsed.pathname = `/${ALLOWED_DATABASE_NAME}`;
  return parsed.toString();
};

export const getSafeMongoUri = () => {
  return forceAllowedDatabaseInUri(process.env.DB_CNN || "");
};

export const connectMongooseToAllowedDb = async () => {
  await mongoose.set("strictQuery", false);
  await mongoose.connect(getSafeMongoUri());

  if (mongoose.connection.name !== ALLOWED_DATABASE_NAME) {
    throw new Error(
      `Migration blocked. Expected database "${ALLOWED_DATABASE_NAME}" but connected to "${mongoose.connection.name}".`,
    );
  }

  return mongoose.connection;
};

export const connectMongoClientToAllowedDb = async () => {
  const client = new MongoClient(getSafeMongoUri(), {
    readPreference: "secondaryPreferred",
    serverSelectionTimeoutMS: 20000,
  });

  await client.connect();

  const db = client.db(ALLOWED_DATABASE_NAME);

  if (db.databaseName !== ALLOWED_DATABASE_NAME) {
    throw new Error(
      `Migration blocked. Expected database "${ALLOWED_DATABASE_NAME}" but connected to "${db.databaseName}".`,
    );
  }

  return { client, db };
};

export const closeMongoose = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

const toCollectionName = (modelName: string) => {
  const lower = modelName.toLowerCase();

  if (lower.endsWith("s")) return lower;
  if (lower.endsWith("y")) return `${lower.slice(0, -1)}ies`;
  return `${lower}s`;
};

export const getExpectedCurrentCollections = () => {
  const modelRoot = path.resolve(process.cwd(), "src/model");
  const files: string[] = [];

  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      if (entry.isFile() && entry.name.endsWith(".ts")) files.push(full);
    }
  };

  walk(modelRoot);

  const names = new Set<string>();

  for (const file of files) {
    const src = fs.readFileSync(file, "utf8");
    const regex = /model(?:<[^>]+>)?\(\s*["'`]([^"'`]+)["'`]/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(src))) {
      names.add(toCollectionName(match[1]));
    }
  }

  [
    "users",
    "worksummaries",
    "punchhistories",
    "payrollruns",
    "payrollpayments",
    "employeevacationbalances",
    "vacationbalancemovements",
    "vacationdayreservations",
    "employeeloanrequests",
    "employeeloanproductconfigs",
    "employeeterminations",
    "terminationpayments",
    "terminationloanpayrollpendingpayments",
    "payrollbankfiles",
    "permissionrequests",
    "permissionrequesthistories",
    "permissiontypes",
    "migrationruns",
    "migrationbackups",
  ].forEach((x) => names.add(x.toLowerCase()));

  return Array.from(names).sort();
};

export const issue = (
  issues: MigrationIssue[],
  priority: IssuePriority,
  message: string,
  collection?: string,
  details?: Record<string, any>,
  documentId?: string,
) => {
  issues.push({ priority, message, collection, details, documentId });
};

const flattenDoc = (
  doc: any,
  prefix = "",
  out: Record<string, number> = {},
) => {
  if (!doc || typeof doc !== "object") return out;

  for (const [key, value] of Object.entries(doc)) {
    const next = prefix ? `${prefix}.${key}` : key;
    out[next] = (out[next] || 0) + 1;

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      !(value instanceof ObjectId) &&
      !(value instanceof Types.ObjectId)
    ) {
      flattenDoc(value, next, out);
    }
  }

  return out;
};

export const analyzeCollectionFields = async (
  db: any,
  collectionName: string,
  sampleLimit: number,
) => {
  const docs = await db
    .collection(collectionName)
    .find({})
    .limit(sampleLimit)
    .toArray();
  const counts: Record<string, number> = {};

  docs.forEach((doc: any) => flattenDoc(doc, "", counts));

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 80)
    .map(([pathName, count]) => ({
      path: pathName,
      count,
      percent: docs.length ? Number(((count / docs.length) * 100).toFixed(2)) : 0,
    }));
};

export const listCollectionsAnalysis = async (
  db: any,
  options: { sampleLimit?: number } = {},
) => {
  const sampleLimit = Math.max(1, Math.min(2000, options.sampleLimit || 300));
  const expected = getExpectedCurrentCollections();
  const expectedSet = new Set(expected.map((x) => x.toLowerCase()));
  const cols = await db.listCollections({}, { nameOnly: true }).toArray();
  const out: CollectionAnalysis[] = [];

  for (const col of cols.sort((a: any, b: any) => a.name.localeCompare(b.name))) {
    const name = col.name;
    const lower = name.toLowerCase();
    const count = await db.collection(name).estimatedDocumentCount();
    const fields = await analyzeCollectionFields(db, name, sampleLimit);
    let modelMatch: CollectionAnalysis["modelMatch"] = "UNKNOWN_OR_LEGACY";

    if (expectedSet.has(lower)) {
      modelMatch = "CURRENT_MODEL";
    } else if (expected.some((x) => lower.includes(x) || x.includes(lower))) {
      modelMatch = "LIKELY_CURRENT_MODEL";
    }

    let indexes: any[] = [];
    try {
      indexes = await db.collection(name).indexes();
    } catch (_) {
      indexes = [];
    }

    out.push({ name, count, fields, modelMatch, indexes });
  }

  return out;
};

export const countDocumentsSafe = async (db: any, name: string, query = {}) => {
  const exists = await db.listCollections({ name }, { nameOnly: true }).hasNext();
  if (!exists) return 0;
  return db.collection(name).countDocuments(query);
};

export const aggregateSafe = async (db: any, name: string, pipeline: any[]) => {
  const exists = await db.listCollections({ name }, { nameOnly: true }).hasNext();
  if (!exists) return [];
  return db.collection(name).aggregate(pipeline).toArray();
};

export const writeReportFiles = (
  report: any,
  baseName: string,
  markdown: string,
) => {
  const reportsDir = path.resolve(process.cwd(), "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const jsonPath = path.join(reportsDir, `${baseName}.json`);
  const mdPath = path.join(reportsDir, `${baseName}.md`);

  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(mdPath, markdown);

  return { jsonPath, mdPath };
};

export const timestampForFile = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  return [
    d.getFullYear(),
    pad(d.getMonth() + 1),
    pad(d.getDate()),
    "-",
    pad(d.getHours()),
    pad(d.getMinutes()),
    pad(d.getSeconds()),
  ].join("");
};

export const summarizeIssues = (issues: MigrationIssue[]) => ({
  blockers: issues.filter((x) => x.priority === "BLOCKER").length,
  warnings: issues.filter((x) => x.priority === "WARNING").length,
  info: issues.filter((x) => x.priority === "INFO").length,
});

export const mdTable = (headers: string[], rows: Array<Array<string | number>>) => {
  const header = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map((x) => String(x)).join(" | ")} |`);
  return [header, sep, ...body].join("\n");
};
