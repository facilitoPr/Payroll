import mongoose, { Schema, model, Types } from "mongoose";
import { IRole } from "./role";
import { IMenu } from "./menu";

export type PermissionFlags = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  manage?: boolean;
  send?: boolean;
  export?: boolean;
};

export interface IRolePermission extends mongoose.Document {
  role: Types.ObjectId | IRole;
  menu: Types.ObjectId | IMenu;

  /**
   * Si department es null, aplica a cualquier departamento.
   * Si tiene valor, solo aplica a usuarios de ese departamento.
   */
  department?: Types.ObjectId | null;

  /**
   * Si jobPosition es null, aplica a cualquier puesto.
   * Si tiene valor, solo aplica a usuarios con ese puesto.
   */
  jobPosition?: Types.ObjectId | null;

  /**
   * null = aplica a manager y no manager.
   * true = solo managers.
   * false = solo empleados no managers.
   */
  isManager?: boolean | null;

  isEnabled: boolean;
  permissions: PermissionFlags;
  createdAt: Date;
  updatedAt: Date;
}

const permissionFlagsSchema = new Schema(
  {
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    approve: { type: Boolean, default: false },
    manage: { type: Boolean, default: false },
    send: { type: Boolean, default: false },
    export: { type: Boolean, default: false },
  },
  {
    _id: false,
  },
);

const rolePermissionSchema = new Schema<IRolePermission>(
  {
    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      index: true,
    },

    menu: {
      type: Schema.Types.ObjectId,
      ref: "Menu",
      required: true,
      index: true,
    },

    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },

    jobPosition: {
      type: Schema.Types.ObjectId,
      ref: "JobPosition",
      default: null,
      index: true,
    },

    isManager: {
      type: Boolean,
      default: null,
      index: true,
    },

    isEnabled: {
      type: Boolean,
      default: true,
    },

    permissions: {
      type: permissionFlagsSchema,
      default: () => ({
        view: false,
        create: false,
        edit: false,
        delete: false,
        approve: false,
        manage: false,
        send: false,
        export: false,
      }),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

rolePermissionSchema.index(
  {
    role: 1,
    menu: 1,
    department: 1,
    jobPosition: 1,
    isManager: 1,
  },
  {
    unique: true,
    name: "role_menu_department_job_manager_unique",
  },
);

export default model<IRolePermission>("RolePermission", rolePermissionSchema);