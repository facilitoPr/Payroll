import { Types } from "mongoose";
import { IAiAgentConfigBase } from "./common";

export interface IRecruitmentAgentConfig extends IAiAgentConfigBase {
  kind: "recruitment";

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

export function isRecruitmentConfig(
  config: any
): config is IRecruitmentAgentConfig {
  return (
    !!config &&
    // config.kind === "recruitment" &&
    !!config.jobProfile &&
    Array.isArray(config.evaluationRubric) &&
    !!config.thresholds &&
    !!config.interviewConfig
  );
}
