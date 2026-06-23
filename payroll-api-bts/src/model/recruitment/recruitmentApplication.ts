import { Schema, model, Document, Types } from "mongoose";
import { IUser } from "../account/user";

export interface IClassificationSectionItem {
  received: boolean;
  date: string;
  status: "Original" | "Copia" | "Digital" | "Pendiente" | "No aplica" | string;
  note: string;
}

export interface IClassificationSections {
  [sectionKey: string]: {
    [itemKey: string]: IClassificationSectionItem;
  };
}

export interface IRecruitmentClassification {
  sections: IClassificationSections;
  expedientCode: string;
  owner: string;
  notes?: string;
  updatedBy?: Types.ObjectId;
  updatedAt?: Date;
}

export interface IInterviewBasic {
  scheduledAt: Date;
  mode: string;
  location: string;
  evaluators: Types.ObjectId[] | IUser[];
  notes?: string;
}

export interface IInterviewEvaluation {
  position: string;
  candidateName: string;
  date: string;
  interviewer: Types.ObjectId;
  professionalCompetencies: {
    key: string;
    label: string;
    description: string;
    score: number;
  }[];
  softSkills: {
    key: string;
    label: string;
    description: string;
    score: number;
  }[];
  generalCriteria: {
    key: string;
    label: string;
    description: string;
    score: number;
  }[];
  keyQuestions: {
    key: string;
    label: string;
    answer: string;
  }[];
  comments: string;
  recommendation: string;
}

export interface IInterview extends IInterviewBasic {
  evaluation?: IInterviewEvaluation;
  evaluationUpdatedAt?: Date;
}

export interface IRecruitmentAiCriterionResult {
  key: string;
  label: string;
  weight: number;
  score: number;
  reasoning: string;
  evidence: string[];
}

export interface IRecruitmentAiHardFilterResult {
  key: string;
  passed: boolean;
  severity: "BLOCKER" | "WARNING";
  message: string;
}

export interface IRecruitmentAiInterviewSuggestion {
  recommend: boolean;
  priority: "ALTA" | "MEDIA" | "BAJA";
  suggestedMode: "Presencial" | "Virtual" | "Telefónica";
  focusPoints: string[];
  structuredQuestions: string[];
}

export interface IRecruitmentAiAgentSnapshot {
  name: string;
  code: string;
  type: string;
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  version?: number;
  thresholds?: {
    autoRejectScore?: number;
    autoInterviewScore?: number;
    autoPoolMinScore?: number;
  };
}

export interface IRecruitmentAiDecision {
  /** Recomendación sugerida por la IA, no reemplaza la decisión humana final */
  recommendation: "REJECT" | "INTERVIEW" | "POOL" | "HIRING";

  overallScore: number;
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW";

  criteriaResults: IRecruitmentAiCriterionResult[];
  hardFilterResults: IRecruitmentAiHardFilterResult[];

  summary: string;
  strengths: string[];
  weaknesses: string[];
  riskFlags: string[];
  missingInformation: string[];
  verificationNeeded: string[];

  interview: IRecruitmentAiInterviewSuggestion;

  agentId?: Types.ObjectId;
  agentVersion?: number;
  agentSnapshot?: IRecruitmentAiAgentSnapshot;
  modelName?: string;
  evaluatedAt?: Date;

  rawResponse?: any;
}

export interface IRecruitmentApplication extends Document {
  form: Types.ObjectId | any;
  publicToken: string;

  answers: Record<string, any>;
  normalizedAnswers?: Record<string, any>;

  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  desiredPosition?: string;
  source?: string;

  classification?: IRecruitmentClassification;
  interview?: IInterview | null;

  /** Decisión operativa/humana del proceso */
  decision?: "INTERVIEW" | "HIRING" | "POOL" | "REJECTED" | "HIRED";

  /** Estado general del expediente */
  status?: "Pendiente" | "Aprobada" | "Rechazada";

  files: string[];

  aiDecision?: IRecruitmentAiDecision;
  aiAgent?: Types.ObjectId;

  expedient?: Types.ObjectId;

  isActive: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const ClassificationSchema = new Schema<IRecruitmentClassification>(
  {
    sections: {
      type: Schema.Types.Mixed,
      required: true,
    },
    expedientCode: { type: String, required: true, default: "EXP-NEW" },
    owner: { type: String, required: true },
    notes: { type: String },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedAt: { type: Date },
  },
  { _id: false },
);

const InterviewEvaluationSchema = new Schema<IInterviewEvaluation>(
  {
    position: { type: String, required: false },
    candidateName: { type: String, required: false },
    date: { type: String, required: true },
    interviewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    professionalCompetencies: [
      {
        key: String,
        label: String,
        description: String,
        score: Number,
      },
    ],
    softSkills: [
      {
        key: String,
        label: String,
        description: String,
        score: Number,
      },
    ],
    generalCriteria: [
      {
        key: String,
        label: String,
        description: String,
        score: Number,
      },
    ],
    keyQuestions: [
      {
        key: String,
        label: String,
        answer: String,
      },
    ],
    comments: { type: String },
    recommendation: { type: String },
  },
  { _id: false },
);

const InterviewSchema = new Schema<IInterview>(
  {
    scheduledAt: { type: Date, required: false },
    mode: { type: String, required: false },
    location: { type: String, required: false },
    evaluators: [{ type: Schema.Types.ObjectId, ref: "User" }],
    notes: { type: String },
    evaluation: { type: InterviewEvaluationSchema, required: false },
    evaluationUpdatedAt: { type: Date },
  },
  { _id: false },
);

const RecruitmentAiCriterionResultSchema =
  new Schema<IRecruitmentAiCriterionResult>(
    {
      key: { type: String, required: true, trim: true },
      label: { type: String, required: true, trim: true },
      weight: { type: Number, required: true, default: 0 },
      score: { type: Number, required: true, min: 0, max: 100, default: 0 },
      reasoning: { type: String, required: true, default: "" },
      evidence: [{ type: String }],
    },
    { _id: false },
  );

const RecruitmentAiHardFilterResultSchema =
  new Schema<IRecruitmentAiHardFilterResult>(
    {
      key: { type: String, required: true, trim: true },
      passed: { type: Boolean, required: true, default: false },
      severity: {
        type: String,
        enum: ["BLOCKER", "WARNING"],
        required: true,
      },
      message: { type: String, required: true, default: "" },
    },
    { _id: false },
  );

const RecruitmentAiInterviewSuggestionSchema =
  new Schema<IRecruitmentAiInterviewSuggestion>(
    {
      recommend: { type: Boolean, required: true, default: false },
      priority: {
        type: String,
        enum: ["ALTA", "MEDIA", "BAJA"],
        default: "MEDIA",
      },
      suggestedMode: {
        type: String,
        enum: ["Presencial", "Virtual", "Telefónica"],
        default: "Presencial",
      },
      focusPoints: [{ type: String }],
      structuredQuestions: [{ type: String }],
    },
    { _id: false },
  );

const RecruitmentAiAgentSnapshotSchema =
  new Schema<IRecruitmentAiAgentSnapshot>(
    {
      name: { type: String, required: true },
      code: { type: String, required: true },
      type: { type: String, required: true },
      provider: { type: String, required: true },
      model: { type: String, required: true },
      temperature: { type: Number, required: true, default: 0 },
      maxTokens: { type: Number, required: true, default: 0 },
      version: { type: Number, required: false },
      thresholds: {
        autoRejectScore: { type: Number, required: false },
        autoInterviewScore: { type: Number, required: false },
        autoPoolMinScore: { type: Number, required: false },
      },
    },
    { _id: false },
  );

const RecruitmentAiDecisionSchema = new Schema<IRecruitmentAiDecision>(
  {
    recommendation: {
      type: String,
      enum: ["REJECT", "INTERVIEW", "POOL", "HIRING"],
      required: true,
    },

    overallScore: { type: Number, required: true, min: 0, max: 100 },
    confidenceLevel: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      required: true,
      default: "MEDIUM",
    },

    criteriaResults: {
      type: [RecruitmentAiCriterionResultSchema],
      default: [],
    },

    hardFilterResults: {
      type: [RecruitmentAiHardFilterResultSchema],
      default: [],
    },

    summary: { type: String, required: true, default: "" },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    riskFlags: [{ type: String }],
    missingInformation: [{ type: String }],
    verificationNeeded: [{ type: String }],

    interview: {
      type: RecruitmentAiInterviewSuggestionSchema,
      required: true,
      default: () => ({
        recommend: false,
        priority: "MEDIA",
        suggestedMode: "Presencial",
        focusPoints: [],
        structuredQuestions: [],
      }),
    },

    agentId: { type: Schema.Types.ObjectId, ref: "AiAgent" },
    agentVersion: { type: Number, required: false },
    agentSnapshot: {
      type: RecruitmentAiAgentSnapshotSchema,
      required: false,
    },
    modelName: { type: String },
    evaluatedAt: { type: Date },

    rawResponse: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  { _id: false },
);

const RecruitmentApplicationSchema = new Schema<IRecruitmentApplication>(
  {
    form: {
      type: Schema.Types.ObjectId,
      ref: "RecruitmentForm",
      required: true,
    },
    publicToken: {
      type: String,
      required: true,
      trim: true,
    },

    answers: {
      type: Schema.Types.Mixed,
      required: true,
    },

    /** Respuestas normalizadas para análisis y búsquedas futuras */
    normalizedAnswers: {
      type: Schema.Types.Mixed,
      required: false,
      default: null,
    },

    applicantName: {
      type: String,
      trim: true,
    },
    applicantEmail: {
      type: String,
      trim: true,
    },
    applicantPhone: {
      type: String,
      trim: true,
    },
    desiredPosition: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pendiente", "Aprobada", "Rechazada"],
      default: "Pendiente",
    },

    decision: {
      type: String,
      enum: ["INTERVIEW", "HIRING", "POOL", "REJECTED", "HIRED"],
      required: false,
    },

    classification: { type: ClassificationSchema, required: false },
    interview: { type: InterviewSchema, required: false, default: null },

    aiDecision: { type: RecruitmentAiDecisionSchema, required: false },

    aiAgent: {
      type: Schema.Types.ObjectId,
      ref: "AiAgent",
      required: false,
    },

    files: [
      {
        type: Schema.Types.String,
        required: false,
        default: null,
      },
    ],

    expedient: {
      type: Schema.Types.ObjectId,
      ref: "Expedient",
      required: false,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

RecruitmentApplicationSchema.index({ form: 1, createdAt: -1 });
RecruitmentApplicationSchema.index({ aiAgent: 1, createdAt: -1 });
RecruitmentApplicationSchema.index({
  "aiDecision.recommendation": 1,
  createdAt: -1,
});
RecruitmentApplicationSchema.index({
  applicantName: "text",
  applicantEmail: "text",
  desiredPosition: "text",
});

const RecruitmentApplication = model<IRecruitmentApplication>(
  "RecruitmentApplication",
  RecruitmentApplicationSchema,
);

export default RecruitmentApplication;