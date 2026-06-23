import { IAiAgentConfigBase } from "./common";

export interface IExpedienteAnalystAgentConfig extends IAiAgentConfigBase {
  kind: "expedienteAnalyst";

  language: "es" | "en";
  templateCode: string;
  requiredSections: string[];
  summaryGoal?: string;

  rules: {
    strictMode: boolean;
    allowMissingAttachments: boolean;
    requireEvidenceLinks: boolean;
    minConfidence: number; // 0..1
  };

  output: {
    format: "json" | "markdown";
    detailLevel: "short" | "standard" | "full";
    includeChecklist: boolean;
    includeObservations: boolean;
    includeSectionBySection: boolean;
  };

  systemNotes?: string;
}

export function isExpedienteAnalystConfig(
  config: any
): config is IExpedienteAnalystAgentConfig {
  return (
    !!config &&
    config.kind === "expedienteAnalyst" &&
    typeof config.templateCode === "string" &&
    Array.isArray(config.requiredSections) &&
    !!config.rules &&
    !!config.output
  );
}
