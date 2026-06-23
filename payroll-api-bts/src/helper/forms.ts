const optionKey = (o: any): string | null => {
  if (!o) return null;
  if (
    o.value !== undefined &&
    o.value !== null &&
    String(o.value).trim() !== ""
  ) {
    return String(o.value);
  }
  if (o._id) return String(o._id);
  if (o.label) return `label:${o.label}`;
  return null;
};

const selectedKey = (sel: any): string | null => {
  if (sel === undefined || sel === null) return null;
  if (typeof sel === "string" || typeof sel === "number") {
    const s = String(sel).trim();
    return s ? s : null;
  }
  if (
    sel.value !== undefined &&
    sel.value !== null &&
    String(sel.value).trim() !== ""
  ) {
    return String(sel.value);
  }
  if (sel._id) return String(sel._id);
  if (sel.label) return `label:${sel.label}`;
  return null;
};

// Normaliza el "value" a un valor NO nulo según el tipo de campo
const normalizeValueForSchema = (typeCode: string, raw: any) => {
if (typeCode === "CHECKBOX") {
  if (Array.isArray(raw)) return raw; // array de objetos o strings
  if (raw == null) return []; // sin selección
  return [raw];
}
if (typeCode === "RADIO") {
  // radio suele ser string o {label,value}
  return typeof raw === "object" && raw !== null
    ? raw.value ?? raw.label ?? ""
    : raw ?? "";
}
if (typeCode === "HTML") {
  // suele ser un checkbox de aceptación => array o boolean/string
  if (Array.isArray(raw)) return raw;
  if (raw === true) return ["accepted"];
  if (raw === false || raw == null) return [];
  return [raw];
}
// TEXT, NUMBER, DATE, TEXTAREA, DROPDOWN…
return raw ?? "";
};

const getLabel = (sel: any, formOptions: any[] = []): string => {
  // Si ya trae label
  if (sel && typeof sel === "object" && sel.label) return String(sel.label);
  // Si es string simple, podría ser ya el label
  if (typeof sel === "string") {
    // intenta matchear por value/_id/label
    const m = formOptions.find(
      (o) =>
        String(o.value) === sel ||
        String(o._id) === sel ||
        String(o.label) === sel
    );
    return m?.label ?? sel;
  }
  // Si viene como objeto sin label, intenta con value/_id
  const skey = selectedKey(sel);
  const m = formOptions.find((o) => optionKey(o) === skey);
  return m?.label ?? skey;
};


const makeIdFromLabel = (label: string): string => {
  return label
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

export {
  optionKey,
  selectedKey,
  normalizeValueForSchema,
  getLabel,
  makeIdFromLabel,
};
