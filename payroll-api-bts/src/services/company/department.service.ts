import Department from "../../model/rrhh/department";

export const populateDepartment = (query: any) => {
  return query
    .populate({
      path: "company",
      select: "code legalName tradeName logo logoUrl primaryColor isActive",
    })
    .populate({
      path: "managers",
      select: "name email",
    });
};

export const validateDuplicateCode = async ({
  code,
  company,
  departmentId,
}: {
  code: string;
  company: string;
  departmentId?: string;
}) => {
  const query: any = {
    code,
    company,
    isDeleted: false,
  };

  if (departmentId) {
    query._id = { $ne: departmentId };
  }

  const exists = await Department.findOne(query).lean();

  if (exists) {
    return {
      ok: false,
      mensaje: "Ya existe un departamento con ese código en esta compañía.",
    };
  }

  return {
    ok: true,
    mensaje: "",
  };
};