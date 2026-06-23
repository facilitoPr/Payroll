import { Types } from "mongoose";
import User from "../model/account/user";

export const findEmployeeIdsByFilters = async ({
  companyId,
  departmentId,
  projectId,
  userId,
  userIds,
  paymentScheduleId,
  managerId,
  jobPositionId,
}: {
  companyId?: string | null;
  departmentId?: string | null;
  projectId?: string | null;
  userId?: string | null;
  userIds?: string[] | null;
  paymentScheduleId?: string | null;
  managerId?: string | null;
  jobPositionId?: string | null;
}) => {
  try {
    const query: any = {
      isDeleted: false,
      isActived: true,
    };

    if (companyId && Types.ObjectId.isValid(companyId)) {
      query.company = new Types.ObjectId(companyId);
    }

    if (departmentId && Types.ObjectId.isValid(departmentId)) {
      query.department = new Types.ObjectId(departmentId);
    }

    if (projectId && Types.ObjectId.isValid(projectId)) {
      query.project = new Types.ObjectId(projectId);
    }

    if (paymentScheduleId && Types.ObjectId.isValid(paymentScheduleId)) {
      query.paymentSchedule = new Types.ObjectId(paymentScheduleId);
    }

    if (jobPositionId && Types.ObjectId.isValid(jobPositionId)) {
      query.jobPosition = new Types.ObjectId(jobPositionId);
    }

    if (userId && Types.ObjectId.isValid(userId)) {
      query._id = new Types.ObjectId(userId);
    }

    if (Array.isArray(userIds) && userIds.length > 0) {
      const validUserIds = userIds
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));

      if (validUserIds.length > 0) {
        query._id = { $in: validUserIds };
      }
    }

    /**
     * Si el usuario es manager, ya deberías mandar el departmentId forzado.
     * managerId queda disponible si en tu lógica anterior lo usabas.
     */
    if (managerId && Types.ObjectId.isValid(managerId)) {
      // No fuerzo nada aquí para no romper tu lógica.
      // La restricción real la hacemos pasando departmentId desde el controlador.
    }

    const employees = await User.find(query)
      .select("_id ")
      .lean();

    return {
      ok: true,
      employeeIds: employees.map((e: any) => e._id),
    };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      mensaje: "Error buscando empleados para nómina.",
      error,
    };
  }
};
