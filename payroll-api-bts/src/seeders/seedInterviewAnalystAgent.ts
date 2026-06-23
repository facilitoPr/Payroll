import AiAgent from "../model/aiAgent";
import { DEFAULT_INTERVIEW_ANALYST_CONFIG } from "../types/aiAgent/interviewAnalyst";

export async function seedInterviewAnalystAgent() {
  const code = "INTERVIEW_ANALYST_DEFAULT"

  // Crea si no existe. Si existe, NO pisa config (para no romper cambios manuales).
  const existing = await AiAgent.findOne({ code, isDeleted: false });

  if (existing) {
    console.log(
      "[seedDefaultInterviewAgent] Agente IA de entrevista ya existe."
    );
    return existing;
  }

  if (!existing) {
    await AiAgent.create({
      name: "Entrevistas - Analista (Default)",
      code,
      type: "interviewAnalyst",
      description:
        "Analiza entrevistas en base a respuestas, notas y transcript. Devuelve evaluación 0..5 y recomendación.",
      provider: "openai",
      model: "gpt-4.1-mini",
      temperature: 0, // determinismo
      maxTokens: 1200,
      config: DEFAULT_INTERVIEW_ANALYST_CONFIG,
      isActive: true,
      isDeleted: false,
    });

    return { created: true, code };
  }

  // Mantén config existente, pero asegura que esté activo
  existing.isActive = true;
  existing.type = "interviewAnalyst";
  if (!existing.provider) existing.provider = "openai";
  if (!existing.model) existing.model = "gpt-4.1-mini";
  if (typeof existing.temperature !== "number") existing.temperature = 0;
  if (typeof existing.maxTokens !== "number") existing.maxTokens = 1200;

  await existing.save();

  return { created: false, code };
}
