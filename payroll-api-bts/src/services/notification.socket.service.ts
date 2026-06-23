import { Types } from "mongoose";
import { getSocketIO } from "../config/socket";

type ObjIdLike = string | Types.ObjectId;

type NotificationTarget =
  | { kind: "users"; userIds: ObjIdLike[] }
  | { kind: "role"; roleCode: string }
  | { kind: "department"; departmentId: ObjIdLike }
  | { kind: "departmentCode"; departmentCode: string }
  | { kind: "jobPosition"; jobPositionId: ObjIdLike }
  | { kind: "jobPositionCode"; jobPositionCode: string }
  | { kind: "project"; projectId: ObjIdLike }
  | { kind: "projectCode"; projectCode: string }
  | { kind: "managers" } // sala global
  | { kind: "departmentManagers"; departmentId: ObjIdLike }; // managers de un dept

function toValidObjectIdString(id: ObjIdLike): string | null {
  const s = String(id);
  return Types.ObjectId.isValid(s) ? s : null;
}

function uniqStrings(arr: string[]) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function emitToRooms(event: string, rooms: string[], payload: any) {
  const io = getSocketIO();
  if (!io) return;

  const cleanRooms = uniqStrings(rooms);
  if (!cleanRooms.length) return;

  // Chaining 100% compatible
  let op: any = io;
  for (const r of cleanRooms) op = op.to(r);
  op.emit(event, payload);
}

function resolveRooms(target: NotificationTarget): string[] {
  switch (target.kind) {
    case "users": {
      const rooms = (target.userIds || [])
        .map((id) => toValidObjectIdString(id))
        .filter(Boolean)
        .map((id) => `user:${id}`);
      return rooms;
    }

    case "role":
      return target.roleCode ? [`role:${String(target.roleCode)}`] : [];

    case "department": {
      const id = toValidObjectIdString(target.departmentId);
      return id ? [`dept:${id}`] : [];
    }

    case "departmentCode":
      return target.departmentCode
        ? [`deptCode:${String(target.departmentCode)}`]
        : [];

    case "jobPosition": {
      const id = toValidObjectIdString(target.jobPositionId);
      return id ? [`jobPosition:${id}`] : [];
    }

    case "jobPositionCode":
      return target.jobPositionCode
        ? [`jobPositionCode:${String(target.jobPositionCode)}`]
        : [];

    case "project": {
      const id = toValidObjectIdString(target.projectId);
      return id ? [`project:${id}`] : [];
    }

    case "projectCode":
      return target.projectCode
        ? [`projectCode:${String(target.projectCode)}`]
        : [];

    case "managers":
      return ["managers"];

    case "departmentManagers": {
      const id = toValidObjectIdString(target.departmentId);
      return id ? [`deptManagers:${id}`] : [];
    }

    default:
      return [];
  }
}

/**
 * ✅ ÚNICA función para emitir notificaciones a cualquier "target"
 */
export function emitNotification(input: {
  target: NotificationTarget | NotificationTarget[];
  payload: any;
  event?: string; // default: "notifications:new"
}) {
  const event = input.event || "notifications:new";
  const targets = Array.isArray(input.target) ? input.target : [input.target];

  const rooms = uniqStrings(targets.flatMap(resolveRooms));
  if (!rooms.length) return;

  emitToRooms(event, rooms, input.payload);
}

/* =========================
   WRAPPERS (opcional)
   ========================= */

export function emitNotificationToUsers(input: {
  userIds: ObjIdLike[];
  payload: any;
  event?: string;
}) {
  emitNotification({
    target: { kind: "users", userIds: input.userIds },
    payload: input.payload,
    event: input.event
  });
}

export function emitNotificationToRole(input: {
  roleCode: string;
  payload: any;
  event?: string;
}) {
  emitNotification({
    target: { kind: "role", roleCode: input.roleCode },
    payload: input.payload,
    event: input.event,
  });
}

export function emitNotificationToDepartment(input: {
  departmentId: ObjIdLike;
  payload: any;
  event?: string;
}) {
  emitNotification({
    target: { kind: "department", departmentId: input.departmentId },
    payload: input.payload,
    event: input.event,
  });
}

export function emitNotificationToDepartmentManagers(input: {
  departmentId: ObjIdLike;
  payload: any;
  event?: string;
}) {
  emitNotification({
    target: { kind: "departmentManagers", departmentId: input.departmentId },
    payload: input.payload,
    event: input.event,
  });
}

export function emitNotificationToJobPosition(input: {
  jobPositionId: ObjIdLike;
  payload: any;
  event?: string;
}) {
  emitNotification({
    target: { kind: "jobPosition", jobPositionId: input.jobPositionId },
    payload: input.payload,
    event: input.event,
  });
}

export function emitNotificationToProject(input: {
  projectId: ObjIdLike;
  payload: any;
  event?: string;
}) {
  emitNotification({
    target: { kind: "project", projectId: input.projectId },
    payload: input.payload,
    event: input.event,
  });
}

export function emitNotificationToManagers(input: { payload: any }) {
  emitNotification({ target: { kind: "managers" }, payload: input.payload });
}
