import { toObjectIdOrNull, uniqValidIdStrings } from "../objectIds";
import User from "../../model/account/user";
import { ConfirmScopeMode } from "./payroll.build";

export const resolvePayrollCloseUserIds = async ({
  scopeMode,
  userIds,
  companyId,
  departmentId,
  jobPositionId,
  projectId,
  paymentScheduleId,
  excludeUserIds = [],
  additionalUserIds = [],
}: {
  scopeMode: ConfirmScopeMode;
  userIds?: any[];
  companyId?: any;
  departmentId?: any;
  jobPositionId?: any;
  projectId?: any;
  paymentScheduleId?: any;
  excludeUserIds?: any[];
  additionalUserIds?: any[];
}) => {
  const normalizedScope = String(
    scopeMode || "EMPLOYEES",
  ).toUpperCase() as ConfirmScopeMode;

  if (normalizedScope === "EMPLOYEES") {
    const ids = uniqValidIdStrings([...(userIds || []), ...(additionalUserIds || [])]);

    if (!ids.length) {
      return {
        ok: false,
        mensaje: "Debes seleccionar al menos un empleado válido.",
        userIds: [],
      };
    }

    const companyObjectId = toObjectIdOrNull(companyId);
    const departmentObjectId = toObjectIdOrNull(departmentId);
    const jobPositionObjectId = toObjectIdOrNull(jobPositionId);
    const projectObjectId = toObjectIdOrNull(projectId);
    const paymentScheduleObjectId = toObjectIdOrNull(paymentScheduleId);

    const userObjectIds = ids
      .map((id) => toObjectIdOrNull(id))
      .filter(Boolean);

    const query: any = {
      _id: { $in: userObjectIds },
      isDeleted: { $ne: true },
      isActived: { $ne: false },
    };

    if (companyObjectId) query.company = companyObjectId;
    if (departmentObjectId) query.department = departmentObjectId;
    if (jobPositionObjectId) query.jobPosition = jobPositionObjectId;
    if (projectObjectId) query.project = projectObjectId;
    if (paymentScheduleObjectId) query.paymentSchedule = paymentScheduleObjectId;

    const excludeSet = new Set(uniqValidIdStrings(excludeUserIds || []));
    const filteredIds = uniqValidIdStrings(
      await User.distinct("_id", query),
    ).filter((id) => !excludeSet.has(String(id)));

    return {
      ok: true,
      mensaje: "",
      userIds: filteredIds,
      query,
    };
  }

  const companyObjectId = toObjectIdOrNull(companyId);
  const departmentObjectId = toObjectIdOrNull(departmentId);
  const jobPositionObjectId = toObjectIdOrNull(jobPositionId);
  const projectObjectId = toObjectIdOrNull(projectId);
  const paymentScheduleObjectId = toObjectIdOrNull(paymentScheduleId);

  const query: any = {
    isDeleted: { $ne: true },
    isActived: { $ne: false },
  };

  if (normalizedScope === "COMPANY") {
    if (!companyObjectId) {
      return {
        ok: false,
        mensaje: "Debe enviar una empresa válida.",
        userIds: [],
      };
    }

    query.company = companyObjectId;
  }

  if (normalizedScope === "DEPARTMENT") {
    if (!departmentObjectId) {
      return {
        ok: false,
        mensaje: "Debe enviar un departamento válido.",
        userIds: [],
      };
    }

    if (companyObjectId) query.company = companyObjectId;
    query.department = departmentObjectId;
  }

  if (normalizedScope === "JOB_POSITION") {
    if (!jobPositionObjectId) {
      return {
        ok: false,
        mensaje: "Debe enviar un puesto de trabajo válido.",
        userIds: [],
      };
    }

    if (companyObjectId) query.company = companyObjectId;
    if (departmentObjectId) query.department = departmentObjectId;

    query.jobPosition = jobPositionObjectId;
  }

  if (normalizedScope === "PROJECT") {
    if (!projectObjectId) {
      return {
        ok: false,
        mensaje: "Debe enviar un proyecto válido.",
        userIds: [],
      };
    }

    if (companyObjectId) query.company = companyObjectId;
    if (departmentObjectId) query.department = departmentObjectId;
    if (jobPositionObjectId) query.jobPosition = jobPositionObjectId;

    query.project = projectObjectId;
  }

  if (paymentScheduleObjectId) {
    query.paymentSchedule = paymentScheduleObjectId;
  }

  const ids = await User.distinct("_id", query);
  const excludeSet = new Set(uniqValidIdStrings(excludeUserIds || []));
  const finalIds = uniqValidIdStrings([...(ids || []), ...(additionalUserIds || [])])
    .filter((id) => !excludeSet.has(String(id)));

  return {
    ok: true,
    mensaje: "",
    userIds: finalIds,
    query,
  };
};
