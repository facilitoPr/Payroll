import { Types } from "mongoose";

const isValidId = (v: any) => Types.ObjectId.isValid(String(v));

const toId = (v: any) => {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return isValidId(v) ? v : null;
  if (typeof v === "object" && v?._id) {
    const id = String(v._id);
    return isValidId(id) ? id : null;
  }
  // por si viene ObjectId directo
  const s = String(v);
  return isValidId(s) ? s : null;
};

const pickSnapshot = (doc: any, fields: string[]) => {
  const out: any = {};
  for (const f of fields) out[f] = doc?.[f];
  return out;
};

/**
 * Convierte cambios en refs:
 * - de: "66..." => { _id:"66...", name:"RRHH", code:"TRIPLE_S" }
 * - para que el audit "se presente con name"
 */
export async function hydrateRefChanges(changes: any[], cfg: any) {
  const refPaths = cfg?.refPaths || {};
  if (!changes?.length || !refPaths || typeof refPaths !== "object")
    return changes;

  // 1) recolectar ids por path
  const idsByPath = new Map<string, Set<string>>();

  for (const c of changes) {
    const conf = refPaths[c.path];
    if (!conf) continue;

    const a = toId(c.from);
    const b = toId(c.to);

    if (a) {
      if (!idsByPath.has(c.path)) idsByPath.set(c.path, new Set());
      idsByPath.get(c.path)!.add(a);
    }
    if (b) {
      if (!idsByPath.has(c.path)) idsByPath.set(c.path, new Set());
      idsByPath.get(c.path)!.add(b);
    }
  }

  if (!idsByPath.size) return changes;

  // 2) cargar docs y armar maps por path
  const mapByPath = new Map<string, Map<string, any>>();

  for (const [path, idsSet] of idsByPath.entries()) {
    const conf = refPaths[path];
    const ids = Array.from(idsSet);

    const docs = await conf.model
      .find({ _id: { $in: ids.map((x: any) => new Types.ObjectId(x)) } })
      .select(conf.select || "name")
      .lean();

    const m = new Map<string, any>();
    for (const d of docs) {
      const id = String(d._id);
      const label = conf.buildLabel ? conf.buildLabel(d) : d?.name || "";
      const snapFields = Array.isArray(conf.snapshotFields)
        ? conf.snapshotFields
        : ["name"];
      m.set(id, {
        _id: id,
        name: label || d?.name || id,
        ...pickSnapshot(d, snapFields),
      });
    }
    mapByPath.set(path, m);
  }

  // 3) reescribir cambios
  for (const c of changes) {
    const conf = refPaths[c.path];
    if (!conf) continue;

    const m = mapByPath.get(c.path);
    if (!m) continue;

    const fromId = toId(c.from);
    const toIdVal = toId(c.to);

    if (fromId) c.from = m.get(fromId) || { _id: fromId, name: fromId };
    if (toIdVal) c.to = m.get(toIdVal) || { _id: toIdVal, name: toIdVal };
  }

  return changes;
}
