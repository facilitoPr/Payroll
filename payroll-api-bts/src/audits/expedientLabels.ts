type AnyObj = Record<string, any>;

const CLASS_FIELD_LABEL: Record<string, string> = {
  received: "Recibido",
  date: "Fecha",
  status: "Estatus",
  note: "Nota",
  label: "Nombre",
  isCustom: "Custom",
};

export function cleanSectionTitle(raw: any) {
  const t = String(raw || "").trim();
  if (!t) return "";

  // Quita: "1. ", "10. ", "2 - ", "3) ", "4: ", etc.
  // Ej: "10. Separación de la Empresa" -> "Separación de la Empresa"
  return t.replace(/^\s*\d+\s*[\.\-:)\]]\s*/g, "").trim();
}

export function getSectionTitlesFromSnapshot(
  templateSnapshot: AnyObj | undefined,
  sectionKey: string,
) {
  const secs = templateSnapshot?.sections || [];
  const sec = secs.find((s: any) => String(s?.key) === String(sectionKey));
  const raw = sec?.title ? String(sec.title) : "";
  const clean = cleanSectionTitle(raw) || String(sectionKey);
  return { raw, clean };
}

export function patchExpedientChangeLabels(opts: {
  changes: AnyObj[];
  templateSnapshot?: AnyObj;
  classification?: AnyObj;
}) {
  const { changes, templateSnapshot, classification } = opts;

  const secTitleByKey = new Map<string, string>();
  const itemLabelByKey = new Map<string, Map<string, string>>();

  const secs = templateSnapshot?.sections || [];
  for (const s of secs) {
    if (!s?.key) continue;

    const secKey = String(s.key);
    const cleanTitle = cleanSectionTitle(s.title) || secKey;
    secTitleByKey.set(secKey, cleanTitle);

    const map = new Map<string, string>();
    for (const it of s.items || []) {
      if (!it?.key) continue;
      map.set(String(it.key), String(it.label || it.key));
    }
    itemLabelByKey.set(secKey, map);
  }

  for (const c of changes) {
    if (c?.label) continue;
    const path = String(c?.path || "");

    // classification.sections.<secKey>.<itemKey>.<field>
    const m = path.match(
      /^classification\.sections\.([^\.]+)\.([^\.]+)(?:\.([^\.]+))?/,
    );
    if (!m) continue;

    const secKey = m[1];
    const itemKey = m[2];
    const field = m[3] || "";

    const secTitle = secTitleByKey.get(secKey) || secKey;

    // 1) label desde snapshot
    const itemLabelFromSnap = itemLabelByKey.get(secKey)?.get(itemKey);

    // 2) label desde classification (custom)
    const node = classification?.sections?.[secKey]?.[itemKey];
    const itemLabelFromNode = node?.label ? String(node.label) : undefined;

    const itemLabel = itemLabelFromSnap || itemLabelFromNode || itemKey;
    const fieldLabel = field ? CLASS_FIELD_LABEL[field] || field : "";

    c.label = fieldLabel
      ? `${secTitle} · ${itemLabel} · ${fieldLabel}`
      : `${secTitle} · ${itemLabel}`;
  }

  return changes;
}