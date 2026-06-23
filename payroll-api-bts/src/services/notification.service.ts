import mongoose, { Types } from "mongoose";
import {
  Notification,
  NotificationSeverity,
  NotificationType,
} from "../model/notification/Notification";
import { NotificationRecipient } from "../model/notification/NotificationRecipient";
import { emitNotification } from "./notification.socket.service";

import User from "../model/account/user";
import Department from "../model/rrhh/department";
import Roles from "../model/role";

type ObjIdLike = string | Types.ObjectId;

type NotificationTarget =
  | { kind: "users"; userIds: ObjIdLike[] }
  | { kind: "role"; roleCode: string }
  | { kind: "department"; departmentId: ObjIdLike }
  | { kind: "departmentCode"; departmentCode: string }
  | { kind: "jobPosition"; jobPositionId: ObjIdLike }
  | { kind: "project"; projectId: ObjIdLike }
  | { kind: "managers" } // managers global (todos los managers de todos los dept)
  | { kind: "departmentManagers"; departmentId: ObjIdLike }; // managers de un dept

function toObjectIdOrNull(id: ObjIdLike): Types.ObjectId | null {
  const s = String(id);
  return Types.ObjectId.isValid(s) ? new Types.ObjectId(s) : null;
}

function uniqObjectIds(ids: (string | Types.ObjectId)[]) {
  const set = new Set<string>();
  const out: Types.ObjectId[] = [];

  for (const id of ids) {
    const s = String(id);
    if (!Types.ObjectId.isValid(s)) continue;
    if (set.has(s)) continue;
    set.add(s);
    out.push(new Types.ObjectId(s));
  }
  return out;
}

async function findUsersIds(query: any) {
  const rows = await User.find(query).select("_id").lean();
  return rows.map((r: any) => new Types.ObjectId(String(r._id)));
}

async function resolveRecipientsFromTarget(target: NotificationTarget) {
  const baseUserFilter: any = { isDeleted: false, isActived: true };

  switch (target.kind) {
    case "users": {
      return uniqObjectIds(target.userIds || []);
    }

    case "role": {
      const roleCode = String(target.roleCode || "");
      if (!roleCode) return [];

      // 1) Ideal: buscar Role por code y luego buscar users por rol ObjectId
      const role = await Roles.findOne({
        code: roleCode,
      })
        .select("_id")
        .lean();

      if (role?._id) {
        return await findUsersIds({
          ...baseUserFilter,
          rol: new Types.ObjectId(String(role._id)),
        });
      }

      // 2) Fallback (si rol está embebido): {"rol.code": "..."}
      return await findUsersIds({
        ...baseUserFilter,
        "rol.code": roleCode,
      });
    }

    case "department": {
      const deptId = toObjectIdOrNull(target.departmentId);
      if (!deptId) return [];
      return await findUsersIds({ ...baseUserFilter, department: deptId });
    }

    case "departmentCode": {
      const code = String(target.departmentCode || "");
      if (!code) return [];

      const dept = await Department.findOne({
        code,
        isDeleted: false,
        isActive: true,
      })
        .select("_id")
        .lean();

      if (dept?._id) {
        return await findUsersIds({
          ...baseUserFilter,
          department: new Types.ObjectId(String(dept._id)),
        });
      }

      // fallback si department está embebido
      return await findUsersIds({
        ...baseUserFilter,
        "department.code": code,
      });
    }

    case "jobPosition": {
      const jpId = toObjectIdOrNull(target.jobPositionId);
      if (!jpId) return [];
      return await findUsersIds({ ...baseUserFilter, jobPosition: jpId });
    }

    case "project": {
      const projectId = toObjectIdOrNull(target.projectId);
      if (!projectId) return [];
      return await findUsersIds({ ...baseUserFilter, project: projectId });
    }

    case "departmentManagers": {
      const deptId = toObjectIdOrNull(target.departmentId);
      if (!deptId) return [];

      const dept = await Department.findOne({
        _id: deptId,
        isDeleted: false,
        isActive: true,
      })
        .select("managers")
        .lean();

      const managers = (dept?.managers || []).map((m: any) => String(m));
      const uniqManagers = uniqObjectIds(managers);
      if (!uniqManagers.length) return [];

      return await findUsersIds({
        ...baseUserFilter,
        _id: { $in: uniqManagers },
      });
    }

    case "managers": {
      // Managers global = unión de todos los managers de todos los dept
      const depts = await Department.find({
        isDeleted: false,
        isActive: true,
      })
        .select("managers")
        .lean();

      const allManagers = depts.flatMap((d: any) =>
        (d?.managers || []).map((m: any) => String(m)),
      );
      const uniqManagers = uniqObjectIds(allManagers);
      if (!uniqManagers.length) return [];

      return await findUsersIds({
        ...baseUserFilter,
        _id: { $in: uniqManagers },
      });
    }

    default:
      return [];
  }
}

function buildRealtimePayload(notification: any) {
  return {
    notificationId: String(notification._id),
    type: notification.type,
    severity: notification.severity,
    title: notification.title,
    message: notification.message,
    link: notification.link,
    entityType: notification.entityType,
    entityId: notification.entityId ? String(notification.entityId) : null,
    createdAt: notification.createdAt,
  };
}

/**
 * ✅ NUEVA: notifica por múltiples targets (users / role / dept / jobPosition / project / managers)
 * - Guarda NotificationRecipient por usuario (resuelto en DB)
 * - Emite SOLO a rooms de user:<id> para evitar duplicados
 */
export async function notify(input: {
  type: NotificationType;
  severity?: NotificationSeverity;
  title: string;
  message?: string;

  entityType?: string;
  entityId?: ObjIdLike;

  link?: string;
  meta?: any;

  // puedes pasar 1 o varios targets
  target: NotificationTarget | NotificationTarget[];

  createdBy?: ObjIdLike;
  event?: string;
}) {
  const targets = Array.isArray(input.target) ? input.target : [input.target];

  // Resolver recipients por cada target
  const resolvedLists = await Promise.all(
    targets.map((t) => resolveRecipientsFromTarget(t)),
  );

  const recipients = uniqObjectIds(resolvedLists.flat());
  if (!recipients.length) {
    return {
      ok: false as const,
      status: 400,
      mensaje: "No hay destinatarios válidos",
    };
  }

  const createdBy =
    input.createdBy && Types.ObjectId.isValid(String(input.createdBy))
      ? new Types.ObjectId(String(input.createdBy))
      : undefined;

  const entityId =
    input.entityId && Types.ObjectId.isValid(String(input.entityId))
      ? new Types.ObjectId(String(input.entityId))
      : undefined;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const notifArr = await Notification.create(
      [
        {
          type: input.type,
          severity: input.severity || "INFO",
          title: input.title,
          message: input.message || "",
          entityType: input.entityType,
          entityId,
          link: input.link,
          meta: input.meta,
          createdBy,
          updatedBy: createdBy,
          isActive: true,
          isDeleted: false,
        },
      ],
      { session },
    );

    const notification = notifArr[0];

    await NotificationRecipient.insertMany(
      recipients.map((u) => ({
        notification: notification._id,
        user: u,
        isActive: true,
        isDeleted: false,
      })),
      { session, ordered: false },
    );

    await session.commitTransaction();

    // ✅ Emit SOLO por users para evitar duplicados por múltiples rooms
    emitNotification({
      target: { kind: "users", userIds: recipients },
      payload: buildRealtimePayload(notification),
      event: input.event,
    });

    return {
      ok: true as const,
      notification,
      recipientsCount: recipients.length,
      mensaje: "Notificación creada",
    };
  } catch (error: any) {
    await session.abortTransaction();
    return {
      ok: false as const,
      status: 500,
      error,
      mensaje: "Error creando notificación",
    };
  } finally {
    session.endSession();
  }
}
/* =========================
   WRAPPERS (casos comunes)
   ========================= */

// Igual que tu notifyUsers original, pero usando notify()
export async function notifyUsers(input: {
  type: NotificationType;
  severity?: NotificationSeverity;
  title: string;
  message?: string;
  entityType?: string;
  entityId?: ObjIdLike;
  link?: string;
  meta?: any;
  recipientUserIds: ObjIdLike[];
  createdBy?: ObjIdLike;
  event?: string;
}) {
  return notify({
    ...input,
    target: { kind: "users", userIds: input.recipientUserIds },
  });
}

export async function notifyRole(input: {
  type: NotificationType;
  severity?: NotificationSeverity;
  title: string;
  message?: string;
  entityType?: string;
  entityId?: ObjIdLike;
  link?: string;
  meta?: any;
  roleCode: string;
  createdBy?: ObjIdLike;
  event?: string;
}) {
  return notify({
    ...input,
    target: { kind: "role", roleCode: input.roleCode },
  });
}

export async function notifyDepartment(input: {
  type: NotificationType;
  severity?: NotificationSeverity;
  title: string;
  message?: string;
  entityType?: string;
  entityId?: ObjIdLike;
  link?: string;
  meta?: any;
  departmentId: ObjIdLike;
  createdBy?: ObjIdLike;
}) {
  return notify({
    ...input,
    target: { kind: "department", departmentId: input.departmentId },
  });
}

export async function notifyJobPosition(input: {
  type: NotificationType;
  severity?: NotificationSeverity;
  title: string;
  message?: string;
  entityType?: string;
  entityId?: ObjIdLike;
  link?: string;
  meta?: any;
  jobPositionId: ObjIdLike;
  createdBy?: ObjIdLike;
}) {
  return notify({
    ...input,
    target: { kind: "jobPosition", jobPositionId: input.jobPositionId },
  });
}

export async function notifyProject(input: {
  type: NotificationType;
  severity?: NotificationSeverity;
  title: string;
  message?: string;
  entityType?: string;
  entityId?: ObjIdLike;
  link?: string;
  meta?: any;
  projectId: ObjIdLike;
  createdBy?: ObjIdLike;
}) {
  return notify({
    ...input,
    target: { kind: "project", projectId: input.projectId },
  });
}

export async function notifyManagers(input: {
  type: NotificationType;
  severity?: NotificationSeverity;
  title: string;
  message?: string;
  entityType?: string;
  entityId?: ObjIdLike;
  link?: string;
  meta?: any;
  createdBy?: ObjIdLike;
}) {
  return notify({
    ...input,
    target: { kind: "managers" },
  });
}

export async function notifyDepartmentManagers(input: {
  type: NotificationType;
  severity?: NotificationSeverity;
  title: string;
  message?: string;
  entityType?: string;
  entityId?: ObjIdLike;
  link?: string;
  meta?: any;
  departmentId: ObjIdLike;
  createdBy?: ObjIdLike;
}) {
  return notify({
    ...input,
    target: { kind: "departmentManagers", departmentId: input.departmentId },
  });
}
