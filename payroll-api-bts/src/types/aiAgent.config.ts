import { Types } from "mongoose";

/** Tipos existentes en tu modelo */
export type AiAgentType = "recruitment" | "support" | "sales" | "generic" | string;

/** === RECRUITMENT (ya lo tienes, lo copio resumido para union) === */
export interface IRecruitmentAgentConfig {
  jobProfile: {
    positionTitle: string;
    description: string;
    mustHaveSkills: string[];
    niceToHaveSkills: string[];
    minExperienceYears: number;
    preferredIndustries: string[];
    minEducationLevel: string;
    languagesRequired: {
      language: string;
      level: "Básico" | "Intermedio" | "Avanzado" | "Nativo";
    }[];
    locationType: "Presencial" | "Remoto" | "Híbrido";
    salaryRange?: { min: number; max: number; currency: string };
    additionalConstraints?: string[];
  };
  evaluationRubric: { key: string; label: string; weight: number }[];
  thresholds: {
    autoRejectScore: number;
    autoInterviewScore: number;
    autoPoolMinScore?: number;
  };
  interviewConfig: {
    autoSchedule: boolean;
    defaultMode: "Presencial" | "Virtual" | "Telefónica";
    defaultLocation: string;
    defaultEvaluators: Types.ObjectId[];
  };
}

/** === SUPPORT (puede ser chatbot o soporte general) === */
export interface ISupportAgentConfig {
  // ejemplo mínimo: luego lo amplías (chatbot, knowledge, tools, etc.)
  knowledgeBaseId?: string;
  tone?: "formal" | "friendly" | "technical";
  language?: "es" | "en";
  allowedTools?: string[]; // ej: ["createContactRequest", "searchFaq"]
}

/** === SALES === */
export interface ISalesAgentConfig {
  productCatalogId?: string;
  tone?: "friendly" | "salesy";
  language?: "es" | "en";
  leadCapture?: {
    enabled: boolean;
    fields?: Array<"name" | "email" | "phone" | "message">;
  };
}

/** === GENERIC === */
export interface IGenericAgentConfig {
  systemPrompt?: string;
  language?: "es" | "en";
}

/** Unión final */
export type AiAgentConfigByType =
  | { type: "recruitment"; config: IRecruitmentAgentConfig }
  | { type: "support"; config: ISupportAgentConfig }
  | { type: "sales"; config: ISalesAgentConfig }
  | { type: "generic"; config: IGenericAgentConfig };
