import { Types } from "mongoose";
import AiAgent, { IAiAgent } from "../model/aiAgent";
import RecruitmentApplication from "../model/recruitment/recruitmentApplication";
import { openaiClient } from "../config/openai";
import {
  DEFAULT_INTERVIEW_ANALYST_CONFIG,
  IInterviewAnalystAgentConfig,
  isInterviewAnalystConfig,
} from "../types/aiAgent/interviewAnalyst";

/** Helpers */
function pickTextFromOpenAIResponse(response: any): string {
  return (
    response?.output_text ?? response?.output?.[0]?.content?.[0]?.text ?? ""
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function asString(x: any, fallback = "") {
  return typeof x === "string" ? x : fallback;
}

function safeArray<T = any>(x: any): T[] {
  return Array.isArray(x) ? x : [];
}

/** Extrae el primer JSON object aunque venga con texto/códigos */
function extractFirstJsonObject(text: string) {
  const s = String(text || "").trim();
  const i = s.indexOf("{");
  const j = s.lastIndexOf("}");
  if (i === -1 || j === -1 || j <= i) return null;
  const slice = s.slice(i, j + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

/**
 * Construye prompts usando:
 * - CONFIG SIMPLE del agente (idioma, strictMode, scoring, options)
 * - ENTREVISTA desde RecruitmentApplication.interview.evaluation (plantillas + answers)
 * - Contexto adicional: interview.notes / interview.transcript
 */
function buildInterviewPrompts(
  cfg: IInterviewAnalystAgentConfig,
  payload: {
    template: {
      professionalCompetencies: any[];
      softSkills: any[];
      generalCriteria: any[];
    };
    evidence: {
      position: string;
      candidateName: string;
      date: string;
      interviewer: string | null;
      keyQuestions: Array<{ key: string; label: string; answer: string }>;
      notes: string;
      transcript: string;
    };
  }
) {
  const min = cfg.scoring.min;
  const max = cfg.scoring.max;

  const systemPrompt = `
Eres un analista de entrevistas ESTRICTO y DETERMINISTA.

REGLAS CRÍTICAS:
- SOLO puedes usar evidencia del input (keyQuestions.answer, notes, transcript).
- NO inventes nada. Si no hay evidencia suficiente, asigna score bajo y explica en comments.
- La salida debe ser 100% consistente: mismo input => misma salida.
- No agregues ítems nuevos ni cambies keys/labels.

PUNTAJES:
- Score entre ${min} y ${max} (inclusive).
- Los ítems a evaluar vienen en TEMPLATE.

FORMATO:
- Responde SOLO JSON válido, sin texto extra.
${cfg.systemNotes ? `\nNOTAS EXTRA:\n${cfg.systemNotes}\n` : ""}
`.trim();

  const userPrompt = `
TEMPLATE (DEBES USAR EXACTAMENTE estos keys y labels; completa score):
${JSON.stringify(payload.template, null, 2)}

EVIDENCIA (ÚNICA FUENTE):
${JSON.stringify(payload.evidence, null, 2)}

Devuelve un JSON con esta estructura:
{
  "position": string,
  "candidateName": string,
  "date": "YYYY-MM-DD",
  "interviewer": string|null,

  "professionalCompetencies": [{"key":string,"label":string,"description":string,"score":number}],
  "softSkills": [{"key":string,"label":string,"description":string,"score":number}],
  "generalCriteria": [{"key":string,"label":string,"description":string,"score":number}],

  "keyQuestions": [{"key":string,"label":string,"answer":string}],

  "comments": string,
  "recommendation": "${cfg.recommendationOptions.join("|")}"
}

REGLAS:
- keyQuestions debe ser una copia fiel (mismos answers, sin reescribirlos).
- No cambies keys/labels del TEMPLATE.
- recommendation debe ser uno de: ${cfg.recommendationOptions.join(", ")}.
- Si requireComments=true, comments no puede estar vacío.
`.trim();

  return { systemPrompt, userPrompt };
}

/**
 * ✅ Evalúa interview basado en RecruitmentApplication.interview.evaluation
 * ✅ Guarda en interview.aiEvaluation (NO pisa interview.evaluation manual)
 */
export async function analyzeInterviewFromApplicationWithAi(params: {
  applicationId: string;
  agentCode?: string;
  evaluationDraft?: any;
  applyDraft?: boolean; 
}) {
  const { applicationId, agentCode = "INTERVIEW_ANALYST_DEFAULT" } = params;

  if (!Types.ObjectId.isValid(applicationId)) {
    throw new Error("applicationId inválido.");
  }

  // 1) Agente
  const agent = (await AiAgent.findOne({
    code: agentCode,
    isActive: true,
    isDeleted: false,
    type: "interviewAnalyst",
  }).lean()) as IAiAgent | null;

  console.log(agent)

  if (!agent)
    throw new Error("Agente interviewAnalyst no encontrado o inactivo.");

  const cfg = isInterviewAnalystConfig(agent.config)
    ? (agent.config as IInterviewAnalystAgentConfig)
    : DEFAULT_INTERVIEW_ANALYST_CONFIG;

  if (agent.provider !== "openai") {
    throw new Error(`Proveedor LLM no soportado: ${agent.provider}`);
  }

  // 2) Application + Interview
  const app = await RecruitmentApplication.findOne({
    _id: new Types.ObjectId(applicationId),
    isDeleted: false,
  })
    // agrega answers/form si lo usas como fallback
    .select("interview candidateName answers form jobPosition isDeleted")
    .lean();

  if (!app) throw new Error("RecruitmentApplication no encontrada.");

  const interview = (app as any).interview;
  if (!interview) throw new Error("Esta aplicación no tiene interview.");

  const evaluation = interview?.evaluation; // <- AQUÍ está el payload real
  if (!evaluation) {
    throw new Error(
      "La entrevista no tiene interview.evaluation (no hay preguntas guardadas)."
    );
  }

  // 3) Evidencia: keyQuestions (de evaluation) + notes/transcript (de interview)
  const keyQuestions = safeArray(evaluation?.keyQuestions).map((q: any) => ({
    key: asString(q?.key),
    label: asString(q?.label),
    answer: asString(q?.answer),
  }));

  const hasAnswers = keyQuestions.some((q) => String(q.answer || "").trim());

  const notes = asString(interview?.notes, "").trim();
  const transcript = asString(interview?.transcript, "").trim();

  if (!hasAnswers && !notes && !transcript) {
    throw new Error(
      "La entrevista no tiene evidencia (answers/notes/transcript)."
    );
  }

  // 4) TEMPLATE: tomar la plantilla desde evaluation (sin usar config del agente)
  const template = {
    professionalCompetencies: safeArray(
      evaluation?.professionalCompetencies
    ).map((x: any) => ({
      key: asString(x?.key),
      label: asString(x?.label),
      description: asString(x?.description, ""),
    })),
    softSkills: safeArray(evaluation?.softSkills).map((x: any) => ({
      key: asString(x?.key),
      label: asString(x?.label),
      description: asString(x?.description, ""),
    })),
    generalCriteria: safeArray(evaluation?.generalCriteria).map((x: any) => ({
      key: asString(x?.key),
      label: asString(x?.label),
      description: asString(x?.description, ""),
    })),
  };

  // Validación mínima del template (evita “llenar nada”)
  if (
    !template.professionalCompetencies.length ||
    !template.softSkills.length ||
    !template.generalCriteria.length
  ) {
    throw new Error(
      "La evaluación no tiene plantilla (professionalCompetencies/softSkills/generalCriteria)."
    );
  }

  const position =
    asString(evaluation?.jobPosition) ||
    asString((app as any)?.jobPosition?.name) ||
    asString((app as any)?.form?.jobPosition?.name) ||
    asString(evaluation?.position) ||
    "";

  const candidateName =
    asString(evaluation?.candidateName) ||
    asString((app as any)?.candidateName) ||
    asString((app as any)?.answers?.fullName) ||
    "";

  const date = asString(
    evaluation?.date,
    new Date().toISOString().slice(0, 10)
  );

  const evidencePayload = {
    position,
    candidateName,
    date,
    interviewer: interview?.interviewer ? String(interview.interviewer) : null,
    keyQuestions,
    notes,
    transcript,
  };

  // 5) Prompts
  const { systemPrompt, userPrompt } = buildInterviewPrompts(cfg, {
    template,
    evidence: evidencePayload,
  });

  // 6) OpenAI
  const response = await openaiClient.responses.create({
    model: agent.model || "gpt-4.1-mini",
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: agent.temperature ?? 0,
    max_output_tokens: agent.maxTokens ?? 1200,
  });

  const outputText = pickTextFromOpenAIResponse(response);
  if (!outputText)
    throw new Error("El modelo no devolvió texto en la respuesta.");

  const parsed = extractFirstJsonObject(outputText);
  if (!parsed) {
    console.error("AI raw output:", outputText);
    throw new Error("La respuesta del modelo no es JSON válido.");
  }

  // 7) Normalizar salida usando la PLANTILLA del evaluation
  const min = cfg.scoring.min;
  const max = cfg.scoring.max;

  const mapItems = (itemsFromAi: any[], templateItems: any[]) => {
    return (templateItems || []).map((tpl: any) => {
      const found = (itemsFromAi || []).find((x) => x?.key === tpl.key) || {};
      const scoreNum = clamp(Number(found.score ?? min), min, max);

      return {
        key: tpl.key,
        label: tpl.label,
        description: tpl.description || "",
        score: scoreNum,
      };
    });
  };

  const aiEvaluation = {
    position,
    candidateName,
    date,
    interviewer: evidencePayload.interviewer,

    professionalCompetencies: mapItems(
      safeArray(parsed.professionalCompetencies),
      template.professionalCompetencies
    ),
    softSkills: mapItems(safeArray(parsed.softSkills), template.softSkills),
    generalCriteria: mapItems(
      safeArray(parsed.generalCriteria),
      template.generalCriteria
    ),

    keyQuestions, // siempre copia fiel del input

    comments: asString(parsed.comments, ""),
    recommendation: cfg.recommendationOptions.includes(parsed.recommendation)
      ? parsed.recommendation
      : "POOL",
  };

  if (cfg.requireComments && !String(aiEvaluation.comments).trim()) {
    aiEvaluation.comments =
      "Falta evidencia suficiente en respuestas/notas/transcript para justificar una conclusión detallada.";
  }

  // 8) Guardar en interview.aiEvaluation (NO pisa manual)
  const update: any = {
    $set: {
      // "interview.aiEvaluation": aiEvaluation,
      "interview.evaluation": aiEvaluation,
      // "interview.aiMeta": {
      //   aiAgent: agent._id,
      //   agentCode: agent.code,
      //   modelName: agent.model,
      //   evaluatedAt: new Date(),
      // },
      "interview.aiUpdatedAt": new Date(),
    },
  };

  const updated = await RecruitmentApplication.findOneAndUpdate(
    { _id: new Types.ObjectId(applicationId), isDeleted: false },
    update,
    { new: true }
  ).lean();

  return {
    application: updated,
    aiEvaluation,
    rawResponse: parsed,
  };
}
