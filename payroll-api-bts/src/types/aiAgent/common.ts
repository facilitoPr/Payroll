import { Types } from "mongoose";

/** Proveedores (extensible) */
export type AiAgentProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "local"
  | string;

/** Tipos “conocidos” (para autocompletado) */
export type KnownAiAgentType =
  | "recruitment"
  | "interviewAnalyst"
  | "expedienteAnalyst"
  | "support"
  | "chatbot"
  | "generic";

/** Permite tipos futuros sin romper TS */
export type AiAgentType = KnownAiAgentType | (string & {});

/** Base común para configs (opcional, útil para estandarizar) */
export interface IAiAgentConfigBase {
  kind?: AiAgentType; // opcional, solo para debug/compat
  language?: "es" | "en";
  strictMode?: boolean;
  systemNotes?: string;
}

/** Campos base del agente */
export interface IAiAgentBase {
  name: string;
  code: string;
  type: AiAgentType;
  description?: string;

  provider: AiAgentProvider;
  model: string;
  temperature?: number; // 0..1 típico
  maxTokens?: number;

  config: Record<string, any>;

  system?: Types.ObjectId; // opcional (multi-tenant)
  isActive: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}
