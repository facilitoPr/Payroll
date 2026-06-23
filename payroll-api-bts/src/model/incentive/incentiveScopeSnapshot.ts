import { Schema, model, Types } from "mongoose";

export type IncentiveScopeType = "user" | "locality" | "department" | "team";
export type IncentiveSnapshotSource =
  | "user_zone"
  | "zone_assignment"
  | "manual";

/**
 * Snapshot mensual de un scope (ej: localidad/zona).
 * Congela quiénes eran los miembros del equipo en ese mes para cálculos consistentes.
 */
export interface IIncentiveScopeSnapshot {
  program: Types.ObjectId;

  /** Mes evaluado en formato YYYY-MM (ej: "2026-02") */
  month: string;

  /**
   * Tipo de scope que se congela:
   * - locality: por localidad/zona (lo que tú necesitas ahora)
   * - department/team: por si luego lo extiendes
   */
  scopeType: IncentiveScopeType;

  /**
   * Localidad (Zone.code). Recomendado porque es estable y fácil de filtrar.
   * Requerido cuando scopeType = "locality"
   */
  subjectLocalityCode?: string;

  /**
   * Departamento (si aplicas snapshots por department en el futuro)
   * Requerido cuando scopeType = "department"
   */
  subjectDepartmentCode?: string;

  /**
   * TeamId (si luego creas un modelo Team)
   * Requerido cuando scopeType = "team"
   */
  subjectTeamId?: Types.ObjectId;

  /** Miembros (usuarios/operadoras) que pertenecen a este scope en ese mes */
  memberUserIds: Types.ObjectId[];

  /** Cantidad de miembros (para dashboard rápido) */
  membersCount: number;

  /**
   * Fuente de cómo se armó el snapshot:
   * - user_zone: desde User.zone (tu caso actual)
   * - zone_assignment: desde una asignación manual en Zone (cuando hagas la pantalla)
   * - manual: forzado manualmente
   */
  source: IncentiveSnapshotSource;

  /** Auditoría */
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;

  /** Flags estándar */
  isActive: boolean;
  isDeleted: boolean;
}

const IncentiveScopeSnapshotSchema = new Schema<IIncentiveScopeSnapshot>(
  {
    program: {
      type: Schema.Types.ObjectId,
      ref: "IncentiveProgram",
      required: true,
      index: true,
    },

    month: { type: String, required: true, trim: true }, // "YYYY-MM"

    scopeType: {
      type: String,
      enum: ["user", "locality", "department", "team"],
      required: true,
      default: "locality",
      index: true,
    },

    subjectLocalityCode: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    subjectDepartmentCode: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    subjectTeamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      default: null,
      index: true,
    },

    memberUserIds: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },

    membersCount: { type: Number, default: 0 },

    source: {
      type: String,
      enum: ["user_zone", "zone_assignment", "manual"],
      required: true,
      default: "user_zone",
    },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// ✅ Auto: membersCount = memberUserIds.length
IncentiveScopeSnapshotSchema.pre("save", function (next) {
  const arr = Array.isArray(this.memberUserIds) ? this.memberUserIds : [];
  this.membersCount = arr.length;
  next();
});

/**
 * ✅ Validación simple por scopeType
 * locality -> subjectLocalityCode requerido
 * department -> subjectDepartmentCode requerido
 * team -> subjectTeamId requerido
 */
IncentiveScopeSnapshotSchema.pre("validate", function (next) {
  if (this.scopeType === "locality" && !this.subjectLocalityCode) {
    return next(
      new Error("subjectLocalityCode es requerido cuando scopeType=locality"),
    );
  }
  if (this.scopeType === "department" && !this.subjectDepartmentCode) {
    return next(
      new Error(
        "subjectDepartmentCode es requerido cuando scopeType=department",
      ),
    );
  }
  if (this.scopeType === "team" && !this.subjectTeamId) {
    return next(new Error("subjectTeamId es requerido cuando scopeType=team"));
  }
  next();
});

// ✅ Único por programa + mes + scope + identificador del scope (con soft delete)
IncentiveScopeSnapshotSchema.index(
  {
    program: 1,
    month: 1,
    scopeType: 1,
    subjectLocalityCode: 1,
    subjectDepartmentCode: 1,
    subjectTeamId: 1,
  },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

// ✅ Para dashboards rápidos por programa/mes
IncentiveScopeSnapshotSchema.index({ program: 1, month: 1, isDeleted: 1 });

// ✅ Para consultar un scope específico en un mes
IncentiveScopeSnapshotSchema.index({
  month: 1,
  scopeType: 1,
  subjectLocalityCode: 1,
  isDeleted: 1,
});

// (Opcional) para buscar snapshots donde participa un usuario (multikey)
IncentiveScopeSnapshotSchema.index({
  month: 1,
  memberUserIds: 1,
  isDeleted: 1,
});

const IncentiveScopeSnapshot = model<IIncentiveScopeSnapshot>(
  "IncentiveScopeSnapshot",
  IncentiveScopeSnapshotSchema,
);

export default IncentiveScopeSnapshot;
