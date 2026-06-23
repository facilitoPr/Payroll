import { Schema, model, Types } from "mongoose";

export interface IIncentiveAchievement {
  rule: Types.ObjectId;

  /** Programa (redundante útil para filtros rápidos) */
  program: Types.ObjectId;

  /** Mes evaluado en formato YYYY-MM (ej: "2026-02") */
  month: string;

  /**
   * Aplica a:
   * - operator: normalmente subjectUser = operadora
   * - leader: subjectUser = líder/gerente
   * - team: puede ser subjectLocality/subjectDepartment, etc.
   */
  appliesTo: "operator" | "leader" | "team";

  /**
   * Tipo de scope definido en la regla.
   * Indica "cómo" se está evaluando el achievement.
   */
  scopeType: "user" | "locality" | "department" | "team";

  /** Usuario principal del achievement (operadora o líder) */
  subjectUser?: Types.ObjectId;

  /** Identificadores de scope si aplica (localidad/depto/equipo) */
  subjectLocalityCode?: string; // ej: "LOCALIDAD_01"
  subjectDepartmentCode?: string; // ej: "TRIPLE_S"
  subjectTeamId?: Types.ObjectId; // si luego creas Team

  /**
   * Estado del progreso:
   * - in_progress: mes en curso
   * - achieved: alcanzó la meta (automático)
   * - not_achieved: mes cerrado y no alcanzó
   * - approved: aprobado por manager/admin (si requiere aprobación)
   * - delivered: recompensa entregada (manual/perk/payroll)
   */
  status:
    | "in_progress"
    | "achieved"
    | "not_achieved"
    | "partial"
    | "approved"
    | "delivered";

  /** Progreso 0..100 para UI (barra) */
  progressPercent: number;

  /**
   * Métricas calculadas (flexible):
   * Ej:
   * - { total: 210, target: 300, recoordinacion: 100, bd: 110 }
   * - { eligibleDays: 20, perfectDays: 20, excludedMedical: 2, lateDays: 0 }
   * - { attended: 240, impacted: 300, ratio: 0.80 }
   */
  metrics: any;

  /**
   * Reward congelada al momento del cálculo/cierre.
   * Importante para que si cambia la regla luego, el historial no cambie.
   */
  rewardSnapshot: {
    deliveryChannel: "payroll" | "manual_cash" | "perk" | "label_only";
    rewardKind: "money" | "perk";
    amount?: number; // si money
    currency?: string; // ej: "DOP"
    label?: string; // texto para UI
  };

  /**
   * Si esta regla es monetaria y deliveryChannel=payroll, esto indica
   * si ya se "exportó" o "incluyó" en cierre de nómina.
   * (Aunque para tu líder no se usará, queda para reglas payroll.)
   */
  payrollIncluded?: boolean;

  /**
   * Evidencia resumida para auditoría.
   * No guardes miles de IDs aquí si no quieres; puede ser:
   * - { sampleIds: [...], totalCount: 300 }
   * - { excludedByReason: { medicalLeave: 2, late: 1 } }
   * - { localityBreakdown: [...] }
   */
  evidence?: any;

  /** Mensaje para UI (“Te faltan 30 citas para la meta”) */
  message?: string;

  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  updatedAt: string;

  isActive: boolean;
  isDeleted: boolean;
}

const IncentiveAchievementSchema = new Schema<IIncentiveAchievement>(
  {
    rule: { type: Schema.Types.ObjectId, ref: "IncentiveRule", required: true },
    program: {
      type: Schema.Types.ObjectId,
      ref: "IncentiveProgram",
      required: true,
    },

    month: { type: String, required: true, trim: true }, // "YYYY-MM"

    appliesTo: {
      type: String,
      enum: ["operator", "leader", "team"],
      required: true,
    },

    scopeType: {
      type: String,
      enum: ["user", "locality", "department", "team"],
      required: true,
    },

    subjectUser: { type: Schema.Types.ObjectId, ref: "User", default: null },
    subjectLocalityCode: { type: String, default: null, trim: true },
    subjectDepartmentCode: { type: String, default: null, trim: true },
    subjectTeamId: { type: Schema.Types.ObjectId, ref: "Team", default: null },

    status: {
      type: String,
      enum: [
        "in_progress",
        "achieved",
        "not_achieved",
        "approved",
        "delivered",
        "partial",
      ],
      default: "in_progress",
    },

    progressPercent: { type: Number, default: 0 },

    metrics: { type: Schema.Types.Mixed, default: {} },

    rewardSnapshot: {
      deliveryChannel: {
        type: String,
        enum: ["payroll", "manual_cash", "perk", "label_only"],
        required: true,
      },
      rewardKind: { type: String, enum: ["money", "perk"], required: true },
      amount: { type: Number, default: null },
      currency: { type: String, default: "DOP", trim: true },
      label: { type: String, default: null, trim: true },
    },

    payrollIncluded: { type: Boolean, default: false },

    evidence: { type: Schema.Types.Mixed, default: {} },

    message: { type: String, default: null, trim: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Un achievement único por: rule + month + sujeto (user/locality/department/team)
IncentiveAchievementSchema.index(
  {
    rule: 1,
    month: 1,
    subjectUser: 1,
    subjectLocalityCode: 1,
    subjectDepartmentCode: 1,
    subjectTeamId: 1,
  },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

// Para dashboards rápidos por usuario/mes
IncentiveAchievementSchema.index({
  month: 1,
  subjectUser: 1,
  isDeleted: 1,
});

// Para listar logros por programa/mes
IncentiveAchievementSchema.index({
  program: 1,
  month: 1,
  isDeleted: 1,
});

const IncentiveAchievement = model<IIncentiveAchievement>(
  "IncentiveAchievement",
  IncentiveAchievementSchema,
);
export default IncentiveAchievement;
