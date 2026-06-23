import { IAiAgentConfigBase } from "./common";

export type InterviewRecommendation =
  | "CONTRATAR"
  | "SEGUNDA_ENTREVISTA"
  | "POOL"
  | "NO_CONTINUAR";

export interface IInterviewAnalystAgentConfig extends IAiAgentConfigBase {
  kind: "interviewAnalyst";
  version?: number;

  language: "es" | "en";
  strictMode: boolean;

  output: { format: "json" | "markdown" };

  scoring: { min: number; max: number }; // ej 0..5
  requireComments: boolean;

  recommendationOptions: InterviewRecommendation[];

  systemNotes?: string;
}

export function isInterviewAnalystConfig(
  config: any
): config is IInterviewAnalystAgentConfig {
  const allowedRec = [
    "CONTRATAR",
    "SEGUNDA_ENTREVISTA",
    "POOL",
    "NO_CONTINUAR",
  ];

  return (
    !!config &&
    config.kind === "interviewAnalyst" &&
    (config.language === "es" || config.language === "en") &&
    typeof config.strictMode === "boolean" &&
    !!config.output &&
    (config.output.format === "json" || config.output.format === "markdown") &&
    !!config.scoring &&
    typeof config.scoring.min === "number" &&
    typeof config.scoring.max === "number" &&
    config.scoring.min >= 0 &&
    config.scoring.min < config.scoring.max &&
    typeof config.requireComments === "boolean" &&
    Array.isArray(config.recommendationOptions) &&
    config.recommendationOptions.length > 0 &&
    config.recommendationOptions.every((x: any) =>
      allowedRec.includes(String(x))
    )
  );
}

export const DEFAULT_INTERVIEW_ANALYST_CONFIG: IInterviewAnalystAgentConfig = {
  kind: "interviewAnalyst",
  version: 1,

  language: "es",
  strictMode: true,
  output: { format: "json" },

  scoring: { min: 0, max: 5 },
  requireComments: true,

  recommendationOptions: [
    "CONTRATAR",
    "SEGUNDA_ENTREVISTA",
    "POOL",
    "NO_CONTINUAR",
  ],

  systemNotes: "",
};
