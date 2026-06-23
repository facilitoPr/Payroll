import {
  IRecruitmentAgentConfig,
  ISupportAgentConfig,
  ISalesAgentConfig,
  IGenericAgentConfig,
  AiAgentType,
} from "../types/aiAgent.config";

const isObj = (v: any) => v && typeof v === "object" && !Array.isArray(v);

export function isRecruitmentConfig(
  config: any
): config is IRecruitmentAgentConfig {
  return (
    isObj(config) &&
    isObj(config.jobProfile) &&
    typeof config.jobProfile.positionTitle === "string" &&
    typeof config.jobProfile.description === "string" &&
    Array.isArray(config.evaluationRubric) &&
    isObj(config.thresholds) &&
    typeof config.thresholds.autoRejectScore === "number" &&
    typeof config.thresholds.autoInterviewScore === "number" &&
    isObj(config.interviewConfig)
  );
}

export function isSupportConfig(config: any): config is ISupportAgentConfig {
  return isObj(config); // mínimo: lo vas endureciendo luego
}

export function isSalesConfig(config: any): config is ISalesAgentConfig {
  return isObj(config);
}

export function isGenericConfig(config: any): config is IGenericAgentConfig {
  return isObj(config);
}

export function validateConfigByType(type: AiAgentType, config: any) {
  switch (type) {
    case "recruitment":
      return isRecruitmentConfig(config);
    case "support":
      return isSupportConfig(config);
    case "sales":
      return isSalesConfig(config);
    case "generic":
      return isGenericConfig(config);
    default:
      return false;
  }
}
