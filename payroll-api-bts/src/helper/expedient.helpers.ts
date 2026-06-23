import Expedient, { IExpedient } from "../model/expedient/expedient";
import ExpedientAttachment from "../model/expedient/expedientAttachment";

/**
 * Valida que sectionKey/itemKey existan dentro del snapshot del expediente.
 */
export function validateSectionItemKeys(
  expedient: IExpedient,
  sectionKey: string,
  itemKey: string
) {
  const sections = expedient?.templateSnapshot?.sections || [];
  const sec = sections.find((s) => s.key === sectionKey);
  if (!sec) return { ok: false, error: "sectionKey no existe en el template" };

  const item = (sec.items || []).find((i: any) => i.key === itemKey);
  if (!item) return { ok: false, error: "itemKey no existe en el template" };

  return { ok: true, item };
}

/**
 * Recalcula progreso requerido (requiredTotal / requiredCompleted).
 * Regla: un item requerido se considera completo si tiene >=1 attachment activo no eliminado.
 */
export async function recomputeExpedientProgress(expedientId: string) {
  // 1) cargar expediente
  const exp = await Expedient.findById(expedientId).lean();
  if (!exp || exp.isDeleted) return null;

  // 2) lista de required items en snapshot
  const sections = exp.templateSnapshot?.sections || [];
  const requiredPairs: Array<{ sectionKey: string; itemKey: string }> = [];

  for (const s of sections) {
    for (const it of s.items || []) {
      if (it.required)
        requiredPairs.push({ sectionKey: s.key, itemKey: it.key });
    }
  }

  const requiredTotal = requiredPairs.length;

  // 3) contar cuántos tienen al menos 1 attachment activo
  let requiredCompleted = 0;

  if (requiredTotal > 0) {
    // consulta eficiente: trae todos los attachments activos del expediente y arma set
    const atts = await ExpedientAttachment.find({
      expedient: exp._id,
      isDeleted: false,
      isActive: true,
    })
      .select("sectionKey itemKey")
      .lean();

    const set = new Set(atts.map((a) => `${a.sectionKey}::${a.itemKey}`));
    for (const p of requiredPairs) {
      if (set.has(`${p.sectionKey}::${p.itemKey}`)) requiredCompleted++;
    }
  }

  // 4) persistir en expediente
  const updated = await Expedient.findByIdAndUpdate(
    exp._id,
    { requiredTotal, requiredCompleted },
    { new: true }
  ).lean();

  return updated;
}
