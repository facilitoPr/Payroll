import { AuditEntityConfig } from "../audits/audit.config";

export const isPlainObject = (v: any) =>
  v !== null &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  !(v instanceof Date);

export const parseMaybeJsonObject = (raw: any) => {
  if (raw === null || raw === undefined) return null;

  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return null;
    try {
      const parsed = JSON.parse(s);
      return parsed;
    } catch {
      return "__INVALID_JSON__";
    }
  }

  return raw;
};

export const parseAuditTags = (auditTags: any) => {
  if (typeof auditTags === "string" && auditTags.trim()) {
    return auditTags
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  if (Array.isArray(auditTags)) return auditTags.filter(Boolean);
  return [];
};


const isObjectIdLike = (v: any) =>
  v &&
  typeof v === "object" &&
  (v._bsontype === "ObjectID" || v.constructor?.name === "ObjectId");

const normalize = (v: any) => {
  if (v === undefined || v === null) return null;
  if (isObjectIdLike(v)) return String(v);
  if (v instanceof Date) return v.toISOString();

  // ✅ importante: si viene populated, compara por _id
  //   if (isPlainObject(v) && v._id) {
  //     const id = (v as any)._id;
  //     if (isObjectIdLike(id)) return String(id);
  //   }
  return v;
};

export const stableStringify = (obj: any) => {
  const seen = new WeakSet();
  return JSON.stringify(obj, function (_key, value) {
    const val = normalize(value);
    if (val && typeof val === "object") {
      if (seen.has(val)) return undefined;
      seen.add(val);
      const sorted: any = {};
      Object.keys(val)
        .sort()
        .forEach((k) => (sorted[k] = (val as any)[k]));
      return sorted;
    }
    return val;
  });
};

export const valuesEqual = (a: any, b: any) =>
  stableStringify(a) === stableStringify(b);

export const shouldIgnorePath = (path: string, cfg: AuditEntityConfig) => {
  const top = path.split(".")[0];
  return cfg.ignorePaths.has(path) || cfg.ignorePaths.has(top);
};

export const isSensitivePath = (path: string, cfg: AuditEntityConfig) =>
  cfg.sensitivePrefixes.some((p) => path === p || path.startsWith(p + "."));

export const labelByPath = (path: string, cfg: AuditEntityConfig) =>
  cfg.labelByPath[path] || "";

export function diffObjects(
  before: any,
  after: any,
  cfg: AuditEntityConfig,
  basePath = "",
): any[] {
  const changes: any[] = [];

  const b = normalize(before);
  const a = normalize(after);

  if (isPlainObject(b) && isPlainObject(a)) {
    const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
    for (const k of keys) {
      const path = basePath ? `${basePath}.${k}` : k;
      if (shouldIgnorePath(path, cfg)) continue;

      const bv = (b as any)[k];
      const av = (a as any)[k];

      if (isPlainObject(bv) && isPlainObject(av)) {
        changes.push(...diffObjects(bv, av, cfg, path));
        continue;
      }

      if (Array.isArray(bv) || Array.isArray(av)) {
        if (!valuesEqual(bv, av)) {
          const masked = isSensitivePath(path, cfg);
          changes.push({
            path,
            from: masked ? undefined : bv,
            to: masked ? undefined : av,
            masked,
            label: labelByPath(path, cfg),
          });
        }
        continue;
      }

      if (!valuesEqual(bv, av)) {
        const masked = isSensitivePath(path, cfg);
        changes.push({
          path,
          from: masked ? undefined : bv,
          to: masked ? undefined : av,
          masked,
          label: labelByPath(path, cfg),
        });
      }
    }
    return changes;
  }

  if (!valuesEqual(b, a)) {
    const path = basePath || "(root)";
    if (!shouldIgnorePath(path, cfg)) {
      const masked = isSensitivePath(path, cfg);
      changes.push({
        path,
        from: masked ? undefined : b,
        to: masked ? undefined : a,
        masked,
        label: labelByPath(path, cfg),
      });
    }
  }

  return changes;
}

const formatSummaryValue = (from: any, to: any, masked: boolean) => {
  const fmt = (x: any) => {
    if (x === null || x === undefined) return "—";
    if (typeof x === "object") {
      // ✅ si viene { _id, name } mostrar name
      if (x?.name) return String(x.name);
      return "[obj]";
    }
    return String(x);
  };

  return `${fmt(masked ? "****" : from)} → ${fmt(masked ? "****" : to)}`;
};


export function buildTitleTagsSummary(changes: any[], cfg: AuditEntityConfig) {
  const paths = changes.map((c) => c.path);

  // ✅ reglas por entidad
  for (const rule of cfg.titleRules || []) {
    if (rule.when(paths)) {
      const summary = changes.slice(0, 3).map((c) => ({
        label: c.label || c.path,
        value: formatSummaryValue(c.from, c.to, !!c.masked),
      }));
      return { title: rule.title, tags: rule.tags, summary };
    }
  }

  // fallback
  const summary = changes.slice(0, 3).map((c) => ({
    label: c.label || c.path,
    value: formatSummaryValue(c.from, c.to, !!c.masked),
  }));
  return { title: "Actualizó registro", tags: ["audit"], summary };
}
