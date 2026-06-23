import { IAiAgentConfigBase } from "./common";

export interface IChatbotAgentConfig extends IAiAgentConfigBase {
  kind: "chatbot" | "support";

  ui: {
    title: string;
    subtitle?: string;
    welcomeMessage?: string;
    avatarUrl?: string;
    position?: "bottom-right" | "bottom-left";
    branding?: { showPoweredBy?: boolean; brandName?: string };
    theme?: {
      primaryColor?: string;
      accentColor?: string;
      backgroundColor?: string;
      textColor?: string;
    };
  };

  behavior: {
    language: "es" | "en";
    tone: "formal" | "friendly" | "salesy" | "technical";
    strictMode: boolean;
    fallbackMessage?: string;
    handoff?: {
      enabled: boolean;
      contactCtaLabel?: string;
      contactFieldsRequired?: Array<"name" | "email" | "phone" | "message">;
    };
    toolsPolicy?: {
      requireConfirmationForActions?: boolean;
    };
  };

  knowledge?: {
    chunks: Array<{ title?: string; text: string }>;
    retrieval?: { topK?: number; minScore?: number };
  };

  routing?: {
    allowedDomains?: string[];
    defaultContextKey?: string;
    contexts?: any[];
  };

  memory?: {
    sessionMemory?: "none" | "summary" | "full";
    storePII?: boolean;
    retentionDays?: number;
  };

  systemNotes?: string;
}

export function isChatbotConfig(config: any): config is IChatbotAgentConfig {
  return (
    !!config &&
    (config.kind === "chatbot" || config.kind === "support") &&
    !!config.ui &&
    !!config.behavior
  );
}
