import { Schema, model, Document, Types } from "mongoose";

export interface IEmployeeLoanPolicy extends Document {
  /** Compañía a la que pertenece esta política. */
  company: Types.ObjectId;

  /** Nombre visible de la política. */
  name: string;

  /** Código interno único de la política. */
  code: string;

  /**
   * Indica si los empleados de esta compañía pueden solicitar préstamos.
   * Esta es la única decisión que controla la empresa.
   */
  allowEmployeeLoanRequests: boolean;

  /**
   * Indica si este registro de política está activo a nivel interno.
   * Normalmente siempre estará activo; para apagar solicitudes usa allowEmployeeLoanRequests.
   */
  isActive: boolean;

  /** Soft delete. */
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const employeeLoanPolicySchema = new Schema<IEmployeeLoanPolicy>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      default: "Política de préstamos para empleados",
    },

    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: "EMPLOYEE_LOAN_POLICY",
      index: true,
    },

    allowEmployeeLoanRequests: {
      type: Boolean,
      default: true,
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
  { timestamps: true },
);

employeeLoanPolicySchema.index(
  { company: 1, code: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  },
);

employeeLoanPolicySchema.index({
  company: 1,
  allowEmployeeLoanRequests: 1,
  isActive: 1,
  isDeleted: 1,
});

export default model<IEmployeeLoanPolicy>(
  "EmployeeLoanPolicy",
  employeeLoanPolicySchema,
);