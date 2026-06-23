import { Types } from "mongoose";
import AiAgent, { IAiAgent } from "../model/aiAgent";
import RecruitmentApplication, {
  IRecruitmentApplication,
} from "../model/recruitment/recruitmentApplication";
import { openaiClient } from "../config/openai";
import { buildHumanProfileFromAnswers } from "../utils/recruitmentProfile";
import { IRecruitmentAgentConfig, isRecruitmentConfig } from "../types/aiAgent";
import { runDifyWorkflow } from "./ai/providers/dify.provider";

type AiRecommendation = "REJECT" | "INTERVIEW" | "POOL" | "HIRING";
type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";
type HardFilterSeverity = "BLOCKER" | "WARNING";

interface INormalizedCandidateLanguage {
  language: string;
  level?: string;
}

interface INormalizedCandidateProfile {
  fullName?: string;
  age?: number | null;
  email?: string;
  phone?: string;
  educationLevel?: string;
  yearsExperience?: number | null;
  languages: INormalizedCandidateLanguage[];
  languagesText?: string;
  hasDriverLicense?: string;
  hasVehicle?: string;
  scheduleAvailable?: string;
  timeAvailability?: string;
  fieldWorkAvailability?: string;

  salesExperience?: string;
  financialProductsExperience?: string;
  dealerOrB2BExperience?: string;
  vehicleKnowledge?: string;

  peopleManagementExperience?: string;
  teamSizeManaged?: number | null;
  branchOperationsExperience?: string;
  kpiManagementExperience?: string;
  conflictManagementExperience?: string;
  cashOrAdministrativeControlExperience?: string;
  leadershipStyle?: string;

  softwareTools?: string;
  softSkills?: string;
  techSkills?: string;
  functionsDescription?: string;
  mainAchievements?: string;
  valueToAdd?: string;
  whyWorkHere?: string;

  summaryText: string;
  rawAnswers: Record<string, any>;
}

interface IHardFilterResult {
  key: string;
  passed: boolean;
  severity: HardFilterSeverity;
  message: string;
}

interface ICriterionResult {
  key: string;
  label: string;
  weight: number;
  score: number;
  reasoning: string;
  evidence: string[];
}

interface IParsedAiCriterionResult {
  key: string;
  score: number;
  reasoning: string;
  evidence?: string[];
}

interface IParsedAiOutput {
  criteriaResults: IParsedAiCriterionResult[];
  summary: string;
  strengths: string[];
  weaknesses: string[];
  riskFlags: string[];
  missingInformation: string[];
  verificationNeeded: string[];
  confidenceLevel?: ConfidenceLevel;
  interview?: {
    recommend?: boolean;
    priority?: "ALTA" | "MEDIA" | "BAJA";
    suggestedMode?: "Presencial" | "Virtual" | "Telefónica";
    focusPoints?: string[];
    structuredQuestions?: string[];
  };
}

function safeString(value: any): string | undefined {
  if (value === null || value === undefined) return undefined;

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  const casted = String(value).trim();
  return casted || undefined;
}

function safeNumber(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeText(value?: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getAnswer(answers: Record<string, any>, key: string): any {
  return answers?.[key];
}

function getFirstString(
  answers: Record<string, any>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = safeString(getAnswer(answers, key));
    if (value) return value;
  }
  return undefined;
}

function getFirstNumber(
  answers: Record<string, any>,
  keys: string[],
): number | null {
  for (const key of keys) {
    const value = safeNumber(getAnswer(answers, key));
    if (value !== null) return value;
  }
  return null;
}

function calculateAgeFromBirthDate(birthDate?: string): number | null {
  if (!birthDate) return null;

  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();

  const monthDiff = today.getMonth() - date.getMonth();
  const dayDiff = today.getDate() - date.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age >= 0 && age <= 120 ? age : null;
}

function inferLanguageLevel(
  text: string,
  language: string,
): string | undefined {
  const normalized = normalizeText(text);
  const lang = normalizeText(language);

  if (!normalized.includes(lang)) return undefined;

  if (normalized.includes("nativo")) return "Nativo";
  if (
    normalized.includes("avanzado") ||
    normalized.includes("c1") ||
    normalized.includes("c2")
  ) {
    return "Avanzado";
  }
  if (
    normalized.includes("intermedio") ||
    normalized.includes("b1") ||
    normalized.includes("b2")
  ) {
    return "Intermedio";
  }
  if (
    normalized.includes("basico") ||
    normalized.includes("a1") ||
    normalized.includes("a2")
  ) {
    return "Básico";
  }

  if (lang === "espanol" || lang === "español") {
    return "Intermedio";
  }

  return undefined;
}

function normalizeLanguages(value: any): INormalizedCandidateLanguage[] {
  if (!value) return [];

  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];

    const commonLanguages = ["Español", "Inglés", "Francés", "Portugués"];
    return commonLanguages
      .map((language) => {
        const level = inferLanguageLevel(text, language);
        if (!level && !normalizeText(text).includes(normalizeText(language))) {
          return null;
        }

        return {
          language,
          level,
        };
      })
      .filter(Boolean) as INormalizedCandidateLanguage[];
  }

  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item) return null;

      if (typeof item === "string") {
        const language = safeString(item);
        if (!language) return null;
        return { language };
      }

      const language = safeString(item.language || item.name);
      const level = safeString(item.level);

      if (!language) return null;

      return {
        language,
        level,
      };
    })
    .filter(Boolean) as INormalizedCandidateLanguage[];
}

function normalizeCandidateProfile(
  answers: Record<string, any>,
): INormalizedCandidateProfile {
  const birthDate = safeString(answers.birthDate);

  const age =
    getFirstNumber(answers, ["age", "edad", "applicantAge"]) ??
    calculateAgeFromBirthDate(birthDate);

  const languagesRaw = answers.languages || answers.languageSkills || "";
  const languagesText = safeString(languagesRaw);
  const languages = normalizeLanguages(languagesRaw);

  return {
    fullName: getFirstString(answers, ["fullName", "name", "applicantName"]),
    age,
    email: getFirstString(answers, ["email", "emailAddress"]),
    phone: getFirstString(answers, ["mobilePhone", "phone", "alternatePhone"]),
    educationLevel: getFirstString(answers, [
      "educationLevel",
      "highestEducationLevel",
      "levelOfStudy",
    ]),
    yearsExperience: getFirstNumber(answers, [
      "yearsExperience",
      "experienceYears",
      "totalExperienceYears",
    ]),
    languages,
    languagesText,

    hasDriverLicense: safeString(answers.hasDriverLicense),
    hasVehicle: safeString(answers.hasVehicle),
    scheduleAvailable: safeString(answers.scheduleAvailable),
    timeAvailability: safeString(answers.timeAvailability),
    fieldWorkAvailability: safeString(answers.fieldWorkAvailability),

    salesExperience: safeString(answers.salesExperience),
    financialProductsExperience: safeString(
      answers.financialProductsExperience,
    ),
    dealerOrB2BExperience: safeString(answers.dealerOrB2BExperience),
    vehicleKnowledge: safeString(answers.vehicleKnowledge),

    peopleManagementExperience: safeString(answers.peopleManagementExperience),
    teamSizeManaged: safeNumber(answers.teamSizeManaged),
    branchOperationsExperience: safeString(answers.branchOperationsExperience),
    kpiManagementExperience: safeString(answers.kpiManagementExperience),
    conflictManagementExperience: safeString(
      answers.conflictManagementExperience,
    ),
    cashOrAdministrativeControlExperience: safeString(
      answers.cashOrAdministrativeControlExperience,
    ),
    leadershipStyle: safeString(answers.leadershipStyle),

    softwareTools: safeString(answers.softwareTools),
    softSkills: safeString(answers.softSkills),
    techSkills: safeString(answers.techSkills),
    functionsDescription: safeString(answers.functionsDescription),
    mainAchievements: safeString(answers.mainAchievements),
    valueToAdd: safeString(answers.valueToAdd),
    whyWorkHere: safeString(answers.whyWorkHere),

    summaryText: buildHumanProfileFromAnswers(answers || {}),
    rawAnswers: answers || {},
  };
}

function buildNormalizedAnswers(
  candidate: INormalizedCandidateProfile,
): Record<string, any> {
  return {
    fullName: candidate.fullName || null,
    age: candidate.age ?? null,
    email: candidate.email || null,
    phone: candidate.phone || null,
    educationLevel: candidate.educationLevel || null,
    yearsExperience: candidate.yearsExperience ?? null,
    languages: candidate.languages || [],
    languagesText: candidate.languagesText || null,

    hasDriverLicense: candidate.hasDriverLicense || null,
    hasVehicle: candidate.hasVehicle || null,
    scheduleAvailable: candidate.scheduleAvailable || null,
    timeAvailability: candidate.timeAvailability || null,
    fieldWorkAvailability: candidate.fieldWorkAvailability || null,

    salesExperience: candidate.salesExperience || null,
    financialProductsExperience: candidate.financialProductsExperience || null,
    dealerOrB2BExperience: candidate.dealerOrB2BExperience || null,
    vehicleKnowledge: candidate.vehicleKnowledge || null,

    peopleManagementExperience: candidate.peopleManagementExperience || null,
    teamSizeManaged: candidate.teamSizeManaged ?? null,
    branchOperationsExperience: candidate.branchOperationsExperience || null,
    kpiManagementExperience: candidate.kpiManagementExperience || null,
    conflictManagementExperience:
      candidate.conflictManagementExperience || null,
    cashOrAdministrativeControlExperience:
      candidate.cashOrAdministrativeControlExperience || null,
    leadershipStyle: candidate.leadershipStyle || null,

    softwareTools: candidate.softwareTools || null,
    softSkills: candidate.softSkills || null,
    techSkills: candidate.techSkills || null,
    functionsDescription: candidate.functionsDescription || null,
    mainAchievements: candidate.mainAchievements || null,
    valueToAdd: candidate.valueToAdd || null,
    whyWorkHere: candidate.whyWorkHere || null,
  };
}

function compareLanguageLevel(
  candidateLevel?: string,
  requiredLevel?: string,
): boolean {
  if (!requiredLevel) return true;
  if (!candidateLevel) return false;

  const order = ["basico", "intermedio", "avanzado", "nativo"];

  const candidateIndex = order.indexOf(normalizeText(candidateLevel));
  const requiredIndex = order.indexOf(normalizeText(requiredLevel));

  if (candidateIndex === -1 || requiredIndex === -1) {
    return normalizeText(candidateLevel) === normalizeText(requiredLevel);
  }

  return candidateIndex >= requiredIndex;
}

function hasTruthyField(
  candidate: INormalizedCandidateProfile,
  field: string,
): boolean {
  const value = (candidate as any)[field];

  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0;

  return !!value;
}

function getCandidateFieldValue(
  candidate: INormalizedCandidateProfile,
  field: string,
): any {
  return (candidate as any)[field];
}

function applyConfigHardFilters(
  config: IRecruitmentAgentConfig,
  candidate: INormalizedCandidateProfile,
): IHardFilterResult[] {
  const results: IHardFilterResult[] = [];
  const hardFilters = Array.isArray((config as any).hardFilters)
    ? (config as any).hardFilters
    : [];

  for (const filter of hardFilters) {
    const type = filter?.type;
    const key = filter?.key || type || "hardFilter";
    const onFail = filter?.onFail || "REVIEW";

    const severity: HardFilterSeverity =
      onFail === "REJECT" ? "BLOCKER" : "WARNING";

    if (type === "minimumAge") {
      const minAge = Number(filter.value || 18);

      if (candidate.age === null || candidate.age === undefined) {
        results.push({
          key,
          passed: false,
          severity: "WARNING",
          message: `No se pudo confirmar edad mínima requerida (${minAge}+).`,
        });
      } else {
        results.push({
          key,
          passed: candidate.age >= minAge,
          severity: candidate.age >= minAge ? "WARNING" : severity,
          message:
            candidate.age >= minAge
              ? `Cumple edad mínima requerida (${minAge}+).`
              : `No cumple edad mínima requerida (${minAge}+).`,
        });
      }
    }

    if (type === "minimumExperience") {
      const minYears = Number(filter.value || 0);

      if (
        candidate.yearsExperience === null ||
        candidate.yearsExperience === undefined
      ) {
        results.push({
          key,
          passed: false,
          severity: "WARNING",
          message: `No se pudo confirmar experiencia mínima requerida (${minYears} años).`,
        });
      } else {
        results.push({
          key,
          passed: candidate.yearsExperience >= minYears,
          severity:
            candidate.yearsExperience >= minYears ? "WARNING" : severity,
          message:
            candidate.yearsExperience >= minYears
              ? `Cumple experiencia mínima requerida (${minYears} años).`
              : `No cumple experiencia mínima requerida (${minYears} años).`,
        });
      }
    }

    if (type === "requiredField") {
      const field = filter.field;
      const passed = field ? hasTruthyField(candidate, field) : false;

      results.push({
        key,
        passed,
        severity: passed ? "WARNING" : severity,
        message: passed
          ? `Campo requerido confirmado: ${field}.`
          : `No se encontró información suficiente para el campo requerido: ${field}.`,
      });
    }

    if (type === "requiredLanguage") {
      const requiredLanguage = filter.language;
      const minLevel = filter.minLevel || filter.level;

      const found = (candidate.languages || []).find(
        (lang) =>
          normalizeText(lang.language) === normalizeText(requiredLanguage),
      );

      const textFallback =
        candidate.languagesText &&
        normalizeText(candidate.languagesText).includes(
          normalizeText(requiredLanguage),
        );

      if (!found && !textFallback) {
        results.push({
          key,
          passed: false,
          severity,
          message: `No se encontró evidencia del idioma requerido: ${requiredLanguage}.`,
        });
        continue;
      }

      const inferredLevel =
        found?.level ||
        inferLanguageLevel(candidate.languagesText || "", requiredLanguage);

      const levelOk = compareLanguageLevel(inferredLevel, minLevel);

      results.push({
        key,
        passed: levelOk,
        severity: levelOk ? "WARNING" : severity,
        message: levelOk
          ? `Cumple con el idioma requerido: ${requiredLanguage}.`
          : `El nivel del idioma ${requiredLanguage} no cumple con lo requerido.`,
      });
    }
  }

  return results;
}

function applyImplicitHardFilters(
  config: IRecruitmentAgentConfig,
  candidate: INormalizedCandidateProfile,
): IHardFilterResult[] {
  const results: IHardFilterResult[] = [];

  const additionalConstraints = config.jobProfile?.additionalConstraints || [];
  const languagesRequired = config.jobProfile?.languagesRequired || [];

  const requiresAdultCheck = additionalConstraints.some((constraint) => {
    const c = normalizeText(String(constraint || ""));
    return c.includes("mayor de edad") || c.includes("18+");
  });

  if (requiresAdultCheck) {
    if (candidate.age === null || candidate.age === undefined) {
      results.push({
        key: "minimumAge",
        passed: false,
        severity: "WARNING",
        message: "No se pudo confirmar si el candidato es mayor de edad.",
      });
    } else if (candidate.age >= 18) {
      results.push({
        key: "minimumAge",
        passed: true,
        severity: "WARNING",
        message: "El candidato cumple con la mayoría de edad requerida.",
      });
    } else {
      results.push({
        key: "minimumAge",
        passed: false,
        severity: "BLOCKER",
        message: "El candidato no cumple con la mayoría de edad requerida.",
      });
    }
  }

  for (const requiredLanguage of languagesRequired) {
    const found = (candidate.languages || []).find(
      (lang) =>
        normalizeText(lang.language) ===
        normalizeText(requiredLanguage.language),
    );

    const textFallback =
      candidate.languagesText &&
      normalizeText(candidate.languagesText).includes(
        normalizeText(requiredLanguage.language),
      );

    if (!found && !textFallback) {
      results.push({
        key: `language_${requiredLanguage.language}`,
        passed: false,
        severity: "BLOCKER",
        message: `No se encontró evidencia del idioma requerido: ${requiredLanguage.language}.`,
      });
      continue;
    }

    const inferredLevel =
      found?.level ||
      inferLanguageLevel(
        candidate.languagesText || "",
        requiredLanguage.language,
      );

    const levelOk = compareLanguageLevel(inferredLevel, requiredLanguage.level);

    results.push({
      key: `language_${requiredLanguage.language}`,
      passed: levelOk,
      severity: levelOk ? "WARNING" : "BLOCKER",
      message: levelOk
        ? `Cumple con el idioma requerido: ${requiredLanguage.language}.`
        : `El nivel del idioma ${requiredLanguage.language} no cumple con lo requerido.`,
    });
  }

  return results;
}

function dedupeHardFilters(results: IHardFilterResult[]): IHardFilterResult[] {
  const map = new Map<string, IHardFilterResult>();

  for (const item of results) {
    const existing = map.get(item.key);

    if (!existing) {
      map.set(item.key, item);
      continue;
    }

    if (!existing.passed && existing.severity === "BLOCKER") continue;

    if (!item.passed && item.severity === "BLOCKER") {
      map.set(item.key, item);
      continue;
    }

    if (!existing.passed && item.passed) continue;

    map.set(item.key, item);
  }

  return Array.from(map.values());
}

function applyHardFilters(
  config: IRecruitmentAgentConfig,
  candidate: INormalizedCandidateProfile,
): IHardFilterResult[] {
  return dedupeHardFilters([
    ...applyConfigHardFilters(config, candidate),
    ...applyImplicitHardFilters(config, candidate),
  ]);
}

const RECRUITMENT_OUTPUT_SCHEMA = {
  criteriaResults: [
    {
      key: "string",
      score: 0,
      reasoning: "string",
      evidence: ["string"],
    },
  ],
  summary: "string",
  strengths: ["string"],
  weaknesses: ["string"],
  riskFlags: ["string"],
  missingInformation: ["string"],
  verificationNeeded: ["string"],
  confidenceLevel: "HIGH | MEDIUM | LOW",
  interview: {
    recommend: true,
    priority: "ALTA | MEDIA | BAJA",
    suggestedMode: "Presencial | Virtual | Telefónica",
    focusPoints: ["string"],
    structuredQuestions: ["string"],
  },
};

function validateCriteriaKeys(params: {
  rubric: Array<{ key: string }>;
  parsed: IParsedAiOutput;
}) {
  const expectedKeys = (params.rubric || []).map((item) => item.key);
  const receivedKeys = (params.parsed.criteriaResults || []).map(
    (item) => item.key,
  );

  const missingKeys = expectedKeys.filter((key) => !receivedKeys.includes(key));
  const extraKeys = receivedKeys.filter((key) => !expectedKeys.includes(key));

  if (missingKeys.length > 0 || extraKeys.length > 0) {
    throw new Error(
      [
        "La IA devolvió criterios que no coinciden con la rúbrica del agente.",
        `Expected: ${expectedKeys.join(", ")}`,
        `Received: ${receivedKeys.join(", ")}`,
        `Missing: ${missingKeys.join(", ") || "ninguno"}`,
        `Extra: ${extraKeys.join(", ") || "ninguno"}`,
      ].join(" | "),
    );
  }
}

function buildDifyRecruitmentInputs(params: {
  agent: IAiAgent | any;
  app: IRecruitmentApplication | any;
  candidate: INormalizedCandidateProfile;
  normalizedAnswers: Record<string, any>;
  hardFilterResults: IHardFilterResult[];
}) {
  const { agent, app, candidate, normalizedAnswers, hardFilterResults } =
    params;

  const agentConfigForDify = {
    kind: agent.config?.kind || "recruitment",
    agentCode: agent.code,
    agentName: agent.name,
    agentVersion: agent.version,
    provider: agent.provider,
    model: agent.model,
    finalDecisionOwner: "backend",
    humanValidationRequired: true,
    instructions: [
      "Evaluar únicamente con la información suministrada.",
      "No inventar experiencia, estudios, habilidades ni disponibilidad.",
      "No usar datos sensibles para recomendar.",
      "No calcular el overallScore final.",
      "No decidir el estado final del candidato.",
      "Devolver exclusivamente JSON válido.",
    ],
  };

  const formContext = {
    applicationId: String(app._id),
    formId: app.form?._id ? String(app.form._id) : null,
    formTitle: app.form?.title || null,
    jobPosition: app.form?.jobPosition?.name || null,
    agentCode: agent.code,
    agentVersion: agent.version,
  };

  return {
    agent_config_json: JSON.stringify(agentConfigForDify, null, 2),

    job_profile_json: JSON.stringify(agent.config?.jobProfile || {}, null, 2),

    evaluation_rubric_json: JSON.stringify(
      agent.config?.evaluationRubric || [],
      null,
      2,
    ),

    rubric_keys_json: JSON.stringify(
      (agent.config?.evaluationRubric || []).map((item: any) => item.key),
      null,
      2,
    ),

    thresholds_json: JSON.stringify(agent.config?.thresholds || {}, null, 2),

    decision_policy_json: JSON.stringify(
      agent.config?.decisionPolicy || {},
      null,
      2,
    ),

    hard_filter_results_json: JSON.stringify(hardFilterResults || [], null, 2),

    candidate_profile_json: JSON.stringify(normalizedAnswers || {}, null, 2),

    raw_answers_json: JSON.stringify(candidate.rawAnswers || {}, null, 2),

    form_context_json: JSON.stringify(formContext, null, 2),

    output_schema_json: JSON.stringify(RECRUITMENT_OUTPUT_SCHEMA, null, 2),
  };
}

function buildRecruitmentPrompts(
  agent: IAiAgent,
  app: IRecruitmentApplication | any,
  config: IRecruitmentAgentConfig,
  candidate: INormalizedCandidateProfile,
  hardFilterResults: IHardFilterResult[],
) {
  const { jobProfile, evaluationRubric, thresholds } = config;

  const systemPrompt = `
Eres un analista de reclutamiento estricto, consistente y auditable.

REGLAS OBLIGATORIAS:
- Evalúa SOLO con la información suministrada.
- No inventes datos.
- No asumas experiencia, habilidades o estudios si no están explícitos o claramente sustentados.
- Si falta información importante, repórtala en missingInformation o verificationNeeded.
- No tomes decisiones basadas en raza, religión, género, estado civil, salud, orientación sexual u otros datos sensibles.
- Debes devolver SOLO JSON válido.
- No calcules el overallScore final ni la recomendación final; eso lo hará el backend.
- Debes evaluar únicamente los criterios enviados en evaluationRubric.
- Cada criterio debe tener key, score, reasoning y evidence.
- score debe estar entre 0 y 100.
- reasoning debe ser breve, profesional y específico.
- evidence debe mencionar datos concretos del candidato o indicar falta de evidencia.
- Sé determinista: misma entrada, misma salida.
`.trim();

  const userPrompt = `
PUESTO / FORMULARIO
- Nombre del puesto del formulario: ${app.form?.jobPosition?.name || "No especificado"}
- Título del agente: ${jobProfile.positionTitle}
- Descripción del puesto: ${jobProfile.description}
- Habilidades obligatorias: ${JSON.stringify(jobProfile.mustHaveSkills || [])}
- Habilidades deseables: ${JSON.stringify(jobProfile.niceToHaveSkills || [])}
- Años mínimos de experiencia: ${jobProfile.minExperienceYears ?? 0}
- Industrias preferidas: ${JSON.stringify(jobProfile.preferredIndustries || [])}
- Nivel educativo mínimo: ${jobProfile.minEducationLevel || "No especificado"}
- Idiomas requeridos: ${JSON.stringify(jobProfile.languagesRequired || [])}
- Tipo de ubicación: ${jobProfile.locationType || "No especificado"}
- Restricciones adicionales: ${JSON.stringify(jobProfile.additionalConstraints || [])}

RÚBRICA
${JSON.stringify(evaluationRubric, null, 2)}

UMBRALES
${JSON.stringify(thresholds, null, 2)}

POLÍTICA DE DECISIÓN
${JSON.stringify((config as any).decisionPolicy || {}, null, 2)}

FILTROS DUROS EVALUADOS POR BACKEND
${JSON.stringify(hardFilterResults, null, 2)}

PERFIL NORMALIZADO DEL CANDIDATO
${JSON.stringify(buildNormalizedAnswers(candidate), null, 2)}

RESUMEN HUMANO DEL CANDIDATO
${candidate.summaryText}

RESPUESTAS CRUDAS DEL FORMULARIO
${JSON.stringify(candidate.rawAnswers, null, 2)}

RESPONDE EXCLUSIVAMENTE ESTE JSON:
{
  "criteriaResults": [
    {
      "key": "string",
      "score": 0,
      "reasoning": "string",
      "evidence": ["string"]
    }
  ],
  "summary": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "riskFlags": ["string"],
  "missingInformation": ["string"],
  "verificationNeeded": ["string"],
  "confidenceLevel": "HIGH" | "MEDIUM" | "LOW",
  "interview": {
    "recommend": true,
    "priority": "ALTA" | "MEDIA" | "BAJA",
    "suggestedMode": "Presencial" | "Virtual" | "Telefónica",
    "focusPoints": ["string"],
    "structuredQuestions": ["string"]
  }
}
`.trim();

  return { systemPrompt, userPrompt };
}

function clampScore(value: any): number {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
}

function recalculateCriteriaResults(
  rubric: Array<{ key: string; label: string; weight: number }>,
  parsed: IParsedAiOutput,
): ICriterionResult[] {
  return rubric.map((criterion) => {
    const found = parsed.criteriaResults?.find(
      (item) => item.key === criterion.key,
    );

    return {
      key: criterion.key,
      label: criterion.label,
      weight: Number(criterion.weight || 0),
      score: clampScore(found?.score),
      reasoning: found?.reasoning?.trim() || "Sin justificación específica.",
      evidence: Array.isArray(found?.evidence)
        ? found.evidence
            .map((item) => String(item).trim())
            .filter(Boolean)
            .slice(0, 5)
        : [],
    };
  });
}

function calculateOverallScore(criteriaResults: ICriterionResult[]): number {
  const totalWeight = criteriaResults.reduce(
    (acc, item) => acc + Number(item.weight || 0),
    0,
  );

  if (totalWeight <= 0) return 0;

  const weightedSum = criteriaResults.reduce(
    (acc, item) => acc + item.score * item.weight,
    0,
  );

  return Math.round(weightedSum / totalWeight);
}

function countCriticalRiskFlags(riskFlags: string[]): number {
  return (riskFlags || []).filter((flag) => {
    const text = normalizeText(flag);
    return (
      text.includes("critico") ||
      text.includes("bloqueante") ||
      text.includes("no cumple") ||
      text.includes("riesgo alto")
    );
  }).length;
}

function applyDecisionPolicy(params: {
  recommendation: AiRecommendation;
  criteriaResults: ICriterionResult[];
  riskFlags: string[];
  missingInformation: string[];
  config: IRecruitmentAgentConfig;
}): AiRecommendation {
  const {
    recommendation,
    criteriaResults,
    riskFlags,
    missingInformation,
    config,
  } = params;

  const policy = (config as any).decisionPolicy || {};
  let next = recommendation;

  const minimumCriterionScores = policy.minimumCriterionScores || {};
  const failedMinimumCriterion = criteriaResults.some((criterion) => {
    const min = minimumCriterionScores[criterion.key];
    if (min === null || min === undefined) return false;
    return criterion.score < Number(min);
  });

  if (failedMinimumCriterion && next === "HIRING") next = "INTERVIEW";
  if (failedMinimumCriterion && next === "INTERVIEW") next = "POOL";

  const maxCriticalRiskFlags =
    typeof policy.maxCriticalRiskFlags === "number"
      ? policy.maxCriticalRiskFlags
      : null;

  if (maxCriticalRiskFlags !== null) {
    const criticalCount = countCriticalRiskFlags(riskFlags);
    if (criticalCount > maxCriticalRiskFlags) {
      if (next === "HIRING") next = "INTERVIEW";
      else if (next === "INTERVIEW") next = "POOL";
      else if (next === "POOL") next = "REJECT";
    }
  }

  if (
    policy.allowInterviewIfMissingInfo === false &&
    Array.isArray(missingInformation) &&
    missingInformation.length > 0 &&
    next === "INTERVIEW"
  ) {
    next = "POOL";
  }

  return next;
}

function decideRecommendation(params: {
  overallScore: number;
  thresholds: {
    autoRejectScore: number;
    autoInterviewScore: number;
    autoPoolMinScore?: number;
  };
  hardFilterResults: IHardFilterResult[];
  criteriaResults: ICriterionResult[];
  parsed: IParsedAiOutput;
  config: IRecruitmentAgentConfig;
}): AiRecommendation {
  const {
    overallScore,
    thresholds,
    hardFilterResults,
    criteriaResults,
    parsed,
    config,
  } = params;

  const hasBlocker = hardFilterResults.some(
    (item) => !item.passed && item.severity === "BLOCKER",
  );

  if (hasBlocker) return "REJECT";

  let recommendation: AiRecommendation;

  if (overallScore < thresholds.autoRejectScore) {
    recommendation = "REJECT";
  } else if (overallScore >= 90) {
    recommendation = "HIRING";
  } else if (overallScore >= thresholds.autoInterviewScore) {
    recommendation = "INTERVIEW";
  } else if (
    thresholds.autoPoolMinScore !== undefined &&
    overallScore >= thresholds.autoPoolMinScore
  ) {
    recommendation = "POOL";
  } else {
    recommendation = "REJECT";
  }

  recommendation = applyDecisionPolicy({
    recommendation,
    criteriaResults,
    riskFlags: parsed.riskFlags || [],
    missingInformation: parsed.missingInformation || [],
    config,
  });

  return recommendation;
}

function normalizeApplicationOutcome(recommendation: AiRecommendation): {
  nextStatus: "Pendiente" | "Aprobada" | "Rechazada";
  nextDecision?: "INTERVIEW" | "POOL";
} {
  if (recommendation === "REJECT") {
    return { nextStatus: "Rechazada" };
  }

  if (recommendation === "POOL") {
    return { nextStatus: "Aprobada", nextDecision: "POOL" };
  }

  return { nextStatus: "Aprobada", nextDecision: "INTERVIEW" };
}

function buildAgentSnapshot(agent: IAiAgent, config: IRecruitmentAgentConfig) {
  return {
    name: agent.name,
    code: agent.code,
    type: agent.type,
    provider: agent.provider,
    model: agent.model,
    temperature: agent.temperature ?? 0,
    maxTokens: agent.maxTokens ?? 1024,
    version: (agent as any).version ?? 1,
    thresholds: {
      autoRejectScore: config.thresholds?.autoRejectScore,
      autoInterviewScore: config.thresholds?.autoInterviewScore,
      autoPoolMinScore: config.thresholds?.autoPoolMinScore,
    },
  };
}

function cleanStringArray(value: any, max = 8): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, max);
}

export const evaluateApplicationWithAi = async (
  applicationId: string,
  agentIdOrCode: { agentId?: string; agentCode?: string },
) => {
  const { agentId, agentCode } = agentIdOrCode;

  const agentQuery: any = {
    isActive: true,
    isDeleted: false,
    type: "recruitment",
  };

  if (agentId && Types.ObjectId.isValid(agentId)) {
    agentQuery._id = agentId;
  } else if (agentCode) {
    agentQuery.code = agentCode;
  } else {
    throw new Error("Debes proveer agentId o agentCode.");
  }

  const agent = (await AiAgent.findOne(agentQuery).lean()) as IAiAgent | null;

  if (!agent) {
    throw new Error("Agente IA de reclutamiento no encontrado o inactivo.");
  }

  if (!isRecruitmentConfig(agent.config)) {
    throw new Error("Config de agente IA no es de tipo reclutamiento.");
  }

  const app = (await RecruitmentApplication.findOne({
    _id: applicationId,
    isDeleted: false,
  })
    .populate({
      path: "form",
      select: "title jobPosition aiAgent autoAiEvaluation",
      populate: {
        path: "jobPosition",
        select: "name",
      },
    })
    .lean()) as IRecruitmentApplication | null;

  if (!app) {
    throw new Error("Aplicación de reclutamiento no encontrada.");
  }

  const candidate = normalizeCandidateProfile(app.answers || {});
  const normalizedAnswers = buildNormalizedAnswers(candidate);
  const hardFilterResults = applyHardFilters(agent.config, candidate);

  let parsed: IParsedAiOutput;
  let providerRawResponse: any = null;
  let providerMeta: any = null;

  if (agent.provider === "openai") {
    const { systemPrompt, userPrompt } = buildRecruitmentPrompts(
      agent,
      app,
      agent.config,
      candidate,
      hardFilterResults,
    );

    const response = await openaiClient.responses.create({
      model: agent.model || "gpt-4.1-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: agent.temperature ?? 0,
      max_output_tokens: agent.maxTokens ?? 1400,
    });

    providerRawResponse = response;

    const outputText =
      (response as any)?.output?.[0]?.content?.[0]?.text ??
      (response as any)?.output_text ??
      "";

    if (!outputText) {
      throw new Error("El modelo no devolvió texto en la respuesta.");
    }

    try {
      parsed = JSON.parse(
        outputText
          .trim()
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```$/i, "")
          .trim(),
      );
    } catch (err) {
      console.error("AI raw output:", outputText);
      throw new Error("La respuesta del modelo no es JSON válido.");
    }
  } else if (agent.provider === "dify") {
    const difyInputs = buildDifyRecruitmentInputs({
      agent,
      app,
      candidate,
      normalizedAnswers,
      hardFilterResults,
    });

    console.log("======= IA RECRUITMENT DEBUG =======");
    console.log("applicationId:", applicationId);
    console.log("formTitle:", app.form?.title);
    console.log("formJobPosition:", app.form?.jobPosition?.name);
    console.log("agentName:", agent.name);
    console.log("agentCode:", agent.code);
    console.log("agentProvider:", agent.provider);
    console.log(
      "agentRubricKeys:",
      agent.config?.evaluationRubric?.map((item: any) => item.key),
    );
    console.log("evaluation_rubric_json enviado a Dify:");
    console.log(difyInputs.evaluation_rubric_json);

const difyResult = await runDifyWorkflow({
  agent,
  inputs: difyInputs,
  userId: String(app._id),
});

parsed = difyResult.output as IParsedAiOutput;
providerRawResponse = difyResult.rawResponse;
providerMeta = difyResult.providerMeta;

if (!parsed || typeof parsed !== "object") {
  console.error("Dify raw response:", difyResult.rawResponse);
  throw new Error("Dify no devolvió una respuesta JSON válida.");
}

if (!Array.isArray(parsed.criteriaResults)) {
  console.error("Dify parsed output:", parsed);
  throw new Error(
    "Dify devolvió JSON, pero no contiene criteriaResults válido.",
  );
}

console.log("======= DIFY OUTPUT KEYS =======");
console.log(parsed.criteriaResults?.map((item) => item.key));

console.log("======= EXPECTED RUBRIC KEYS =======");
console.log(agent.config?.evaluationRubric?.map((item: any) => item.key));

    parsed = difyResult.output as IParsedAiOutput;
    providerRawResponse = difyResult.rawResponse;
    providerMeta = difyResult.providerMeta;

    if (!parsed || typeof parsed !== "object") {
      console.error("Dify raw response:", difyResult.rawResponse);
      throw new Error("Dify no devolvió una respuesta JSON válida.");
    }

    if (!Array.isArray(parsed.criteriaResults)) {
      console.error("Dify parsed output:", parsed);
      throw new Error(
        "Dify devolvió JSON, pero no contiene criteriaResults válido.",
      );
    }
  } else {
    throw new Error(`Proveedor LLM no soportado: ${agent.provider}`);
  }

  validateCriteriaKeys({
    rubric: agent.config.evaluationRubric,
    parsed,
  });


  const criteriaResults = recalculateCriteriaResults(
    agent.config.evaluationRubric,
    parsed,
  );

  const overallScore = calculateOverallScore(criteriaResults);

  const recommendation = decideRecommendation({
    overallScore,
    thresholds: agent.config.thresholds,
    hardFilterResults,
    criteriaResults,
    parsed,
    config: agent.config,
  });

  const { nextStatus, nextDecision } =
    normalizeApplicationOutcome(recommendation);

  const aiDecision = {
    recommendation,
    overallScore,
    confidenceLevel:
      parsed.confidenceLevel === "HIGH" || parsed.confidenceLevel === "LOW"
        ? parsed.confidenceLevel
        : "MEDIUM",

    criteriaResults,
    hardFilterResults,

    summary: safeString(parsed.summary) || "Sin resumen disponible.",
    strengths: cleanStringArray(parsed.strengths, 8),
    weaknesses: cleanStringArray(parsed.weaknesses, 8),
    riskFlags: cleanStringArray(parsed.riskFlags, 8),
    missingInformation: cleanStringArray(parsed.missingInformation, 10),
    verificationNeeded: cleanStringArray(parsed.verificationNeeded, 10),

    interview: {
      recommend: !!parsed.interview?.recommend,
      priority:
        parsed.interview?.priority === "ALTA" ||
        parsed.interview?.priority === "BAJA"
          ? parsed.interview.priority
          : "MEDIA",
      suggestedMode:
        parsed.interview?.suggestedMode === "Virtual" ||
        parsed.interview?.suggestedMode === "Telefónica"
          ? parsed.interview.suggestedMode
          : "Presencial",
      focusPoints: cleanStringArray(parsed.interview?.focusPoints, 8),
      structuredQuestions: cleanStringArray(
        parsed.interview?.structuredQuestions,
        8,
      ),
    },

    agentId: new Types.ObjectId(String(agent._id)),
    agentVersion: (agent as any).version ?? 1,
    agentSnapshot: buildAgentSnapshot(agent, agent.config),
    modelName: agent.model,
    provider: agent.provider,
    providerMeta,
    evaluatedAt: new Date(),

    rawResponse: parsed,
  };

  const update: any = {
    $set: {
      normalizedAnswers,
      aiDecision,
      aiAgent: agent._id,
      status: nextStatus,
    },
  };

  if (nextDecision) {
    update.$set.decision = nextDecision;
  } else {
    update.$unset = { decision: "" };
  }

  const updatedApp = await RecruitmentApplication.findOneAndUpdate(
    {
      _id: applicationId,
      isDeleted: false,
      decision: { $ne: "HIRING" },
    },
    update,
    { new: true },
  )
    .populate("form", "title")
    .populate("aiAgent", "name code type version provider")
    .lean();

  if (!updatedApp) {
    throw new Error(
      "La evaluación IA se generó, pero no se pudo actualizar la aplicación. Verifica si existe, si no está eliminada o si ya tiene decision='HIRING'.",
    );
  }

  return updatedApp;
};