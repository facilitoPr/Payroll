import { Types } from "mongoose";

export type AppliesTo = "operator" | "leader" | "team";
export type ScopeType = "user" | "locality" | "department" | "team";

export type AchievementStatus =
  | "in_progress"
  | "achieved"
  | "not_achieved"
  | "approved"
  | "delivered";

export type CalculatorKey =
  | "REMINDERS_COMPOSITION_MONTHLY"
  | "REMINDERS_ATTENDED_OF_IMPACTED"
  | "LEADERBOARD_EMPLOYEE_OF_MONTH"
  | "TEAM_LOCALITY_ATTENDED_TARGET"
  | "PUNCH_PERFECT_MONTH";

export type Subject =
  | { scopeType: "user"; subjectUser: Types.ObjectId }
  | { scopeType: "locality"; subjectLocalityCode: string }
  | { scopeType: "department"; subjectDepartmentCode: string }
  | { scopeType: "team"; subjectTeamId: Types.ObjectId };

export interface CalcContext {
  month: string; // YYYY-MM
  programId: Types.ObjectId;
  programScopeCodes: string[];
  // si quieres multi-tenant en el futuro:
  // systemId?: Types.ObjectId;

  // helper: cache opcional
  cache?: Map<string, any>;
}

export interface CalcInput {
  ruleId: Types.ObjectId;
  ruleCode: string;
  appliesTo: AppliesTo;
  scopeType: ScopeType;
  config: any;
  // reward congelada la arma el engine (desde IncentiveRule)
}

export interface CalcResult {
  achieved: boolean; // si alcanzó la meta
  progressPercent: number; // 0..100
  metrics: any; // flexible
  message?: string; // UI message
  // Para leaderboard: puedes devolver ranking/ganador
  extra?: any;
}

export type CalculatorFn = (args: {
  ctx: CalcContext;
  input: CalcInput;
  subject: Subject;
}) => Promise<CalcResult>;
