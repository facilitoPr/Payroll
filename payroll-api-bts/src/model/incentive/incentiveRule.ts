import { Schema, model, Types } from "mongoose";

export interface IIncentiveRule {
  _id: Types.ObjectId;
  program: Types.ObjectId;
  name: string;
  code: string;
  description?: string;

  /**
   * A quién aplica:
   * - operator: operadoras/usuarios que gestionan citas
   * - leader: líder/gerente (recibe incentivo por rendimiento del equipo)
   * - team: incentivo al equipo (localidad / departamento / grupo)
   */
  appliesTo: "operator" | "leader" | "team";

  /**
   * Cómo se agrupa/cuenta la meta:
   * - user: por usuario (operadora)
   * - locality: por localidad/centro (equipo por localidad)
   * - department: por departamento
   * - team: por equipo definido (si tienes un modelo Team)
   */
  scopeType: "user" | "locality" | "department" | "team";

  /**
   * Canal de entrega de la recompensa:
   * - payroll: se incluye como earning/bono en cierre de nómina
   * - manual_cash: dinero pero NO va a nómina (se paga manual)
   * - perk: beneficio no monetario (pizza, sábado libre, almuerzo, etc.)
   * - label_only: solo reconocimiento visual, sin pago automático
   */
  deliveryChannel: "payroll" | "manual_cash" | "perk" | "label_only";

  /**
   * Tipo de recompensa:
   * - money: monto en pesos (o moneda que definas)
   * - perk: recompensa no monetaria
   */
  rewardKind: "money" | "perk";

  /**
   * Monto (solo si rewardKind = money).
   * Ej: 500, 1500, 2000, etc.
   */
  rewardAmount?: number;

  /**
   * Moneda (si rewardKind = money).
   * Ej: "DOP" (pesos dominicanos)
   */
  rewardCurrency?: string;

  /**
   * Texto corto para UI: chip/badge.
   * Ej: "RD$500", "Pizza + 1 sábado libre", "Label de reconocimiento"
   */
  rewardLabel?: string;

  /**
   * Tipo de regla:
   * - count: meta por conteo (ej: 300 citas)
   * - ratio: meta por porcentaje/ratio (ej: efectividad > 85%)
   * - composition: meta con composición (ej: 50% recoordinación y 50% BD)
   * - leaderboard: ranking / top (ej: empleado del mes)
   */
  ruleType: "count" | "ratio" | "composition" | "leaderboard";

  /**
   * Fuente de métricas:
   * - reminders: datos salen de Reminders (citas)
   * - attendance: datos salen de ponches/asistencia (HR)
   * - custom: métrica especial (por si luego conectas otra tabla)
   */
  metricSource: "reminders" | "attendance" | "custom";

  /**
   * Configuración flexible de la regla (JSON).
   * Aquí defines:
   * - umbrales (target)
   * - filtros (marks, status, tipos de cita, etc.)
   * - campo fecha a usar (date vs createdByOperatorDate)
   * - composición (buckets y % mínimos)
   * - reglas de exclusión (ej: licencia médica, tardanza)
   */
  config: any;

  /**
   * Versión de la regla.
   * Si cambias parámetros a mitad del año, creas v2 y desactivas v1.
   */
  version: number;

  /**
   * (Opcional) regla raíz/parent para agrupar versiones.
   * Útil si quieres: v1, v2, v3 apuntando al mismo "rootRule".
   */
  rootRule?: Types.ObjectId;

  /**
   * Mes inicio para esta regla (si quieres que una regla empiece después
   * de iniciado el programa). Formato "YYYY-MM".
   */
  startMonth?: string;

  /** Mes fin de esta regla (opcional). Formato "YYYY-MM". */
  endMonth?: string;

  /**
   * Orden para UI (qué regla se muestra primero)
   */
  displayOrder?: number;

  /**
   * UI meta (opcional): icono/color para chips/cards.
   * Ej: { icon: "event", color: "primary" }
   */
  ui?: {
    icon?: string;
    color?: string;
  };

  /** Auditoría */
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;

  isActive: boolean;
  isDeleted: boolean;
}

const IncentiveRuleSchema = new Schema<IIncentiveRule>(
  {
    program: {
      type: Schema.Types.ObjectId,
      ref: "IncentiveProgram",
      required: true,
    },

    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, default: null, trim: true },

    appliesTo: {
      type: String,
      enum: ["operator", "leader", "team"],
      required: true,
    },

    scopeType: {
      type: String,
      enum: ["user", "locality", "department", "team"],
      required: true,
      default: "user",
    },

    deliveryChannel: {
      type: String,
      enum: ["payroll", "manual_cash", "perk", "label_only"],
      required: true,
      default: "label_only",
    },

    rewardKind: {
      type: String,
      enum: ["money", "perk"],
      required: true,
      default: "money",
    },

    rewardAmount: { type: Number, default: null },
    rewardCurrency: { type: String, default: "DOP", trim: true },
    rewardLabel: { type: String, default: null, trim: true },

    ruleType: {
      type: String,
      enum: ["count", "ratio", "composition", "leaderboard"],
      required: true,
    },

    metricSource: {
      type: String,
      enum: ["reminders", "attendance", "custom"],
      required: true,
      default: "reminders",
    },

    // Flexible JSON config (acepta cualquier shape)
    config: { type: Schema.Types.Mixed, required: true, default: {} },

    version: { type: Number, default: 1 },
    rootRule: {
      type: Schema.Types.ObjectId,
      ref: "IncentiveRule",
      default: null,
    },

    startMonth: { type: String, default: null, trim: true }, // "YYYY-MM"
    endMonth: { type: String, default: null, trim: true }, // "YYYY-MM"

    displayOrder: { type: Number, default: 0 },

    ui: {
      icon: { type: String, default: null, trim: true },
      color: { type: String, default: null, trim: true },
    },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

IncentiveRuleSchema.index(
  { program: 1, code: 1, version: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

IncentiveRuleSchema.index({ program: 1, isActive: 1, isDeleted: 1 });
IncentiveRuleSchema.index({ program: 1, displayOrder: 1 });

const IncentiveRule = model<IIncentiveRule>(
  "IncentiveRule",
  IncentiveRuleSchema,
);
export default IncentiveRule;
