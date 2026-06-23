import { IAiAgentConfigBase } from "./common";

export interface IGenericAgentConfig extends IAiAgentConfigBase {
  kind: "generic";
  systemPrompt?: string;
  language?: "es" | "en";
  strictMode?: boolean;
  systemNotes?: string;
}
